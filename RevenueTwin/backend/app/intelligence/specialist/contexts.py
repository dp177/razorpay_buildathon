"""
Specialist context schemas for each revenue-loss agent.
Each schema contains ONLY the fields that agent needs.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime


# ─────────────────────────────────────────────────────
# CART RECOVERY AGENT
# ─────────────────────────────────────────────────────
class CartSession(BaseModel):
    timestamp: datetime
    product_name: str
    category: str
    cart_value: float
    checkout_started: bool
    checkout_completed: bool
    recovery_attempted: bool
    recovery_response: Optional[str] = None  # CONVERTED, IGNORED, CLICKED

class CartRecoveryContext(BaseModel):
    agent: str = "CartRecoveryAgent"
    data_accessed: List[str] = ["cart_history", "checkout_history", "product_affinity", "purchase_intent", "notification_fatigue"]
    data_not_accessed: List[str] = ["b2b_invoice_history", "mandate_history", "subscription_history", "voice_history"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str

    # Current event
    cart_value: float
    items_count: int
    cart_age_minutes: int
    checkout_started: bool
    checkout_stage: Optional[str] = None  # SHIPPING, PAYMENT, REVIEW
    cart_abandoned_at: Optional[datetime] = None

    # Task-specific history
    historical_cart_count: int
    historical_checkout_count: int
    historical_purchase_count: int
    historical_abandonment_count: int
    historical_cart_conversion_rate: float  # 0.0-1.0
    historical_average_cart_value: float
    past_sessions: List[CartSession]

    # Behavioral signals
    days_since_last_purchase: int
    purchase_intent: float  # 0.0-1.0
    price_sensitivity: float  # 0.0-1.0
    notification_fatigue: float  # 0.0-1.0
    previous_recovery_attempts: int
    previous_recovery_success_rate: float

    # Derived evidence signals
    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# CHECKOUT RECOVERY AGENT
# ─────────────────────────────────────────────────────
class CheckoutRecoveryContext(BaseModel):
    agent: str = "CheckoutRecoveryAgent"
    data_accessed: List[str] = ["checkout_history", "payment_methods", "session_data", "friction_signals"]
    data_not_accessed: List[str] = ["b2b_invoice_history", "mandate_history", "subscription_history"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str

    checkout_id: Optional[str] = None
    checkout_started_at: Optional[datetime] = None
    checkout_duration_minutes: int
    checkout_stage: str  # SHIPPING, PAYMENT, REVIEW, OTP
    last_completed_stage: Optional[str] = None
    dropoff_stage: str
    cart_value: float
    items_count: int

    payment_method_selected: bool
    payment_method: Optional[str] = None
    payment_attempted: bool
    payment_error: Optional[str] = None

    historical_checkout_count: int
    historical_checkout_completion_rate: float
    previous_dropoff_stages: List[str]
    checkout_attempt_count: int

    purchase_intent: float
    notification_fatigue: float
    previous_interventions: int

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# PAYMENT RECOVERY AGENT
# ─────────────────────────────────────────────────────
class PaymentRecoveryContext(BaseModel):
    agent: str = "PaymentRecoveryAgent"
    data_accessed: List[str] = ["payment_history", "failure_analysis", "retry_eligibility", "alternate_methods"]
    data_not_accessed: List[str] = ["cart_history", "b2b_invoice_history", "mandate_history", "subscription_history"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str

    payment_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    payment_method: str
    payment_method_type: str  # CARD, UPI, NETBANKING, WALLET
    card_network: Optional[str] = None  # VISA, MC, AMEX

    failure_code: str
    failure_category: str  # TRANSIENT, PERMANENT, ISSUER_DECLINE, FRAUD, TIMEOUT
    failure_reason: str
    attempt_number: int

    historical_payment_count: int
    historical_success_count: int
    historical_failure_count: int
    payment_success_rate: float
    last_successful_payment_days_ago: int

    retry_eligible: bool
    alternate_payment_available: bool
    alternate_methods: List[str]

    customer_value: float  # lifetime value
    risk_flags: List[str]

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# SUBSCRIPTION RECOVERY AGENT
# ─────────────────────────────────────────────────────
class RenewalRecord(BaseModel):
    month: int
    status: str  # SUCCESS, FAILED, SKIPPED
    amount: float
    payment_method: str

class SubscriptionRecoveryContext(BaseModel):
    agent: str = "SubscriptionRecoveryAgent"
    data_accessed: List[str] = ["subscription_lifecycle", "renewal_history", "usage_data", "payment_methods"]
    data_not_accessed: List[str] = ["cart_history", "checkout_history", "b2b_invoice_history", "mandate_history"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str

    subscription_id: Optional[str] = None
    plan_name: str
    plan_price: float
    billing_cycle: str  # MONTHLY, ANNUAL
    subscription_age_months: int

    renewal_date: Optional[datetime] = None
    days_overdue: int
    failure_reason: str
    attempt_number: int
    grace_period_remaining_days: int

    total_renewals: int
    successful_renewals: int
    failed_renewals: int
    renewal_success_rate: float
    renewal_history: List[RenewalRecord]

    backup_payment_method: Optional[str] = None
    backup_available: bool

    subscription_usage: str  # HIGH, MEDIUM, LOW
    feature_usage: List[str]
    engagement_frequency: str  # DAILY, WEEKLY, MONTHLY

    customer_lifetime_value: float

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# CHURN PREVENTION AGENT
# ─────────────────────────────────────────────────────
class ChurnPreventionContext(BaseModel):
    agent: str = "ChurnPreventionAgent"
    data_accessed: List[str] = ["purchase_behavior", "engagement_metrics", "support_history", "communication_response"]
    data_not_accessed: List[str] = ["b2b_invoice_history", "mandate_history", "checkout_history"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str

    customer_age_months: int
    last_purchase_days_ago: int
    purchase_frequency_30d: int
    purchase_frequency_30d_prev: int  # previous period for comparison
    average_order_value: float
    average_order_value_prev: float
    monthly_spend: float
    monthly_spend_prev: float
    total_orders: int
    return_count: int
    return_rate: float

    login_frequency_weekly: float
    session_frequency_change: float  # negative = declining
    engagement_score: float  # 0.0-1.0
    engagement_trend: str  # DECLINING, STABLE, IMPROVING

    support_tickets_30d: int
    complaint_count: int
    discount_usage_rate: float

    communication_response_rate: float
    notification_fatigue: float

    churn_risk_score: float  # 0.0-1.0
    churn_signals: List[str]

    previous_retention_actions: int
    previous_retention_success: bool

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# B2B RECEIVABLES AGENT
# ─────────────────────────────────────────────────────
class InvoiceRecord(BaseModel):
    invoice_id: str
    amount: float
    issued_date: str
    due_date: str
    status: str  # PAID, OVERDUE, DISPUTED, PARTIAL
    days_to_pay: Optional[int] = None

class B2BReceivablesContext(BaseModel):
    agent: str = "B2BReceivablesAgent"
    data_accessed: List[str] = ["invoice_history", "payment_terms", "promise_history", "contact_behavior", "account_profile"]
    data_not_accessed: List[str] = ["cart_history", "checkout_history", "subscription_history"]

    customer_id: UUID
    company_name: str
    account_type: str = "BUSINESS"
    industry: str
    account_tenure_months: int

    credit_limit: float
    credit_terms: str  # NET_30, NET_60
    payment_terms: str

    current_invoice_id: Optional[str] = None
    invoice_amount: float
    invoice_created_at: Optional[datetime] = None
    invoice_due_date: Optional[datetime] = None
    days_overdue: int
    outstanding_balance: float
    total_outstanding: float
    open_invoice_count: int

    historical_invoice_count: int
    historical_paid_count: int
    average_days_to_pay: float
    on_time_payment_rate: float
    late_payment_rate: float
    partial_payment_rate: float
    dispute_rate: float
    invoice_history: List[InvoiceRecord]

    promise_to_pay_count: int
    promise_fulfillment_rate: float

    last_payment_days_ago: int
    contact_response_rate: float
    relationship_value: float  # account lifetime value

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# MANDATE RECOVERY AGENT
# ─────────────────────────────────────────────────────
class MandateRecoveryContext(BaseModel):
    agent: str = "MandateRecoveryAgent"
    data_accessed: List[str] = ["mandate_history", "debit_schedule", "backup_methods"]
    data_not_accessed: List[str] = ["cart_history", "b2b_invoice_history", "checkout_history", "churn_signals"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str

    mandate_id: Optional[str] = None
    mandate_type: str  # NACH, UPI_AUTOPAY, SI
    mandate_status: str  # ACTIVE, EXPIRED, FAILED, PENDING
    scheduled_debit_date: Optional[datetime] = None
    amount: float
    currency: str = "INR"

    failure_reason: str
    failure_code: str
    attempt_number: int

    successful_debits: int
    failed_debits: int
    mandate_success_rate: float
    days_until_next_debit: int

    backup_payment_available: bool
    backup_methods: List[str]

    customer_payment_history_score: float  # 0.0-1.0

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# PROMISE-TO-PAY AGENT
# ─────────────────────────────────────────────────────
class PromiseRecord(BaseModel):
    promise_id: str
    promised_amount: float
    promised_date: str
    status: str  # FULFILLED, BROKEN, PENDING

class PromiseToPayContext(BaseModel):
    agent: str = "PromiseToPayAgent"
    data_accessed: List[str] = ["promise_history", "invoice_data", "contact_history", "payment_history"]
    data_not_accessed: List[str] = ["cart_history", "checkout_history", "subscription_history"]

    customer_id: UUID
    customer_name: str
    company_name: Optional[str] = None

    promise_id: Optional[str] = None
    promised_amount: float
    outstanding_amount: float
    promised_date: Optional[datetime] = None
    days_until_promise: int
    days_since_promise: int

    total_promises: int
    fulfilled_promises: int
    broken_promises: int
    promise_fulfillment_rate: float
    promise_history: List[PromiseRecord]

    contact_response_rate: float
    previous_reminders: int
    previous_escalations: int

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# PAYMENT DEGRADATION AGENT
# ─────────────────────────────────────────────────────
class PaymentDegradationContext(BaseModel):
    agent: str = "PaymentDegradationAgent"
    data_accessed: List[str] = ["transaction_metrics", "failure_distribution", "trend_analysis"]
    data_not_accessed: List[str] = ["cart_history", "b2b_invoice_history", "subscription_history", "churn_signals"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str

    time_window_days: int = 30
    transaction_count: int
    successful_transactions: int
    failed_transactions: int
    current_success_rate: float
    previous_success_rate: float
    success_rate_change: float  # negative = declining

    failure_rate: float
    failure_rate_change: float
    recent_failure_streak: int

    failure_reason_distribution: Dict[str, int]
    payment_method_distribution: Dict[str, float]
    issuer_distribution: Dict[str, float]

    retry_success_rate: float
    alternate_payment_success_rate: float

    evidence: List[str] = []


# ─────────────────────────────────────────────────────
# VOICE RECOVERY AGENT
# ─────────────────────────────────────────────────────
class VoiceRecoveryContext(BaseModel):
    agent: str = "VoiceRecoveryAgent"
    data_accessed: List[str] = ["contact_history", "customer_value", "communication_preference", "escalation_history"]
    data_not_accessed: List[str] = ["cart_history", "checkout_history", "b2b_invoice_history"]

    customer_id: UUID
    customer_name: str
    customer_archetype: str
    account_type: str  # CONSUMER, BUSINESS

    customer_value: float
    outstanding_amount: float
    issue_type: str  # PAYMENT_FAILURE, CHURN_RISK, HIGH_OVERDUE

    previous_contact_count: int
    previous_contact_channels: List[str]
    contact_response_rate: float
    preferred_contact_time: Optional[str] = None
    preferred_language: str = "English"
    communication_fatigue: float

    previous_voice_interactions: int
    voice_success_rate: float
    escalation_count: int
    customer_sentiment_signal: str  # POSITIVE, NEUTRAL, NEGATIVE, FRUSTRATED

    evidence: List[str] = []
