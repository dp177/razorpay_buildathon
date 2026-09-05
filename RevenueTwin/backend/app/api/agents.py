from fastapi import APIRouter, HTTPException
from app.agents.registry import agent_registry

router = APIRouter()

AGENT_DESCRIPTIONS = {
    "cart_recovery": {
        "id": "cart_recovery",
        "name": "Cart Recovery Agent",
        "event_types": ["CART_ABANDONMENT"],
        "objective": "Recover abandoned carts without excessive messaging.",
        "candidate_actions": ["RESUME_CHECKOUT", "REMINDER", "PERSONALIZED_MESSAGE", "NO_ACTION"],
        "data_accessed": ["cart_history", "checkout_history", "product_affinity", "purchase_intent", "notification_fatigue"],
        "data_not_accessed": ["b2b_invoice_history", "mandate_history", "subscription_history"],
    },
    "checkout_recovery": {
        "id": "checkout_recovery",
        "name": "Checkout Recovery Agent",
        "event_types": ["CHECKOUT_DROPOFF"],
        "objective": "Re-engage customers who dropped off during the checkout flow.",
        "candidate_actions": ["RESUME_CHECKOUT", "ALTERNATE_PAYMENT", "ASSIST", "NO_ACTION"],
        "data_accessed": ["checkout_history", "payment_methods", "session_data", "friction_signals"],
        "data_not_accessed": ["b2b_invoice_history", "mandate_history", "subscription_history"],
    },
    "payment_recovery": {
        "id": "payment_recovery",
        "name": "Payment Recovery Agent",
        "event_types": ["PAYMENT_FAILED"],
        "objective": "Recover failed payments by identifying root cause.",
        "candidate_actions": ["RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK", "WAIT"],
        "data_accessed": ["payment_history", "failure_analysis", "retry_eligibility", "alternate_methods"],
        "data_not_accessed": ["cart_history", "b2b_invoice_history", "mandate_history"],
    },
    "subscription_recovery": {
        "id": "subscription_recovery",
        "name": "Subscription Recovery Agent",
        "event_types": ["SUBSCRIPTION_PAYMENT_FAILURE"],
        "objective": "Recover failed subscription payments while maintaining retention.",
        "candidate_actions": ["RETRY", "ALTERNATE_PAYMENT", "PLAN_CHANGE", "WAIT"],
        "data_accessed": ["subscription_lifecycle", "renewal_history", "usage_data", "payment_methods"],
        "data_not_accessed": ["cart_history", "checkout_history", "b2b_invoice_history"],
    },
    "churn_prevention": {
        "id": "churn_prevention",
        "name": "Churn Prevention Agent",
        "event_types": ["CHURN_RISK"],
        "objective": "Proactively intervene when churn signals are detected.",
        "candidate_actions": ["RETENTION_OFFER", "PLAN_CHANGE", "ASSIST", "WAIT"],
        "data_accessed": ["purchase_behavior", "engagement_metrics", "support_history", "communication_response"],
        "data_not_accessed": ["b2b_invoice_history", "mandate_history", "checkout_history"],
    },
    "b2b_receivables": {
        "id": "b2b_receivables",
        "name": "B2B Receivables Agent",
        "event_types": ["RECEIVABLE_OVERDUE"],
        "objective": "Recover overdue receivables while preserving business relationships.",
        "candidate_actions": ["REMINDER", "PROMISE_TO_PAY", "ESCALATION", "WAIT"],
        "data_accessed": ["invoice_history", "payment_terms", "promise_history", "contact_behavior"],
        "data_not_accessed": ["cart_history", "checkout_history", "subscription_history"],
    },
    "mandate_recovery": {
        "id": "mandate_recovery",
        "name": "Mandate Recovery Agent",
        "event_types": ["MANDATE_FAILURE"],
        "objective": "Recover failed mandates via retry or alternate payment paths.",
        "candidate_actions": ["MANDATE_RETRY", "ALTERNATE_PAYMENT", "WAIT"],
        "data_accessed": ["mandate_history", "debit_schedule", "backup_methods"],
        "data_not_accessed": ["cart_history", "b2b_invoice_history", "churn_signals"],
    },
    "promise_to_pay": {
        "id": "promise_to_pay",
        "name": "Promise-to-Pay Agent",
        "event_types": ["PROMISE_TO_PAY"],
        "objective": "Track payment promises and escalate when commitments are not met.",
        "candidate_actions": ["REMINDER", "ESCALATION", "WAIT"],
        "data_accessed": ["promise_history", "invoice_data", "contact_history", "payment_history"],
        "data_not_accessed": ["cart_history", "checkout_history", "subscription_history"],
    },
    "payment_degradation": {
        "id": "payment_degradation",
        "name": "Payment Degradation Agent",
        "event_types": ["PAYMENT_DEGRADATION"],
        "objective": "Detect and respond to declining payment success rates.",
        "candidate_actions": ["ROUTING_CHANGE", "WAIT"],
        "data_accessed": ["transaction_metrics", "failure_distribution", "trend_analysis"],
        "data_not_accessed": ["cart_history", "b2b_invoice_history", "churn_signals"],
    },
    "voice_recovery": {
        "id": "voice_recovery",
        "name": "Voice Recovery Agent",
        "event_types": ["VOICE_RECOVERY"],
        "objective": "Initiate voice-based recovery for high-value cases.",
        "candidate_actions": ["VOICE_CALL", "REMINDER", "WAIT"],
        "data_accessed": ["contact_history", "customer_value", "communication_preference", "escalation_history"],
        "data_not_accessed": ["cart_history", "checkout_history", "b2b_invoice_history"],
    },
}

@router.get("")
async def list_agents():
    return {"agents": list(AGENT_DESCRIPTIONS.values()), "total": len(AGENT_DESCRIPTIONS)}


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    info = AGENT_DESCRIPTIONS.get(agent_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return info
