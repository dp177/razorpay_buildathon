from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class SubscriptionRecoveryAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Recover a failed recurring payment while preserving subscription value.",
            required_context=['subscription_tenure_months', 'payment_success_rate', 'customer_engagement_score'],
            candidate_actions=['RETRY', 'ALTERNATE_PAYMENT', 'PAYMENT_LINK', 'PLAN_CHANGE', 'NO_ACTION'],
            hard_constraints=['Respect renewal schedules.'],
            decision_rules=['If alternative payment historically successful, use ALTERNATE_PAYMENT.']
        )
        # Override the evaluate_rules method safely on the instance's profile
        # Note: We bind a method dynamically for simplicity in testing
        
        def evaluate_rules_logic(event: dict, context: Any) -> Optional[str]:
            pass
            return None
            
        self._profile.evaluate_rules = evaluate_rules_logic
        
    @property
    def profile(self) -> AgentDecisionProfile:
        return self._profile

    @property
    def agent_id(self) -> str:
        return "subscription_recovery"

    @property
    def name(self) -> str:
        return "Subscription Recovery Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['SUBSCRIPTION_PAYMENT_FAILURE']

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

agent_registry.register(SubscriptionRecoveryAgent())
