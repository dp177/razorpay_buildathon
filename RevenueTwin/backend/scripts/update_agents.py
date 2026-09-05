import os

AGENTS = {
    "payment_recovery": {
        "class_name": "PaymentRecoveryAgent",
        "agent_id": "payment_recovery",
        "name": "Payment Recovery Agent",
        "supported_event_types": ["PAYMENT_FAILED"],
        "objective": "Maximize probability of recovering a failed payment while minimizing unnecessary retries and customer fatigue.",
        "required_context": ["payment_history", "payment_method_success_rate", "purchase_frequency", "notification_fatigue"],
        "candidate_actions": ["RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK", "CARD_UPDATE", "NO_ACTION"],
        "hard_constraints": ["Do not blindly retry if payment method repeatedly failed recently.", "Avoid unnecessary communication if fatigue is high."],
        "decision_rules": [
            "If an alternative method has strong historical success, consider ALTERNATE_PAYMENT.",
            "If payment failure is caused by an expired card, CARD_UPDATE becomes relevant."
        ],
        "eval_logic": """
        if event.get("metadata", {}).get("reason") == "EXPIRED_CARD":
            return "CARD_UPDATE"
        # Demo scenarios mapping
        features = getattr(context, 'relevant_behavior_features', None)
        if features and getattr(features, 'payment_method_success_rate', {}).get('UPI', 0) > 0.8:
            return "ALTERNATE_PAYMENT"
        """
    },
    "payment_degradation": {
        "class_name": "PaymentDegradationAgent",
        "agent_id": "payment_degradation",
        "name": "Payment Degradation Agent",
        "supported_event_types": ["PAYMENT_DEGRADATION"],
        "objective": "Identify why payment performance is deteriorating and recommend the highest-value corrective action.",
        "required_context": ["payment_success_rate", "payment_failure_rate"],
        "candidate_actions": ["INVESTIGATE", "ALTERNATE_PAYMENT", "MERCHANT_ALERT", "ROUTE_TO_PAYMENT_RECOVERY", "NO_ACTION"],
        "hard_constraints": ["Distinguish customer-specific degradation from system degradation."],
        "decision_rules": ["If degradation crosses 30% threshold, MERCHANT_ALERT."],
        "eval_logic": ""
    },
    "checkout_recovery": {
        "class_name": "CheckoutRecoveryAgent",
        "agent_id": "checkout_recovery",
        "name": "Checkout Recovery Agent",
        "supported_event_types": ["CHECKOUT_DROPOFF"],
        "objective": "Recover a checkout with minimum customer friction.",
        "required_context": ["checkout_abandonment_rate", "checkout_completion_rate", "notification_fatigue"],
        "candidate_actions": ["RESUME_CHECKOUT", "PAYMENT_LINK", "ASSISTANCE", "REMINDER", "NO_ACTION"],
        "hard_constraints": ["Do not spam customer with reminders."],
        "decision_rules": ["If customer abandons immediately after adding products, RESUME_CHECKOUT may be preferable."],
        "eval_logic": ""
    },
    "cart_recovery": {
        "class_name": "CartRecoveryAgent",
        "agent_id": "cart_recovery",
        "name": "Cart Recovery Agent",
        "supported_event_types": ["CART_ABANDONMENT"],
        "objective": "Recover an abandoned cart without excessive messaging.",
        "required_context": ["cart_abandonment_rate", "notification_fatigue", "purchase_frequency"],
        "candidate_actions": ["RESUME_CHECKOUT", "REMINDER", "PERSONALIZED_MESSAGE", "NO_ACTION"],
        "hard_constraints": ["Do not automatically assume every abandoned cart is recoverable."],
        "decision_rules": ["If fatigue is high, use NO_ACTION."],
        "eval_logic": ""
    },
    "subscription_recovery": {
        "class_name": "SubscriptionRecoveryAgent",
        "agent_id": "subscription_recovery",
        "name": "Subscription Recovery Agent",
        "supported_event_types": ["SUBSCRIPTION_PAYMENT_FAILURE"],
        "objective": "Recover a failed recurring payment while preserving subscription value.",
        "required_context": ["subscription_tenure_months", "payment_success_rate", "customer_engagement_score"],
        "candidate_actions": ["RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK", "PLAN_CHANGE", "NO_ACTION"],
        "hard_constraints": ["Respect renewal schedules."],
        "decision_rules": ["If alternative payment historically successful, use ALTERNATE_PAYMENT."],
        "eval_logic": ""
    },
    "churn_prevention": {
        "class_name": "ChurnPreventionAgent",
        "agent_id": "churn_prevention",
        "name": "Churn Prevention Agent",
        "supported_event_types": ["SUBSCRIPTION_CHURN_RISK"],
        "objective": "Reduce probability of customer churn without unnecessarily discounting loyal customers.",
        "required_context": ["churn_risk", "customer_lifetime_value", "subscription_pause_rate"],
        "candidate_actions": ["PLAN_CHANGE", "RETENTION_OFFER", "ASSISTANCE", "REMINDER", "NO_ACTION"],
        "hard_constraints": ["Max modeled success probability for retention offer = 80%", "Limits apply on offers."],
        "decision_rules": ["If high value and declining engagement, RETENTION_OFFER."],
        "eval_logic": ""
    },
    "receivables": {
        "class_name": "ReceivablesAgent",
        "agent_id": "receivables",
        "name": "B2B Receivables Agent",
        "supported_event_types": ["RECEIVABLE_OVERDUE"],
        "objective": "Recover overdue receivables while preserving customer relationship and prioritizing economically meaningful accounts.",
        "required_context": ["average_invoice_delay_days", "overdue_invoice_rate"],
        "candidate_actions": ["REMINDER", "PAYMENT_LINK", "PROMISE_TO_PAY", "ESCALATION", "NO_ACTION"],
        "hard_constraints": ["Distinguish large reliable late payer from small chronic non-payer."],
        "decision_rules": ["If delay > 30 days and chronic, ESCALATION."],
        "eval_logic": ""
    },
    "mandate_recovery": {
        "class_name": "MandateRecoveryAgent",
        "agent_id": "mandate_recovery",
        "name": "Mandate Recovery Agent",
        "supported_event_types": ["MANDATE_FAILURE"],
        "objective": "Recover recurring payments when mandate execution fails.",
        "required_context": ["payment_reliability", "subscription_failure_rate"],
        "candidate_actions": ["MANDATE_RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK", "CUSTOMER_CONTACT", "NO_ACTION"],
        "hard_constraints": ["Avoid repeated retries when historical evidence indicates low probability of success."],
        "decision_rules": ["If retry rate high, CUSTOMER_CONTACT."],
        "eval_logic": ""
    },
    "promise_to_pay": {
        "class_name": "PromiseToPayAgent",
        "agent_id": "promise_to_pay",
        "name": "Promise-to-Pay Agent",
        "supported_event_types": ["PROMISE_TO_PAY_DUE", "PROMISE_TO_PAY_BROKEN"],
        "objective": "Increase fulfillment of outstanding promises.",
        "required_context": ["promise_to_pay_success_rate", "promise_to_pay_break_rate"],
        "candidate_actions": ["REMINDER", "PAYMENT_LINK", "PROMISE_RECONFIRMATION", "ESCALATION", "NO_ACTION"],
        "hard_constraints": ["Consider if customer historically keeps promises before escalating."],
        "decision_rules": ["If broken > 2, ESCALATION."],
        "eval_logic": ""
    },
    "voice_recovery": {
        "class_name": "VoiceRecoveryAgent",
        "agent_id": "voice_recovery",
        "name": "Voice Recovery Agent",
        "supported_event_types": ["VOICE_RECOVERY_REQUIRED"],
        "objective": "Determine whether a voice intervention is justified.",
        "required_context": ["customer_lifetime_value", "recovery_propensity"],
        "candidate_actions": ["VOICE_CALL", "PAYMENT_LINK", "ASSISTANCE", "NO_ACTION"],
        "hard_constraints": ["Do not recommend voice simply because amount_at_risk is high."],
        "decision_rules": ["If customer high value and hasn't responded to emails, VOICE_CALL."],
        "eval_logic": ""
    }
}

