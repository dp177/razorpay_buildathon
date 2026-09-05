import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Activity, Brain, Zap, Shield, Layers, RefreshCw, 
  CheckCircle, AlertCircle, ArrowRight, Sparkles, Cpu, 
  Radio, PhoneCall, Compass, ChevronRight, BarChart2,
  Play, Pause, RotateCcw, GitBranch, ArrowDown, Database,
  ExternalLink, Check, Eye, CornerDownRight, HelpCircle
} from 'lucide-react';

const ACTION_COLORS = {
  RETRY: '#06b6d4',
  ALTERNATE_PAYMENT: '#818cf8',
  PAYMENT_LINK: '#10b981',
  RESUME_CHECKOUT: '#10b981',
  SEND_REMINDER: '#38bdf8',
  REMINDER: '#38bdf8',
  ASSIST: '#a78bfa',
  PLAN_CHANGE: '#fbbf24',
  RETENTION_OFFER: '#fb7185',
  PROMISE_TO_PAY: '#a78bfa',
  ESCALATION: '#fb7185',
  MANDATE_RETRY: '#10b981',
  VOICE_CALL: '#fbbf24',
  ROUTING_CHANGE: '#fbbf24',
  WAIT: '#64748b',
  NO_ACTION: '#64748b',
};

// Radar chart dimensions & comparison data
const RADAR_METRICS = [
  { label: 'Reasoning Depth', agent: 98, rules: 35, desc: 'Evaluates multi-factor customer history & bank decline codes instead of static if/else' },
  { label: 'Multi-Rail Reach', agent: 96, rules: 25, desc: 'Dynamically switches across Retries, Alternate Rails & Razorpay Shortlinks' },
  { label: 'Decision Latency', agent: 93, rules: 92, desc: 'Sub-second inference via OpenRouter streaming and local policy gates' },
  { label: 'Guardrail Safety', agent: 100, rules: 60, desc: 'Strict deterministic policy checks guarantee zero over-retry or rogue actions' },
  { label: 'Fatigue Defense', agent: 95, rules: 20, desc: 'Tracks 7-day customer contact frequency to prevent spamming & customer churn' },
  { label: 'Closed-Loop Adapt', agent: 97, rules: 15, desc: 'Automatically reactivates upon intermediate failure to escalate to next tier' },
];

