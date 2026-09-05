from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class MandateRecoveryAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Recover recurring payments when mandate execution fails.",
            required_context=['payment_reliability', 'subscription_failure_rate'],
            candidate_actions=['MANDATE_RETRY', 'ALTERNATE_PAYMENT', 'PAYMENT_LINK', 'CUSTOMER_CONTACT', 'NO_ACTION'],
            hard_constraints=['Avoid repeated retries when historical evidence indicates low probability of success.'],
            decision_rules=['If retry rate high, CUSTOMER_CONTACT.']
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
        return "mandate_recovery"

    @property
    def name(self) -> str:
        return "Mandate Recovery Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['MANDATE_FAILURE']

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

agent_registry.register(MandateRecoveryAgent())
