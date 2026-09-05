from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID, uuid4
from typing import Dict, Any, Optional

class RevenueEventSchema(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    merchant_id: UUID
    event_type: str
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    amount_at_risk: float = 0.0
    source: str = "SYSTEM"
    severity: str = "MEDIUM"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    order_id: Optional[UUID] = None
    payment_id: Optional[UUID] = None
    cart_id: Optional[UUID] = None
    checkout_session_id: Optional[UUID] = None
    subscription_id: Optional[UUID] = None
    invoice_id: Optional[UUID] = None
    promise_id: Optional[UUID] = None
