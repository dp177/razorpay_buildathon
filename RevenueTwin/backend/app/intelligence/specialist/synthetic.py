"""
Specialist synthetic data generators for each agent.
Each generator produces realistic, internally consistent, agent-specific data.
"""
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict
import random


def _ago(days: int) -> datetime:
    return datetime.utcnow() - timedelta(days=days)


def generate_cart_recovery_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    sessions = []
    for i in range(12):
        days_ago = random.randint(10, 180)
        completed = random.random() > 0.33
        recovered = False
        response = None
        if not completed and random.random() > 0.5:
            recovered = True
            response = random.choice(["CONVERTED", "IGNORED", "CLICKED"])
        sessions.append({
            "timestamp": _ago(days_ago).isoformat(),
            "product_name": random.choice(["Laptop Bag", "Wireless Earbuds", "Mechanical Keyboard", "Monitor Stand", "USB Hub"]),
            "category": random.choice(["Electronics", "Accessories", "Peripherals"]),
            "cart_value": round(random.uniform(999, 8999), 2),
            "checkout_started": random.random() > 0.4,
            "checkout_completed": completed,
            "recovery_attempted": recovered,
            "recovery_response": response,
        })
    conversions = sum(1 for s in sessions if s["checkout_completed"])
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"{customer_name.lower()}@example.com", "archetype": "HIGH_INTENT_RETURNING_CUSTOMER"},
        "agent": "CartRecoveryAgent",
        "context_type": "CART_RECOVERY",
        "specialist_history": {
            "label": "Cart History",
            "stats": [
                {"title": "Total Cart Sessions", "value": str(len(sessions)), "detail": "Last 6 months"},
                {"title": "Completed Purchases", "value": str(conversions), "detail": f"{round(conversions/len(sessions)*100)}% conversion rate"},
                {"title": "Abandoned Carts", "value": str(len(sessions) - conversions), "detail": f"{len(sessions) - conversions} sessions abandoned"},
                {"title": "Avg Cart Value", "value": f"₹{round(sum(s['cart_value'] for s in sessions)/len(sessions)):,}", "detail": "Historical average"},
                {"title": "Recovery Success", "value": f"{sum(1 for s in sessions if s.get('recovery_response') == 'CONVERTED')} / {sum(1 for s in sessions if s['recovery_attempted'])}", "detail": "Past recovery attempts"},
                {"title": "Purchase Intent", "value": "HIGH", "detail": "Based on session signals"},
            ],
            "past_sessions": sessions[-5:]  # show 5 most recent
        },
        "evidence_cards": [
            {"signal": "HIGH_PURCHASE_INTENT", "label": "Purchase Intent", "value": "HIGH", "importance": "HIGH", "cls": "high"},
            {"signal": "HIGH_CART_VALUE", "label": "Cart Value", "value": f"₹{random.randint(2999, 8999):,}", "importance": "HIGH", "cls": "high"},
            {"signal": "PREVIOUS_CART_CONVERSION", "label": "Prev. Cart Conversion", "value": f"{round(conversions/len(sessions)*100)}%", "importance": "MEDIUM", "cls": "active"},
            {"signal": "LOW_NOTIFICATION_FATIGUE", "label": "Recovery Fatigue", "value": "LOW", "importance": "MEDIUM", "cls": "low"},
            {"signal": "RECENT_PRODUCT_INTEREST", "label": "Recent Product Interest", "value": "HIGH", "importance": "HIGH", "cls": "high"},
            {"signal": "PREVIOUS_RECOVERY_SUCCESS", "label": "Prev. Recovery Success", "value": f"{sum(1 for s in sessions if s.get('recovery_response') == 'CONVERTED')} / {max(1, sum(1 for s in sessions if s['recovery_attempted']))}", "importance": "MEDIUM", "cls": "active"},
        ],
        "data_access_audit": {
            "agent": "CartRecoveryAgent",
            "data_accessed": ["cart_history", "checkout_history", "product_affinity", "purchase_intent", "notification_fatigue"],
            "data_not_accessed": ["b2b_invoice_history", "mandate_history", "subscription_history", "voice_history", "promise_history"]
        }
    }


def generate_payment_recovery_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    full_name = "Meera Patel" if "meera" in customer_name.lower() else customer_name
    past_methods = ["CARD", "UPI", "CARD", "CARD", "UPI", "CARD", "UPI", "CARD", "CARD", "UPI", "CARD", "CARD"]
    history = []
    for i in range(12):
        status = "FAILED" if i in [2, 7] else "SUCCESS"
        method = past_methods[i % len(past_methods)]
        history.append({
            "date": _ago(i * 24 + 3).isoformat(),
            "amount": 4999.0 if i == 0 else round(random.choice([1999.0, 2499.0, 3400.0, 4999.0, 5200.0]), 2),
            "status": status,
            "method": method,
            "rail": "HDFC Visa ••4242" if method == "CARD" else "UPI: meera.patel@okhdfcbank",
            "failure_reason": "Soft Decline (Issuer Timeout)" if status == "FAILED" else None,
            "recovery_status": "RECOVERED_ON_RETRY" if status == "FAILED" else "FIRST_ATTEMPT_SUCCESS",
        })
    success = sum(1 for h in history if h["status"] == "SUCCESS")

    return {
        "customer": {
            "id": customer_id,
            "name": full_name,
            "email": "meera.patel@example.com",
            "phone": "+91 98765 43210",
            "city": "Bengaluru, Karnataka (IN)",
            "tier": "Gold Tier VIP",
            "tenure": "18 Months (Member since Mar 2023)",
            "archetype": "HIGH_VALUE_RETURNING_CUSTOMER",
            "churn_risk": "0.08 (Very Low)",
            "fatigue_score": 0.12,
            "avg_monthly_spend": "₹4,250",
            "total_lifetime_orders": 12,
        },
        "order": {
            "item": "ShopNow Pro Annual Plan",
            "amount": 4999.0,
            "currency": "INR",
            "order_id": f"order_{customer_id[:8]}",
            "failure_simulation": "Soft Decline (Temporary Bank Network Glitch)",
        },
        "payment_instruments": {
            "primary": {
                "type": "CREDIT_CARD",
                "label": "HDFC Bank Visa Platinum Card",
                "last4": "4242",
                "issuer": "HDFC Bank",
                "status": "Active (Transient Network Decline)",
                "historical_success": "85%",
            },
            "alternate_rails": [
                {"type": "UPI", "vpa": "meera.patel@okhdfcbank", "status": "Verified & Active", "historical_success": "100%"},
                {"type": "NETBANKING", "bank": "HDFC Bank / ICICI Bank", "status": "Available", "historical_success": "96%"},
                {"type": "WALLET", "provider": "Amazon Pay / Paytm", "status": "Linked", "historical_success": "94%"},
                {"type": "PAYMENT_LINK", "channel": "WhatsApp / SMS Instant Link", "status": "Ready", "historical_success": "92%"},
            ]
        },
        "agent": "PaymentRecoveryAgent",
        "context_type": "PAYMENT_RECOVERY",
        "specialist_history": {
            "label": "Payment History",
            "stats": [
                {"title": "Total Payments", "value": "12", "detail": "Last 12 months"},
                {"title": "Successful Payments", "value": f"{success}", "detail": f"{round(success/len(history)*100)}% historical success"},
                {"title": "Soft Declines", "value": f"{len(history)-success}", "detail": "Both recovered via smart retry"},
                {"title": "Retry Success Rate", "value": "100%", "detail": "100% past soft decline recovery"},
                {"title": "Alternate Methods", "value": "UPI, NetBanking, Wallets", "detail": "3 verified backup rails"},
                {"title": "Last Success", "value": "12 days ago", "detail": "₹4,999 via HDFC Visa"},
            ],
            "payment_history": history[:6]
        },
        "evidence_cards": [
            {"signal": "TRANSIENT_FAILURE", "label": "Failure Type", "value": "Transient Soft Decline", "importance": "HIGH", "cls": "active"},
            {"signal": "RETRY_ELIGIBLE", "label": "Retry Eligible", "value": "Yes (High Probability)", "importance": "HIGH", "cls": "high"},
            {"signal": "HIGH_SUCCESS_RATE", "label": "Historical Success Rate", "value": f"{round(success/len(history)*100)}%", "importance": "HIGH", "cls": "high"},
            {"signal": "ALTERNATE_AVAILABLE", "label": "Alternate Methods", "value": "UPI (100% Reliability)", "importance": "MEDIUM", "cls": "active"},
            {"signal": "PAYMENT_AMOUNT", "label": "Payment Amount", "value": "₹4,999", "importance": "HIGH", "cls": "high"},
            {"signal": "LOW_FATIGUE", "label": "Contact Fatigue", "value": "0.12 (Zero Spam in 14d)", "importance": "MEDIUM", "cls": "low"},
        ],
        "data_access_audit": {
            "agent": "PaymentRecoveryAgent",
            "data_accessed": ["payment_history", "failure_analysis", "retry_eligibility", "alternate_methods", "contact_fatigue"],
            "data_not_accessed": ["card_cvv", "raw_pan", "biometric_data", "b2b_invoices", "browsing_history"]
        }
    }



def generate_subscription_recovery_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    renewals = [{"month": i+1, "status": "FAILED" if i == 17 else "SUCCESS", "amount": 999.0, "method": "CARD"} for i in range(18)]
    success = sum(1 for r in renewals if r["status"] == "SUCCESS")
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"{customer_name.lower()}@example.com", "archetype": "LOYAL_ANNUAL"},
        "agent": "SubscriptionRecoveryAgent",
        "context_type": "SUBSCRIPTION_RECOVERY",
        "specialist_history": {
            "label": "Renewal History",
            "stats": [
                {"title": "Subscription Age", "value": "18 months", "detail": "Active since Jan 2025"},
                {"title": "Total Renewals", "value": str(len(renewals)), "detail": "Billing cycle history"},
                {"title": "Successful Renewals", "value": str(success), "detail": f"{round(success/len(renewals)*100)}% renewal success rate"},
                {"title": "Failed Renewals", "value": str(len(renewals)-success), "detail": "Current failure is first"},
                {"title": "Subscription Usage", "value": "HIGH", "detail": "Daily active user"},
                {"title": "Grace Period", "value": "5 days", "detail": "Remaining before suspension"},
            ],
            "renewal_history": renewals[-6:]
        },
        "evidence_cards": [
            {"signal": "HIGH_RENEWAL_HISTORY", "label": "Renewal Success Rate", "value": f"{round(success/len(renewals)*100)}%", "importance": "HIGH", "cls": "high"},
            {"signal": "STRONG_ENGAGEMENT", "label": "Subscription Usage", "value": "HIGH", "importance": "HIGH", "cls": "high"},
            {"signal": "GRACE_PERIOD_ACTIVE", "label": "Grace Period", "value": "5 days", "importance": "HIGH", "cls": "active"},
            {"signal": "PAYMENT_METHOD_FAILURE", "label": "Failure Reason", "value": "Card Expired", "importance": "HIGH", "cls": "low"},
            {"signal": "BACKUP_AVAILABLE", "label": "Backup Payment", "value": "Available", "importance": "MEDIUM", "cls": "active"},
            {"signal": "PLAN_VALUE", "label": "Plan", "value": "Pro Annual — ₹11,988", "importance": "MEDIUM", "cls": "high"},
        ],
        "data_access_audit": {
            "agent": "SubscriptionRecoveryAgent",
            "data_accessed": ["subscription_lifecycle", "renewal_history", "usage_data", "payment_methods"],
            "data_not_accessed": ["cart_history", "checkout_history", "b2b_invoice_history", "mandate_history"]
        }
    }


