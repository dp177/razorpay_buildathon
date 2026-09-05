from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
from app.models.domain import (
    Customer, Merchant, RevenueEvent, AgentModel,
    AgentRun, AgentTrace, AgentDecision, ApprovalRecord, ExecutionRecord, ActionOutcome, AuditLog, AgentMemory, GlobalPolicy,
    SimulationState,
    Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
    Payment, Return, Refund, Subscription, SubscriptionEvent,
    Invoice, PromiseToPay, Notification, RecoveryAction
)

async def init_db():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Customer, Merchant, RevenueEvent, AgentModel,
            AgentRun, AgentTrace, AgentDecision, ApprovalRecord, ExecutionRecord, ActionOutcome, AuditLog, AgentMemory, GlobalPolicy,
            SimulationState,
            Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
            Payment, Return, Refund, Subscription, SubscriptionEvent,
            Invoice, PromiseToPay, Notification, RecoveryAction
        ]
    )
