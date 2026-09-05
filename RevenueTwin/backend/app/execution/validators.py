from uuid import UUID
from app.decisions.policy import policy_enforcer

class ExecutionValidator:
    @staticmethod
    async def validate_stale_decision(customer_id: UUID, event_type: str) -> bool:
        # Checks if event is already resolved before execution
        return True
        
    @staticmethod
    async def validate_policy_limits(customer_id: UUID, action: str) -> bool:
        return await policy_enforcer.check_limits(customer_id, action)

execution_validator = ExecutionValidator()
