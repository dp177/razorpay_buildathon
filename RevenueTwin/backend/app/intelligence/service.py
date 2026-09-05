from uuid import UUID
from typing import Any
from app.models.domain import (
    Customer, Order, Payment, Cart, CheckoutSession, Return, Refund, 
    Subscription, Invoice, PromiseToPay, Notification, RecoveryAction
)
from app.intelligence.schemas import CustomerContext, TimelineEvent
from app.intelligence.features import FeatureCalculator

class CustomerIntelligenceService:
    async def get_customer_timeline(self, customer_id: UUID):
        timeline = []
        orders = await Order.find(Order.customer_id == customer_id).to_list()
        for o in orders:
            timeline.append(TimelineEvent(timestamp=o.timestamp, event_type="ORDER", amount=o.total, details={"order_id": str(o.order_id)}))
        
        payments = await Payment.find(Payment.customer_id == customer_id).to_list()
        for p in payments:
            timeline.append(TimelineEvent(timestamp=p.timestamp, event_type=f"PAYMENT_{p.status}", amount=p.amount, details={"method": p.payment_method}))
            
        returns = await Return.find(Return.customer_id == customer_id).to_list()
        for r in returns:
            timeline.append(TimelineEvent(timestamp=r.return_date, event_type="RETURN", details={"reason": r.return_reason}))
            
        subscriptions = await Subscription.find(Subscription.customer_id == customer_id).to_list()
        for s in subscriptions:
            timeline.append(TimelineEvent(timestamp=s.start_date, event_type="SUBSCRIPTION_STARTED", amount=s.price, details={"plan": s.plan}))
            
        checkouts = await CheckoutSession.find(CheckoutSession.customer_id == customer_id).to_list()
        for c in checkouts:
            timeline.append(TimelineEvent(timestamp=c.checkout_started, event_type=f"CHECKOUT_{c.status.upper()}", details={"step": c.checkout_step}))

        timeline.sort(key=lambda x: x.timestamp)
        return timeline
    
    async def get_specialist_context(self, customer_id: UUID, agent_id: str) -> Any:
        from app.intelligence.specialist.synthetic import generate_for_agent
        
        # A live scenario stores the exact specialist payload generated for the
        # customer. This keeps the profile, evidence, and agent decision aligned.
        
        # Map agent_id back to event_type string used by synthetic generator
        agent_to_event = {
            "cart_recovery": "CART_ABANDONMENT",
            "checkout_recovery": "CHECKOUT_DROPOFF",
            "payment_recovery": "PAYMENT_FAILED",
            "subscription_recovery": "SUBSCRIPTION_PAYMENT_FAILURE",
            "churn_prevention": "CHURN_RISK",
            "b2b_receivables": "RECEIVABLE_OVERDUE",
            "mandate_recovery": "MANDATE_FAILURE",
            "promise_to_pay": "PROMISE_TO_PAY",
            "payment_degradation": "PAYMENT_DEGRADATION",
            "voice_recovery": "VOICE_RECOVERY",
        }
        
        event_type = agent_to_event.get(agent_id, "CART_ABANDONMENT")
        customer = await Customer.find_one(Customer.id == customer_id)
        stored_context = (customer.current_state or {}).get("specialist_context") if customer else None
        data = stored_context or generate_for_agent(event_type, str(customer_id))
        data["relevant_behavior_features"] = {
            **data.get("specialist_history", {}),
            "evidence_cards": data.get("evidence_cards", []),
        }
        
        # Add Persistent Memory
        from app.models.domain import AgentMemory
        memories = await AgentMemory.find(
            AgentMemory.customer_id == customer_id,
            AgentMemory.agent_id == agent_id
        ).sort("-id").limit(10).to_list()
        
        data["historical_learnings"] = [m.memory_value for m in memories]
        
        return data

    async def get_customer_context(self, customer_id: UUID) -> Any:
        """Compatibility entry point for existing API callers."""
        return await self.get_specialist_context(customer_id, "cart_recovery")

intelligence_service = CustomerIntelligenceService()
