import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import uuid

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.config import settings
from app.models.domain import (
    Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
    Payment, Return, Refund, Subscription, SubscriptionEvent,
    Invoice, PromiseToPay, Notification, RecoveryAction,
    RevenueEvent, AgentModel, AgentRun, AgentDecision, AgentAction, AgentOutcome, AgentMemory, AgentTrace
)
from app.events.schemas import RevenueEventSchema
from app.events.event_types import EventType
from app.events.event_engine import event_engine
from app.agents import register_all_agents

async def run_demo():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
            Payment, Return, Refund, Subscription, SubscriptionEvent,
            Invoice, PromiseToPay, Notification, RecoveryAction,
            RevenueEvent, AgentModel, AgentRun, AgentDecision, AgentAction, AgentOutcome, AgentMemory, AgentTrace
        ]
    )
    register_all_agents()
    
    print("=" * 40)
    print("REVENUETWIN AGENT DEMO")
    print("=" * 40)
    
    customer = await Customer.find_one()
    if not customer:
        print("No customer found. Run generate_data.py first.")
        return
        
    print(f"\nCustomer:\n{customer.name} ({customer.id})")
    
    print("\nEvent:\nPAYMENT_FAILED")
    print("\nAmount at risk:\n$4,999.00")
    print("\n" + "-" * 40 + "\n")
    
    event = RevenueEventSchema(
        customer_id=customer.id,
        merchant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
        event_type=EventType.PAYMENT_FAILED,
        amount_at_risk=4999.0
    )
    
    res = await event_engine.publish_event(event)
    
    if "run_id" not in res:
        print(f"Flow aborted: {res}")
        return
        
    run_id = uuid.UUID(res["run_id"])
    
    # Wait briefly for traces to persist in async flow
    await asyncio.sleep(1)
    
    traces = await AgentTrace.find(AgentTrace.run_id == run_id).sort("timestamp").to_list()
    for t in traces:
        print(f"{t.stage}")
        print(f"{t.message}")
        if t.metadata:
            print(t.metadata)
        print(" | ")
        print(" V ")
        
    print("No action executed.\n")
    print("=" * 40)

if __name__ == "__main__":
    asyncio.run(run_demo())
