from abc import ABC, abstractmethod
from typing import List, Any, Dict, Optional
from app.events.schemas import RevenueEventSchema

class AgentDecisionProfile:
    def __init__(
        self,
        objective: str,
        required_context: List[str],
        candidate_actions: List[str],
        hard_constraints: List[str],
        decision_rules: List[str]
    ):
        self.objective = objective
        self.required_context = required_context
        self.candidate_actions = candidate_actions
        self.hard_constraints = hard_constraints
        self.decision_rules = decision_rules
        
    def evaluate_rules(self, event: dict, context: Any) -> Optional[str]:
        return None

class BaseAgent(ABC):
    @property
    @abstractmethod
    def agent_id(self) -> str:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def supported_event_types(self) -> List[str]:
        pass

    @property
    @abstractmethod
    def profile(self) -> AgentDecisionProfile:
        pass

    @property
    @abstractmethod
    def allowed_actions(self) -> List[str]:
        pass

    @abstractmethod
    async def can_handle(self, event: RevenueEventSchema) -> bool:
        pass

    @abstractmethod
    async def get_required_context(self, event: RevenueEventSchema) -> List[str]:
        pass

    @abstractmethod
    async def evaluate(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def recommend(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_status(self) -> str:
        pass
