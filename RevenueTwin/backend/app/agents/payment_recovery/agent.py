from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class PaymentRecoveryAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Maximize probability of recovering a failed payment while minimizing unnecessary retries and customer fatigue.",
            required_context=['payment_history', 'payment_method_success_rate', 'purchase_frequency', 'notification_fatigue'],
            candidate_actions=['RETRY', 'ALTERNATE_PAYMENT', 'PAYMENT_LINK', 'CARD_UPDATE', 'ESCALATE_TO_VOICE', 'NO_ACTION'],
            hard_constraints=[
                'Do not blindly retry if payment method repeatedly failed recently.',
                'Avoid unnecessary communication if fatigue is high.',
                'Do not recommend RETRY if it has already been attempted for this specific failure.'
            ],
            decision_rules=['If an alternative method has strong historical success, consider ALTERNATE_PAYMENT.', 'If payment failure is caused by an expired card, CARD_UPDATE becomes relevant.']
        )
        # Override the evaluate_rules method safely on the instance's profile
        # Note: We bind a method dynamically for simplicity in testing
        
        def evaluate_rules_logic(event: dict, context: Any) -> Optional[str]:
            if event.get("metadata", {}).get("reason") == "EXPIRED_CARD":
                return "CARD_UPDATE"
            # Demo scenarios mapping
            features = getattr(context, 'relevant_behavior_features', None)
            if features and getattr(features, 'payment_method_success_rate', {}).get('UPI', 0) > 0.8:
                return "ALTERNATE_PAYMENT"
            return None
            
        self._profile.evaluate_rules = evaluate_rules_logic
        
    @property
    def profile(self) -> AgentDecisionProfile:
        return self._profile

    @property
    def agent_id(self) -> str:
        return "payment_recovery"

    @property
    def name(self) -> str:
        return "Payment Recovery Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['PAYMENT_FAILED']

    @property
    def allowed_actions(self) -> List[str]:
        return self._profile.candidate_actions

    async def can_handle(self, event: RevenueEventSchema) -> bool:
        return event.event_type in self.supported_event_types

    async def get_required_context(self, event: RevenueEventSchema) -> List[str]:
        return self._profile.required_context

    async def evaluate(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "evaluated"}

    async def recommend(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        return {"action": "NO_ACTION"}

    def get_status(self) -> str:
        return "active"

agent_registry.register(PaymentRecoveryAgent())
