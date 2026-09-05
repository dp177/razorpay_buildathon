from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class PromiseToPayAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Increase fulfillment of outstanding promises.",
            required_context=['promise_to_pay_success_rate', 'promise_to_pay_break_rate'],
            candidate_actions=['REMINDER', 'PAYMENT_LINK', 'PROMISE_RECONFIRMATION', 'ESCALATION', 'NO_ACTION'],
            hard_constraints=['Consider if customer historically keeps promises before escalating.'],
            decision_rules=['If broken > 2, ESCALATION.']
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
        return "promise_to_pay"

    @property
    def name(self) -> str:
        return "Promise-to-Pay Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['PROMISE_TO_PAY_DUE', 'PROMISE_TO_PAY_BROKEN']

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

agent_registry.register(PromiseToPayAgent())
