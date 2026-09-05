from datetime import datetime, timezone
from typing import List, Dict, Any
from app.intelligence.schemas import BehaviorFeatures
from app.models.domain import (
    Order, Payment, Cart, CheckoutSession, Return, Refund, 
    Subscription, Invoice, PromiseToPay, Notification
)

class FeatureCalculator:
    @staticmethod
    def calculate(
        orders: List[Order],
        payments: List[Payment],
        carts: List[Cart],
        checkouts: List[CheckoutSession],
        returns: List[Return],
        refunds: List[Refund],
        subscriptions: List[Subscription],
        invoices: List[Invoice],
        promises: List[PromiseToPay],
        notifications: List[Notification],
        customer_created_at: datetime
    ) -> BehaviorFeatures:
        
        features = BehaviorFeatures()
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        active_customer_months = max(1, (now - customer_created_at).days // 30)
        
        # 1. Orders
        if orders:
            features.gross_revenue = sum(o.total for o in orders)
            features.average_order_value = features.gross_revenue / len(orders)
            sorted_orders = sorted(orders, key=lambda o: o.total)
            features.median_order_value = sorted_orders[len(orders)//2].total
            features.purchase_frequency = len(orders) / active_customer_months
            
            recent_orders = [o for o in orders if (now - o.timestamp).days <= 30]
            features.orders_last_30d = len(recent_orders)
            
            quarter_orders = [o for o in orders if (now - o.timestamp).days <= 90]
            features.orders_last_90d = len(quarter_orders)
            
            latest_order = max(orders, key=lambda o: o.timestamp)
            features.purchase_recency_days = (now - latest_order.timestamp).days
        
        # 2. Payments
        if payments:
            success_payments = [p for p in payments if p.status == "SUCCESS"]
            features.payment_success_rate = len(success_payments) / len(payments)
            features.payment_failure_rate = 1.0 - features.payment_success_rate
            
            methods = {}
            for p in payments:
                if p.payment_method not in methods:
                    methods[p.payment_method] = {"total": 0, "success": 0}
                methods[p.payment_method]["total"] += 1
                if p.status == "SUCCESS":
                    methods[p.payment_method]["success"] += 1
            features.payment_method_success_rate = {
                m: methods[m]["success"] / methods[m]["total"] for m in methods
            }
            
            retries = [p for p in payments if p.attempt_number > 1]
            if retries:
                success_retries = [p for p in retries if p.status == "SUCCESS"]
                features.retry_success_rate = len(success_retries) / len(retries)
                
        # 3. Checkouts & Carts
        if carts:
            abandoned = [c for c in carts if c.status == "abandoned"]
            features.cart_abandonment_rate = len(abandoned) / len(carts)
            
        if checkouts:
            completed = [c for c in checkouts if c.status == "completed"]
            abandoned = [c for c in checkouts if c.status == "abandoned"]
            features.checkout_completion_rate = len(completed) / len(checkouts)
            features.checkout_abandonment_rate = len(abandoned) / len(checkouts)
            
        # 4. Returns & Refunds
        if returns and orders:
            features.return_rate = len(returns) / len(orders)
        if refunds and payments:
            total_refund = sum(r.refund_amount for r in refunds)
            total_paid = sum(p.amount for p in payments if p.status == "SUCCESS")
            if total_paid > 0:
                features.refund_rate = total_refund / total_paid
                
        features.net_revenue = features.gross_revenue - sum(r.refund_amount for r in refunds)
        features.customer_lifetime_value = features.net_revenue
        
        # 5. Subscriptions
        if subscriptions:
            tenure = sum(s.tenure_months for s in subscriptions)
            features.subscription_tenure_months = tenure
            
        # 6. Notifications
        if notifications:
            delivered = [n for n in notifications if n.status != "FAILED"]
            responded = [n for n in notifications if n.status in ["CLICKED", "RESPONDED"]]
            ignored = [n for n in notifications if n.status == "IGNORED"]
            if delivered:
                features.notification_response_rate = len(responded) / len(delivered)
                features.notification_ignore_rate = len(ignored) / len(delivered)
                
            recent_delivered = [n for n in delivered if (now - n.sent_at).days <= 30]
            if len(recent_delivered) > 5:
                recent_ignored = [n for n in recent_delivered if n.status == "IGNORED"]
                features.notification_fatigue = len(recent_ignored) / len(recent_delivered)
        
        # 7. B2B
        if invoices:
            features.average_invoice_delay_days = sum(i.days_overdue for i in invoices) / len(invoices)
            overdue = [i for i in invoices if i.days_overdue > 0]
            features.overdue_invoice_rate = len(overdue) / len(invoices)
        if promises:
            fulfilled = [p for p in promises if p.status == "FULFILLED"]
            broken = [p for p in promises if p.status == "BROKEN"]
            features.promise_to_pay_success_rate = len(fulfilled) / len(promises)
            features.promise_to_pay_break_rate = len(broken) / len(promises)
            
        # Composite scores
        features.payment_reliability = features.payment_success_rate
        if features.payment_reliability < 0.6:
            features.payment_reliability -= 0.2
        features.payment_reliability = max(0.0, features.payment_reliability)
            
        if features.notification_fatigue > 0.7 or features.payment_failure_rate > 0.5:
            features.churn_risk = min(1.0, features.notification_fatigue * 0.5 + features.payment_failure_rate * 0.5)

        return features
