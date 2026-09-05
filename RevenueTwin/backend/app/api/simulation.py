from fastapi import APIRouter, HTTPException
import uuid
from pydantic import BaseModel

from app.simulation.engine import simulation_engine

router = APIRouter()

class AdvanceTimeRequest(BaseModel):
    scenario_id: uuid.UUID
    hours: int

@router.post("/advance")
async def advance_simulation(request: AdvanceTimeRequest):
    # Actually, we index by run_id in the simulation engine for now
    # Let's just find the run_id from the scenario_id, but our SimulationState has both
    from app.models.domain import SimulationState
    sim = await SimulationState.find_one(SimulationState.scenario_id == request.scenario_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    result = await simulation_engine.advance_time(sim.run_id, request.hours)
    return result

@router.get("/{scenario_id}")
async def get_simulation_state(scenario_id: uuid.UUID):
    from app.models.domain import SimulationState
    sim = await SimulationState.find_one(SimulationState.scenario_id == scenario_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim
