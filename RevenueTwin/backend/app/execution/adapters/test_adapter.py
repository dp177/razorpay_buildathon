from typing import Dict, Any
from uuid import UUID
from app.execution.base import BaseActionExecutor
import random

class TestActionExecutor(BaseActionExecutor):
    def __init__(self):
        # We simulate a deterministic outcome for testing based on the action and customer data.
        self.costs = {
            "RETENTION_OFFER": 150.0,
            "ESCALATION": 100.0,
            "REMINDER": 0.5,
            "PAYMENT_LINK": 1.0,
            "RETRY": 0.0,
            "ALTERNATE_PAYMENT": 0.0,
            "CARD_UPDATE": 0.0,
            "RESUME_CHECKOUT": 0.0,
            "PERSONALIZED_MESSAGE": 5.0,
            "PLAN_CHANGE": 0.0,
            "PROMISE_RECONFIRMATION": 0.0,
            "MANDATE_RETRY": 0.0,
            "CUSTOMER_CONTACT": 10.0,
            "VOICE_CALL": 50.0,
            "NO_ACTION": 0.0
        }

    async def validate(self, action: str, customer_id: UUID, payload: Dict[str, Any]) -> bool:
        return True

    async def execute(self, action: str, customer_id: UUID, payload: Dict[str, Any]) -> Dict[str, Any]:
        amount = payload.get("amount_at_risk", 0.0)
        cost = self.costs.get(action, 0.0)
        
        # Simulate outcome deterministically based on action length and amount (pseudo-deterministic)
        # Real system would use context, but for testing we just do a stable branch
        if action == "NO_ACTION":
            return {
                "status": "NOT_APPLICABLE",
                "recovered_amount": 0.0,
                "intervention_cost": 0.0,
                "message": "No action executed"
            }
            
        success = amount % 2 != 1.0 # arbitrary stable rule for test failure scenarios
        # E.g. 4999.0 % 2 is 1.0 -> False, so it fails? Wait, let's just make it always succeed for the basic demo
        # unless specifically instructed to fail via payload.
        
        if payload.get("force_fail", False):
            return {
                "status": "FAILED",
                "recovered_amount": 0.0,
                "intervention_cost": cost,
                "message": "Execution failed downstream"
            }
            
        return {
            "status": "SUCCESS",
            "recovered_amount": amount,
            "intervention_cost": cost,
            "message": f"Successfully executed {action} in test mode."
        }

    async def cancel(self, execution_id: UUID) -> bool:
        return True