def generate_churn_prevention_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"{customer_name.lower()}@example.com", "archetype": "LOW_ENGAGEMENT_CUSTOMER"},
        "agent": "ChurnPreventionAgent",
        "context_type": "CHURN_PREVENTION",
        "specialist_history": {
            "label": "Engagement History",
            "stats": [
                {"title": "Last Purchase", "value": "45 days ago", "detail": "Significantly longer than usual"},
                {"title": "Purchases (Last 90d)", "value": "1", "detail": "Down from 4 previous quarter"},
                {"title": "Monthly Spend", "value": "₹1,200", "detail": "Down 65% from peak"},
                {"title": "Login Frequency", "value": "1.2x/week", "detail": "Down from 4x/week"},
                {"title": "Return Rate", "value": "28%", "detail": "Significantly elevated"},
                {"title": "Churn Risk Score", "value": "0.82", "detail": "High risk threshold exceeded"},
            ]
        },
        "evidence_cards": [
            {"signal": "PURCHASE_FREQUENCY_DECLINING", "label": "Purchase Frequency", "value": "DECLINING", "importance": "HIGH", "cls": "low"},
            {"signal": "ENGAGEMENT_DECLINING", "label": "Engagement", "value": "DECLINING", "importance": "HIGH", "cls": "low"},
            {"signal": "HIGH_RETURN_RATE", "label": "Return Rate", "value": "28%", "importance": "HIGH", "cls": "low"},
            {"signal": "HIGH_VALUE_CUSTOMER", "label": "Customer Value", "value": "HIGH", "importance": "HIGH", "cls": "high"},
            {"signal": "COMMUNICATION_RESPONSIVE", "label": "Communication Response", "value": "62%", "importance": "MEDIUM", "cls": "active"},
            {"signal": "EARLY_CHURN_SIGNAL", "label": "Churn Signal", "value": "EARLY", "importance": "HIGH", "cls": "low"},
        ],
        "data_access_audit": {
            "agent": "ChurnPreventionAgent",
            "data_accessed": ["purchase_behavior", "engagement_metrics", "support_history", "communication_response"],
            "data_not_accessed": ["b2b_invoice_history", "mandate_history", "checkout_history", "promise_history"]
        }
    }


