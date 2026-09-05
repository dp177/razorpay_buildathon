from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class CartRecoveryAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Recover an abandoned cart without excessive messaging.",
            required_context=['cart_abandonment_rate', 'notification_fatigue', 'purchase_frequency'],
            candidate_actions=['RESUME_CHECKOUT', 'REMINDER', 'PERSONALIZED_MESSAGE', 'NO_ACTION'],
            hard_constraints=['Do not automatically assume every abandoned cart is recoverable.'],
            decision_rules=['If fatigue is high, use NO_ACTION.']
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
        return "cart_recovery"

    @property
    def name(self) -> str:
        return "Cart Recovery Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['CART_ABANDONMENT']

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

agent_registry.register(CartRecoveryAgent())
