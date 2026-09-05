import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.config import settings
from app.models.domain import (
    Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
    Payment, Return, Refund, Subscription, SubscriptionEvent,
    Invoice, PromiseToPay, Notification, RecoveryAction
)

async def validate():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
            Payment, Return, Refund, Subscription, SubscriptionEvent,
            Invoice, PromiseToPay, Notification, RecoveryAction
        ]
    )
    
    print("Validating data integrity and constraints...")
    
    # 1. Orphan checks
    orders_without_customer = await Order.find(Order.customer_id == None).count()
    if orders_without_customer > 0:
        print(f"FAILED: Found {orders_without_customer} orders without customer_id")
    else:
        print("PASS: No orphan orders")

    # 2. Chronology: refund before payment
    refunds = await Refund.find_all().to_list()
    bad_refunds = 0
    for r in refunds:
        payment = await Payment.find_one(Payment.payment_id == r.payment_id)
        if payment and r.refund_date < payment.timestamp:
            bad_refunds += 1
    if bad_refunds > 0:
        print(f"FAILED: Found {bad_refunds} refunds occurring before their payment")
    else:
        print("PASS: Refund chronology is correct")

    # 3. Chronology: payment before order
    payments = await Payment.find_all().to_list()
    bad_payments = 0
    for p in payments:
        if p.order_id:
            order = await Order.find_one(Order.order_id == p.order_id)
            if order and p.timestamp < order.timestamp:
                bad_payments += 1
    if bad_payments > 0:
        print(f"FAILED: Found {bad_payments} payments occurring before their order")
    else:
        print("PASS: Payment chronology is correct")
        
    print("Validation complete.")

if __name__ == "__main__":
    asyncio.run(validate())