def generate_b2b_receivables_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    invoices = []
    for i in range(42):
        days_ago = random.randint(10, 720)
        overdue_days = random.choice([0, 0, 0, 5, 12, 25, 0])
        invoices.append({
            "invoice_id": f"INV-{2024000+i}",
            "amount": round(random.uniform(10000, 150000), 2),
            "issued_date": _ago(days_ago + 30).strftime("%Y-%m-%d"),
            "due_date": _ago(days_ago).strftime("%Y-%m-%d"),
            "status": "OVERDUE" if i == 0 else random.choice(["PAID", "PAID", "PAID", "LATE"]),
            "days_to_pay": None if i == 0 else overdue_days + random.randint(0, 5),
        })
    paid = sum(1 for inv in invoices if inv["status"] in ("PAID", "LATE"))
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"accounts@{customer_name.lower().replace(' ', '')}.com", "archetype": "SLOW_PAYER"},
        "agent": "B2BReceivablesAgent",
        "context_type": "B2B_RECEIVABLES",
        "specialist_history": {
            "label": "Invoice History",
            "stats": [
                {"title": "Total Invoices", "value": str(len(invoices)), "detail": "Last 24 months"},
                {"title": "Paid On Time", "value": str(sum(1 for inv in invoices if inv["status"] == "PAID")), "detail": f"{round(sum(1 for inv in invoices if inv['status']=='PAID')/len(invoices)*100)}% on-time rate"},
                {"title": "Late Payments", "value": str(sum(1 for inv in invoices if inv["status"] == "LATE")), "detail": "Average 11 days late"},
                {"title": "Avg Days to Pay", "value": "11 days", "detail": "After due date"},
                {"title": "Outstanding Balance", "value": "₹84,000", "detail": "Current invoice overdue"},
                {"title": "Account Value", "value": f"₹{round(sum(inv['amount'] for inv in invoices)/100000, 1)}L+", "detail": "Lifetime business value"},
            ],
            "invoice_history": invoices[:6]
        },
        "evidence_cards": [
            {"signal": "HIGH_OVERDUE_AMOUNT", "label": "Outstanding Balance", "value": "₹84,000", "importance": "HIGH", "cls": "low"},
            {"signal": "LONG_PAYMENT_DELAY", "label": "Days Overdue", "value": "17 days", "importance": "HIGH", "cls": "low"},
            {"signal": "STRONG_PAYMENT_HISTORY", "label": "Avg Days to Pay", "value": "11 days", "importance": "HIGH", "cls": "active"},
            {"signal": "HIGH_ACCOUNT_VALUE", "label": "Account Relationship", "value": "4.2 years", "importance": "HIGH", "cls": "high"},
            {"signal": "CONTACT_RESPONSIVE", "label": "Contact Response", "value": "HIGH", "importance": "MEDIUM", "cls": "active"},
            {"signal": "ON_TIME_RATE", "label": "On-Time Payment Rate", "value": f"{round(sum(1 for inv in invoices if inv['status']=='PAID')/len(invoices)*100)}%", "importance": "MEDIUM", "cls": "active"},
        ],
        "data_access_audit": {
            "agent": "B2BReceivablesAgent",
            "data_accessed": ["invoice_history", "payment_terms", "promise_history", "contact_behavior", "account_profile"],
            "data_not_accessed": ["cart_history", "checkout_history", "subscription_history", "churn_signals"]
        }
    }


def generate_mandate_recovery_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"{customer_name.lower()}@example.com", "archetype": "PAYMENT_METHOD_PROBLEM"},
        "agent": "MandateRecoveryAgent",
        "context_type": "MANDATE_RECOVERY",
        "specialist_history": {
            "label": "Mandate History",
            "stats": [
                {"title": "Mandate Type", "value": "NACH (Bank)", "detail": "Auto-debit mandate"},
                {"title": "Successful Debits", "value": "24", "detail": "Over 24 months"},
                {"title": "Failed Debits", "value": "1", "detail": "Current failure"},
                {"title": "Mandate Success Rate", "value": "96%", "detail": "Historical reliability"},
                {"title": "Backup Method", "value": "UPI Available", "detail": "Alternative debit option"},
                {"title": "Next Debit", "value": "In 28 days", "detail": "Scheduled cycle"},
            ]
        },
        "evidence_cards": [
            {"signal": "TRANSIENT_MANDATE_FAILURE", "label": "Failure Type", "value": "Transient", "importance": "HIGH", "cls": "active"},
            {"signal": "HIGH_MANDATE_HISTORY", "label": "Mandate Success Rate", "value": "96%", "importance": "HIGH", "cls": "high"},
            {"signal": "BACKUP_AVAILABLE", "label": "Backup Method", "value": "UPI Available", "importance": "MEDIUM", "cls": "active"},
            {"signal": "RETRY_ELIGIBLE", "label": "Retry Eligible", "value": "Yes", "importance": "HIGH", "cls": "high"},
            {"signal": "AMOUNT_AT_RISK", "label": "Debit Amount", "value": f"₹{random.randint(999, 4999):,}", "importance": "HIGH", "cls": "high"},
            {"signal": "DAYS_UNTIL_NEXT", "label": "Next Scheduled Debit", "value": "28 days", "importance": "MEDIUM", "cls": "active"},
        ],
        "data_access_audit": {
            "agent": "MandateRecoveryAgent",
            "data_accessed": ["mandate_history", "debit_schedule", "backup_methods"],
            "data_not_accessed": ["cart_history", "b2b_invoice_history", "checkout_history", "churn_signals"]
        }
    }


