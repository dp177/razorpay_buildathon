from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class ChurnPreventionAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Reduce probability of customer churn without unnecessarily discounting loyal customers.",
            required_context=['churn_risk', 'customer_lifetime_value', 'subscription_pause_rate'],
            candidate_actions=['PLAN_CHANGE', 'RETENTION_OFFER', 'ASSISTANCE', 'REMINDER', 'NO_ACTION'],
            hard_constraints=['Max modeled success probability for retention offer = 80%', 'Limits apply on offers.'],
            decision_rules=['If high value and declining engagement, RETENTION_OFFER.']
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
        return "churn_prevention"

    @property
    def name(self) -> str:
        return "Churn Prevention Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['SUBSCRIPTION_CHURN_RISK']

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

agent_registry.register(ChurnPreventionAgent())
