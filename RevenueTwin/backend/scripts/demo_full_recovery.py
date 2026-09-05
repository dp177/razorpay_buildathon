import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import uuid
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.config import settings
from app.models.domain import (
    Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
    Payment, Return, Refund, Subscription, SubscriptionEvent,
    Invoice, PromiseToPay, Notification, RecoveryAction,
    RevenueEvent, AgentModel, AgentRun, AgentDecision, ApprovalRecord, ExecutionRecord, ActionOutcome, AgentMemory, AgentTrace, AuditLog
)
from app.events.schemas import RevenueEventSchema
from app.events.event_types import EventType
from app.events.event_engine import event_engine
from app.agents import register_all_agents
from app.intelligence.service import intelligence_service
from app.decisions.engine import decision_engine
from app.execution.engine import execution_engine
from app.agents.registry import agent_registry

# os.environ["USE_MOCK_LLM"] = "true"

async def run_demo():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
            Payment, Return, Refund, Subscription, SubscriptionEvent,
            Invoice, PromiseToPay, Notification, RecoveryAction,
            RevenueEvent, AgentModel, AgentRun, AgentDecision, ApprovalRecord, ExecutionRecord, ActionOutcome, AgentMemory, AgentTrace, AuditLog
        ]
    )
    register_all_agents()
    
    print("=" * 40)
    print("REVENUETWIN")
    print("AUTONOMOUS RECOVERY DEMO")
    print("=" * 40)
    
    customer = await Customer.find_one()
    if not customer:
        print("No customer found.")
        return
        
    event = RevenueEventSchema(
        customer_id=customer.id,
        merchant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
        event_type=EventType.PAYMENT_FAILED,
        amount_at_risk=4999.0
    )
    
    res = await event_engine.publish_event(event)
    
    if "run_id" not in res:
        print("Failed to orchestrate.")
        return
        
    run_id = uuid.UUID(res["run_id"])
    run = await AgentRun.find_one(AgentRun.run_id == run_id)
    db_event = await RevenueEvent.find_one(RevenueEvent.event_id == event.event_id)
    
    agent = agent_registry.get_agent(run.agent_id)
    context = await intelligence_service.get_customer_context(run.customer_id)
    
    await decision_engine.make_decision(run, db_event.model_dump(), context, agent.profile)
    decision = await AgentDecision.find_one(AgentDecision.run_id == run_id)
    
    print(f"\nEVENT\n{event.event_type}\n")
    print(f"AMOUNT AT RISK\nRs. {event.amount_at_risk:,.0f}\n")
    print(f"AGENT\n{agent.name}\n")
    print(f"DECISION\n{decision.decision}\n")
    print(f"EXPECTED RECOVERY\nRs. {event.amount_at_risk * decision.confidence:,.0f}\n")
    
    approval = await execution_engine.approve(run_id, True, "demo-merchant")
    print(f"APPROVAL\n{approval.status}\n")
    
    execution = await execution_engine.execute(run_id)
    print(f"EXECUTION\n{execution.status}\n")
    
    outcome = await ActionOutcome.find_one(ActionOutcome.execution_id == execution.execution_id)
    if outcome:
        print(f"ACTUAL RECOVERY\nRs. {outcome.actual_recovered_amount:,.0f}\n")
        print(f"INTERVENTION COST\nRs. {outcome.intervention_cost:,.0f}\n")
        print(f"NET RECOVERY\nRs. {outcome.actual_net_recovery:,.0f}\n")
    
    print("=" * 40)
    print("\nExecution Trace:")
    traces = await AgentTrace.find(AgentTrace.run_id == run_id).sort("timestamp").to_list()
    for t in traces:
        if t.stage in ["APPROVAL", "EXECUTION", "OBSERVATION", "OUTCOME", "RECOVERY", "NET RECOVERY"]:
            print(f"[{t.timestamp.strftime('%H:%M:%S')}] {t.stage}")
            print(f"{t.message}\n")

if __name__ == "__main__":
    asyncio.run(run_demo())