def generate_promise_to_pay_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    promises = [
        {"promise_id": f"PTP-{1000+i}", "promised_amount": round(random.uniform(10000, 80000), 2), "promised_date": _ago(i*45).strftime("%Y-%m-%d"), "status": random.choice(["FULFILLED", "FULFILLED", "FULFILLED", "BROKEN"])}
        for i in range(4)
    ]
    fulfilled = sum(1 for p in promises if p["status"] == "FULFILLED")
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"accounts@{customer_name.lower().replace(' ', '')}.com", "archetype": "PROMISE_KEEPER"},
        "agent": "PromiseToPayAgent",
        "context_type": "PROMISE_TO_PAY",
        "specialist_history": {
            "label": "Promise History",
            "stats": [
                {"title": "Total Promises", "value": str(len(promises)), "detail": "Formal payment commitments"},
                {"title": "Fulfilled", "value": str(fulfilled), "detail": f"{round(fulfilled/len(promises)*100)}% fulfillment rate"},
                {"title": "Broken", "value": str(len(promises)-fulfilled), "detail": "Failed commitments"},
                {"title": "Outstanding Amount", "value": "₹45,000", "detail": "Current promise"},
                {"title": "Days to Promise Date", "value": "3 days", "detail": "Promise due soon"},
                {"title": "Previous Escalations", "value": "0", "detail": "No escalations needed"},
            ],
            "promise_history": promises
        },
        "evidence_cards": [
            {"signal": "PROMISE_DUE_SOON", "label": "Promise Due", "value": "3 days", "importance": "HIGH", "cls": "low"},
            {"signal": "HIGH_FULFILLMENT_HISTORY", "label": "Fulfillment Rate", "value": f"{round(fulfilled/len(promises)*100)}%", "importance": "HIGH", "cls": "high"},
            {"signal": "OUTSTANDING_BALANCE", "label": "Outstanding Balance", "value": "₹45,000", "importance": "HIGH", "cls": "low"},
            {"signal": "CONTACT_RESPONSIVE", "label": "Contact Responsiveness", "value": "HIGH", "importance": "MEDIUM", "cls": "active"},
            {"signal": "NO_ESCALATION_HISTORY", "label": "Previous Escalations", "value": "None", "importance": "MEDIUM", "cls": "high"},
            {"signal": "RELATIONSHIP_QUALITY", "label": "Relationship", "value": "Strong", "importance": "MEDIUM", "cls": "high"},
        ],
        "data_access_audit": {
            "agent": "PromiseToPayAgent",
            "data_accessed": ["promise_history", "invoice_data", "contact_history", "payment_history"],
            "data_not_accessed": ["cart_history", "checkout_history", "subscription_history"]
        }
    }


