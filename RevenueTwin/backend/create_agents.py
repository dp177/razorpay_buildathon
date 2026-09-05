import os

agents_data = [
    {
        "folder": "payment_recovery",
        "class_name": "PaymentRecoveryAgent",
        "agent_id": "agent_payment_recovery",
        "name": "Payment Recovery Agent",
        "description": "Recover failed payments.",
        "domain": "Payments",
        "events": ["PAYMENT_FAILED"],
        "actions": ["RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK", "CARD_UPDATE", "NO_ACTION"]
    },
    {
        "folder": "payment_degradation",
        "class_name": "PaymentDegradationAgent",
        "agent_id": "agent_payment_degradation",
        "name": "Payment Degradation Agent",
        "description": "Detect worsening payment performance and identify possible root causes.",
        "domain": "Payments",
        "events": ["PAYMENT_DEGRADATION"],
        "actions": ["INVESTIGATE", "CHANGE_PAYMENT_METHOD", "ALERT_MERCHANT", "ROUTE_TO_PAYMENT_RECOVERY"]
    },
    {
        "folder": "checkout_recovery",
        "class_name": "CheckoutRecoveryAgent",
        "agent_id": "agent_checkout_recovery",
        "name": "Checkout Recovery Agent",
        "description": "Recover users who started checkout but did not complete it.",
        "domain": "Checkout",
        "events": ["CHECKOUT_DROPOFF"],
        "actions": ["RESUME_CHECKOUT", "PAYMENT_LINK", "ASSISTANCE", "REMINDER", "NO_ACTION"]
    },
    {
        "folder": "cart_recovery",
        "class_name": "CartRecoveryAgent",
        "agent_id": "agent_cart_recovery",
        "name": "Cart Recovery Agent",
        "description": "Recover abandoned carts.",
        "domain": "Cart",
        "events": ["CART_ABANDONMENT"],
        "actions": ["RESUME_CHECKOUT", "REMINDER", "PERSONALIZED_MESSAGE", "NO_ACTION"]
    },
    {
        "folder": "subscription_recovery",
        "class_name": "SubscriptionRecoveryAgent",
        "agent_id": "agent_subscription_recovery",
        "name": "Subscription Recovery Agent",
        "description": "Recover failed subscription renewals.",
        "domain": "Subscriptions",
        "events": ["SUBSCRIPTION_PAYMENT_FAILURE"],
        "actions": ["RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK", "PLAN_CHANGE", "NO_ACTION"]
    },
    {
        "folder": "churn_prevention",
        "class_name": "ChurnPreventionAgent",
        "agent_id": "agent_churn_prevention",
        "name": "Churn Prevention Agent",
        "description": "Identify customers likely to cancel and choose an appropriate retention strategy.",
        "domain": "Retention",
        "events": ["SUBSCRIPTION_CHURN_RISK"],
        "actions": ["PLAN_CHANGE", "RETENTION_OFFER", "ASSISTANCE", "REMINDER", "NO_ACTION"]
    },
    {
        "folder": "receivables",
        "class_name": "ReceivablesAgent",
        "agent_id": "agent_receivables",
        "name": "B2B Receivables Agent",
        "description": "Recover overdue B2B invoices.",
        "domain": "B2B",
        "events": ["RECEIVABLE_OVERDUE"],
        "actions": ["REMINDER", "PAYMENT_LINK", "PROMISE_TO_PAY", "ESCALATION", "NO_ACTION"]
    },
    {
        "folder": "mandate_recovery",
        "class_name": "MandateRecoveryAgent",
        "agent_id": "agent_mandate_recovery",
        "name": "Mandate Recovery Agent",
        "description": "Recover failed recurring-payment mandates.",
        "domain": "Payments",
        "events": ["MANDATE_FAILURE"],
        "actions": ["MANDATE_RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK", "CUSTOMER_CONTACT", "NO_ACTION"]
    },
    {
        "folder": "promise_to_pay",
        "class_name": "PromiseToPayAgent",
        "agent_id": "agent_promise_to_pay",
        "name": "Promise-to-Pay Agent",
        "description": "Track promises made by customers and determine the appropriate follow-up.",
        "domain": "Collections",
        "events": ["PROMISE_TO_PAY_DUE", "PROMISE_TO_PAY_BROKEN"],
        "actions": ["REMINDER", "PAYMENT_LINK", "PROMISE_RECONFIRMATION", "ESCALATION", "NO_ACTION"]
    },
    {
        "folder": "voice_recovery",
        "class_name": "VoiceRecoveryAgent",
        "agent_id": "agent_voice_recovery",
        "name": "Voice Recovery Agent",
        "description": "Determine when voice-based intervention may be useful.",
        "domain": "Voice",
        "events": ["VOICE_RECOVERY_REQUIRED"],
        "actions": ["VOICE_CALL", "PAYMENT_LINK", "ASSISTANCE", "NO_ACTION"]
    }
]

