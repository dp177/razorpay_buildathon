import { 
  CreditCard, AlertTriangle, RefreshCcw, UserX, FileText, Phone,
  Clock, ArrowRight, TrendingDown, ShieldAlert,
  Eye, ShoppingCart, LogIn, CreditCard as CardIcon, Truck,
  Package, CheckCircle, XCircle, RotateCcw, Send, MessageSquare,
  Headphones, BarChart2
} from 'lucide-react';

export const SCENARIOS = [
  {
    id: 'PAYMENT_FAILED',
    name: 'Payment Failure',
    icon: CreditCard,
    desc: 'Payments that failed before revenue was captured.',
    agentName: 'Payment Recovery Agent',
    agentObjective: 'Recover failed payments by identifying root cause and selecting the best retry or alternate path.',
    actions: ['RETRY', 'ALTERNATE_PAYMENT', 'PAYMENT_LINK', 'WAIT'],
    journey: [
      { label: 'Payment\nInitiated', icon: CreditCard, key: 'payment_init' },
      { label: 'Payment\nAttempted', icon: Send, key: 'payment_attempt' },
      { label: 'Payment\nFailed', icon: XCircle, key: 'payment_failed', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Customer\nResponse', icon: MessageSquare, key: 'customer_response', isFuture: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Payment History', detail: 'Transaction records and success rates' },
      { title: 'Failure Analysis', detail: 'Error codes and failure patterns' },
      { title: 'Payment Methods', detail: 'Available alternate payment instruments' },
      { title: 'Customer Fatigue', detail: 'Recent recovery attempts and contact frequency' }
    ],
    evidenceRows: [
      { label: 'Failure Type', sub: 'Bank decline or network issue', valueLabel: 'Recoverable', cls: 'high' },
      { label: 'Retry Window', sub: 'Time since last attempt', valueLabel: 'Open', cls: 'active' },
      { label: 'Payment Behavior', sub: 'Historical success rate', valueLabel: 'Strong', cls: 'strong' },
      { label: 'Contact Fatigue', sub: 'No recent retry attempts', valueLabel: 'LOW', cls: 'low' }
    ],
    whyText: 'Payment failed due to a temporary bank decline. Customer has strong payment history and no recent retry fatigue.'
  },
  {
    id: 'PAYMENT_DEGRADATION',
    name: 'Payment Degradation',
    icon: TrendingDown,
    desc: 'Payment success rate is declining for a customer or segment.',
    agentName: 'Payment Degradation Agent',
    agentObjective: 'Detect and respond to declining payment success rates before they become critical.',
    actions: ['ROUTING_CHANGE', 'WAIT'],
    journey: [
      { label: 'Normal\nSuccess Rate', icon: BarChart2, key: 'normal_rate' },
      { label: 'Rate\nDropped', icon: TrendingDown, key: 'rate_dropped' },
      { label: 'Degradation\nDetected', icon: AlertTriangle, key: 'degradation_detected', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Customer\nResponse', icon: MessageSquare, key: 'customer_response', isFuture: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Success Rate Trend', detail: 'Payment success over last 30 days' },
      { title: 'Routing Config', detail: 'Current payment routing rules' }
    ],
    evidenceRows: [
      { label: 'Success Rate', sub: 'Current vs baseline', valueLabel: 'Degraded', cls: 'low' },
      { label: 'Impact', sub: 'Revenue at risk', valueLabel: 'HIGH', cls: 'high' }
    ],
    whyText: 'Payment success rate has dropped below threshold. Proactive intervention recommended.'
  },
  {
    id: 'CART_ABANDONMENT',
    name: 'Cart Abandonment',
    icon: AlertTriangle,
    desc: 'Customers added products but did not complete purchase.',
    agentName: 'Cart Recovery Agent',
    agentObjective: 'Recover abandoned shopping sessions while avoiding unnecessary customer contact.',
    actions: ['RESUME_CHECKOUT', 'SEND_REMINDER', 'ASSIST', 'WAIT'],
    journey: [
      { label: 'Product\nViewed', icon: Eye, key: 'product_viewed' },
      { label: 'Added to\nCart', icon: ShoppingCart, key: 'added_to_cart' },
      { label: 'Checkout\nStarted', icon: LogIn, key: 'checkout_started' },
      { label: 'Checkout\nAbandoned', icon: XCircle, key: 'checkout_abandoned', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Customer\nResponse', icon: MessageSquare, key: 'customer_response', isFuture: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Shopping History', detail: 'Cart sessions and purchase patterns' },
      { title: 'Cart History', detail: 'Previous abandonment behavior' },
      { title: 'Checkout History', detail: 'Checkout completion rate' },
      { title: 'Communication', detail: 'Recent recovery messages sent' }
    ],
    evidenceRows: [
      { label: 'Purchase Intent', sub: 'Based on session behavior and history', valueLabel: 'HIGH', cls: 'high' },
      { label: 'Notification Fatigue', sub: 'No recent recovery attempts', valueLabel: 'LOW', cls: 'low' },
      { label: 'Historical Behavior', sub: 'Similar carts converted 68% of the time', valueLabel: 'Strong', cls: 'strong' },
      { label: 'Checkout Signals', sub: 'Payment method selected', valueLabel: 'Active', cls: 'active' }
    ],
    whyText: 'Customer shows high purchase intent and low intervention fatigue.'
  },
  {
    id: 'CHECKOUT_DROPOFF',
    name: 'Checkout Drop-off',
    icon: ArrowRight,
    desc: 'Customers started checkout but left before payment.',
    agentName: 'Checkout Agent',
    agentObjective: 'Re-engage customers who dropped off during the checkout flow at specific friction points.',
    actions: ['RESUME_CHECKOUT', 'ALTERNATE_PAYMENT', 'ASSIST', 'WAIT'],
    journey: [
      { label: 'Product', icon: Package, key: 'product' },
      { label: 'Cart', icon: ShoppingCart, key: 'cart' },
      { label: 'Checkout', icon: LogIn, key: 'checkout' },
      { label: 'Shipping', icon: Truck, key: 'shipping' },
      { label: 'Payment', icon: CreditCard, key: 'payment' },
      { label: 'Drop-off', icon: XCircle, key: 'dropoff', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Checkout Stage', detail: 'Where did the customer leave?' },
      { title: 'Payment Attempt', detail: 'Was payment method selected?' },
      { title: 'Historical Dropoff', detail: 'Has customer abandoned at this stage before?' }
    ],
    evidenceRows: [
      { label: 'Drop-off Stage', sub: 'Payment page reached', valueLabel: 'Deep', cls: 'high' },
      { label: 'Payment Selected', sub: 'Credit card chosen', valueLabel: 'Yes', cls: 'active' },
      { label: 'Session Duration', sub: 'Spent 8 minutes in checkout', valueLabel: 'Strong', cls: 'strong' }
    ],
    whyText: 'Customer reached payment stage and spent significant time. High intent signal.'
  },
  {
    id: 'SUBSCRIPTION_PAYMENT_FAILURE',
    name: 'Subscription Failure',
    icon: RefreshCcw,
    desc: 'Recurring payment could not be completed.',
    agentName: 'Subscription Recovery Agent',
    agentObjective: 'Recover failed subscription payments while maintaining customer retention.',
    actions: ['RETRY', 'ALTERNATE_PAYMENT', 'PLAN_CHANGE', 'WAIT'],
    journey: [
      { label: 'Subscription\nActive', icon: RefreshCcw, key: 'sub_active' },
      { label: 'Renewal\nDue', icon: Clock, key: 'renewal_due' },
      { label: 'Payment\nAttempt', icon: CreditCard, key: 'payment_attempt' },
      { label: 'Payment\nFailed', icon: XCircle, key: 'payment_failed', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Customer\nResponse', icon: MessageSquare, key: 'customer_response', isFuture: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Subscription Info', detail: 'Plan, tenure, and renewal cycle' },
      { title: 'Payment History', detail: 'Previous renewal success rates' },
      { title: 'Engagement', detail: 'Product usage and activity level' }
    ],
    evidenceRows: [
      { label: 'Subscription Age', sub: '14 months active', valueLabel: 'Strong', cls: 'strong' },
      { label: 'Engagement', sub: 'Active user, daily logins', valueLabel: 'HIGH', cls: 'high' },
      { label: 'Failure Reason', sub: 'Insufficient funds', valueLabel: 'Temporary', cls: 'active' }
    ],
    whyText: 'Long-term subscriber with high engagement. Failure appears temporary.'
  },
  {
    id: 'CHURN_RISK',
    name: 'Subscription Churn',
    icon: UserX,
    desc: 'Customer behavior indicates increasing churn risk.',
    agentName: 'Churn Prevention Agent',
    agentObjective: 'Proactively intervene when churn signals are detected to retain valuable customers.',
    actions: ['RETENTION_OFFER', 'PLAN_CHANGE', 'ASSIST', 'WAIT'],
    journey: [
      { label: 'Normal\nActivity', icon: BarChart2, key: 'normal' },
      { label: 'Activity\nDecline', icon: TrendingDown, key: 'decline' },
      { label: 'Purchase\nGap', icon: Clock, key: 'gap' },
      { label: 'Engagement\nDecline', icon: UserX, key: 'engagement_decline' },
      { label: 'Churn\nSignal', icon: AlertTriangle, key: 'churn_signal', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Purchase Frequency', detail: 'Order cadence and recency' },
      { title: 'Engagement', detail: 'Login frequency and feature usage' },
      { title: 'Returns', detail: 'Return rate and satisfaction' }
    ],
    evidenceRows: [
      { label: 'Churn Score', sub: 'Behavioral model output', valueLabel: 'HIGH', cls: 'high' },
      { label: 'Last Purchase', sub: '45 days ago', valueLabel: 'Stale', cls: 'low' },
      { label: 'Customer Value', sub: 'Lifetime spend', valueLabel: 'Strong', cls: 'strong' }
    ],
    whyText: 'Customer activity has declined significantly. Proactive retention recommended.'
  },
  {
    id: 'RECEIVABLE_OVERDUE',
    name: 'B2B Receivables',
    icon: FileText,
    desc: 'Invoices remain unpaid beyond expected payment timing.',
    agentName: 'B2B Receivables Agent',
    agentObjective: 'Recover overdue receivables through appropriate escalation while preserving business relationships.',
    actions: ['REMINDER', 'PROMISE_TO_PAY', 'ESCALATION', 'WAIT'],
    journey: [
      { label: 'Invoice\nCreated', icon: FileText, key: 'invoice_created' },
      { label: 'Due\nDate', icon: Clock, key: 'due_date' },
      { label: 'Payment\nDue', icon: CreditCard, key: 'payment_due' },
      { label: 'Overdue', icon: AlertTriangle, key: 'overdue', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Customer\nResponse', icon: MessageSquare, key: 'customer_response', isFuture: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Payer History', detail: 'Payment patterns and delays' },
      { title: 'Invoice Details', detail: 'Amount, terms, and aging' },
      { title: 'Relationship', detail: 'Business relationship health' }
    ],
    evidenceRows: [
      { label: 'Days Overdue', sub: 'Beyond net-30 terms', valueLabel: '15 days', cls: 'low' },
      { label: 'Payer History', sub: 'Usually pays within 5 days of due', valueLabel: 'Good', cls: 'strong' },
      { label: 'Relationship', sub: 'Long-term business partner', valueLabel: 'Strong', cls: 'strong' }
    ],
    whyText: 'Invoice is overdue but payer has strong historical payment behavior.'
  },
  {
    id: 'MANDATE_FAILURE',
    name: 'Mandate Failure',
    icon: ShieldAlert,
    desc: 'Scheduled payment authorization failed.',
    agentName: 'Mandate Agent',
    agentObjective: 'Recover failed mandates by retrying or offering alternate payment paths.',
    actions: ['MANDATE_RETRY', 'ALTERNATE_PAYMENT', 'WAIT'],
    journey: [
      { label: 'Mandate\nActive', icon: ShieldAlert, key: 'mandate_active' },
      { label: 'Debit\nScheduled', icon: Clock, key: 'debit_scheduled' },
      { label: 'Mandate\nFailed', icon: XCircle, key: 'mandate_failed', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Customer\nResponse', icon: MessageSquare, key: 'customer_response', isFuture: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Mandate Details', detail: 'Type, bank, and status' },
      { title: 'Debit History', detail: 'Previous debit success rate' }
    ],
    evidenceRows: [
      { label: 'Failure Type', sub: 'Bank processing error', valueLabel: 'Recoverable', cls: 'high' },
      { label: 'Mandate Status', sub: 'Still active at bank', valueLabel: 'Active', cls: 'active' }
    ],
    whyText: 'Mandate failure appears to be a temporary processing issue. Retry recommended.'
  },
  {
    id: 'PROMISE_TO_PAY',
    name: 'Promise-to-Pay',
    icon: Clock,
    desc: 'Customer promised payment but settlement is pending.',
    agentName: 'Promise Agent',
    agentObjective: 'Track payment promises and escalate when commitments are not met.',
    actions: ['REMINDER', 'ESCALATION', 'WAIT'],
    journey: [
      { label: 'Invoice\nOverdue', icon: FileText, key: 'invoice_overdue' },
      { label: 'Customer\nContacted', icon: MessageSquare, key: 'contacted' },
      { label: 'Promise\nCreated', icon: Clock, key: 'promise_created' },
      { label: 'Promised\nDate', icon: Clock, key: 'promised_date', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Promise Details', detail: 'Amount, date, and terms' },
      { title: 'Promise History', detail: 'Previous promises and fulfillment rate' }
    ],
    evidenceRows: [
      { label: 'Promise Status', sub: 'Date has passed', valueLabel: 'Overdue', cls: 'low' },
      { label: 'Fulfillment Rate', sub: 'Customer keeps 80% of promises', valueLabel: 'Good', cls: 'strong' }
    ],
    whyText: 'Payment promise date has passed. Customer has generally reliable history.'
  },
  {
    id: 'VOICE_RECOVERY_REQUIRED',
    name: 'Voice Recovery',
    icon: Phone,
    desc: 'High-value recovery requires a human-like conversation.',
    agentName: 'Voice Agent',
    agentObjective: 'Initiate voice-based recovery for high-value cases where digital channels have been exhausted.',
    actions: ['VOICE_CALL', 'REMINDER', 'WAIT'],
    journey: [
      { label: 'High-Value\nIssue', icon: AlertTriangle, key: 'high_value' },
      { label: 'Digital\nExhausted', icon: MessageSquare, key: 'digital_exhausted' },
      { label: 'Voice\nAssessment', icon: Phone, key: 'voice_assessment', isEvent: true },
      { label: 'Agent\nDetected', icon: Eye, key: 'agent_detected', isAgent: true },
      { label: 'Customer\nResponse', icon: MessageSquare, key: 'customer_response', isFuture: true },
      { label: 'Outcome', icon: CheckCircle, key: 'outcome', isFuture: true }
    ],
    contextCards: [
      { title: 'Contact History', detail: 'Previous communication attempts' },
      { title: 'Case Value', detail: 'Outstanding amount and priority' }
    ],
    evidenceRows: [
      { label: 'Case Value', sub: 'High-priority recovery', valueLabel: 'HIGH', cls: 'high' },
      { label: 'Digital Attempts', sub: '3 messages sent, no response', valueLabel: 'Exhausted', cls: 'low' }
    ],
    whyText: 'Digital channels have been exhausted for a high-value case. Voice intervention recommended.'
  }
];
