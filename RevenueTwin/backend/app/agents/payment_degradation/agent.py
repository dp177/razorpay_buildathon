from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class PaymentDegradationAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Identify why payment performance is deteriorating and recommend the highest-value corrective action.",
            required_context=['payment_success_rate', 'payment_failure_rate'],
            candidate_actions=['INVESTIGATE', 'ALTERNATE_PAYMENT', 'MERCHANT_ALERT', 'ROUTE_TO_PAYMENT_RECOVERY', 'NO_ACTION'],
            hard_constraints=['Distinguish customer-specific degradation from system degradation.'],
            decision_rules=['If degradation crosses 30% threshold, MERCHANT_ALERT.']
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
        return "payment_degradation"

    @property
    def name(self) -> str:
        return "Payment Degradation Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['PAYMENT_DEGRADATION']

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

agent_registry.register(PaymentDegradationAgent())
