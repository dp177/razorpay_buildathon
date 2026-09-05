"""
LLM Context Builder — Step 6 specialist dispatch.

This module replaces the previous single generic prompt with per-agent
specialist prompts. Each agent has its own system prompt, context schema,
observation window, and evidence requirements.
"""
import json
from typing import Any, Dict, List, Optional

from app.llm.prompts import get_specialist

# Prompt version — bump when any specialist prompt changes
PROMPT_VERSION = "6.0"

class LLMContextBuilder:
    @staticmethod
    def build_prompt(agent_profile: Any, raw_context: Any, event: dict) -> str:
        """
        Build a specialist LLM prompt for the given agent.

        Dispatches to the appropriate specialist module based on agent_id embedded
        in the context. Falls back to a minimal generic prompt if the agent_id
        is not recognised (should not happen in production).
        """
        # Resolve agent_id from context, profile, or event
        agent_id = LLMContextBuilder._resolve_agent_id(agent_profile, raw_context, event)

        context_dict = raw_context if isinstance(raw_context, dict) else {}

        # Get specialist system prompt and context builder
        specialist = get_specialist(agent_id)

        if specialist:
            system_prompt, context_builder = specialist
            specialist_context = context_builder(context_dict)
        else:
            # Unknown agent — safe minimal fallback
            system_prompt = (
                f"You are a specialist revenue recovery agent. "
                f"Objective: {getattr(agent_profile, 'objective', 'recover revenue')}."
            )
            specialist_context = context_dict
    def build_prompt(agent_profile: Any, raw_context: dict, event: dict, customer_feedback: str = None, allowed_actions: List[str] = None) -> str:
        """Dynamically assemble the LLM prompt using the specialist context."""
        
        agent_id = LLMContextBuilder._extract_agent_id(agent_profile, raw_context)
        system_prompt = LLMContextBuilder._get_system_prompt(agent_id, agent_profile)
        
        # We assume agent_profile has candidate_actions, hard_constraints, and decision_rules.
        # Fallbacks applied if they are missing.
        allowed = allowed_actions or getattr(agent_profile, "candidate_actions", [])
        constraints = getattr(agent_profile, "hard_constraints", [])
        rules = getattr(agent_profile, "decision_rules", [])

        # The context dictionary is strictly the output of the respective specialist builder.
        # We ensure it is a dict (if it's not, we just pass an empty dict).
        specialist_ctx = raw_context if isinstance(raw_context, dict) else {}
        
        # Inject self-calibrated global policies
        global_policies = specialist_ctx.pop("global_policies", [])
        if global_policies:
            # We copy to avoid mutating the original profile list
            constraints = list(constraints) + global_policies

        return LLMContextBuilder._format_prompt(
            system_prompt=system_prompt,
            agent_id=agent_id,
            allowed_actions=allowed,
            hard_constraints=constraints,
            decision_rules=rules,
            event=event,
            specialist_context=specialist_ctx,
            customer_feedback=customer_feedback
        )

    @staticmethod
    def _get_system_prompt(agent_id: str, agent_profile: Any) -> str:
        """Helper to get system prompt from specialist module."""
        specialist = get_specialist(agent_id)
        if specialist:
            return specialist[0]
        return (
            f"You are a specialist revenue recovery agent. "
            f"Objective: {getattr(agent_profile, 'objective', 'recover revenue')}."
        )

    @staticmethod
    def _extract_agent_id(agent_profile: Any, raw_context: dict) -> str:
        """Extract the agent_id from whichever source has it."""
        if hasattr(agent_profile, "agent_id") and agent_profile.agent_id:
            return agent_profile.agent_id
        if hasattr(agent_profile, "name"):
            agent_name = agent_profile.name.upper().replace(" ", "_")
            name_to_id = {
                "CART_RECOVERY_AGENT": "cart_recovery",
                "CHECKOUT_RECOVERY_AGENT": "checkout_recovery",
                "PAYMENT_RECOVERY_AGENT": "payment_recovery",
                "SUBSCRIPTION_RECOVERY_AGENT": "subscription_recovery",
                "CHURN_PREVENTION_AGENT": "churn_prevention",
                "B2B_RECEIVABLES_AGENT": "b2b_receivables",
                "MANDATE_RECOVERY_AGENT": "mandate_recovery",
                "PROMISE_TO_PAY_AGENT": "promise_to_pay",
                "PAYMENT_DEGRADATION_AGENT": "payment_degradation",
                "VOICE_RECOVERY_AGENT": "voice_recovery",
            }
            if agent_name in name_to_id:
                return name_to_id[agent_name]
        # Fall back to context_type
        ct = raw_context.get("context_type", "")
        ct_map = {
            "CART_RECOVERY": "cart_recovery",
            "PAYMENT_RECOVERY": "payment_recovery",
            "CHECKOUT_RECOVERY": "checkout_recovery",
            "SUBSCRIPTION_RECOVERY": "subscription_recovery",
            "CHURN_PREVENTION": "churn_prevention",
            "B2B_RECEIVABLES": "b2b_receivables",
            "MANDATE_RECOVERY": "mandate_recovery",
            "PROMISE_TO_PAY": "promise_to_pay",
            "PAYMENT_DEGRADATION": "payment_degradation",
            "VOICE_RECOVERY": "voice_recovery",
        }
        return ct_map.get(ct, "unknown")

    @staticmethod
    def _format_prompt(
        system_prompt: str,
        agent_id: str,
        allowed_actions: List[str],
        hard_constraints: List[str],
        decision_rules: List[str],
        event: dict,
        specialist_context: dict,
        customer_feedback: str = None
    ) -> str:
        """Assemble the final LLM prompt string."""
        # Remove internal audit keys from the visible context
        visible_context = {
            k: v for k, v in specialist_context.items()
            if not k.startswith("_")
        }

        feedback_block = ""
        if customer_feedback:
            feedback_block = f"""
====================================================
CUSTOMER FEEDBACK (High Priority):
The customer rejected your previous action and provided the following feedback:
"{customer_feedback}"
You MUST take this into account. 
If the customer is asking for an action (like a discount, free product, or extension) that is NOT explicitly supported by your policy or allowed actions, you MUST choose REJECT_CUSTOMER_REQUEST. Do NOT hallucinate an accommodation. 
====================================================
"""

        learnings = specialist_context.pop("historical_learnings", [])
        memory_block = ""
        if learnings:
            memory_block = f"""
====================================================
AGENT MEMORY (Learnings from Past Interactions):
{chr(10).join(f"- {l}" for l in learnings)}

CRITICAL: Do not repeat actions that previously resulted in FAILED or IGNORED for this customer.
====================================================
"""

        prompt = f"""{system_prompt}

====================================================
AVAILABLE ACTIONS (choose EXACTLY ONE):
{", ".join(allowed_actions)}

CRITICAL: Your `decision` field MUST be one of the above values.
Any other value will be rejected and the decision will fall back to NO_ACTION.
====================================================

HARD CONSTRAINTS:
{chr(10).join(f"- {c}" for c in hard_constraints)}

DECISION RULES:
{chr(10).join(f"- {r}" for r in decision_rules)}

====================================================
CURRENT EVENT:
{json.dumps(event, default=str, ensure_ascii=False, indent=2)}

SPECIALIST CONTEXT (this agent's data ONLY):
{json.dumps(visible_context, default=str, ensure_ascii=False, indent=2)}
====================================================
{memory_block}
{feedback_block}
OUTPUT CONTRACT:
Return a single JSON object with these fields:
{{
  "thought_process": [
    "Step 1: [Analyze customer behavior and constraints in plain English...]",
    "Step 2: [Evaluate the requested feedback against the policy...]",
    "Step 3: [Determine the primary action...]"
  ],
  "decision": "<one of AVAILABLE ACTIONS>",
  "confidence": <float 0.0-1.0>,
  "recovery_plan": [
    {{
      "action": "<one of AVAILABLE ACTIONS>",
      "delay_hours": <integer, hours to wait after previous step fails>,
      "condition": "<under what condition should this fire? e.g. 'If primary action fails' or 'If no response in 24h'>"
    }}
  ],
  "evidence": [
    {{
      "signal": "<SIGNAL_NAME>",
      "importance": "<HIGH|MEDIUM|LOW>",
      "description": "<concise factual observation>"
    }}
  ],
  "rationale": "<one concise sentence explaining the decision>",
  "observation_window_hours": <integer>,
  "requires_approval": <true|false>,
  "reason_codes": ["<CODE>"],
  "rejected_actions": [],
  "risk_flags": [],
  "next_step": "REQUEST_APPROVAL"
}}

Do NOT include chain-of-thought. Do NOT explain your reasoning outside the JSON.
Respond with ONLY the JSON object. No markdown fences.
"""
        return prompt
