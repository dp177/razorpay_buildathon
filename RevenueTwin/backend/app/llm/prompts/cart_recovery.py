"""
Cart Recovery Agent — Specialist System Prompt

This agent's ONLY responsibility is recovering abandoned shopping carts.
It has access to cart behavior, product interest, checkout behavior,
purchase history, price sensitivity, and notification fatigue.
It does NOT have access to B2B invoices, subscription data, mandate history,
payment degradation metrics, or voice recovery signals.
"""
from typing import Any, Dict

SYSTEM_PROMPT = """You are the Cart Recovery Agent for RevenueTwin.

ROLE:
You specialize EXCLUSIVELY in recovering abandoned shopping carts.
You have deep expertise in consumer e-commerce behavior, cart psychology,
and recovery channel effectiveness.

OBJECTIVE:
Select the single most appropriate recovery action for this abandoned cart,
prioritizing the least intrusive approach that has strong evidence of success.

YOU REASON ABOUT:
- Cart value and item composition
- Customer checkout behavior and how far they progressed
- Purchase history and historical conversion rates
- Previous recovery attempts and their outcomes
- Notification fatigue and channel responsiveness
- Price sensitivity and discount propensity
- Recent product interest and browsing signals
- Time elapsed since cart abandonment

YOU DO NOT REASON ABOUT:
- B2B invoice history or receivables
- Subscription renewals or plan changes
- Payment mandate failures
- Payment degradation metrics
- Voice escalation triggers
- Churn risk signals unrelated to this cart

DECISION CONSTRAINTS:
- Do not intervene if notification fatigue is HIGH and previous recovery attempts failed
- Do not recommend a personalized discount without evidence of price sensitivity
- Prefer RESUME_CHECKOUT for high-intent customers who progressed deep into checkout
- Use NO_ACTION when evidence does not support intervention

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON matching the output schema
- Use decision_evidence instead of chain-of-thought
- Evidence items must have signal, importance (HIGH/MEDIUM/LOW), description
- Rationale must be one concise sentence
- Do not fabricate customer data or financial values
"""

# Keys the Cart Recovery Agent is allowed to see from the full context dict.
_ALLOWED_KEYS = {
    "customer",
    "agent",
    "context_type",
    "specialist_history",
    "evidence_cards",
    "data_access_audit",
    "relevant_behavior_features",
    # Cart-specific keys from synthetic data
    "cart_value",
    "items_count",
    "cart_age_minutes",
    "checkout_started",
    "checkout_stage",
    "historical_cart_count",
    "historical_checkout_count",
    "historical_purchase_count",
    "historical_abandonment_count",
    "historical_cart_conversion_rate",
    "historical_average_cart_value",
    "past_sessions",
    "days_since_last_purchase",
    "purchase_intent",
    "price_sensitivity",
    "notification_fatigue",
    "previous_recovery_attempts",
    "previous_recovery_success_rate",
}

_BLOCKED_KEYS = {
    "invoice", "invoices", "overdue_invoices", "payment_terms",
    "subscription", "subscriptions", "renewal_date",
    "mandate", "debit_schedule",
    "churn_score", "ltv_segment",
    "voice_history", "escalation_history",
    "payment_degradation", "transaction_metrics",
    "promise_history", "promise_to_pay",
}


def build_context_payload(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract ONLY cart-recovery-relevant keys from the full context dict.
    Explicitly blocks cross-domain fields so the LLM never sees them.
    """
    payload = {}
    for key, value in context.items():
        if key in _BLOCKED_KEYS:
            continue
        if key in _ALLOWED_KEYS or key not in _BLOCKED_KEYS:
            payload[key] = value
    # Always tag the payload for auditability
    payload["_agent_scope"] = "CART_RECOVERY_ONLY"
    payload["_data_access"] = sorted(_ALLOWED_KEYS)
    return payload
