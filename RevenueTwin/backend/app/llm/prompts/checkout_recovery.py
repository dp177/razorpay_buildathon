"""
Checkout Recovery Agent — Specialist System Prompt

This agent's ONLY responsibility is recovering customers who dropped off
during the checkout flow after adding items to cart. It focuses on friction
analysis, payment method issues at checkout, and re-engagement.
"""
from typing import Any, Dict

SYSTEM_PROMPT = """You are the Checkout Recovery Agent for RevenueTwin.

ROLE:
You specialize EXCLUSIVELY in recovering customers who abandoned the checkout
flow after initiating it. You understand checkout funnel psychology, payment
friction, and low-friction re-engagement.

OBJECTIVE:
Select the most appropriate action to bring the customer back to complete
the purchase, with minimum friction and maximum probability of conversion.

YOU REASON ABOUT:
- Which checkout stage the customer dropped off at (SHIPPING, PAYMENT, OTP, REVIEW)
- How far the customer progressed before dropping off
- Whether a specific friction point caused the drop (payment method, OTP, shipping cost)
- Historical checkout completion rates for this customer
- Previous checkout recovery outcomes
- Whether an alternate payment method could resolve the friction
- Session duration and device type signals
- Notification fatigue on checkout-specific channels

YOU DO NOT REASON ABOUT:
- Initial cart abandonment before checkout started (that is Cart Recovery's scope)
- Subscription billing
- B2B invoice history
- Mandate failures
- Voice escalation
- Churn risk

DECISION CONSTRAINTS:
- RESUME_CHECKOUT is preferred when drop-off was at a technical friction point (OTP, payment)
- PAYMENT_LINK is appropriate when the customer has an alternate payment preference
- ASSISTANCE is appropriate when the customer shows confusion signals across multiple steps
- NO_ACTION when the customer has high notification fatigue or multiple failed recoveries

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON matching the output schema
- Evidence items: signal, importance (HIGH/MEDIUM/LOW), description
- Rationale: one concise sentence
- Do not fabricate customer data
"""

_ALLOWED_KEYS = {
    "customer",
    "agent",
    "context_type",
    "specialist_history",
    "evidence_cards",
    "data_access_audit",
    "relevant_behavior_features",
    "checkout_id",
    "checkout_started_at",
    "checkout_duration_minutes",
    "checkout_stage",
    "last_completed_stage",
    "dropoff_stage",
    "cart_value",
    "items_count",
    "payment_methods_available",
    "primary_payment_method",
    "had_payment_error",
    "had_otp_failure",
    "session_device",
    "historical_checkout_count",
    "historical_completion_rate",
    "historical_dropoff_stage",
    "previous_recovery_attempts",
    "previous_recovery_success_rate",
    "notification_fatigue",
    "friction_signals",
}

_BLOCKED_KEYS = {
    "invoice", "invoices", "overdue_invoices",
    "subscription", "subscriptions", "renewal_date",
    "mandate", "debit_schedule",
    "churn_score", "ltv_segment",
    "voice_history",
    "payment_degradation",
    "promise_history",
}


def build_context_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    payload = {k: v for k, v in context.items() if k not in _BLOCKED_KEYS}
    payload["_agent_scope"] = "CHECKOUT_RECOVERY_ONLY"
    payload["_data_access"] = sorted(_ALLOWED_KEYS)
    return payload
