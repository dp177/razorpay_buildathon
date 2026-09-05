import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from app.models.domain import Order, Payment, Cart, CheckoutSession, Return, Refund, Subscription, Invoice, PromiseToPay, Notification
from app.intelligence.features import FeatureCalculator

@pytest.mark.asyncio
async def test_feature_calculator_basic_orders():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    created_at = now - timedelta(days=365)
    
    orders = [
        Order(customer_id=uuid4(), subtotal=100, total=100, timestamp=now - timedelta(days=10)),
        Order(customer_id=uuid4(), subtotal=200, total=200, timestamp=now - timedelta(days=40)),
        Order(customer_id=uuid4(), subtotal=300, total=300, timestamp=now - timedelta(days=100))
    ]
    
    features = FeatureCalculator.calculate(
        orders=orders,
        payments=[], carts=[], checkouts=[], returns=[], refunds=[],
        subscriptions=[], invoices=[], promises=[], notifications=[],
        customer_created_at=created_at
    )
    
    assert features.gross_revenue == 600
    assert features.average_order_value == 200
    assert features.orders_last_30d == 1
    assert features.orders_last_90d == 2
    assert features.purchase_recency_days == 10

@pytest.mark.asyncio
async def test_feature_calculator_payments():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    created_at = now - timedelta(days=365)
    
    payments = [
        Payment(customer_id=uuid4(), amount=100, payment_method="CREDIT_CARD", status="SUCCESS"),
        Payment(customer_id=uuid4(), amount=100, payment_method="CREDIT_CARD", status="FAILED"),
        Payment(customer_id=uuid4(), amount=100, payment_method="UPI", status="SUCCESS"),
        Payment(customer_id=uuid4(), amount=100, payment_method="UPI", status="SUCCESS")
    ]
    
    features = FeatureCalculator.calculate(
        orders=[],
        payments=payments, carts=[], checkouts=[], returns=[], refunds=[],
        subscriptions=[], invoices=[], promises=[], notifications=[],
        customer_created_at=created_at
    )
    
    assert features.payment_success_rate == 0.75
    assert features.payment_failure_rate == 0.25
    assert features.payment_method_success_rate["CREDIT_CARD"] == 0.5
    assert features.payment_method_success_rate["UPI"] == 1.0
