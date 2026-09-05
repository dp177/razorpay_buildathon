import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import statistics
import json

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.config import settings
from app.models.domain import (
    Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
    Payment, Return, Refund, Subscription, SubscriptionEvent,
    Invoice, PromiseToPay, Notification, RecoveryAction
)
from app.intelligence.service import intelligence_service

async def run_report():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
            Payment, Return, Refund, Subscription, SubscriptionEvent,
            Invoice, PromiseToPay, Notification, RecoveryAction
        ]
    )
    
    print("=" * 60)
    print("FINAL VERIFICATION REPORT")
    print("=" * 60)
    
    print("\n--- RECORD COUNTS ---")
    models = [
        Customer, Product, Order, Payment, Cart, CheckoutSession,
        Return, Refund, Subscription, Invoice, PromiseToPay, Notification, RecoveryAction
    ]
    for m in models:
        count = await m.find_all().count()
        print(f"{m.__name__}: {count}")

    print("\n--- FEATURE DISTRIBUTIONS ---")
    customers = await Customer.find_all().limit(100).to_list()
    if customers:
        clvs = []
        payment_rates = []
        abandon_rates = []
        freqs = []
        for c in customers:
            ctx = await intelligence_service.get_customer_context(c.id)
            feats = ctx.relevant_behavior_features
            clvs.append(feats.customer_lifetime_value)
            payment_rates.append(feats.payment_success_rate)
            abandon_rates.append(feats.checkout_abandonment_rate)
            freqs.append(feats.purchase_frequency)
            
        print(f"Customer Lifetime Value (sample 100): Avg={statistics.mean(clvs):.2f}, Max={max(clvs):.2f}")
        print(f"Payment Success Rate (sample 100): Avg={statistics.mean(payment_rates):.2f}")
        print(f"Checkout Abandonment (sample 100): Avg={statistics.mean(abandon_rates):.2f}")
        print(f"Purchase Frequency (sample 100): Avg={statistics.mean(freqs):.2f}")

    print("\n--- EXAMPLE CUSTOMER TIMELINES ---")
    for i in range(min(5, len(customers))):
        c = customers[i]
        print(f"\nTimeline for {c.name} ({c.archetype}):")
        ctx = await intelligence_service.get_customer_context(c.id)
        for e in ctx.recent_history[-5:]:
            print(f"  {e.timestamp.strftime('%Y-%m-%d')} - {e.event_type} - {e.amount} - {e.details}")

    print("\n--- EXAMPLE CONTEXT PACKETS ---")
    for i in range(min(2, len(customers))): # print just 2 full packets to avoid massive wall of text
        c = customers[i]
        print(f"\nContext for {c.name}:")
        ctx = await intelligence_service.get_customer_context(c.id)
        print(ctx.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(run_report())
