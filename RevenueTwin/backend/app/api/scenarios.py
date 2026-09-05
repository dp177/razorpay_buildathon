from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
import uuid
import asyncio

from app.models.domain import Customer, RevenueEvent, AgentRun, SimulationState
from app.events.schemas import RevenueEventSchema
from app.events.event_types import EventType
from app.events.event_engine import event_engine
from app.events.event_store import event_deduplicator
from app.decisions.engine import decision_engine
from app.agents.registry import agent_registry
from app.intelligence.service import intelligence_service
from app.intelligence.specialist.synthetic import generate_for_agent, CUSTOMER_NAMES

router = APIRouter()

# The UI uses friendly scenario identifiers for its specialist generators.
# The event bus uses the canonical EventType values registered by the agents.
LIVE_EVENT_TYPES = {
    "CHURN_RISK": "SUBSCRIPTION_CHURN_RISK",
    "PROMISE_TO_PAY": "PROMISE_TO_PAY_DUE",
    "VOICE_RECOVERY": "VOICE_RECOVERY_REQUIRED",
}

# Map UI / event-bus ids onto the keys used by generate_for_agent.
SYNTHETIC_AGENT_TYPES = {
    "VOICE_RECOVERY_REQUIRED": "VOICE_RECOVERY",
    "SUBSCRIPTION_CHURN_RISK": "CHURN_RISK",
    "PROMISE_TO_PAY_DUE": "PROMISE_TO_PAY",
}


class StartScenarioRequest(BaseModel):
    agent_type: str
    customer_id: str | None = None
    specialist_context: dict[str, Any] | None = None


class GenerateSyntheticRequest(BaseModel):
    agent_type: str


@router.post("/generate-synthetic")
async def generate_synthetic(request: GenerateSyntheticRequest):
    event_type_str = SYNTHETIC_AGENT_TYPES.get(
        request.agent_type.upper(), request.agent_type.upper()
    )

    # Preview only — persist the customer when the live scenario actually starts.
    customer_id = str(uuid.uuid4())
    data = generate_for_agent(event_type_str, customer_id)
    data["customer"]["id"] = customer_id
    name = data.get("customer", {}).get("name") or CUSTOMER_NAMES.get(event_type_str, "Customer")
    email_name = name.lower().replace(" ", "")
    data.setdefault("customer", {})
    data["customer"].setdefault("email", f"{email_name}.{customer_id[:8]}@example.com")

    return {"status": "SUCCESS", **data}


@router.post("/start")
async def start_scenario(request: StartScenarioRequest):
    scenario_type = request.agent_type.upper()
    event_type_str = LIVE_EVENT_TYPES.get(scenario_type, scenario_type)
    try:
        event_type = EventType(event_type_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid scenario type: {event_type_str}")

    if request.customer_id:
        try:
            customer = await Customer.find_one(Customer.id == uuid.UUID(request.customer_id))
        except Exception:
            customer = None
    else:
        customer = None

    if not customer:
        synthetic_type = SYNTHETIC_AGENT_TYPES.get(scenario_type, scenario_type)
        name = (
            (request.specialist_context or {}).get("customer", {}).get("name")
            or CUSTOMER_NAMES.get(synthetic_type, CUSTOMER_NAMES.get(scenario_type, "Customer"))
        )
        customer_uuid = None
        if request.customer_id:
            try:
                customer_uuid = uuid.UUID(request.customer_id)
            except Exception:
                customer_uuid = None
        email_stub = name.lower().replace(" ", "")
        unique = str(customer_uuid or uuid.uuid4())[:8]
        customer_kwargs = dict(
            name=name,
            email=f"{email_stub}.{unique}@example.com",
            behavior_profile={"purchase_intent": "HIGH", "notification_fatigue": "LOW"},
            current_state={},
        )
        if customer_uuid:
            customer_kwargs["id"] = customer_uuid
        customer = Customer(**customer_kwargs)
        await customer.insert()

    if request.specialist_context:
        customer.current_state = {
            **(customer.current_state or {}),
            "specialist_context": request.specialist_context,
        }
        await customer.save()

    amount = 3499.0 if event_type == EventType.CART_ABANDONMENT else 4999.0

    event = RevenueEventSchema(
        customer_id=customer.id,
        merchant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
        event_type=event_type,
        amount_at_risk=amount
    )

    # Clear deduplication entry so we can re-run
    dedup_key = f"{event.customer_id}:{event.event_type}"
    event_deduplicator.seen_events.pop(dedup_key, None)

    res = await event_engine.publish_event(event)

    if not res or "run_id" not in res:
        raise HTTPException(status_code=500, detail=f"Failed to create scenario run: {res}")

    run_id = uuid.UUID(res["run_id"])

    run = await AgentRun.find_one(AgentRun.run_id == run_id)
    db_event = await RevenueEvent.find_one(RevenueEvent.event_id == event.event_id)

    if not run or not db_event:
        raise HTTPException(status_code=500, detail="Failed to find run/event in DB")

    sim = SimulationState(
        run_id=run_id,
        customer_id=customer.id,
        event_id=db_event.event_id,
        scenario_type=scenario_type
    )
    await sim.insert()

    agent = agent_registry.get_agent(run.agent_id)
    context = await intelligence_service.get_specialist_context(run.customer_id, run.agent_id)
    async def run_decision():
        try:
            await decision_engine.make_decision(run, db_event.model_dump(), context, agent.profile)
        except Exception as e:
            run.status = "FAILED"
            await run.save()
            import traceback
            print(f"[ERROR] Decision task failed: {e}")
            traceback.print_exc()

    asyncio.create_task(run_decision())

    return {
        "scenario_id": str(sim.scenario_id),
        "run_id": str(run_id),
        "customer": customer.name,
        "event_type": event_type_str,
        "agent": agent.name if agent else event_type_str,
        "specialist_context": context,
    }


@router.get("/{scenario_id}/context")
async def get_scenario_context(scenario_id: uuid.UUID):
    sim = await SimulationState.find_one(SimulationState.scenario_id == scenario_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Scenario not found")
    customer = await Customer.find_one(Customer.id == sim.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    run = await AgentRun.find_one(AgentRun.run_id == sim.run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Scenario run not found")
    return await intelligence_service.get_specialist_context(customer.id, run.agent_id)


@router.get("/{scenario_id}/evidence")
async def get_scenario_evidence(scenario_id: uuid.UUID):
    sim = await SimulationState.find_one(SimulationState.scenario_id == scenario_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Scenario not found")
    customer = await Customer.find_one(Customer.id == sim.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    run = await AgentRun.find_one(AgentRun.run_id == sim.run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Scenario run not found")
    data = await intelligence_service.get_specialist_context(customer.id, run.agent_id)
    return {"evidence_cards": data.get("evidence_cards", []), "agent": data.get("agent")}


@router.get("/{scenario_id}/data-access")
async def get_scenario_data_access(scenario_id: uuid.UUID):
    sim = await SimulationState.find_one(SimulationState.scenario_id == scenario_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Scenario not found")
    customer = await Customer.find_one(Customer.id == sim.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    run = await AgentRun.find_one(AgentRun.run_id == sim.run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Scenario run not found")
    data = await intelligence_service.get_specialist_context(customer.id, run.agent_id)
    return data.get("data_access_audit", {})
