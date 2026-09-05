from app.events.schemas import RevenueEventSchema

class EventNormalizer:
    @staticmethod
    def normalize(raw_event_data: dict) -> RevenueEventSchema:
        # Ensures that raw dictionaries coming from external systems or detectors
        # adhere to our strong RevenueEventSchema
        return RevenueEventSchema(**raw_event_data)

event_normalizer = EventNormalizer()
