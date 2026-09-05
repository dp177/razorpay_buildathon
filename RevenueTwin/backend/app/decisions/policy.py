from typing import Dict, Any
from app.models.domain import AgentDecision
from datetime import datetime, timedelta, timezone

class PolicyEnforcer:
    def __init__(self):
        # Configurable limits per 24 hours
        self.limits = {
            "RETENTION_OFFER": 2, # Low for testing
            "ESCALATION": 5,
            "RETRY": 3,
            "REMINDER": 3
        }

    async def check_limits(self, customer_id: Any, action: str) -> bool:
        if action not in self.limits:
            return True
            
        limit = self.limits[action]
        cutoff = datetime.utcnow() - timedelta(days=1)
        
        # In a real app we would query the database for executed actions.
        # We'll just do a basic stub that passes for now, unless we explicitly inject a failure for testing.
        return True
        
    async def get_global_policies(self, agent_id: str) -> list[str]:
        from app.models.domain import GlobalPolicy
        policies = await GlobalPolicy.find(
            GlobalPolicy.agent_id == agent_id,
            GlobalPolicy.is_active == True
        ).to_list()
        return [p.constraint_rule for p in policies]

policy_enforcer = PolicyEnforcer()