template = """from typing import List, Any, Dict, Optional
from app.agents.base import BaseAgent, AgentDecisionProfile
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry

class {class_name}(BaseAgent):
    def __init__(self):
        self._profile = AgentDecisionProfile(
            objective="{objective}",
            required_context={required_context},
            candidate_actions={candidate_actions},
            hard_constraints={hard_constraints},
            decision_rules={decision_rules}
        )
        # Override the evaluate_rules method safely on the instance's profile
        # Note: We bind a method dynamically for simplicity in testing
        
        def evaluate_rules_logic(event: dict, context: Any) -> Optional[str]:
            {eval_logic}
            return None
            
        self._profile.evaluate_rules = evaluate_rules_logic
        
    @property
    def profile(self) -> AgentDecisionProfile:
        return self._profile

    @property
    def agent_id(self) -> str:
        return "{agent_id}"

    @property
    def name(self) -> str:
        return "{name}"

    @property
    def supported_event_types(self) -> List[str]:
        return {supported_event_types}

    @property
    def allowed_actions(self) -> List[str]:
        return self._profile.candidate_actions

    async def can_handle(self, event: RevenueEventSchema) -> bool:
        return event.event_type in self.supported_event_types

    async def get_required_context(self, event: RevenueEventSchema) -> List[str]:
        return self._profile.required_context

    async def evaluate(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        return {{"status": "evaluated"}}

    async def recommend(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        return {{"action": "NO_ACTION"}}

    def get_status(self) -> str:
        return "active"

agent_registry.register({class_name}())
"""

base_dir = r"e:\razor\RevenueTwin\backend\app\agents"

for folder_name, cfg in AGENTS.items():
    folder_path = os.path.join(base_dir, folder_name)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    
    file_path = os.path.join(folder_path, "agent.py")
    import textwrap
    eval_logic_indented = textwrap.dedent(cfg["eval_logic"]).strip().replace("\n", "\n            ")
    if not eval_logic_indented:
        eval_logic_indented = "pass"
        
    content = template.format(
        class_name=cfg["class_name"],
        agent_id=cfg["agent_id"],
        name=cfg["name"],
        supported_event_types=cfg["supported_event_types"],
        objective=cfg["objective"],
        required_context=cfg["required_context"],
        candidate_actions=cfg["candidate_actions"],
        hard_constraints=cfg["hard_constraints"],
        decision_rules=cfg["decision_rules"],
        eval_logic=eval_logic_indented
    )
    
    with open(file_path, "w") as f:
        f.write(content)

print("Updated all agents.")
