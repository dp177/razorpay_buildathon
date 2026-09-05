from typing import List
from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.models.domain import Payment, Cart, Invoice
from app.events.schemas import RevenueEventSchema
from app.events.event_types import EventType

class EventDetector:
    @staticmethod
    async def detect_payment_failures(window_minutes: int = 15) -> List[RevenueEventSchema]:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        cutoff = now - timedelta(minutes=window_minutes)
        
        failed_payments = await Payment.find(
            Payment.status == "FAILED",
            Payment.timestamp >= cutoff
        ).to_list()
        
        events = []
        for p in failed_payments:
            events.append(RevenueEventSchema(
                customer_id=p.customer_id,
                merchant_id=UUID("00000000-0000-0000-0000-000000000000"),
                event_type=EventType.PAYMENT_FAILED,
                amount_at_risk=p.amount,
                source="DATABASE_DETECTOR",
                severity="HIGH",
                payment_id=p.payment_id,
                order_id=p.order_id
            ))
        return events

event_detector = EventDetector()
