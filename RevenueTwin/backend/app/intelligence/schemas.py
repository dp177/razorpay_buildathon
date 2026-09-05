from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

class TimelineEvent(BaseModel):
    timestamp: datetime
    event_type: str
    amount: Optional[float] = None
    details: Dict[str, Any] = Field(default_factory=dict)

class BehaviorFeatures(BaseModel):
    purchase_frequency: float = 0.0
    orders_last_30d: int = 0
    orders_last_90d: int = 0
    average_order_value: float = 0.0
    median_order_value: float = 0.0
    purchase_recency_days: Optional[int] = None
    customer_lifetime_value: float = 0.0
    gross_revenue: float = 0.0
    net_revenue: float = 0.0
    payment_success_rate: float = 0.0
    payment_failure_rate: float = 0.0
    retry_success_rate: float = 0.0
    payment_method_success_rate: Dict[str, float] = Field(default_factory=dict)
    cart_abandonment_rate: float = 0.0
    checkout_abandonment_rate: float = 0.0
    checkout_completion_rate: float = 0.0
    return_rate: float = 0.0
    refund_rate: float = 0.0
    subscription_tenure_months: int = 0
    subscription_failure_rate: float = 0.0
    subscription_pause_rate: float = 0.0
    notification_response_rate: float = 0.0
    notification_ignore_rate: float = 0.0
    notification_fatigue: float = 0.0
    average_invoice_delay_days: float = 0.0
    overdue_invoice_rate: float = 0.0
    promise_to_pay_success_rate: float = 0.0
    promise_to_pay_break_rate: float = 0.0
    customer_engagement_score: float = 0.0
    purchase_intent: float = 0.0
    payment_reliability: float = 0.0
    recovery_propensity: float = 0.0
    churn_risk: float = 0.0

class CustomerContext(BaseModel):
    customer_id: UUID
    customer_summary: Dict[str, Any]
    current_event: Optional[Dict[str, Any]] = None
    recent_history: List[TimelineEvent] = Field(default_factory=list)
    relevant_behavior_features: BehaviorFeatures
    relevant_payment_history: List[Dict[str, Any]] = Field(default_factory=list)
    relevant_purchase_history: List[Dict[str, Any]] = Field(default_factory=list)
    relevant_recovery_history: List[Dict[str, Any]] = Field(default_factory=list)
    risk_signals: List[str] = Field(default_factory=list)
    fatigue_signals: List[str] = Field(default_factory=list)
