import asyncio
import random
from datetime import datetime, timedelta, timezone
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

CUSTOMERS_COUNT = 10
PRODUCTS_COUNT = 50
YEARS_HISTORY = 5
RANDOM_SEED = 42

ARCHETYPES = [
    "LOYAL_HIGH_VALUE", "FREQUENT_LOW_VALUE", "PRICE_SENSITIVE", "WINDOW_SHOPPER",
    "HIGH_RETURN_CUSTOMER", "PAYMENT_UNRELIABLE", "PAYMENT_CONSTRAINED", "HIGH_ENGAGEMENT",
    "LOW_ENGAGEMENT", "FATIGUE_PRONE", "SUBSCRIPTION_LOYAL", "SUBSCRIPTION_CHURN_RISK",
    "B2B_RELIABLE_PAYER", "B2B_SLOW_PAYER", "B2B_PROMISE_BREAKER", "SEASONAL_CUSTOMER",
    "RECOVERABLE_CUSTOMER", "LOW_INTENT_CUSTOMER"
]

def generate_products():
    categories = ["Electronics", "Fashion", "Home", "Beauty", "Grocery", "Software", "Subscriptions", "Services"]
    products = []
    for i in range(PRODUCTS_COUNT):
        cat = random.choice(categories)
        price = round(random.uniform(10.0, 500.0), 2)
        cost = round(price * random.uniform(0.3, 0.7), 2)
        products.append(Product(
            category=cat,
            name=f"{cat} Product {i}",
            price=price,
            cost=cost,
            margin=price - cost
        ))
    return products

def generate_customer_history(customer, products, start_date, end_date):
    events = []
    current_date = start_date
    
    is_high_value = customer.archetype in ["LOYAL_HIGH_VALUE", "B2B_RELIABLE_PAYER"]
    is_payment_unreliable = customer.archetype in ["PAYMENT_UNRELIABLE", "PAYMENT_CONSTRAINED", "B2B_PROMISE_BREAKER"]
    is_high_return = customer.archetype == "HIGH_RETURN_CUSTOMER"
    is_b2b = "B2B" in customer.archetype
    
    order_prob_per_week = 0.8 if is_high_value else 0.2
    if customer.archetype == "FREQUENT_LOW_VALUE":
        order_prob_per_week = 0.9
        
    payment_fail_prob = 0.4 if is_payment_unreliable else 0.05
    return_prob = 0.3 if is_high_return else 0.05
    cart_abandon_prob = 0.6 if customer.archetype in ["WINDOW_SHOPPER", "PRICE_SENSITIVE", "LOW_INTENT_CUSTOMER"] else 0.2
    
    while current_date < end_date:
        if is_b2b and random.random() < 0.1:
            amount = round(random.uniform(500, 5000), 2)
            due_date = current_date + timedelta(days=30)
            
            days_late = 0
            if customer.archetype == "B2B_SLOW_PAYER":
                days_late = random.randint(15, 60)
            elif customer.archetype == "B2B_PROMISE_BREAKER":
                days_late = random.randint(30, 90)
                
            payment_date = due_date + timedelta(days=days_late) if random.random() < 0.9 else None
            status = "PAID" if payment_date and payment_date < end_date else "UNPAID"
            
            inv = Invoice(
                customer_id=customer.id,
                amount=amount,
                issue_date=current_date,
                due_date=due_date,
                payment_date=payment_date if status == "PAID" else None,
                days_overdue=days_late if status == "PAID" else max(0, (end_date - due_date).days),
                status=status
            )
            events.append(inv)
            
            if days_late > 20 and status == "PAID":
                prom = PromiseToPay(
                    customer_id=customer.id,
                    invoice_id=inv.invoice_id,
                    promise_date=due_date + timedelta(days=10),
                    promised_amount=amount,
                    due_date=due_date + timedelta(days=days_late + 5),
                    status="BROKEN" if customer.archetype == "B2B_PROMISE_BREAKER" else "FULFILLED",
                    days_late=5 if customer.archetype == "B2B_PROMISE_BREAKER" else 0
                )
                events.append(prom)
        
        elif not is_b2b:
            if random.random() < order_prob_per_week:
                c = Cart(
                    customer_id=customer.id,
                    cart_created=current_date,
                    cart_updated=current_date + timedelta(minutes=5),
                    cart_value=0.0,
                    item_count=random.randint(1, 5),
                    status="active"
                )
                
                selected_products = random.sample(products, c.item_count)
                c.cart_value = sum(p.price for p in selected_products)
                
                if random.random() < cart_abandon_prob:
                    c.status = "abandoned"
                    events.append(c)
                else:
                    c.status = "purchased"
                    events.append(c)
                    
                    session = CheckoutSession(
                        customer_id=customer.id,
                        cart_id=c.cart_id,
                        checkout_started=current_date + timedelta(minutes=10),
                        checkout_step="CONFIRMATION",
                        status="completed"
                    )
                    events.append(session)
                    
                    order = Order(
                        customer_id=customer.id,
                        timestamp=current_date + timedelta(minutes=15),
                        subtotal=c.cart_value,
                        total=c.cart_value
                    )
                    events.append(order)
                    
                    pay_status = "FAILED" if random.random() < payment_fail_prob else "SUCCESS"
                    pay = Payment(
                        customer_id=customer.id,
                        order_id=order.order_id,
                        amount=order.total,
                        payment_method="CREDIT_CARD",
                        status=pay_status,
                        timestamp=order.timestamp + timedelta(minutes=1),
                        attempt_number=1,
                        failure_reason="INSUFFICIENT_FUNDS" if pay_status == "FAILED" else None
                    )
                    events.append(pay)
                    
                    if pay_status == "FAILED":
                        retry_status = "SUCCESS" if random.random() < 0.5 else "FAILED"
                        pay2 = Payment(
                            customer_id=customer.id,
                            order_id=order.order_id,
                            amount=order.total,
                            payment_method="UPI",
                            status=retry_status,
                            timestamp=order.timestamp + timedelta(minutes=10),
                            attempt_number=2,
                            failure_reason="BANK_DECLINE" if retry_status == "FAILED" else None
                        )
                        events.append(pay2)
                        pay_status = retry_status
                        
                    if pay_status == "SUCCESS" and random.random() < return_prob:
                        ret = Return(
                            customer_id=customer.id,
                            order_id=order.order_id,
                            return_reason="CHANGED_MIND",
                            return_date=order.timestamp + timedelta(days=random.randint(2, 10))
                        )
                        events.append(ret)
                        ref = Refund(
                            customer_id=customer.id,
                            return_id=ret.return_id,
                            payment_id=pay.payment_id if pay.status == "SUCCESS" else (pay2.payment_id if 'pay2' in locals() else pay.payment_id),
                            refund_amount=order.total,
                            refund_date=ret.return_date + timedelta(days=2)
                        )
                        events.append(ref)
                        
        if random.random() < 0.2:
            status = "DELIVERED"
            if random.random() < 0.5:
                status = "OPENED"
            if customer.archetype == "FATIGUE_PRONE":
                status = "IGNORED"
                
            notif = Notification(
                customer_id=customer.id,
                channel="EMAIL",
                sent_at=current_date + timedelta(hours=random.randint(1, 12)),
                status=status
            )
            events.append(notif)

        current_date += timedelta(days=7)
        
    return events

