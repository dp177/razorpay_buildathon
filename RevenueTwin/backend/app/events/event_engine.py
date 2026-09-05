from app.events.schemas import RevenueEventSchema
from app.events.event_bus import event_bus
from app.agents.orchestrator import master_orchestrator

class EventEngine:
    async def publish_event(self, event: RevenueEventSchema):
        return await master_orchestrator.process_event(event)
        
event_engine = EventEngine()
