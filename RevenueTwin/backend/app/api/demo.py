from fastapi import APIRouter, HTTPException
from uuid import UUID
import uuid
import asyncio

from app.models.domain import Customer, RevenueEvent, AgentRun
from app.events.schemas import RevenueEventSchema
from app.events.event_types import EventType
from app.events.event_engine import event_engine
from app.decisions.engine import decision_engine
from app.agents.registry import agent_registry
from app.intelligence.service import intelligence_service

router = APIRouter()

@router.post("/trigger-event")
async def demo_trigger_event(payload: dict):
    event_type_str = payload.get("event_type", "PAYMENT_FAILED")
    amount = float(payload.get("amount", 4999.0))
    
    try:
        event_type = EventType(event_type_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event type")
        
    customer = await Customer.find_one()
    if not customer:
        raise HTTPException(status_code=404, detail="No customer found in DB")
        
    event = RevenueEventSchema(
        customer_id=customer.id,
        merchant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
        event_type=event_type,
        amount_at_risk=amount
    )
    
    res = await event_engine.publish_event(event)
    
    if "run_id" not in res:
        raise HTTPException(status_code=500, detail="Failed to orchestrate event")
        
    run_id = uuid.UUID(res["run_id"])
    
    # We need to wait for AgentRun and RevenueEvent to be created
    run = await AgentRun.find_one(AgentRun.run_id == run_id)
    db_event = await RevenueEvent.find_one(RevenueEvent.event_id == event.event_id)
    
    if not run or not db_event:
        raise HTTPException(status_code=500, detail="Failed to find run or event in DB")
    
    agent = agent_registry.get_agent(run.agent_id)
    context = await intelligence_service.get_customer_context(run.customer_id)
    
    # Background the decision engine so UI can stream traces
    async def run_decision():
        try:
            await decision_engine.make_decision(run, db_event.model_dump(), context, agent.profile)
        except Exception as e:
            print(f"Error in decision background task: {e}")
            
    asyncio.create_task(run_decision())
    
    return {
        "status": "triggered", 
        "run_id": str(run_id), 
        "agent": agent.name, 
        "customer": customer.name,
        "amount_at_risk": amount,
        "event_type": event_type.value
    }

import razorpay
import os

@router.post("/razorpay/create-order")
async def create_razorpay_order(payload: dict):
    amount_inr = payload.get("amount", 4999.0)
    amount_paise = int(amount_inr * 100)
    
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay keys not configured")
        
    client = razorpay.Client(auth=(key_id, key_secret))
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"receipt_{uuid.uuid4().hex[:8]}"
    }
    try:
        # This will fail if the background pip install isn't reloaded, but uvicorn --reload will handle that!
        order = client.order.create(data=order_data)
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fast-forward/{run_id}")
async def fast_forward_outcome(run_id: UUID):
    from app.execution.engine import execution_engine
    from app.models.domain import ActionOutcome, ExecutionRecord
    try:
        # Fast forward just triggers the execution engine and gets outcome
        execution = await execution_engine.execute(run_id)
        outcome = await ActionOutcome.find_one(ActionOutcome.execution_id == execution.execution_id)
        return {"status": "SUCCESS", "outcome": outcome}
    except Exception as e:
        # Check if already executed
        execs = await ExecutionRecord.find(ExecutionRecord.run_id == run_id).to_list()
        if execs:
            outcome = await ActionOutcome.find_one(ActionOutcome.execution_id == execs[0].execution_id)
            if outcome:
                 return {"status": "SUCCESS", "outcome": outcome}
        raise HTTPException(status_code=400, detail=str(e))

