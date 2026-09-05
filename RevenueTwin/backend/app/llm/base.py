from abc import ABC, abstractmethod
from typing import Any, Dict, Type
from pydantic import BaseModel


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str) -> str:
        pass

    @abstractmethod
    async def structured_complete(self, prompt: str, schema: Type[BaseModel]) -> BaseModel:
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Return provider status. Must not raise — return error details instead."""
        pass
