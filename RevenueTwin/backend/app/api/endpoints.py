from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from uuid import UUID
from app.models.domain import AgentModel, AgentRun, AgentDecision, RevenueEvent, AgentTrace, Customer, ActionOutcome, ExecutionRecord, ApprovalRecord
from app.events.schemas import RevenueEventSchema
from app.events.event_engine import event_engine
from app.agents.registry import agent_registry
from app.agents.orchestrator import master_orchestrator
import uuid

router = APIRouter()

from app.api.demo import router as demo_router
from app.api.scenarios import router as scenarios_router
from app.api.simulation import router as simulation_router

router.include_router(demo_router, prefix="/demo", tags=["demo"])
router.include_router(scenarios_router, prefix="/scenarios", tags=["scenarios"])
router.include_router(simulation_router, prefix="/simulation", tags=["simulation"])

from app.api.agents import AGENT_DESCRIPTIONS

@router.get("/agents")
async def get_agents():
    agents = agent_registry.list_agents()
    result = []
    for a in agents:
        specialist = AGENT_DESCRIPTIONS.get(a.agent_id, {})
        result.append({
            "agent_id": a.agent_id,
            "name": a.name,
            "status": a.get_status(),
            "data_accessed": specialist.get("data_accessed", []),
            "data_not_accessed": specialist.get("data_not_accessed", []),
        })
    return result

@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    agent = agent_registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    specialist = AGENT_DESCRIPTIONS.get(agent_id, {})
    return {
        "agent_id": agent.agent_id,
        "name": agent.name,
        "supported_event_types": agent.supported_event_types,
        "allowed_actions": agent.allowed_actions,
        "status": agent.get_status(),
        "data_accessed": specialist.get("data_accessed", []),
        "data_not_accessed": specialist.get("data_not_accessed", []),
        "objective": specialist.get("objective", ""),
    }

@router.post("/events")
async def create_event(event: RevenueEventSchema):
    result = await event_engine.publish_event(event)
    return result

@router.post("/events/simulate")
async def simulate_event(req: dict):
    customer_id_str = req.get("customer_id")
    event_type = req.get("event_type")
    
    if not customer_id_str or not event_type:
        raise HTTPException(status_code=400, detail="Missing customer_id or event_type")
        
    customer = await Customer.find_one(Customer.id == UUID(customer_id_str))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    event = RevenueEventSchema(
        customer_id=customer.id,
        merchant_id=UUID("00000000-0000-0000-0000-000000000000"), # Default merchant
        event_type=event_type,
        amount_at_risk=4999.00
    )
    
    # Normally this would be backgrounded.
    # We await it directly so the simulator can get the result instantly.
    res = await event_engine.publish_event(event)
    return res

@router.get("/events")
async def get_events():
    events = await RevenueEvent.find_all().sort("-timestamp").limit(50).to_list()
    return events