def generate_payment_degradation_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"{customer_name.lower()}@example.com", "archetype": "PAYMENT_PROBLEM_CUSTOMER"},
        "agent": "PaymentDegradationAgent",
        "context_type": "PAYMENT_DEGRADATION",
        "specialist_history": {
            "label": "Transaction Metrics",
            "stats": [
                {"title": "Current Success Rate", "value": "71%", "detail": "Last 30 days"},
                {"title": "Baseline Success Rate", "value": "94%", "detail": "3-month average"},
                {"title": "Rate Decline", "value": "-23%", "detail": "Significant drop detected"},
                {"title": "Recent Failure Streak", "value": "4 consecutive", "detail": "Ongoing failure cluster"},
                {"title": "Issuer Pattern", "value": "HDFC Specific", "detail": "Concentrated issuer failures"},
                {"title": "Retry Success Rate", "value": "45%", "detail": "Partial retry effectiveness"},
            ]
        },
        "evidence_cards": [
            {"signal": "SUCCESS_RATE_DECLINING", "label": "Success Rate Trend", "value": "DECLINING −23%", "importance": "HIGH", "cls": "low"},
            {"signal": "FAILURE_CLUSTER", "label": "Failure Pattern", "value": "Cluster Detected", "importance": "HIGH", "cls": "low"},
            {"signal": "ISSUER_SPECIFIC", "label": "Issuer Pattern", "value": "HDFC Concentrated", "importance": "HIGH", "cls": "active"},
            {"signal": "RETRY_EFFECTIVE", "label": "Retry Effectiveness", "value": "45%", "importance": "MEDIUM", "cls": "active"},
            {"signal": "ALTERNATE_EFFECTIVE", "label": "Alternate Payment", "value": "89% Success", "importance": "HIGH", "cls": "high"},
            {"signal": "FAILURE_STREAK", "label": "Recent Streak", "value": "4 Consecutive", "importance": "HIGH", "cls": "low"},
        ],
        "data_access_audit": {
            "agent": "PaymentDegradationAgent",
            "data_accessed": ["transaction_metrics", "failure_distribution", "trend_analysis"],
            "data_not_accessed": ["cart_history", "b2b_invoice_history", "subscription_history", "churn_signals"]
        }
    }


def generate_voice_recovery_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"{customer_name.lower()}@example.com", "archetype": "HIGH_VALUE_CUSTOMER"},
        "agent": "VoiceRecoveryAgent",
        "context_type": "VOICE_RECOVERY",
        "specialist_history": {
            "label": "Contact History",
            "stats": [
                {"title": "Customer Value", "value": "₹2.4L+", "detail": "Lifetime spend"},
                {"title": "Previous Contacts", "value": "3", "detail": "All channels attempted"},
                {"title": "Digital Response Rate", "value": "12%", "detail": "Very low digital engagement"},
                {"title": "Voice Success Rate", "value": "78%", "detail": "High voice responsiveness"},
                {"title": "Preferred Channel", "value": "Voice Call", "detail": "Historical preference"},
                {"title": "Customer Sentiment", "value": "NEUTRAL", "detail": "No negative signals"},
            ]
        },
        "evidence_cards": [
            {"signal": "HIGH_VALUE_CUSTOMER", "label": "Customer Value", "value": "₹2.4L+", "importance": "HIGH", "cls": "high"},
            {"signal": "LOW_DIGITAL_RESPONSE", "label": "Digital Response Rate", "value": "12%", "importance": "HIGH", "cls": "low"},
            {"signal": "HIGH_VOICE_SUCCESS", "label": "Voice Success Rate", "value": "78%", "importance": "HIGH", "cls": "high"},
            {"signal": "PREFERRED_VOICE", "label": "Preferred Channel", "value": "Voice Call", "importance": "HIGH", "cls": "active"},
            {"signal": "OUTSTANDING_AMOUNT", "label": "Outstanding Amount", "value": f"₹{random.randint(10000, 80000):,}", "importance": "HIGH", "cls": "low"},
            {"signal": "CUSTOMER_SENTIMENT", "label": "Customer Sentiment", "value": "NEUTRAL", "importance": "MEDIUM", "cls": "active"},
        ],
        "data_access_audit": {
            "agent": "VoiceRecoveryAgent",
            "data_accessed": ["contact_history", "customer_value", "communication_preference", "escalation_history"],
            "data_not_accessed": ["cart_history", "checkout_history", "b2b_invoice_history"]
        }
    }