async def main():
    random.seed(RANDOM_SEED)
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
            Payment, Return, Refund, Subscription, SubscriptionEvent,
            Invoice, PromiseToPay, Notification, RecoveryAction
        ]
    )
    
    print("Clearing collections...")
    await Customer.delete_all()
    await Product.delete_all()
    await Order.delete_all()
    await Payment.delete_all()
    await Cart.delete_all()
    await CheckoutSession.delete_all()
    await Return.delete_all()
    await Refund.delete_all()
    await Subscription.delete_all()
    await Invoice.delete_all()
    await PromiseToPay.delete_all()
    await Notification.delete_all()

    print(f"Generating {PRODUCTS_COUNT} products...")
    products = generate_products()
    await Product.insert_many(products)
    
    print(f"Generating {CUSTOMERS_COUNT} customers and their history... (This might take a moment)")
    
    end_date = datetime.now(timezone.utc).replace(tzinfo=None)
    start_date = end_date - timedelta(days=365 * YEARS_HISTORY)
    
    customers = []
    for i in range(CUSTOMERS_COUNT):
        c = Customer(
            name=f"Customer {i}",
            email=f"customer{i}@example.com",
            archetype=random.choice(ARCHETYPES)
        )
        customers.append(c)
        
    await Customer.insert_many(customers)
    
    all_events = {
        Order: [], Payment: [], Cart: [], CheckoutSession: [],
        Return: [], Refund: [], Invoice: [], PromiseToPay: [],
        Notification: []
    }
    
    for idx, customer in enumerate(customers):
        events = generate_customer_history(customer, products, start_date, end_date)
        for e in events:
            all_events[type(e)].append(e)
            
        if (idx + 1) % 500 == 0:
            print(f"Processed history for {idx + 1} customers...")

    for model, items in all_events.items():
        if items:
            print(f"Inserting {len(items)} {model.__name__} records...")
            chunk_size = 5000
            for i in range(0, len(items), chunk_size):
                await model.insert_many(items[i:i+chunk_size])

    print("Data generation complete!")

if __name__ == "__main__":
    asyncio.run(main())