@router.get("/events/{event_id}")
async def get_event(event_id: UUID):
    event = await RevenueEvent.find_one(RevenueEvent.event_id == event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.get("/events/{event_id}/run")
async def get_run_for_event(event_id: UUID):
    run = await AgentRun.find_one(AgentRun.event_id == event_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found for event")
    return run

@router.get("/agent-runs")
async def get_agent_runs():
    runs = await AgentRun.find_all().to_list()
    return runs

@router.get("/agent-runs/{run_id}/traces")
async def get_agent_traces(run_id: UUID):
    traces = await AgentTrace.find(AgentTrace.run_id == run_id).sort("timestamp").to_list()
    return traces

@router.post("/agent-runs/{run_id}/decide")
async def make_agent_decision(run_id: UUID):
    from app.intelligence.service import intelligence_service
    from app.decisions.engine import decision_engine
    
    run = await AgentRun.find_one(AgentRun.run_id == run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    event = await RevenueEvent.find_one(RevenueEvent.event_id == run.event_id)
    agent = agent_registry.get_agent(run.agent_id)
    context = await intelligence_service.get_specialist_context(run.customer_id, run.agent_id)
    
    result = await decision_engine.make_decision(run, event.model_dump(), context, agent.profile)
    return result

@router.get("/agent-runs/{run_id}/decision")
async def get_agent_decision(run_id: UUID):
    decision = await AgentDecision.find_one(AgentDecision.run_id == run_id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision

@router.get("/agent-runs/{run_id}")
async def get_agent_run(run_id: uuid.UUID):
    from app.models.domain import AgentRun
    from fastapi import HTTPException
    run = await AgentRun.find_one(AgentRun.run_id == run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.get("/agent-runs/{run_id}/traces")
async def get_agent_run_traces(run_id: uuid.UUID):
    from app.models.domain import AgentTrace
    traces = await AgentTrace.find(AgentTrace.run_id == run_id).sort("timestamp").to_list()
    return traces

@router.get("/agent-runs/{run_id}/timeline")
async def get_agent_run_timeline(run_id: uuid.UUID):
    from app.models.domain import AgentDecision, ApprovalRecord, ExecutionRecord, ActionOutcome
    decisions = await AgentDecision.find(AgentDecision.run_id == run_id).to_list()
    approvals = await ApprovalRecord.find(ApprovalRecord.run_id == run_id).to_list()
    executions = await ExecutionRecord.find(ExecutionRecord.run_id == run_id).to_list()
    outcomes = await ActionOutcome.find(ActionOutcome.run_id == run_id).to_list()
    return {"decisions": decisions, "approvals": approvals, "executions": executions, "outcomes": outcomes}

@router.post("/agent-runs/{run_id}/approve")
async def approve_agent_run(run_id: UUID, payload: dict):
    from app.execution.engine import execution_engine
    from fastapi import HTTPException
    import traceback
    try:
        result = await execution_engine.approve(run_id, True, payload.get("approved_by", "system"))
        return {"status": "APPROVED", "approval_id": str(result.approval_id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Approve error: {str(e)}")

@router.post("/agent-runs/{run_id}/reject")
async def reject_agent_run(run_id: UUID, payload: dict):
    from app.execution.engine import execution_engine
    from fastapi import HTTPException
    import traceback
    try:
        result = await execution_engine.approve(run_id, False, payload.get("approved_by", "system"))
        return {"status": "REJECTED", "approval_id": str(result.approval_id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Reject error: {str(e)}")

@router.post("/agent-runs/{run_id}/execute")
async def execute_agent_run(run_id: UUID):
    from app.execution.engine import execution_engine
    from fastapi import HTTPException
    import traceback
    try:
        execution = await execution_engine.execute(run_id)
        return {"status": execution.status, "execution_id": str(execution.execution_id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Execute error: {str(e)}")

class ResolveRequest(BaseModel):
    customer_response: str
    execution_id: UUID

@router.post("/agent-runs/{run_id}/resolve")
async def resolve_agent_run(run_id: UUID, req: ResolveRequest):
    from app.execution.engine import execution_engine
    from fastapi import HTTPException
    import traceback
    try:
        outcome = await execution_engine.resolve_execution(req.execution_id, req.customer_response)
        return {"status": outcome.status, "outcome_id": str(outcome.outcome_id if hasattr(outcome, 'outcome_id') else outcome.id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Resolve error: {str(e)}")

class NegotiateRequest(BaseModel):
    customer_feedback: str
    execution_id: UUID

@router.post("/agent-runs/{run_id}/negotiate")
async def negotiate_agent_run(run_id: UUID, req: NegotiateRequest):
    from app.execution.engine import execution_engine
    from app.decisions.engine import decision_engine
    from app.intelligence.service import intelligence_service
    from app.api.agents import agent_registry
    from fastapi import HTTPException
    import datetime
    
    run = await AgentRun.find_one(AgentRun.run_id == run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    execution = await ExecutionRecord.find_one(ExecutionRecord.execution_id == req.execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    # Check max negotiation limit (max 2)
    # We count how many decisions this run has
    decisions = await AgentDecision.find(AgentDecision.run_id == run_id).to_list()
    # 1 initial decision + 2 negotiations = 3 total decisions max allowed before rejecting.
    # If len(decisions) >= 3, they've already negotiated twice!
    if len(decisions) >= 3:
        raise HTTPException(status_code=400, detail="Maximum number of negotiation loops (2) reached.")
        
    execution.status = "NEGOTIATION_REQUESTED"
    await execution.save()
    
    run.status = "DECIDING"
    await run.save()
    
    event = await RevenueEvent.find_one(RevenueEvent.event_id == run.event_id)
    agent = agent_registry.get_agent(run.agent_id)
    context = await intelligence_service.get_specialist_context(run.customer_id, run.agent_id)
    
    # 2nd call to engine with customer_feedback
    result = await decision_engine.make_decision(run, event.model_dump(), context, agent.profile, customer_feedback=req.customer_feedback)
    return result

@router.get("/executions")
async def list_executions():
    from app.models.domain import ExecutionRecord
    return await ExecutionRecord.find_all().to_list()
    
@router.get("/executions/{execution_id}")
async def get_execution(execution_id: UUID):
    from app.models.domain import ExecutionRecord
    from fastapi import HTTPException
    exe = await ExecutionRecord.find_one(ExecutionRecord.execution_id == execution_id)
    if not exe:
        raise HTTPException(status_code=404, detail="Execution not found")
    return exe

@router.post("/policies/calibrate")
async def trigger_calibration():
    from app.policies.calibrator import policy_calibrator
    return await policy_calibrator.run_calibration()
    
@router.get("/executions/{execution_id}/outcome")
async def get_execution_outcome(execution_id: UUID):
    from app.models.domain import ActionOutcome
    from fastapi import HTTPException
    outcome = await ActionOutcome.find_one(ActionOutcome.execution_id == execution_id)
    if not outcome:
        raise HTTPException(status_code=404, detail="Outcome not found")
    return outcome


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: POST /api/agents/{agent_id}/decide
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/agents/{agent_id}/decide")
async def agent_decide(agent_id: str, body: dict):
    """
    Step 6 canonical decision endpoint.

    Request:  {"scenario_id": "<optional uuid>"}
    Response: Full Step 6 decision with evidence, rationale, metadata.

    The LLM receives ONLY the specialist context for this agent_id.
    Invalid actions are blocked. LLM unavailability returns a deterministic fallback.
    No production payments are executed.
    """
    from app.intelligence.service import intelligence_service
    from app.decisions.engine import decision_engine
    from app.models.domain import AgentRun, RevenueEvent, Customer
    from app.events.schemas import RevenueEventSchema
    import uuid as _uuid

    agent = agent_registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    scenario_id = body.get("scenario_id")

    # ── Try to load an existing run by scenario_id ──────────────────────────
    run = None
    event_dict = {}
    customer_id = None

    if scenario_id:
        try:
            scenario_uuid = UUID(scenario_id)
            from app.models.domain import SimulationState
            sim = await SimulationState.find_one(SimulationState.scenario_id == scenario_uuid)
            if sim:
                run = await AgentRun.find_one(AgentRun.run_id == sim.run_id)
                customer_id = sim.customer_id
                rev_event = await RevenueEvent.find_one(RevenueEvent.event_id == sim.event_id)
                if rev_event:
                    event_dict = rev_event.model_dump()
        except (ValueError, Exception):
            pass  # invalid UUID or missing sim — create synthetic run below

    # ── Synthetic run for demo / testing ────────────────────────────────────
    if not run:
        # Find or create a demo customer
        customer = await Customer.find_one()
        if not customer:
            raise HTTPException(status_code=400, detail="No customers found. Seed data first.")
        customer_id = customer.id
        merchant_id = _uuid.UUID("00000000-0000-0000-0000-000000000000")

        # Map agent_id → canonical event type
        _agent_event_map = {
            "cart_recovery": "CART_ABANDONMENT",
            "checkout_recovery": "CHECKOUT_DROPOFF",
            "payment_recovery": "PAYMENT_FAILED",
            "subscription_recovery": "SUBSCRIPTION_PAYMENT_FAILURE",
            "churn_prevention": "SUBSCRIPTION_CHURN_RISK",
            "b2b_receivables": "RECEIVABLE_OVERDUE",
            "receivables": "RECEIVABLE_OVERDUE",
            "mandate_recovery": "MANDATE_FAILURE",
            "promise_to_pay": "PROMISE_TO_PAY_DUE",
            "payment_degradation": "PAYMENT_DEGRADATION",
            "voice_recovery": "VOICE_RECOVERY_REQUIRED",
        }
        event_type = _agent_event_map.get(agent_id, "CART_ABANDONMENT")

        rev_event = RevenueEvent(
            customer_id=customer_id,
            merchant_id=merchant_id,
            event_type=event_type,
            amount_at_risk=4999.00,
        )
        await rev_event.insert()
        event_dict = rev_event.model_dump()

        run = AgentRun(
            agent_id=agent_id,
            event_id=rev_event.event_id,
            customer_id=customer_id,
            status="READY_FOR_DECISION",
            priority="HIGH",
        )
        await run.insert()

    # ── Build specialist context ─────────────────────────────────────────────
    context = await intelligence_service.get_specialist_context(customer_id, agent_id)

    # ── Run decision engine ──────────────────────────────────────────────────
    result = await decision_engine.make_decision(run, event_dict, context, agent.profile)

    # ── Step 6 canonical response ────────────────────────────────────────────
    decision_info = result.get("decision", {})
    return {
        "decision_id": result.get("decision_id"),
        "agent_id": agent_id,
        "scenario_id": scenario_id,
        "run_id": result.get("run_id"),
        "decision": decision_info.get("action"),
        "confidence": decision_info.get("confidence"),
        "evidence": decision_info.get("evidence", []),
        "rationale": decision_info.get("rationale"),
        "observation_window_hours": decision_info.get("observation_window_hours", 24),
        "requires_approval": decision_info.get("requires_approval", True),
        "status": result.get("status"),
        "decision_metadata": {
            "decision_source": decision_info.get("decision_source"),
            "model_provider": decision_info.get("model_provider"),
            "model_name": decision_info.get("model_name"),
            "prompt_version": "6.0",
            "context_version": "1.0",
            "validation_status": decision_info.get("validation_status"),
            "llm_used": decision_info.get("llm_used"),
            "risk_flags": decision_info.get("risk_flags", []),
        },
    }


@router.get("/llm/health")
async def llm_health():
    """LLM provider health check — never exposes API keys."""
    from app.decisions.engine import decision_engine
    result = await decision_engine.llm.health_check()
    # Strip any key that could contain credentials
    safe = {k: v for k, v in result.items() if k not in {"api_key", "token", "secret", "key"}}
    return safe

