from beanie import Document
from pydantic import Field, BaseModel
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List, Dict, Any

class BaseDocument(Document):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ----------------------------------------
# CORE IDENTITIES
# ----------------------------------------
class Customer(BaseDocument):
    name: str
    email: str
    archetype: Optional[str] = None
    behavior_profile: Dict[str, Any] = Field(default_factory=lambda: {"purchase_intent": "HIGH", "notification_fatigue": "LOW"})
    current_state: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Settings:
        name = "customers"
        indexes = ["email"]

class Merchant(BaseDocument):
    name: str
    api_key: str
    
    class Settings:
        name = "merchants"

# ----------------------------------------
# PRODUCTS
# ----------------------------------------
class Product(BaseDocument):
    product_id: UUID = Field(default_factory=uuid4)
    category: str
    name: str
    price: float
    cost: float
    margin: float
    active_status: bool = True
    
    class Settings:
        name = "products"
        indexes = ["category", "active_status"]

# ----------------------------------------
# ORDERS & CARTS
# ----------------------------------------
class Order(BaseDocument):
    order_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    shipping: float = 0.0
    total: float
    
    class Settings:
        name = "orders"
        indexes = ["customer_id", "timestamp"]

class OrderItem(BaseDocument):
    order_id: UUID
    product_id: UUID
    quantity: int
    price: float
    
    class Settings:
        name = "order_items"
        indexes = ["order_id"]

class Cart(BaseDocument):
    cart_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    cart_created: datetime = Field(default_factory=datetime.utcnow)
    cart_updated: datetime = Field(default_factory=datetime.utcnow)
    cart_value: float = 0.0
    item_count: int = 0
    status: str = "active" # active, abandoned, recovered, purchased
    
    class Settings:
        name = "carts"
        indexes = ["customer_id", "status"]

class CartItem(BaseDocument):
    cart_id: UUID
    product_id: UUID
    added_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "cart_items"
        indexes = ["cart_id"]

class CheckoutSession(BaseDocument):
    session_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    cart_id: UUID
    checkout_started: datetime = Field(default_factory=datetime.utcnow)
    checkout_step: str # CART, ADDRESS, SHIPPING, PAYMENT, CONFIRMATION
    status: str # active, completed, abandoned
    session_duration_seconds: int = 0
    device: str = "DESKTOP"
    platform: str = "WEB"
    attempts: int = 1
    
    class Settings:
        name = "checkout_sessions"
        indexes = ["customer_id", "cart_id"]

# ----------------------------------------
# PAYMENTS
# ----------------------------------------
class Payment(BaseDocument):
    payment_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    order_id: Optional[UUID] = None
    subscription_id: Optional[UUID] = None
    invoice_id: Optional[UUID] = None
    amount: float
    payment_method: str
    status: str # SUCCESS, FAILED
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    failure_reason: Optional[str] = None
    attempt_number: int = 1
    
    class Settings:
        name = "payments"
        indexes = ["customer_id", "order_id", "timestamp", "status"]

# ----------------------------------------
# RETURNS & REFUNDS
# ----------------------------------------
class Return(BaseDocument):
    return_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    order_id: UUID
    return_reason: str
    return_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "COMPLETED"
    
    class Settings:
        name = "returns"
        indexes = ["customer_id", "order_id"]

class Refund(BaseDocument):
    refund_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    return_id: UUID
    payment_id: UUID
    refund_amount: float
    refund_date: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "refunds"
        indexes = ["customer_id"]

# ----------------------------------------
# SIMULATION ENGINE
# ----------------------------------------
class SimulationState(Document):
    scenario_id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    customer_id: UUID
    event_id: UUID
    virtual_time: datetime = Field(default_factory=datetime.utcnow)
    status: str = "ACTIVE" # ACTIVE, COMPLETED
    scenario_type: str # e.g. CART_ABANDONMENT
    
    class Settings:
        name = "simulation_states"

        indexes = ["customer_id"]

# ----------------------------------------
# SUBSCRIPTIONS
# ----------------------------------------
class Subscription(BaseDocument):
    subscription_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    plan: str
    price: float
    start_date: datetime
    renewal_date: datetime
    tenure_months: int = 0
    status: str # ACTIVE, PAUSED, CANCELLED, PAST_DUE
    
    class Settings:
        name = "subscriptions"
        indexes = ["customer_id", "status"]

class SubscriptionEvent(BaseDocument):
    event_id: UUID = Field(default_factory=uuid4)
    subscription_id: UUID
    event_type: str # STARTED, RENEWED, UPGRADED, DOWNGRADED, PAUSED, RESUMED, PAYMENT_FAILED, RETRY, CANCELLED
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "subscription_events"
        indexes = ["subscription_id"]

# ----------------------------------------
# B2B RECEIVABLES
# ----------------------------------------
class Invoice(BaseDocument):
    invoice_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    amount: float
    issue_date: datetime
    due_date: datetime
    payment_date: Optional[datetime] = None
    days_overdue: int = 0
    status: str # PAID, UNPAID, PARTIAL
    
    class Settings:
        name = "invoices"
        indexes = ["customer_id", "status"]

class PromiseToPay(BaseDocument):
    promise_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    invoice_id: UUID
    promise_date: datetime
    promised_amount: float
    due_date: datetime
    status: str # FULFILLED, BROKEN, PENDING
    days_late: int = 0
    
    class Settings:
        name = "promise_to_pay"
        indexes = ["customer_id", "invoice_id"]

