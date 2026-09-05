import random
import hashlib
from typing import Dict, Any

class CustomerBehaviorEngine:
    """
    Deterministically evaluates customer responses to interventions based on
    their history, state, and the action taken.
    """
    
    @staticmethod
    def _generate_seed(customer_id: str, action: str, run_id: str) -> float:
        """Generates a deterministic float between 0 and 1."""
        h = hashlib.sha256(f"{customer_id}:{action}:{run_id}".encode()).hexdigest()
        return int(h[:8], 16) / 0xffffffff

    async def evaluate_response(
        self, 
        customer_id: str, 
        run_id: str,
        customer_state: Dict[str, Any],
        behavior_profile: Dict[str, Any], 
        action: str, 
        time_elapsed_hours: float
    ) -> str:
        """
        Returns the event that the customer generates in response to the action.
        Examples: CUSTOMER_RETURNED_TO_CHECKOUT, PURCHASED, IGNORED, PAYMENT_FAILED, NO_RESPONSE
        """
        # If not enough time has passed to observe a response, return NO_RESPONSE
        if time_elapsed_hours < 1:
            return "NO_RESPONSE"
            
        seed = self._generate_seed(customer_id, action, run_id)
        
        intent = behavior_profile.get("purchase_intent", "MEDIUM")
        fatigue = behavior_profile.get("notification_fatigue", "LOW")
        
        intent_score = {"HIGH": 0.8, "MEDIUM": 0.5, "LOW": 0.2}.get(intent, 0.5)
        fatigue_penalty = {"HIGH": -0.3, "MEDIUM": -0.1, "LOW": 0.0}.get(fatigue, 0)
        
        base_probability = intent_score + fatigue_penalty
        
        # Specific scenarios
        if action == "RESUME_CHECKOUT":
            if time_elapsed_hours >= 4:
                # 4 hours is enough time for a checkout resume
                if seed < base_probability:
                    # They returned. Did they buy?
                    if seed < (base_probability * 0.7): # 70% of returns convert
                        if customer_state.get("payment_issues", False) and seed > 0.4:
                            return "PAYMENT_FAILED"
                        return "PURCHASED"
                    return "CUSTOMER_RETURNED_TO_CHECKOUT"
                return "IGNORED"
                
        elif action == "RETRY":
            # Retry happens automatically.
            if seed < 0.6:
                return "PURCHASED" # Retry succeeded
            return "PAYMENT_FAILED"
            
        elif action in ["ALTERNATE_PAYMENT", "PAYMENT_LINK"]:
            if time_elapsed_hours >= 12:
                if seed < (base_probability * 1.2): # Higher success if intent is high
                    return "PURCHASED"
                return "IGNORED"
                
        elif action == "RETENTION_OFFER":
            if time_elapsed_hours >= 24:
                if seed < (base_probability * 1.5): # Offers convert well
                    return "OFFER_ACCEPTED"
                return "CHURNED"
                
        elif action == "WAIT":
            # If the agent waited, what did the customer do organically?
            if time_elapsed_hours >= 24:
                if seed < (intent_score * 0.5): # Organic conversion is lower
                    return "PURCHASED"
                return "NO_RESPONSE"
        
        return "NO_RESPONSE"

behavior_engine = CustomerBehaviorEngine()