def generate_checkout_recovery_data(customer_name: str, customer_id: str) -> Dict[str, Any]:
    return {
        "customer": {"id": customer_id, "name": customer_name, "email": f"{customer_name.lower()}@example.com", "archetype": "HIGH_INTENT_RETURNING_CUSTOMER"},
        "agent": "CheckoutRecoveryAgent",
        "context_type": "CHECKOUT_RECOVERY",
        "specialist_history": {
            "label": "Checkout History",
            "stats": [
                {"title": "Checkout Attempts", "value": "8", "detail": "Last 6 months"},
                {"title": "Completed", "value": "6", "detail": "75% checkout completion rate"},
                {"title": "Dropoff Stage", "value": "Payment", "detail": "Reached payment page"},
                {"title": "Session Duration", "value": "8 minutes", "detail": "Deep checkout engagement"},
                {"title": "Payment Method", "value": "Selected", "detail": "Credit card chosen"},
                {"title": "Prev. Dropoff Stages", "value": "Payment (2x)", "detail": "Consistent pattern"},
            ]
        },
        "evidence_cards": [
            {"signal": "PAYMENT_STAGE_DROPOFF", "label": "Dropoff Stage", "value": "Payment Page", "importance": "HIGH", "cls": "low"},
            {"signal": "HIGH_CHECKOUT_INTENT", "label": "Checkout Intent", "value": "HIGH", "importance": "HIGH", "cls": "high"},
            {"signal": "PAYMENT_METHOD_SELECTED", "label": "Payment Method", "value": "Selected", "importance": "HIGH", "cls": "active"},
            {"signal": "CHECKOUT_NEAR_COMPLETION", "label": "Checkout Progress", "value": "95% Complete", "importance": "HIGH", "cls": "high"},
            {"signal": "SESSION_DURATION", "label": "Session Duration", "value": "8 min", "importance": "MEDIUM", "cls": "active"},
            {"signal": "REPEATED_DROPOFF", "label": "Repeat Dropoff", "value": "Same Stage", "importance": "HIGH", "cls": "low"},
        ],
        "data_access_audit": {
            "agent": "CheckoutRecoveryAgent",
            "data_accessed": ["checkout_history", "payment_methods", "session_data", "friction_signals"],
            "data_not_accessed": ["b2b_invoice_history", "mandate_history", "subscription_history"]
        }
    }


GENERATOR_MAP = {
    "CART_ABANDONMENT": generate_cart_recovery_data,
    "PAYMENT_FAILED": generate_payment_recovery_data,
    "SUBSCRIPTION_PAYMENT_FAILURE": generate_subscription_recovery_data,
    "CHURN_RISK": generate_churn_prevention_data,
    "RECEIVABLE_OVERDUE": generate_b2b_receivables_data,
    "MANDATE_FAILURE": generate_mandate_recovery_data,
    "PROMISE_TO_PAY": generate_promise_to_pay_data,
    "PROMISE_TO_PAY_DUE": generate_promise_to_pay_data,
    "PAYMENT_DEGRADATION": generate_payment_degradation_data,
    "VOICE_RECOVERY": generate_voice_recovery_data,
    "VOICE_RECOVERY_REQUIRED": generate_voice_recovery_data,
    "CHECKOUT_DROPOFF": generate_checkout_recovery_data,
}

CUSTOMER_NAMES = {
    "CART_ABANDONMENT": "Aarav",
    "PAYMENT_FAILED": "Meera",
    "SUBSCRIPTION_PAYMENT_FAILURE": "Rohan",
    "CHURN_RISK": "Priya",
    "RECEIVABLE_OVERDUE": "Zenith Technologies",
    "MANDATE_FAILURE": "Siddharth",
    "PROMISE_TO_PAY": "Apex Corp",
    "PROMISE_TO_PAY_DUE": "Apex Corp",
    "PAYMENT_DEGRADATION": "Kavya",
    "VOICE_RECOVERY": "Arjun",
    "VOICE_RECOVERY_REQUIRED": "Arjun",
    "CHECKOUT_DROPOFF": "Divya",
}

def generate_for_agent(agent_type: str, customer_id: str) -> Dict[str, Any]:
    name = CUSTOMER_NAMES.get(agent_type, "Customer")
    generator = GENERATOR_MAP.get(agent_type)
    if not generator:
        return generate_cart_recovery_data(name, customer_id)
    return generator(name, customer_id)
