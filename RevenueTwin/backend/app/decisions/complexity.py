from enum import Enum
from typing import Any

class ComplexityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class DecisionComplexityAssessor:
    @staticmethod
    def assess(event: dict, context: Any, agent_profile: Any) -> str:
        # Deterministic rules for complexity
        amt = event.get("amount_at_risk", 0.0)
        
        # High complexity if high amount or specific agent settings
        if amt >= 2000.0:
            return ComplexityLevel.HIGH
        elif amt >= 500.0:
            return ComplexityLevel.MEDIUM
            
        return ComplexityLevel.LOW

complexity_assessor = DecisionComplexityAssessor()
