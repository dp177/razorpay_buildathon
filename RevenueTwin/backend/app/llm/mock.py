"""
Mock LLM Provider — Step 6 compatible.

Returns valid Step 6 structured decisions with proper evidence format.
For payment recovery scenarios, returns a rich multi-step recovery plan.
Used in tests and when USE_MOCK_LLM=true.
"""
import re
from typing import Any, Dict, Type
from pydantic import BaseModel
from app.llm.base import LLMProvider


class MockLLMProvider(LLMProvider):
    def __init__(self, predefined_responses=None):
        # Key: agent_id (or prompt substring), Value: DecisionOutput kwargs
        self.predefined_responses = predefined_responses or {}

    async def complete(self, prompt: str) -> str:
        return "Mock response"

    async def structured_complete(self, prompt: str, schema: Type[BaseModel]) -> BaseModel:
        # Choose only from the actions supplied by the active specialist.
        action_match = re.search(r"AVAILABLE ACTIONS.*?:\n([^\n]+)", prompt)
        allowed_actions = (
            [a.strip() for a in action_match.group(1).split(",")]
            if action_match else []
        )
        default_action = next(
            (a for a in allowed_actions if a not in {"NO_ACTION", "WAIT"}),
            "NO_ACTION"
        )

        # ── Dynamic Recovery: Do not pre-bake recovery plan steps ───────────
        # Each subsequent step is dynamically decided by the agent upon failure.
        if default_action == "RETRY" and "ALTERNATE_PAYMENT" in allowed_actions:
            recovery_plan = []

            return schema(**{
                "decision": "RETRY",
                "confidence": 0.83,
                "recovery_plan": [],
                "evidence": [
                    {
                        "signal": "TRANSIENT_FAILURE",
                        "importance": "HIGH",
                        "description": "Error code indicates a temporary bank decline — not a permanent card block."
                    },
                    {
                        "signal": "HIGH_PAYMENT_HISTORY",
                        "importance": "HIGH",
                        "description": "9 of last 10 payment attempts succeeded on this method. Retry is very likely to work."
                    },
                    {
                        "signal": "SOFT_DECLINE_SIGNAL",
                        "importance": "HIGH",
                        "description": "Issuer sent a soft decline — the retry window is still open for the next 2 hours."
                    },
                    {
                        "signal": "LOW_CONTACT_FATIGUE",
                        "importance": "MEDIUM",
                        "description": "No recent recovery attempts on this customer — full capacity to act without fatigue."
                    },
                ],
                "thought_process": [
                    "Failure analysis: soft decline from bank, not a hard block. RETRY is safe to attempt.",
                    "Historical data: customer has 90% success rate on this exact payment method.",
                    "Fatigue check: zero recent recovery contacts — customer is receptive.",
                    f"Recovery plan mapped: RETRY → {' → '.join(s['action'] for s in recovery_plan)}.",
                ],
                "rationale": (
                    "Soft bank decline with a strong payment history. Immediate retry is the highest-probability action. "
                    "If retry fails, alternate payment covers UPI and wallet users. "
                    "Payment link as the final safety net ensures every channel is exhausted before giving up."
                ),
                "observation_window_hours": 2,
                "requires_approval": True,
                "reason_codes": ["TRANSIENT_FAILURE", "HIGH_SUCCESS_RATE", "SOFT_DECLINE", "RETRY_ELIGIBLE"],
                "rejected_actions": [
                    {
                        "action": "NO_ACTION",
                        "reason": "Recovery probability is 83% — inaction would lose this payment without any attempt."
                    },
                    {
                        "action": "CARD_UPDATE",
                        "reason": "Card is not blocked — an update request is not warranted for a soft decline."
                    },
                ],
                "risk_flags": ["RETRY_WINDOW_EXPIRES_IN_2H"],
                "next_step": "REQUEST_APPROVAL",
            })

        # ── Default response for all other agents ─────────────────────────────
        default_resp = {
            "decision": default_action,
            "confidence": 0.91,
            "recovery_plan": [],
            # Step 6 evidence format: signal, importance, description
            "evidence": [
                {
                    "signal": "SPECIALIST_CONTEXT_USED",
                    "importance": "HIGH",
                    "description": "Candidate action selected from this agent's allowed action policy."
                }
            ],
            "rationale": "Mock decision — specialist action selected from policy.",
            "observation_window_hours": 24,
            "requires_approval": True,
            "reason_codes": ["MOCK_SPECIALIST_ACTION"],
            "rejected_actions": [],
            "risk_flags": [],
            "next_step": "REQUEST_APPROVAL",
        }

        resp_data = default_resp
        for key, resp in self.predefined_responses.items():
            if key in prompt:
                resp_data = resp
                break

        return schema(**resp_data)

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "healthy", "provider": "mock", "model": "mock"}