# ----------------------------------------
# NOTIFICATIONS & RECOVERY
# ----------------------------------------
class Notification(BaseDocument):
    notification_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    channel: str # EMAIL, SMS, WHATSAPP, PUSH
    sent_at: datetime
    status: str # DELIVERED, OPENED, CLICKED, IGNORED, RESPONDED, UNSUBSCRIBED
    response_latency_seconds: Optional[int] = None
    
    class Settings:
        name = "notifications"
        indexes = ["customer_id"]

class RecoveryAction(BaseDocument):
    action_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    event_id: UUID
    agent_id: str
    action: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cost: float = 0.0
    reason: str = ""
    outcome: str # SUCCESS, FAILURE, PENDING
    recovered_amount: float = 0.0
    response_time_seconds: Optional[int] = None
    
    class Settings:
        name = "recovery_actions"
        indexes = ["customer_id", "agent_id"]

# ----------------------------------------
# FOUNDATION MODELS (Step 1)
# ----------------------------------------
class RevenueEvent(BaseDocument):
    event_id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    merchant_id: UUID
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    amount_at_risk: float
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Settings:
        name = "revenue_events"
        indexes = ["customer_id", "event_type"]

class AgentModel(BaseDocument):
    agent_id: str
    name: str
    description: str
    domain: str
    supported_event_types: List[str]
    allowed_actions: List[str]
    status: str
    
    class Settings:
        name = "agents"

class AgentRun(BaseDocument):
    run_id: UUID = Field(default_factory=uuid4)
    agent_id: str
    event_id: UUID
    customer_id: UUID
    status: str
    priority: str = "MEDIUM"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Settings:
        name = "agent_runs"

class AgentTrace(BaseDocument):
    trace_id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    stage: str
    event_type: Optional[str] = None
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    duration_ms: Optional[int] = None

    class Settings:
        name = "agent_traces"
        indexes = ["run_id", "timestamp"]

class AgentDecision(BaseDocument):
    decision_id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    agent_id: str
    event_id: UUID
    decision: str
    confidence: float
    rule_recommendation: Optional[str] = None
    llm_recommendation: Optional[str] = None
    final_recommendation: str
    reason_codes: List[str] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    rejected_actions: List[Dict[str, Any]] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    policy_checks: Dict[str, Any] = Field(default_factory=dict)
    
    # NEW: Temporal Recovery Plan
    recovery_plan: List[Dict[str, Any]] = Field(default_factory=list)
    
    llm_used: bool = False
    model_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # ── Step 6: Decision Metadata ────────────────────────────────────────────
    # Source of the final decision — never ambiguous
    decision_source: str = "UNKNOWN"  # LLM | DETERMINISTIC_RULE | DETERMINISTIC_FALLBACK
    model_provider: Optional[str] = None  # openrouter | openai | mock
    context_version: str = "1.0"
    prompt_version: str = "6.0"
    validation_status: str = "VALID"  # VALID | INVALID_REJECTED | FALLBACK

    # Rich decision output fields
    rationale: Optional[str] = None
    thought_process: List[str] = Field(default_factory=list)
    observation_window_hours: int = 24
    requires_approval: bool = True

    class Settings:
        name = "agent_decisions"
        indexes = ["run_id", "event_id"]

class ApprovalRecord(BaseDocument):
    approval_id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    decision_id: UUID
    status: str # PENDING, APPROVED, REJECTED, EXPIRED
    approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    expires_at: datetime
    reason: Optional[str] = None

    class Settings:
        name = "approvals"
        indexes = ["run_id", "status"]

class ExecutionRecord(BaseDocument):
    execution_id: UUID = Field(default_factory=uuid4)
    idempotency_key: str
    run_id: UUID
    merchant_id: UUID
    customer_id: UUID
    action: str
    status: str # QUEUED, EXECUTING, PARTIALLY_COMPLETED, COMPLETED, FAILED, CANCELLED
    attempts: int = 0
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "executions"
        indexes = ["idempotency_key", "run_id"]

class ActionOutcome(BaseDocument):
    outcome_id: UUID = Field(default_factory=uuid4)
    execution_id: UUID
    run_id: UUID
    event_id: UUID
    customer_id: UUID
    action: str
    status: str # SUCCESS, PARTIAL_SUCCESS, NO_RESPONSE, FAILED, REJECTED, EXPIRED, NOT_APPLICABLE
    attempted_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    amount_at_risk: float = 0.0
    expected_incremental_recovery: float = 0.0
    actual_recovered_amount: float = 0.0
    intervention_cost: float = 0.0
    actual_net_recovery: float = 0.0
    
    customer_response: Optional[str] = None
    failure_reason: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Settings:
        name = "action_outcomes"
        indexes = ["execution_id", "run_id", "customer_id", "status"]

class AuditLog(BaseDocument):
    log_id: UUID = Field(default_factory=uuid4)
    actor: str
    actor_type: str # SYSTEM, MERCHANT, AGENT
    action: str
    resource_type: str # DECISION, APPROVAL, EXECUTION, OUTCOME
    resource_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    result: str # SUCCESS, BLOCKED, CANCELLED
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Settings:
        name = "audit_logs"
        indexes = ["resource_type", "resource_id"]

class AgentMemory(BaseDocument):
    agent_id: str
    customer_id: UUID
    memory_key: str
    memory_value: Any
    
    class Settings:
        name = "agent_memory"

class GlobalPolicy(BaseDocument):
    agent_id: str
    target_action: str
    constraint_rule: str
    reason: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "global_policies"
