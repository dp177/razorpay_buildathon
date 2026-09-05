from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class ReceivablesAgent(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="Recover overdue receivables while preserving customer relationship and prioritizing economically meaningful accounts.",
            required_context=['average_invoice_delay_days', 'overdue_invoice_rate'],
            candidate_actions=['REMINDER', 'PAYMENT_LINK', 'PROMISE_TO_PAY', 'ESCALATION', 'NO_ACTION'],
            hard_constraints=['Distinguish large reliable late payer from small chronic non-payer.'],
            decision_rules=['If delay > 30 days and chronic, ESCALATION.']
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
        return "receivables"

    @property
    def name(self) -> str:
        return "B2B Receivables Agent"

    @property
    def supported_event_types(self) -> List[str]:
        return ['RECEIVABLE_OVERDUE']

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

agent_registry.register(ReceivablesAgent())
