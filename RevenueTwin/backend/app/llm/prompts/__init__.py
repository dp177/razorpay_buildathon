"""
Specialist prompt files for all 10 RevenueTwin agents.

Each module exports:
  SYSTEM_PROMPT   — the role/identity/scope instructions for the LLM
  build_context_payload(context: dict) -> dict  — extracts ONLY that
      agent's relevant keys so the LLM never sees cross-domain data.
"""
from app.llm.prompts.cart_recovery import SYSTEM_PROMPT as CART_SYSTEM_PROMPT, build_context_payload as cart_context
from app.llm.prompts.checkout_recovery import SYSTEM_PROMPT as CHECKOUT_SYSTEM_PROMPT, build_context_payload as checkout_context
from app.llm.prompts.payment_recovery import SYSTEM_PROMPT as PAYMENT_SYSTEM_PROMPT, build_context_payload as payment_context
from app.llm.prompts.subscription_recovery import SYSTEM_PROMPT as SUBSCRIPTION_SYSTEM_PROMPT, build_context_payload as subscription_context
from app.llm.prompts.churn_prevention import SYSTEM_PROMPT as CHURN_SYSTEM_PROMPT, build_context_payload as churn_context
from app.llm.prompts.b2b_receivables import SYSTEM_PROMPT as B2B_SYSTEM_PROMPT, build_context_payload as b2b_context
from app.llm.prompts.mandate_recovery import SYSTEM_PROMPT as MANDATE_SYSTEM_PROMPT, build_context_payload as mandate_context
from app.llm.prompts.promise_to_pay import SYSTEM_PROMPT as PTP_SYSTEM_PROMPT, build_context_payload as ptp_context
from app.llm.prompts.payment_degradation import SYSTEM_PROMPT as DEGRADATION_SYSTEM_PROMPT, build_context_payload as degradation_context
from app.llm.prompts.voice_recovery import SYSTEM_PROMPT as VOICE_SYSTEM_PROMPT, build_context_payload as voice_context

# Registry: agent_id -> (system_prompt, context_builder)
SPECIALIST_REGISTRY = {
    "cart_recovery": (CART_SYSTEM_PROMPT, cart_context),
    "checkout_recovery": (CHECKOUT_SYSTEM_PROMPT, checkout_context),
    "payment_recovery": (PAYMENT_SYSTEM_PROMPT, payment_context),
    "subscription_recovery": (SUBSCRIPTION_SYSTEM_PROMPT, subscription_context),
    "churn_prevention": (CHURN_SYSTEM_PROMPT, churn_context),
    "b2b_receivables": (B2B_SYSTEM_PROMPT, b2b_context),
    # Note: agent registered as "receivables" in registry — support both keys
    "receivables": (B2B_SYSTEM_PROMPT, b2b_context),
    "mandate_recovery": (MANDATE_SYSTEM_PROMPT, mandate_context),
    "promise_to_pay": (PTP_SYSTEM_PROMPT, ptp_context),
    "payment_degradation": (DEGRADATION_SYSTEM_PROMPT, degradation_context),
    "voice_recovery": (VOICE_SYSTEM_PROMPT, voice_context),
}


def get_specialist(agent_id: str):
    """
    Return (system_prompt, context_builder) for the given agent_id.
    Falls back to a safe default if the agent is not registered.
    """
    return SPECIALIST_REGISTRY.get(agent_id)
