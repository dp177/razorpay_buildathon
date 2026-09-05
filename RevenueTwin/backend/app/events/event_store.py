from datetime import datetime, timedelta
from app.events.schemas import RevenueEventSchema

class EventDeduplicator:
    def __init__(self):
        # Very simple in-memory deduplication for development
        # Key: "customer_id:event_type"
        # Value: datetime
        self.seen_events = {}
        
    def is_duplicate(self, event: RevenueEventSchema, window_minutes: int = 60) -> bool:
        key = f"{event.customer_id}:{event.event_type}"
        now = datetime.utcnow()
        
        if key in self.seen_events:
            last_seen = self.seen_events[key]
            if (now - last_seen) < timedelta(minutes=window_minutes):
                return True
                
        self.seen_events[key] = now
        return False

class EventPrioritizer:
    @staticmethod
    def calculate_priority(event: RevenueEventSchema) -> str:
        if event.amount_at_risk > 1000:
            return "CRITICAL"
        elif event.amount_at_risk > 500:
            return "HIGH"
        elif event.amount_at_risk > 100:
            return "MEDIUM"
        return "LOW"

event_deduplicator = EventDeduplicator()
event_prioritizer = EventPrioritizer()