template = """from typing import List, Any, Dict
from app.agents.base import BaseAgent
from app.events.schemas import RevenueEventSchema

class {class_name}(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "{agent_id}"

    @property
    def name(self) -> str:
        return "{name}"

    @property
    def description(self) -> str:
        return "{description}"

    @property
    def domain(self) -> str:
        return "{domain}"

    @property
    def supported_event_types(self) -> List[str]:
        return {events}

    @property
    def allowed_actions(self) -> List[str]:
        return {actions}

    async def can_handle(self, event: RevenueEventSchema) -> bool:
        return event.event_type in self.supported_event_types

    async def get_required_context(self, event: RevenueEventSchema) -> List[str]:
        return ["customer_history"]

    async def evaluate(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        return {{"status": "evaluated"}}

    async def recommend(self, event: RevenueEventSchema, context: Dict[str, Any]) -> Dict[str, Any]:
        return {{"action": self.allowed_actions[0] if self.allowed_actions else "NO_ACTION"}}

    def get_status(self) -> str:
        return "active"
"""

init_content = """from app.agents.registry import agent_registry
from .payment_recovery.agent import PaymentRecoveryAgent
from .payment_degradation.agent import PaymentDegradationAgent
from .checkout_recovery.agent import CheckoutRecoveryAgent
from .cart_recovery.agent import CartRecoveryAgent
from .subscription_recovery.agent import SubscriptionRecoveryAgent
from .churn_prevention.agent import ChurnPreventionAgent
from .receivables.agent import ReceivablesAgent
from .mandate_recovery.agent import MandateRecoveryAgent
from .promise_to_pay.agent import PromiseToPayAgent
from .voice_recovery.agent import VoiceRecoveryAgent

def register_all_agents():
    agent_registry.register(PaymentRecoveryAgent())
    agent_registry.register(PaymentDegradationAgent())
    agent_registry.register(CheckoutRecoveryAgent())
    agent_registry.register(CartRecoveryAgent())
    agent_registry.register(SubscriptionRecoveryAgent())
    agent_registry.register(ChurnPreventionAgent())
    agent_registry.register(ReceivablesAgent())
    agent_registry.register(MandateRecoveryAgent())
    agent_registry.register(PromiseToPayAgent())
    agent_registry.register(VoiceRecoveryAgent())
"""

base_dir = r"e:\razor\RevenueTwin\backend\app\agents"
os.makedirs(base_dir, exist_ok=True)

for agent in agents_data:
    folder_path = os.path.join(base_dir, agent["folder"])
    os.makedirs(folder_path, exist_ok=True)
    
    with open(os.path.join(folder_path, "__init__.py"), "w") as f:
        pass
        
    with open(os.path.join(folder_path, "agent.py"), "w") as f:
        content = template.format(
            class_name=agent["class_name"],
            agent_id=agent["agent_id"],
            name=agent["name"],
            description=agent["description"],
            domain=agent["domain"],
            events=agent["events"],
            actions=agent["actions"]
        )
        f.write(content)

with open(os.path.join(base_dir, "__init__.py"), "w") as f:
    f.write(init_content)

print("Agents generated successfully.")
