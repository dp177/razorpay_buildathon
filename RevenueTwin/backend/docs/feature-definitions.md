# Feature Definitions

This document defines the formulas and calculations used by the `FeatureCalculator` in the Customer Intelligence layer.

## Order Features
- **purchase_frequency**: `completed_orders / active_customer_months`
- **orders_last_30d**: Count of orders in the last 30 days.
- **orders_last_90d**: Count of orders in the last 90 days.
- **average_order_value**: `gross_revenue / total_orders`
- **median_order_value**: The median value of all orders.
- **purchase_recency_days**: Days since the most recent order.
- **gross_revenue**: Sum of all order totals.
- **net_revenue**: `gross_revenue - total_refund_amount`

## Payment Features
- **payment_success_rate**: `successful_payment_attempts / total_payment_attempts`
- **payment_failure_rate**: `1.0 - payment_success_rate`
- **payment_method_success_rate**: Success rate calculated per payment method (e.g., CREDIT_CARD, UPI).
- **retry_success_rate**: `successful_retries / total_retries` (attempts > 1).

## Cart & Checkout Features
- **cart_abandonment_rate**: `abandoned_carts / total_carts`
- **checkout_abandonment_rate**: `abandoned_checkouts / total_checkouts`
- **checkout_completion_rate**: `completed_checkouts / total_checkouts`

## Return & Refund Features
- **return_rate**: `returns / total_orders`
- **refund_rate**: `total_refund_amount / total_paid_amount`

## Notification Features
- **notification_response_rate**: `responded_notifications / delivered_notifications`
- **notification_ignore_rate**: `ignored_notifications / delivered_notifications`
- **notification_fatigue**: `ignored_notifications_in_last_30_days / delivered_notifications_in_last_30_days` (only calculated if delivered > 5)

## B2B Features
- **average_invoice_delay_days**: Average of `days_overdue` across all invoices.
- **overdue_invoice_rate**: `invoices_with_days_overdue_gt_0 / total_invoices`
- **promise_to_pay_success_rate**: `fulfilled_promises / total_promises`
- **promise_to_pay_break_rate**: `broken_promises / total_promises`

## Risk Signals (Composite)
- **payment_reliability**: Adjusted payment success rate. Penalized if success rate is below 60%.
- **churn_risk**: `min(1.0, notification_fatigue * 0.5 + payment_failure_rate * 0.5)`