// Comprehensive Flowcharts for All 10 Specialists (Flowchart Standard: Oval -> Diamond -> Action -> Loopback)
export const ALL_AGENT_FLOWCHARTS = {
  PAYMENT_FAILED: {
    id: 'PAYMENT_FAILED',
    name: 'Payment Recovery Agent',
    badge: 'CLOSED-LOOP RECOVERY STATE MACHINE',
    startNode: {
      label: 'Payment Failed Webhook Received',
      sub: 'Event: payment.failed · ₹4,999 · HDFC Visa'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Is failure a soft bank decline?',
        yesLabel: 'Yes (Transient)',
        noLabel: 'No (Hard Decline)',
        noBranch: {
          action: 'Mark Hard Decline & Log',
          why: 'Card stolen, expired or account closed. Immediate retries will damage merchant gateway health.'
        }
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Customer Reliability ≥ 70% & Fatigue < 2?',
        yesLabel: 'Yes (Safe to Recover)',
        noLabel: 'No (Fatigued)',
        noBranch: {
          action: 'Wait 24h & Send Low-Touch Push',
          why: 'Customer has high recent outreach fatigue; aggressive retries trigger unsubscribe churn.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Tier 1: Smart Retry',
        action: 'Execute Smart Retry on Primary Rail',
        why: 'Transient issuer network timeout detected; customer has strong 83% 12-month payment record and zero contact fatigue.'
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Did Smart Retry succeed at bank?',
        yesLabel: 'Yes (Success)',
        noLabel: 'No (Loopback ➔ Escalate)',
        isLoopbackBranch: true
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Tier 2: Alternate Rails',
        action: 'Orchestrate Alternate Rails (UPI Intent / NetBanking)',
        why: 'Primary card rail congested; UPI Intent bypasses card network with 94% instant clearance on mobile.',
        isLoopback: true
      },
      {
        id: 'd4',
        type: 'decision',
        question: 'Did Alternate UPI Rail clear?',
        yesLabel: 'Yes (Success)',
        noLabel: 'No (Abandoned)',
        isLoopbackBranch: true
      },
      {
        id: 'a3',
        type: 'action',
        tier: 'Tier 3: Razorpay Payment Link',
        action: 'Dispatch Razorpay Payment Link via WhatsApp & SMS',
        why: 'Customer session dropped; authenticated asynchronous shortlink allows friction-free 1-tap completion anytime within 24 hours.',
        isLoopback: true
      },
      {
        id: 'd5',
        type: 'decision',
        question: 'Customer completed payment via Link?',
        yesLabel: 'Yes (Recovered)',
        noLabel: 'No (Expired)'
      }
    ],
    endSuccess: {
      label: 'Payment Recovered ₹4,999',
      sub: 'Transaction captured · Customer memory store updated'
    },
    endEscalate: {
      label: 'Escalate to High-Touch Voice Agent',
      sub: 'Digital channels exhausted · Voice queue assigned'
    },
    simPath: ['start', 'd1', 'd2', 'a1', 'd3_fail', 'a2', 'd4_fail', 'a3', 'd5_success', 'end']
  },

  CART_ABANDONMENT: {
    id: 'CART_ABANDONMENT',
    name: 'Cart Recovery Agent',
    badge: 'PURCHASE INTENT ACCELERATOR',
    startNode: {
      label: 'Cart Abandoned Event Ingested',
      sub: 'Session drop · ₹12,499 in cart · 8 mins in checkout'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'High Purchase Intent (>5 mins in checkout)?',
        yesLabel: 'Yes (High Intent)',
        noLabel: 'No (Casual)',
        noBranch: {
          action: 'Passive Retargeting Banner',
          why: 'Low-intent browsing session does not justify high-cost direct WhatsApp/SMS outreach.'
        }
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Notification Fatigue < 2 in last 7 days?',
        yesLabel: 'Yes (Allowed)',
        noLabel: 'No (Fatigued)',
        noBranch: {
          action: 'Queue On-Site Welcome Banner',
          why: 'Customer already received 2 reminders this week; additional push triggers customer fatigue.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Channel 1: WhatsApp Session',
        action: 'Send Dynamic WhatsApp Message with 1-Click Resume Link',
        why: 'Customer entered delivery address and spent 8 mins; WhatsApp delivers 98% open rate vs 20% on email.'
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Did customer click resume link within 2h?',
        yesLabel: 'Yes (Converted)',
        noLabel: 'No (Price Friction)',
        isLoopbackBranch: true
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Channel 2: Margin-Safe Incentive',
        action: 'Inject Time-Sensitive Free Shipping / 5% Voucher',
        why: 'Price sensitivity detected at final payment step; 5% voucher is strictly within merchant profit margin guardrails.',
        isLoopback: true
      },
      {
        id: 'd4',
        type: 'decision',
        question: 'Checkout completed with incentive?',
        yesLabel: 'Yes (Success)',
        noLabel: 'No (Close)'
      }
    ],
    endSuccess: {
      label: 'Cart Recovered ₹12,499',
      sub: 'Order created · Conversion telemetry saved'
    },
    endEscalate: {
      label: 'Close Recovery Mission (Zero Spam)',
      sub: 'Respects customer communication boundary'
    },
    simPath: ['start', 'd1', 'd2', 'a1', 'd3_fail', 'a2', 'd4_success', 'end']
  },

  SUBSCRIPTION_PAYMENT_FAILURE: {
    id: 'SUBSCRIPTION_PAYMENT_FAILURE',
    name: 'Subscription Recovery Agent',
    badge: 'MRR PRESERVATION ENGINE',
    startNode: {
      label: 'Recurring Mandate Debit Failed',
      sub: 'Plan: ₹2,499/mo · 14-Month Active Subscriber'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Is subscriber active in app (daily logins)?',
        yesLabel: 'Yes (Active)',
        noLabel: 'No (Inactive)',
        noBranch: {
          action: 'Route to Voluntary Churn Prevention',
          why: 'Zero logins in 30 days indicates intentional cancellation, not a transient banking glitch.'
        }
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Failure Reason: Insufficient Funds vs Expired Card?',
        yesLabel: 'Funds (Soft)',
        noLabel: 'Expired Card',
        noBranch: {
          action: 'Send 1-Click In-App Card Update Link',
          why: 'Expired card cannot be auto-debited; customer must submit replacement token.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Strategy 1: Salary Cycle Retry',
        action: 'Schedule Smart Retry on 1st/5th Salary Cycle',
        why: 'Subscriber cashflow analytics show recurring liquidity on the 1st of month; retrying immediately will fail again.'
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Did Salary Cycle Debit succeed?',
        yesLabel: 'Yes (Renewed)',
        noLabel: 'No (Escalate)',
        isLoopbackBranch: true
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Strategy 2: Flexible Retention',
        action: 'Offer 1-Click Switch to Quarterly / Flexible Plan',
        why: 'Reduces immediate upfront cash barrier while preserving customer tenure and active software access.',
        isLoopback: true
      },
      {
        id: 'd4',
        type: 'decision',
        question: 'Subscriber accepted plan adjustment?',
        yesLabel: 'Yes (Retained)',
        noLabel: 'No (Grace Period)'
      }
    ],
    endSuccess: {
      label: 'Subscription Active & MRR Preserved',
      sub: 'Recurring payment token re-established'
    },
    endEscalate: {
      label: 'Grace Period Extended (14 Days)',
      sub: 'Account access maintained to prevent churn'
    },
    simPath: ['start', 'd1', 'd2', 'a1', 'd3_fail', 'a2', 'd4_success', 'end']
  },

  CHECKOUT_DROPOFF: {
    id: 'CHECKOUT_DROPOFF',
    name: 'Checkout Agent',
    badge: 'FRICTION ELIMINATION STATE MACHINE',
    startNode: {
      label: 'Checkout Drop-Off Event Detected',
      sub: 'Session abandoned at payment step'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Was a payment method selected before exit?',
        yesLabel: 'Yes',
        noLabel: 'No',
        noBranch: {
          action: 'Prompt Missing Payment Rail Survey',
          why: 'User experienced decision paralysis or preferred local rail (e.g. Cred Pay/EMI) was absent.'
        }
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Did gateway experience OTP delivery lag?',
        yesLabel: 'Yes (OTP Lag)',
        noLabel: 'No (Distraction)',
        noBranch: {
          action: 'Send Web Push with Preserved Cart',
          why: 'User got distracted; preserving session state allows 1-tap return without re-entering data.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Action: Seamless UPI Intent',
        action: 'Instantly Prompt 1-Tap UPI Intent (GPay/PhonePe)',
        why: 'Bank SMS OTP failed; UPI Intent bypasses SMS completely via native biometric app confirmation in <4 seconds.'
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Did customer approve biometric UPI prompt?',
        yesLabel: 'Yes (Captured)',
        noLabel: 'No (Preserve)'
      }
    ],
    endSuccess: {
      label: 'Checkout Completed Successfully',
      sub: 'Order created with zero customer friction'
    },
    endEscalate: {
      label: 'Preserve Cart in User Account',
      sub: 'Available on next login across devices'
    },
    simPath: ['start', 'd1', 'd2', 'a1', 'd3_success', 'end']
  },

  RECEIVABLE_OVERDUE: {
    id: 'RECEIVABLE_OVERDUE',
    name: 'B2B Receivables Agent',
    badge: 'CORPORATE CASHFLOW RECOVERY',
    startNode: {
      label: 'B2B Invoice Overdue by 15 Days',
      sub: 'Invoice: ₹1,50,000 · Terms: Net-30'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Payer Historical Reliability Score ≥ 80%?',
        yesLabel: 'Yes (Trusted Partner)',
        noLabel: 'No (High Risk)',
        noBranch: {
          action: 'Apply Immediate Account Hold & Formal Notice',
          why: 'Chronically defaulting payer; further credit extension creates bad debt exposure.'
        }
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Is invoice disputed or delivery discrepancy flagged?',
        yesLabel: 'Disputed',
        noLabel: 'Clean Invoice',
        noBranch: {
          action: 'Route to Account Exec to Resolve Line-Item Dispute',
          why: 'Holding payment is legitimate dispute behavior; resolving PO discrepancy unlocks payment.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Action: AP Ledger Reconciliation',
        action: 'Send Automated Statement with Razorpay Virtual Account',
        why: 'Preserves long-term B2B relationship while providing instant NEFT/RTGS auto-reconciling virtual bank details.'
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Did AP department provide Promise-to-Pay date?',
        yesLabel: 'Yes (Locked)',
        noLabel: 'No (Incentive)',
        isLoopbackBranch: true
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Action: Cashflow Incentive',
        action: 'Offer 2% Early Settlement Discount or 2-Tranche Split',
        why: 'Encourages immediate cash liquidity without damaging commercial vendor standing.',
        isLoopback: true
      },
      {
        id: 'd4',
        type: 'decision',
        question: 'Settlement confirmed via Virtual Account?',
        yesLabel: 'Yes (Cleared)',
        noLabel: 'No (Escalate)'
      }
    ],
    endSuccess: {
      label: 'Receivables Cleared ₹1,50,000',
      sub: 'Auto-reconciled in ERP ledger'
    },
    endEscalate: {
      label: 'Escalate to VP Finance Review',
      sub: 'Relationship preservation check required'
    },
    simPath: ['start', 'd1', 'd2', 'a1', 'd3_fail', 'a2', 'd4_success', 'end']
  },

  PAYMENT_DEGRADATION: {
    id: 'PAYMENT_DEGRADATION',
    name: 'Payment Degradation Agent',
    badge: 'SWARM ROUTING PROTECTION',
    startNode: {
      label: 'Success Rate Degradation Detected',
      sub: 'HDFC BIN drops from 89% to 54%'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Is degradation localized to specific Bank BIN vs Global?',
        yesLabel: 'Bank BIN',
        noLabel: 'Global Gateway',
        noBranch: {
          action: 'Switch Primary Acquirer Pipe Globally',
          why: 'Gateway-wide outage detected; traffic switched to secondary gateway backup.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Action: Dynamic Acquirer Switch',
        action: 'Reroute HDFC BIN to Secondary Banking Acquirer Pipe',
        why: 'Secondary acquirer maintains 88% clearing rate for this BIN; prevents hundreds of customer failures.'
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Did secondary pipe restore success rate > 85%?',
        yesLabel: 'Yes (Restored)',
        noLabel: 'No (Adapt UI)',
        isLoopbackBranch: true
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Action: Checkout UI Adaptation',
        action: 'Pre-emptively Promote UPI & AutoPay at Top of Checkout',
        why: 'Card issuer completely unresponsive; guiding buyers to UPI preserves 100% of purchase flow.',
        isLoopback: true
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Checkout volume stabilized?',
        yesLabel: 'Yes (Normal)',
        noLabel: 'No (Alert)'
      }
    ],
    endSuccess: {
      label: 'Success Rate Restored to 91%',
      sub: 'Pre-emptive routing averted ₹8.4L revenue loss'
    },
    endEscalate: {
      label: 'Notify Gateway Engineering Ops',
      sub: 'Issuer incident ticket created'
    },
    simPath: ['start', 'd1', 'a1', 'd2_fail', 'a2', 'd3_success', 'end']
  },

  MANDATE_FAILURE: {
    id: 'MANDATE_FAILURE',
    name: 'Mandate Agent',
    badge: 'AUTOPAY RETRY GOVERNANCE',
    startNode: {
      label: 'Recurring e-Mandate Debit Failed',
      sub: 'AutoPay Mandate #MND_88192'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Is Mandate active at destination bank?',
        yesLabel: 'Yes (Active)',
        noLabel: 'No (Revoked)',
        noBranch: {
          action: 'Trigger 1-Click UPI AutoPay Re-Registration',
          why: 'Old mandate was revoked by bank; new UPI AutoPay mandate sets up in 30 seconds.'
        }
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Transient clearing glitch vs insufficient balance?',
        yesLabel: 'Glitch (Soft)',
        noLabel: 'Insufficient',
        noBranch: {
          action: 'Send WhatsApp Instant UPI Top-up Prompt',
          why: 'Alerts customer to approve payment before late penalties apply.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Action: 4-Hour Clearing Window',
        action: 'Schedule Automated Re-Debit in Secondary Clearing Window',
        why: 'NPCI settlement batches reopen at 2 PM with 91% success for morning transient errors.'
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Did secondary clearing debit succeed?',
        yesLabel: 'Yes (Debited)',
        noLabel: 'No (Manual)'
      }
    ],
    endSuccess: {
      label: 'Mandate Debit Captured Successfully',
      sub: 'Subscription cycle renewed'
    },
    endEscalate: {
      label: 'Escalate to Manual Support',
      sub: 'Mandate requires customer re-auth'
    },
    simPath: ['start', 'd1', 'd2', 'a1', 'd3_success', 'end']
  },

  PROMISE_TO_PAY: {
    id: 'PROMISE_TO_PAY',
    name: 'Promise Agent',
    badge: 'COMMITMENT TRACKING ENGINE',
    startNode: {
      label: 'Promised Settlement Date Reached',
      sub: 'Promise #PT_99120 · ₹35,000'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Grace period < 24 hours remaining?',
        yesLabel: 'Yes (Grace)',
        noLabel: 'No (Expired)',
        noBranch: {
          action: 'Initiate Formal Collection Notice',
          why: 'Grace period has expired; debt enters formal collections workflow.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Action: Courtesy Reminder',
        action: 'Send Soft Courtesy Notification with 1-Click Pay Link',
        why: 'Courtesy reminder before enforcement maintains positive customer relationship.'
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Customer requested micro-installment restructuring?',
        yesLabel: 'Yes (Split)',
        noLabel: 'No (Followup)',
        isLoopbackBranch: true
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Action: Flexible Installments',
        action: 'Restructure Balance into 2 Bi-Weekly Auto-Debits',
        why: 'Recovers 100% of principal balance while avoiding default or service termination.',
        isLoopback: true
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'First installment captured?',
        yesLabel: 'Yes (Recovered)',
        noLabel: 'No (Hold)'
      }
    ],
    endSuccess: {
      label: 'Payment Promise Fulfilled',
      sub: 'Account verified in good standing'
    },
    endEscalate: {
      label: 'Service Paused & Account Flagged',
      sub: 'Breach of settlement terms'
    },
    simPath: ['start', 'd1', 'a1', 'd2_yes', 'a2', 'd3_success', 'end']
  },

  CHURN_RISK: {
    id: 'CHURN_RISK',
    name: 'Churn Prevention Agent',
    badge: 'BEHAVIORAL RETENTION MATRIX',
    startNode: {
      label: 'High Churn Risk Signal Detected',
      sub: 'Usage score 85% drop · Zero logins in 21d'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Customer LTV > ₹25,000 (Tier 1 VIP)?',
        yesLabel: 'Yes (VIP)',
        noLabel: 'No (Standard)',
        noBranch: {
          action: 'Send Automated Interactive Product Re-engagement Guide',
          why: 'Demonstrates immediate product value to re-ignite adoption without sales overhead.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Action: VIP Executive Check-in',
        action: 'Trigger Account Manager Personal Video Check-in',
        why: 'High-LTV accounts justify human touch; resolves unspoken dissatisfaction before formal cancellation.'
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Is churn driven by pricing or feature complexity?',
        yesLabel: 'Pricing',
        noLabel: 'Complexity',
        noBranch: {
          action: 'Assign Dedicated Solution Architect Onboarding',
          why: 'Solves technical roadblocks that prevent realization of ROI.'
        }
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Action: 30-Day Account Pause',
        action: 'Offer 30-Day Free Account Pause with Zero Data Deletion',
        why: 'Prevents hard cancellation; 72% of paused customers reactivate within 60 days.',
        isLoopback: true
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Customer accepted pause vs cancellation?',
        yesLabel: 'Yes (Retained)',
        noLabel: 'No (Exit)'
      }
    ],
    endSuccess: {
      label: 'Customer Retained & Engagement Rebounding',
      sub: 'Churn score reduced from 85% to 18%'
    },
    endEscalate: {
      label: 'Conduct Offboarding Exit Interview',
      sub: 'Product feedback cataloged'
    },
    simPath: ['start', 'd1', 'a1', 'd2_yes', 'a2', 'd3_success', 'end']
  },

  VOICE_RECOVERY_REQUIRED: {
    id: 'VOICE_RECOVERY_REQUIRED',
    name: 'Voice Agent',
    badge: 'NEURAL CONVERSATIONAL RECOVERY',
    startNode: {
      label: 'High-Value Recovery Case Escalated',
      sub: 'Transaction: ₹45,000 · OTP Latency Drop'
    },
    flowItems: [
      {
        id: 'd1',
        type: 'decision',
        question: 'Have all digital push channels been exhausted?',
        yesLabel: 'Yes (Call)',
        noLabel: 'No (Wait)',
        noBranch: {
          action: 'Wait 5 Mins for Customer to Open WhatsApp Link',
          why: 'Gives customer time to complete digital checkout before triggering voice call.'
        }
      },
      {
        id: 'a1',
        type: 'action',
        tier: 'Action: WebRTC Neural Voice Call',
        action: 'Dispatch Real-Time AI Neural Voice Agent in Native Language',
        why: 'High ticket size justifies conversational assistance; AI resolves OTP lag and pushes instant WhatsApp link during call.'
      },
      {
        id: 'd2',
        type: 'decision',
        question: 'Did customer answer call and confirm intent?',
        yesLabel: 'Yes (Engaged)',
        noLabel: 'No (Memo)'
      },
      {
        id: 'a2',
        type: 'action',
        tier: 'Action: In-Call UPI Push',
        action: 'Trigger In-Call Biometric UPI Push Notification',
        why: 'Customer is on the line; 1-tap push notification completes payment in 8 seconds while call is live.',
        isLoopback: true
      },
      {
        id: 'd3',
        type: 'decision',
        question: 'Did UPI payment clear during call?',
        yesLabel: 'Yes (Captured)',
        noLabel: 'No (Callback)'
      }
    ],
    endSuccess: {
      label: 'High-Value Revenue Recovered ₹45,000',
      sub: 'Resolved via conversational voice agent'
    },
    endEscalate: {
      label: 'Leave Urgent Voice Memo & SMS Link',
      sub: 'Priority callback ticket logged'
    },
    simPath: ['start', 'd1', 'a1', 'd2_yes', 'a2', 'd3_success', 'end']
  }
};

