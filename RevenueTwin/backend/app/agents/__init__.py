from app.agents.registry import agent_registry
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
