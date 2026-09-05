import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

from app.models.domain import SimulationState, AgentRun, ExecutionRecord, ActionOutcome, Customer, AgentTrace, AgentDecision
from app.simulation.customer_behavior import behavior_engine
from app.events.event_engine import event_engine

class SimulationEngine:
    """
    Manages the virtual clock and drives the scenario forward.
    """
    async def advance_time(self, run_id: uuid.UUID, hours: int) -> Dict[str, Any]:
        sim = await SimulationState.find_one(SimulationState.run_id == run_id)
        if not sim or sim.status == "COMPLETED":
            return {"status": "NO_ACTION", "message": "Simulation not found or completed"}
            
        # 1. Advance virtual time
        sim.virtual_time += timedelta(hours=hours)
        await sim.save()
        
        # 2. Add trace for time advancement
        await AgentTrace(
            run_id=run_id,
            stage="SIMULATION",
            message=f"{hours} hours advanced. Virtual time is now {sim.virtual_time.strftime('%Y-%m-%d %H:%M')}"
        ).insert()
        
        # 3. Check for pending executions that need observation
        # An execution happens, then we observe the customer's response
        exec_records = await ExecutionRecord.find(ExecutionRecord.run_id == run_id).sort("-timestamp").to_list()
        
        if not exec_records:
            return {"status": "ADVANCED", "message": "Time advanced, but no execution pending"}
            
        latest_exec = exec_records[0]
        
        # Did we already produce an outcome for this execution?
        existing_outcome = await ActionOutcome.find_one(ActionOutcome.execution_id == latest_exec.execution_id)
        if existing_outcome:
            return {"status": "ADVANCED", "message": "Outcome already finalized"}
            
        # Get customer to evaluate behavior
        customer = await Customer.find_one(Customer.id == sim.customer_id)
        
        # How much time has passed since execution?
        elapsed_dt = sim.virtual_time - latest_exec.timestamp.replace(tzinfo=None)
        elapsed_hours = elapsed_dt.total_seconds() / 3600
        
        # Evaluate customer response
        response = await behavior_engine.evaluate_response(
            str(customer.id), 
            str(run_id), 
            customer.current_state,
            customer.behavior_profile, 
            latest_exec.action, 
            elapsed_hours
        )
        
        if response == "NO_RESPONSE":
            await AgentTrace(
                run_id=run_id,
                stage="OBSERVATION",
                message="No customer response detected yet."
            ).insert()
            return {"status": "ADVANCED", "message": "Time advanced, no response yet"}
            
        # We got a response!
        from app.execution.engine import execution_engine
        
        # Map probabilistic response to SUCCESS or FAILED for the engine
        resolved_status = "SUCCESS" if response in ["PURCHASED", "OFFER_ACCEPTED", "PROMISE_FULFILLED"] else "FAILED"
        
        # Call the execution engine to handle the outcome AND the temporal plan
        await execution_engine.resolve_execution(latest_exec.execution_id, resolved_status)
        
        # Check if the run completed
        run = await AgentRun.find_one(AgentRun.run_id == run_id)
        if run.status == "COMPLETED":
            sim.status = "COMPLETED"
            await sim.save()
            return {"status": "COMPLETED", "message": f"Scenario concluded with: {response}"}
            
        return {"status": "AGENT_REACTIVATED", "message": f"Scenario advanced. Response was {response}, fallback plan activated."}

simulation_engine = SimulationEngine()