export default function AgentDetailPanel({ agent, onClose }) {
  const [activeTab, setActiveTab] = useState('LOOP'); // 'LOOP' | 'RADAR' | 'TOOLS' | 'ROADMAP'
  const [selectedAgentId, setSelectedAgentId] = useState(agent.id || 'PAYMENT_FAILED');
  const [simulating, setSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [selectedRadarMetric, setSelectedRadarMetric] = useState(RADAR_METRICS[0]);
  const simTimerRef = useRef(null);

  const currentFlow = ALL_AGENT_FLOWCHARTS[selectedAgentId] || ALL_AGENT_FLOWCHARTS.PAYMENT_FAILED;
  const AgentIcon = agent.icon || Brain;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Simulation Runner for Flowchart
  useEffect(() => {
    if (simulating) {
      simTimerRef.current = setInterval(() => {
        setSimIndex(prev => {
          if (prev === null || prev >= currentFlow.simPath.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [simulating, currentFlow]);

  // SVG Radar calculation helper
  const size = 300;
  const center = size / 2;
  const radius = 105;
  const totalPoints = RADAR_METRICS.length;

  const getPointCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / totalPoints) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const agentPolygonPoints = RADAR_METRICS.map((m, i) => {
    const { x, y } = getPointCoordinates(i, m.agent);
    return `${x},${y}`;
  }).join(' ');

  const rulesPolygonPoints = RADAR_METRICS.map((m, i) => {
    const { x, y } = getPointCoordinates(i, m.rules);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(3, 7, 18, 0.9)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', overflowY: 'auto',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 1220, maxHeight: '94vh',
        background: 'linear-gradient(135deg, #0b1120 0%, #030712 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 22,
        boxShadow: '0 30px 90px rgba(0,0,0,0.9), 0 0 50px rgba(6,182,212,0.15)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* TOP HEADER */}
        <div style={{
          padding: '18px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2))',
              border: '1px solid rgba(6,182,212,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#06b6d4',
              boxShadow: '0 0 20px rgba(6,182,212,0.25)'
            }}>
              <AgentIcon size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {agent.agentName}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(16,185,129,0.12)', color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  letterSpacing: '0.06em'
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  AUTONOMOUS ONLINE
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Specialist Domain: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{agent.name}</span> · OpenRouter nemotron-3.5 + Razorpay SDK Adapter
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION STRIP */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 13, 26, 0.85)', padding: '0 28px', gap: 6
        }}>
          {[
            { id: 'LOOP', label: 'Dynamic Decision Flowchart', icon: RefreshCw },
            { id: 'RADAR', label: 'Autonomous Capability Radar', icon: BarChart2 },
            { id: 'TOOLS', label: 'Live Tool Ecosystem', icon: Zap },
            { id: 'ROADMAP', label: 'Next-Gen Innovations', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 18px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  color: isActive ? '#06b6d4' : '#64748b',
                  borderBottom: isActive ? '2px solid #06b6d4' : '2px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* MAIN BODY AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* TAB 1: FORMAL FLOWCHART DIAGRAM WITH ALL AGENTS SELECTOR */}
          {activeTab === 'LOOP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* SPECIALIST SELECTOR STRIP (FOR ALL AGENTS) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center',
                gap: 10, overflowX: 'auto'
              }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                  SELECT SPECIALIST FLOWCHART:
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Object.keys(ALL_AGENT_FLOWCHARTS).map(agentKey => {
                    const ag = ALL_AGENT_FLOWCHARTS[agentKey];
                    const isSelected = selectedAgentId === agentKey;
                    return (
                      <button
                        key={agentKey}
                        onClick={() => {
                          setSelectedAgentId(agentKey);
                          setSimIndex(null);
                          setSimulating(false);
                          setSelectedNodeInfo(null);
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: 8,
                          background: isSelected ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)',
                          color: isSelected ? '#06b6d4' : '#94a3b8',
                          fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                          transition: 'all 0.15s'
                        }}
                      >
                        {ag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SIMULATION & CONTROLS HEADER */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(99,102,241,0.06) 100%)',
                border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
                      {currentFlow.name} Decision Logic
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 4,
                      background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)'
                    }}>
                      {currentFlow.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                    Each action is paired with its causal "WHY" rationale, decision diamonds, and closed-loop reactivation paths.
                  </div>
                </div>

                {/* Simulation controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => {
                      if (!simulating && simIndex === null) setSimIndex(0);
                      setSimulating(!simulating);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8,
                      background: simulating ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      border: simulating ? '1px solid rgba(239,68,68,0.4)' : 'none',
                      color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer',
                      boxShadow: simulating ? 'none' : '0 0 16px rgba(2,132,199,0.4)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {simulating ? <Pause size={13} /> : <Play size={13} />}
                    {simulating ? 'PAUSE TRACE' : '▶ SIMULATE EXECUTION TRACE'}
                  </button>

                  <button
                    onClick={() => {
                      setSimulating(false);
                      setSimIndex(null);
                      setSelectedNodeInfo(null);
                    }}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                </div>
              </div>

              {/* FLOWCHART DIAGRAM CANVAS (MATCHING USER'S IMAGE GEOMETRY) */}
              <div style={{
                background: 'rgba(11, 17, 32, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 20, padding: '32px 24px',
                position: 'relative', overflowX: 'auto',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'
              }}>
                {/* Subtle flowchart grid backdrop */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '24px 24px', pointerEvents: 'none'
                }} />

                {/* 1. START NODE (OVAL / CAPSULE) */}
                <div style={{
                  padding: '12px 36px', borderRadius: 30,
                  background: simIndex === 0 
                    ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' 
                    : 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(59,130,246,0.15) 100%)',
                  border: simIndex === 0 ? '2px solid #38bdf8' : '1.5px solid rgba(6,182,212,0.4)',
                  color: '#fff', textAlign: 'center', zIndex: 2,
                  boxShadow: simIndex === 0 ? '0 0 25px rgba(2,132,199,0.6)' : '0 0 15px rgba(6,182,212,0.2)',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.02em' }}>
                    {currentFlow.startNode.label}
                  </div>
                  <div style={{ fontSize: 10, color: simIndex === 0 ? '#e0f2fe' : '#94a3b8', marginTop: 2 }}>
                    {currentFlow.startNode.sub}
                  </div>
                </div>

                {/* Connecting arrow down */}
                <div style={{ width: 2, height: 32, background: 'rgba(255,255,255,0.2)', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', bottom: -4, left: -4,
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                    borderTop: '6px solid rgba(255,255,255,0.4)'
                  }} />
                </div>

                {/* 2. THE FLOWCHART VERTICAL SEQUENCE (DIAMONDS & ACTIONS) */}
                <div style={{
                  width: '100%', maxWidth: 760,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                  position: 'relative', zIndex: 2
                }}>
                  {currentFlow.flowItems.map((item, idx) => {
                    if (item.type === 'decision') {
                      const isSimActive = simulating && (
                        (item.id === 'd1' && simIndex === 1) ||
                        (item.id === 'd2' && simIndex === 2) ||
                        (item.id === 'd3' && (simIndex === 4 || simIndex === 5)) ||
                        (item.id === 'd4' && (simIndex === 6 || simIndex === 7)) ||
                        (item.id === 'd5' && (simIndex === 8 || simIndex === 9))
                      );

                      return (
                        <div key={item.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          
                          {/* DECISION CONTAINER (DIAMOND + OPTIONAL NO BRANCH TO THE RIGHT) */}
                          <div style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', minHeight: 96
                          }}>
                            {/* DIAMOND SHAPE */}
                            <div
                              onClick={() => setSelectedNodeInfo(item)}
                              style={{
                                width: 210, height: 86,
                                background: isSimActive 
                                  ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' 
                                  : 'rgba(15, 23, 42, 0.9)',
                                border: isSimActive ? '2px solid #38bdf8' : '1.5px solid rgba(167,139,250,0.5)',
                                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '12px 24px', textAlign: 'center',
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: isSimActive ? '0 0 30px rgba(2,132,199,0.7)' : '0 0 15px rgba(167,139,250,0.15)',
                                position: 'relative', zIndex: 3
                              }}
                            >
                              <span style={{
                                fontSize: 11, fontWeight: 900,
                                color: isSimActive ? '#fff' : '#e2e8f0',
                                lineHeight: 1.3, maxWidth: 140
                              }}>
                                {item.question}
                              </span>
                            </div>

                            {/* "NO" BRANCH TO THE RIGHT (IF PRESENT) */}
                            {item.noBranch && (
                              <div style={{
                                position: 'absolute', left: 'calc(50% + 105px)',
                                display: 'flex', alignItems: 'center'
                              }}>
                                {/* Horizontal connector with "No" label */}
                                <div style={{
                                  width: 44, height: 2, background: 'rgba(255,255,255,0.25)', position: 'relative'
                                }}>
                                  <span style={{
                                    position: 'absolute', top: -16, left: 12,
                                    fontSize: 10, fontWeight: 900, color: '#fb7185'
                                  }}>
                                    No
                                  </span>
                                  <div style={{
                                    position: 'absolute', right: -4, top: -4,
                                    width: 0, height: 0,
                                    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                                    borderLeft: '6px solid rgba(255,255,255,0.4)'
                                  }} />
                                </div>

                                {/* No Action Box */}
                                <div style={{
                                  width: 220, padding: '10px 14px', borderRadius: 10,
                                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                                }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: '#fb7185' }}>
                                    {item.noBranch.action}
                                  </div>
                                  <div style={{
                                    fontSize: 9.5, color: '#cbd5e1', marginTop: 4, lineHeight: 1.3,
                                    background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: 4
                                  }}>
                                    <strong style={{ color: '#fbbf24' }}>WHY: </strong>{item.noBranch.why}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* CLOSED-LOOP ESCALATION BRANCH (ON NO/FAIL) */}
                            {item.isLoopbackBranch && !item.noBranch && (
                              <div style={{
                                position: 'absolute', left: 'calc(50% + 105px)',
                                display: 'flex', alignItems: 'center'
                              }}>
                                <div style={{
                                  width: 44, height: 2, background: 'rgba(251,113,133,0.4)', position: 'relative'
                                }}>
                                  <span style={{
                                    position: 'absolute', top: -16, left: 6,
                                    fontSize: 9.5, fontWeight: 900, color: '#fb7185', whiteSpace: 'nowrap'
                                  }}>
                                    No (Fail)
                                  </span>
                                  <div style={{
                                    position: 'absolute', right: -4, top: -4,
                                    width: 0, height: 0,
                                    borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                                    borderLeft: '6px solid rgba(251,113,133,0.7)'
                                  }} />
                                </div>

                                <div style={{
                                  width: 220, padding: '10px 14px', borderRadius: 10,
                                  background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.3)',
                                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                                }}>
                                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <RotateCcw size={11} /> ↺ Closed-Loop Reactivation
                                  </div>
                                  <div style={{
                                    fontSize: 9.5, color: '#cbd5e1', marginTop: 4, lineHeight: 1.3,
                                    background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: 4
                                  }}>
                                    <strong style={{ color: '#38bdf8' }}>TRIGGER: </strong>
                                    Failure observed in real time; agent does not terminate—escalates to next tier.
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* "YES" LABEL POINTING DOWN */}
                            <span style={{
                              position: 'absolute', bottom: -20, left: 'calc(50% + 12px)',
                              fontSize: 10, fontWeight: 900, color: '#10b981', zIndex: 4
                            }}>
                              Yes
                            </span>
                          </div>

                          {/* Connecting arrow down */}
                          <div style={{ width: 2, height: 28, background: 'rgba(255,255,255,0.2)', position: 'relative' }}>
                            <div style={{
                              position: 'absolute', bottom: -4, left: -4,
                              width: 0, height: 0,
                              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                              borderTop: '6px solid rgba(255,255,255,0.4)'
                            }} />
                          </div>

                        </div>
                      );
                    }

                    if (item.type === 'action') {
                      const isSimActive = simulating && (
                        (item.tier.includes('Tier 1') && simIndex === 3) ||
                        (item.tier.includes('Tier 2') && simIndex === 5) ||
                        (item.tier.includes('Tier 3') && simIndex === 7) ||
                        (item.tier.includes('Strategy 1') && simIndex === 3) ||
                        (item.tier.includes('Strategy 2') && simIndex === 5)
                      );

                      return (
                        <div key={item.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          
                          {/* ACTION RECTANGLE WITH "WHY THAT ACTION" */}
                          <div
                            onClick={() => setSelectedNodeInfo(item)}
                            style={{
                              width: '100%', maxWidth: 440,
                              background: isSimActive 
                                ? 'linear-gradient(135deg, #16a34a 0%, #10b981 100%)' 
                                : item.isLoopback
                                  ? 'rgba(15, 23, 42, 0.95)'
                                  : 'rgba(15, 23, 42, 0.85)',
                              border: isSimActive 
                                ? '2px solid #86efac' 
                                : item.isLoopback 
                                  ? '1.5px solid #818cf8' 
                                  : '1.5px solid #06b6d4',
                              borderRadius: 14, padding: '14px 18px',
                              cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: isSimActive 
                                ? '0 0 35px rgba(22,163,74,0.7)' 
                                : '0 6px 20px rgba(0,0,0,0.5)',
                              position: 'relative', zIndex: 3
                            }}
                          >
                            {/* Action Header & Tier */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{
                                fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 4,
                                background: isSimActive ? 'rgba(0,0,0,0.25)' : 'rgba(6,182,212,0.15)',
                                color: isSimActive ? '#fff' : '#38bdf8',
                                border: '1px solid rgba(255,255,255,0.15)'
                              }}>
                                {item.tier}
                              </span>
                              {item.isLoopback && (
                                <span style={{
                                  fontSize: 8.5, fontWeight: 900, color: '#fb7185',
                                  display: 'flex', alignItems: 'center', gap: 3
                                }}>
                                  <RotateCcw size={10} /> CLOSED-LOOP ESCALATION
                                </span>
                              )}
                            </div>

                            {/* Action Name */}
                            <div style={{
                              fontSize: 13, fontWeight: 900,
                              color: isSimActive ? '#fff' : '#f8fafc',
                              lineHeight: 1.3
                            }}>
                              {item.action}
                            </div>

                            {/* WHY THAT ACTION (CRITICAL SECTION) */}
                            <div style={{
                              marginTop: 8, padding: '8px 10px', borderRadius: 8,
                              background: isSimActive ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.5)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              fontSize: 10.5, lineHeight: 1.4,
                              color: isSimActive ? '#f0fdf4' : '#cbd5e1'
                            }}>
                              <strong style={{ color: isSimActive ? '#fef08a' : '#fbbf24' }}>
                                WHY THIS ACTION: </strong>
                              {item.why}
                            </div>
                          </div>

                          {/* Connecting arrow down */}
                          <div style={{ width: 2, height: 28, background: 'rgba(255,255,255,0.2)', position: 'relative' }}>
                            <div style={{
                              position: 'absolute', bottom: -4, left: -4,
                              width: 0, height: 0,
                              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                              borderTop: '6px solid rgba(255,255,255,0.4)'
                            }} />
                          </div>

                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* 3. TERMINAL END NODE (OVAL / CAPSULE) */}
                <div style={{
                  padding: '14px 40px', borderRadius: 30,
                  background: simIndex === currentFlow.simPath.length - 1 
                    ? 'linear-gradient(135deg, #16a34a 0%, #10b981 100%)' 
                    : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.15) 100%)',
                  border: simIndex === currentFlow.simPath.length - 1 ? '2px solid #86efac' : '1.5px solid rgba(16,185,129,0.4)',
                  color: '#fff', textAlign: 'center', zIndex: 2,
                  boxShadow: simIndex === currentFlow.simPath.length - 1 ? '0 0 35px rgba(22,163,74,0.7)' : '0 0 20px rgba(16,185,129,0.2)',
                  transition: 'all 0.2s', marginTop: 4
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle size={16} />
                    {currentFlow.endSuccess.label}
                  </div>
                  <div style={{ fontSize: 10.5, color: simIndex === currentFlow.simPath.length - 1 ? '#f0fdf4' : '#94a3b8', marginTop: 3 }}>
                    {currentFlow.endSuccess.sub}
                  </div>
                </div>

              </div>

              {/* NODE DETAIL INSPECTOR (ON CLICK) */}
              {selectedNodeInfo && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #06b6d4',
                  borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HelpCircle size={16} color="#06b6d4" />
                      Node Specification: {selectedNodeInfo.action || selectedNodeInfo.question}
                    </div>
                    <button
                      onClick={() => setSelectedNodeInfo(null)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                    {selectedNodeInfo.why || 'Decision condition evaluated dynamically using OpenRouter LLM context vector & real-time webhook telemetry.'}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: AUTONOMOUS CAPABILITY RADAR & BENCHMARK MATRIX */}
          {activeTab === 'RADAR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                    Architecture Benchmark: Autonomous Agent vs Traditional Rule Engines
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Comparing deep contextual reasoning and closed-loop adaptability against brittle if/else trees.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#06b6d4' }}>
                    <div style={{ width: 12, height: 4, background: '#06b6d4', borderRadius: 2 }} />
                    RevenueTwin Agent
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#ef4444' }}>
                    <div style={{ width: 12, height: 4, background: '#ef4444', borderRadius: 2, borderBottom: '1px dashed #ef4444' }} />
                    Legacy Rule Trees
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 18, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', position: 'relative'
                }}>
                  <svg width={size} height={size} style={{ overflow: 'visible' }}>
                    {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
                      <circle
                        key={i}
                        cx={center} cy={center} r={radius * level}
                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                      />
                    ))}

                    {RADAR_METRICS.map((_, i) => {
                      const { x, y } = getPointCoordinates(i, 100);
                      return (
                        <line
                          key={i}
                          x1={center} y1={center} x2={x} y2={y}
                          stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                        />
                      );
                    })}

                    <polygon
                      points={rulesPolygonPoints}
                      fill="rgba(239,68,68,0.12)"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />

                    <polygon
                      points={agentPolygonPoints}
                      fill="rgba(6,182,212,0.22)"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.5))' }}
                    />

                    {RADAR_METRICS.map((m, i) => {
                      const { x: ax, y: ay } = getPointCoordinates(i, m.agent);
                      const { x: lx, y: ly } = getPointCoordinates(i, 125);
                      const isSelected = selectedRadarMetric.label === m.label;
                      return (
                        <g key={i} onClick={() => setSelectedRadarMetric(m)} style={{ cursor: 'pointer' }}>
                          <circle
                            cx={ax} cy={ay} r={isSelected ? 6 : 4}
                            fill="#06b6d4" stroke="#fff" strokeWidth={isSelected ? 2 : 1}
                            style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }}
                          />
                          <text
                            x={lx} y={ly}
                            textAnchor="middle" dominantBaseline="central"
                            fill={isSelected ? '#06b6d4' : '#94a3b8'}
                            fontSize="10" fontWeight={isSelected ? 800 : 600}
                          >
                            {m.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>
                        {selectedRadarMetric.label}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                        +{(selectedRadarMetric.agent - selectedRadarMetric.rules)}% SUPERIORITY
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                      {selectedRadarMetric.desc}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: '#06b6d4', fontWeight: 800 }}>RevenueTwin Autonomous Agent</span>
                          <span style={{ color: '#fff', fontWeight: 800 }}>{selectedRadarMetric.agent}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${selectedRadarMetric.agent}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #38bdf8)' }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>Legacy Rule Engine</span>
                          <span style={{ color: '#94a3b8' }}>{selectedRadarMetric.rules}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${selectedRadarMetric.rules}%`, height: '100%', background: '#ef4444' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Agent Average', val: '96.5%', color: '#06b6d4' },
                      { label: 'Rule Engine', val: '41.2%', color: '#ef4444' },
                      { label: 'Autonomy Gap', val: '2.34x', color: '#10b981' },
                    ].map((st, i) => (
                      <div key={i} style={{
                        padding: '12px', borderRadius: 10,
                        background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.06)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{st.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: st.color, marginTop: 2 }}>{st.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE TOOL ECOSYSTEM */}
          {activeTab === 'TOOLS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
              }}>
                <Zap size={20} color="#10b981" flexShrink={0} />
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  <strong style={{ color: '#fff' }}>Production-Ready Razorpay API Integration:</strong> The agent commands dedicated tool endpoints directly linked to live Razorpay SDK and WhatsApp notification pipelines.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {[
                  {
                    name: 'Razorpay Payment Link API',
                    action: 'PAYMENT_LINK',
                    latency: '340ms',
                    icon: Zap,
                    desc: 'Generates secure authenticated shortlinks (rzp.io/i/...) with 24hr auto-expiry dispatched via Razorpay WhatsApp API.',
                    endpoints: ['POST /v1/payment_links', 'POST /v1/notifications/whatsapp']
                  },
                  {
                    name: 'Smart Retry Engine',
                    action: 'RETRY',
                    latency: '180ms',
                    icon: RefreshCw,
                    desc: 'Submits payment tokens to secondary gateway acquirers using exponential backoff with randomized network jitter.',
                    endpoints: ['POST /v1/payments/{id}/retry', 'GET /v1/issuers/health']
                  },
                  {
                    name: 'Alternate Rail Gateway Bridge',
                    action: 'ALTERNATE_PAYMENT',
                    latency: '290ms',
                    icon: ArrowRight,
                    desc: 'Instantly transitions user sessions to UPI Intent deep-linking (PhonePe, GPay, Paytm) and NetBanking interfaces.',
                    endpoints: ['POST /v1/checkout/switch_rail', 'GET /v1/upi/intent_uri']
                  },
                  {
                    name: 'Deterministic Policy Guardrail',
                    action: 'GUARDRAILS',
                    latency: '12ms',
                    icon: Shield,
                    desc: 'Sub-millisecond local policy verification ensuring retry frequency caps, fatigue budgets, and confidence floors.',
                    endpoints: ['LOCAL_POLICY_GATE', 'MERCHANT_FATIGUE_STORE']
                  },
                  {
                    name: 'Customer Memory Vector Store',
                    action: 'CONTEXT_MEMORY',
                    latency: '45ms',
                    icon: Layers,
                    desc: 'Vectorized historical ledger tracking 12-month payment frequency, issuer decline patterns, and preferred channels.',
                    endpoints: ['GET /api/scenarios/synthetic', 'POST /api/memory/vector_update']
                  },
                  {
                    name: 'OpenRouter Nemotron LLM Orchestrator',
                    action: 'REASONING_CORE',
                    latency: '620ms',
                    icon: Brain,
                    desc: 'High-throughput reasoning model delivering structured JSON actions with causal recovery justification.',
                    endpoints: ['POST /api/v1/chat/completions', 'STREAMING_POLICY_JSON']
                  },
                ].map((tool, i) => {
                  const ToolIcon = tool.icon;
                  return (
                    <div key={i} style={{
                      background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#06b6d4'
                          }}>
                            <ToolIcon size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{tool.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>SLA Latency: {tool.latency}</div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                          LIVE
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                        {tool.desc}
                      </div>

                      <div style={{
                        marginTop: 'auto',
                        padding: '8px 10px', borderRadius: 6,
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)',
                        fontSize: 10, fontFamily: 'monospace', color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2
                      }}>
                        {tool.endpoints.map((ep, j) => (
                          <div key={j}>• {ep}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: NEXT-GEN INNOVATIONS / ARCHITECTURE PREVIEW */}
          {activeTab === 'ROADMAP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
              }}>
                <Radio size={22} color="#fbbf24" flexShrink={0} />
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  <strong style={{ color: '#fff' }}>Future Technical Roadmap (Enterprise Core):</strong> Beyond single-merchant transaction loops, RevenueTwin is engineered to scale into collaborative swarm intelligence and real-time voice agents.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
                {[
                  {
                    title: 'Cross-Merchant Swarm Outage Pre-emption',
                    badge: 'SWARM INTEL v3.2',
                    icon: Radio,
                    color: '#06b6d4',
                    desc: 'Aggregates failure signals across thousands of distributed checkouts. When an issuer (e.g. HDFC or SBI) degrades on Merchant A, the swarm pre-emptively reroutes traffic to alternative rails on Merchant B before transactions fail.'
                  },
                  {
                    title: 'Autonomous AI Neural Voice Recovery',
                    badge: 'WEBRTC VOICE AGENT',
                    icon: PhoneCall,
                    color: '#818cf8',
                    desc: 'For high-ticket transactions that drop at OTP, dispatches an ultra-low latency (<450ms) neural voice call in the customer’s native language (Hindi, Tamil, English) to resolve OTP delays and trigger instant WhatsApp payment links.'
                  },
                  {
                    title: 'Reinforcement Learning from Merchant Feedback (RLMF)',
                    badge: 'SELF-CALIBRATING ML',
                    icon: Cpu,
                    color: '#10b981',
                    desc: 'A continuous policy optimization loop that learns from human merchant approvals and overrides, progressively expanding autonomous limits for high-confidence failure archetypes while tightening control on edge cases.'
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} style={{
                      background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 16, padding: '22px', display: 'flex', flexDirection: 'column', gap: 14,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute', top: -30, right: -30, width: 90, height: 90,
                        background: `radial-gradient(circle, ${item.color}25 0%, transparent 70%)`,
                        pointerEvents: 'none'
                      }} />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: `${item.color}15`, border: `1px solid ${item.color}35`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: item.color
                        }}>
                          <Icon size={18} />
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                          background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}35`,
                          letterSpacing: '0.06em'
                        }}>
                          {item.badge}
                        </span>
                      </div>

                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</div>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 11, fontWeight: 700, color: item.color, marginTop: 'auto'
                      }}>
                        Architecture Preview <ChevronRight size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM FOOTER */}
        <div style={{
          padding: '14px 28px', borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            RevenueTwin Autonomous Specialist Matrix · Official Razorpay Hackathon Showcase
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
}
