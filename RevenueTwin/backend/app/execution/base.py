from abc import ABC, abstractmethod
from typing import Dict, Any
from uuid import UUID

class BaseActionExecutor(ABC):
    @abstractmethod
    async def validate(self, action: str, customer_id: UUID, payload: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    async def execute(self, action: str, customer_id: UUID, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns a dict containing:
        - status: SUCCESS, FAILED
        - recovered_amount: float
        - intervention_cost: float
        - message: str
        """
        pass

    @abstractmethod
    async def cancel(self, execution_id: UUID) -> bool:
        pass
