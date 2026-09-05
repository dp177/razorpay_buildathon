/**
 * PaymentRecoveryDashboard
 *
 * Dedicated premium page for the full agentic payment recovery loop.
 * Shows the clear agent decision → retry → fallback → outcome cycle.
 *
 * States: IDLE → GENERATING → READY → DECIDING → AWAITING_APPROVAL →
 *         ATTEMPT(RETRY) → ATTEMPT(ALTERNATE_PAYMENT) → ATTEMPT(PAYMENT_LINK)
 *         → COMPLETED
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Shield, Activity, CreditCard, RefreshCw,
  CheckCircle, XCircle, Clock, ArrowRight, Copy,
  ExternalLink, AlertTriangle, RotateCcw, Loader2,
  Check, X, User, Zap, TrendingUp, Link as LinkIcon,
  Wallet, Smartphone, Building2, ChevronRight,
  Brain, Eye, Lock, Unlock, BarChart2, Target,
  Mail, Phone, MapPin, Calendar, Award
} from 'lucide-react';
import { useScenarioPolling } from '../hooks/useScenarioPolling';
import AgentDetailPanel from '../components/AgentDetailPanel';
import { SCENARIOS } from '../config/agents';

const API_BASE = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '4173')
  ? '/api'
  : 'http://127.0.0.1:8000/api';

// ── Action metadata ────────────────────────────────────────────────────────────
const ACTION_META = {
  RETRY: {
    label: 'Retry Payment',
    shortLabel: 'RETRY',
    sub: 'Attempt the same payment method again',
    icon: RotateCcw,
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.3)',
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.25)',
  },
  ALTERNATE_PAYMENT: {
    label: 'Alternate Payment',
    shortLabel: 'ALT PAY',
    sub: 'Pay via UPI, wallet, or net banking',
    icon: Wallet,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
  },
  PAYMENT_LINK: {
    label: 'Payment Link',
    shortLabel: 'PAY LINK',
    sub: 'Secure Razorpay link sent to customer',
    icon: LinkIcon,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
  },
  CARD_UPDATE: {
    label: 'Card Update',
    shortLabel: 'UPDATE',
    sub: 'Customer updates their card details',
    icon: CreditCard,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  NO_ACTION: {
    label: 'No Action',
    shortLabel: 'NONE',
    sub: 'No intervention at this time',
    icon: Clock,
    color: '#6b7280',
    glow: 'rgba(107,114,128,0.2)',
    bg: 'rgba(107,114,128,0.06)',
    border: 'rgba(107,114,128,0.2)',
  },
};

function getMeta(action) {
  return ACTION_META[action] || {
    label: action,
    shortLabel: action,
    sub: '',
    icon: Zap,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.2)',
    bg: 'rgba(148,163,184,0.06)',
    border: 'rgba(148,163,184,0.2)',
  };
}

// ── Razorpay loader ────────────────────────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KPIBar({ decision, allExecutions, allOutcomes, run, elapsed }) {
  const attemptCurrent = allExecutions.length;
  const totalPlan = decision
    ? 1 + (decision.recovery_plan?.length || 0)
    : 3;
  const recoveryProb = decision
    ? Math.round((decision.confidence || 0.75) * 100)
    : 75;

  const latestOutcome = allOutcomes[allOutcomes.length - 1];
  const amountRecovered = latestOutcome?.actual_recovered_amount;

  return (
    <div style={{
      display: 'flex', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)'
    }}>
      {[
        {
          label: 'AMOUNT AT RISK',
          value: '₹4,999',
          sub: 'Payment failed',
          icon: CreditCard,
          color: '#ef4444',
        },
        {
          label: 'RECOVERY ATTEMPT',
          value: attemptCurrent > 0 ? `Attempt ${attemptCurrent}` : '—',
          sub: run?.status === 'COMPLETED' ? 'Recovery completed' : 'Agent active',
          icon: Target,
          color: '#06b6d4',
        },
        {
          label: 'RECOVERY PROB',
          value: `${recoveryProb}%`,
          sub: decision ? 'LLM confidence' : 'Estimated',
          icon: TrendingUp,
          color: recoveryProb >= 70 ? '#10b981' : '#f59e0b',
        },
        {
          label: 'TIME ELAPSED',
          value: elapsed,
          sub: 'Since failure event',
          icon: Clock,
          color: '#8b5cf6',
        },
        amountRecovered != null && {
          label: 'RECOVERED',
          value: amountRecovered > 0 ? `₹${amountRecovered.toFixed(0)}` : '₹0',
          sub: amountRecovered > 0 ? 'Success!' : 'Not recovered',
          icon: amountRecovered > 0 ? CheckCircle : XCircle,
          color: amountRecovered > 0 ? '#10b981' : '#ef4444',
        },
      ].filter(Boolean).map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <div key={i} style={{
            flex: 1, padding: '14px 20px',
            borderRight: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon size={11} color={kpi.color} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569' }}>
                {kpi.label}
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>{kpi.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

function RecoveryChainPanel({ decision, allExecutions, allOutcomes, currentAction, runStatus }) {
  if (!decision) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', marginBottom: 16 }}>
          RECOVERY CHAIN
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0' }}>
          <Loader2 size={20} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 11, color: '#475569' }}>Awaiting decision...</span>
        </div>
      </div>
    );
  }

  // Dynamically build chain from actions decided & initiated by the agent
  const chain = [];
  if (!allExecutions || allExecutions.length === 0) {
    chain.push({
      action: decision.decision,
      stepLabel: 'Attempt 1 (Primary)',
      execution: null,
    });
  } else {
    allExecutions.forEach((exec, idx) => {
      chain.push({
        action: exec.action,
        stepLabel: idx === 0 ? 'Primary Action' : `Fallback ${idx}`,
        execution: exec,
      });
    });
  }

  // Outcome node is always the end of the chain
  chain.push({ action: 'OUTCOME', stepLabel: 'Outcome', isOutcome: true });

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', marginBottom: 20 }}>
        RECOVERY CHAIN
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {chain.map((step, idx) => {
          const outcomeForStep = allOutcomes?.find(o =>
            step.execution ? (o.execution_id === step.execution.execution_id || o.action === step.execution.action) : false
          );

          let status = 'pending';
          if (step.isOutcome) {
            status = allOutcomes?.some(o => o.status === 'SUCCESS') ? 'success'
              : (runStatus === 'COMPLETED' && allOutcomes?.length > 0) ? 'failed'
                : 'pending';
          } else if (step.execution) {
            if (step.execution.status === 'AWAITING_CUSTOMER') status = 'active';
            else if (outcomeForStep?.status === 'SUCCESS') status = 'success';
            else if (step.execution.status === 'COMPLETED') status = 'failed';
          } else {
            status = 'active';
          }

          const isLast = idx === chain.length - 1;
          const meta = step.isOutcome ? null : getMeta(step.action);
          const Icon = meta ? meta.icon : CheckCircle;

          const dotColor = {
            active: meta?.color || '#06b6d4',
            success: '#10b981',
            failed: '#ef4444',
            pending: '#1e293b',
          }[status];

          const dotBorder = {
            active: meta?.color || '#06b6d4',
            success: '#10b981',
            failed: '#ef4444',
            pending: 'rgba(255,255,255,0.12)',
          }[status];

          return (
            <React.Fragment key={idx}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                opacity: status === 'pending' ? 0.45 : 1,
                transition: 'opacity 0.3s',
              }}>
                {/* Dot + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: dotColor,
                    border: `2px solid ${dotBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: status === 'active' ? `0 0 12px ${meta?.glow}` : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {status === 'success' ? <Check size={14} color="#fff" />
                      : status === 'failed' ? <X size={14} color="#fff" />
                        : status === 'active' ? <Icon size={14} color="#fff" />
                          : step.isOutcome ? <Target size={14} color="#475569" />
                            : <Icon size={14} color="#475569" />}
                  </div>
                </div>

                {/* Label */}
                <div style={{ paddingTop: 4, paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                    color: status === 'active' ? (meta?.color || '#06b6d4')
                      : status === 'success' ? '#10b981'
                        : status === 'failed' ? '#ef4444'
                          : '#94a3b8',
                  }}>
                    {step.isOutcome ? 'OUTCOME' : (meta?.shortLabel || step.action)}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                    {step.stepLabel}
                  </div>
                  {status === 'active' && (
                    <div style={{
                      marginTop: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      color: meta?.color, background: meta?.bg,
                      border: `1px solid ${meta?.border}`,
                      borderRadius: 4, padding: '2px 6px', display: 'inline-block',
                    }}>
                      CURRENT
                    </div>
                  )}
                  {status === 'success' && (
                    <div style={{ marginTop: 4, fontSize: 9, color: '#10b981', fontWeight: 700 }}>
                      ✓ Recovered
                    </div>
                  )}
                  {status === 'failed' && !step.isOutcome && (
                    <div style={{ marginTop: 4, fontSize: 9, color: '#ef4444', fontWeight: 700 }}>
                      ✗ Failed — escalated
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div style={{
                  width: 2, height: 16, marginLeft: 15,
                  background: status === 'success' ? '#10b981'
                    : status === 'failed' ? '#ef4444'
                      : status === 'active' ? (meta?.color || '#06b6d4')
                        : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function AgentConsole({ traces, decision, consoleRef }) {
  const entries = useMemo(() => {
    const arr = [];
    (traces || []).forEach((t, i) => {
      // Skip raw internal connection errors
      if (t.stage === 'EVIDENCE' || t.stage === 'LLM_UNAVAILABLE' || t.stage === 'LLM_FAILURE') return;
      const rawMsg = typeof t.message === 'string' ? t.message : JSON.stringify(t.message);
      if (rawMsg.includes('switching to local reasoning engine')) return;

      let tagColor = '#475569';
      let tagBg = 'rgba(71,85,105,0.15)';
      if (t.stage === 'FINAL DECISION' || t.stage === 'DECISION') { tagColor = '#06b6d4'; tagBg = 'rgba(6,182,212,0.12)'; }
      else if (t.stage === 'RECOMMENDATION') { tagColor = '#10b981'; tagBg = 'rgba(16,185,129,0.12)'; }
      else if (t.stage === 'LLM CALL' || t.stage === 'LLM') { tagColor = '#818cf8'; tagBg = 'rgba(129,140,248,0.2)'; }
      else if (t.stage === 'LLM INFERENCE') { tagColor = '#38bdf8'; tagBg = 'rgba(56,189,248,0.2)'; }
      else if (t.stage === 'REASONING' || t.stage === 'FALLBACK_REASONING') { tagColor = '#8b5cf6'; tagBg = 'rgba(139,92,246,0.12)'; }
      else if (t.stage === 'RULE ENGINE') { tagColor = '#f59e0b'; tagBg = 'rgba(245,158,11,0.12)'; }
      else if (t.stage === 'POLICY') { tagColor = '#10b981'; tagBg = 'rgba(16,185,129,0.12)'; }
      else if (t.stage === 'COMPLEXITY') { tagColor = '#fb7185'; tagBg = 'rgba(251,113,133,0.12)'; }
      else if (t.stage === 'EXECUTION') { tagColor = '#06b6d4'; tagBg = 'rgba(6,182,212,0.12)'; }
      else if (t.stage === 'OBSERVATION' || t.stage === 'OUTCOME') { tagColor = '#10b981'; tagBg = 'rgba(16,185,129,0.12)'; }
      else if (t.stage === 'AGENT_REACTIVATED') { tagColor = '#f59e0b'; tagBg = 'rgba(245,158,11,0.12)'; }
      else if (t.stage === 'MEMORY') { tagColor = '#a78bfa'; tagBg = 'rgba(167,139,250,0.12)'; }

      const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour12: false });
      arr.push({ key: `t-${i}`, timeStr, tagColor, tagBg, stage: t.stage, msg: rawMsg });
    });
    return arr;
  }, [traces]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Brain size={14} color="#8b5cf6" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>
          AGENT REASONING
        </span>
        <div style={{
          marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
          background: traces?.length > 0 ? '#10b981' : '#374151',
          boxShadow: traces?.length > 0 ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
        }} />
      </div>

      {/* Traces */}
      <div ref={consoleRef} style={{
        flex: 1, overflowY: 'auto', padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0,
      }}>
        {entries.length === 0 ? (
          <div style={{ fontSize: 11, color: '#374151', padding: '20px 0', textAlign: 'center' }}>
            Agent is idle — start a scenario to see live reasoning
          </div>
        ) : entries.map(e => (
          <div key={e.key} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 9, color: '#334155', minWidth: 55, paddingTop: 1, flexShrink: 0 }}>
              {e.timeStr}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
              background: e.tagBg, color: e.tagColor, flexShrink: 0, letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>
              {e.stage.replace('LLM GATE', 'GATE').replace('DECISION_STARTED', 'START')
                .replace('ACTION VALIDATION', 'VALIDATE').replace('FINAL DECISION', 'DECISION')}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {e.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Action-specific center panels ─────────────────────────────────────────────

function RetryPanel({ attemptNumber, onSuccess, onFail, isLoading, amountStr }) {
  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)',
          borderRadius: 6, padding: '4px 10px', marginBottom: 16,
        }}>
          <RotateCcw size={11} color="#06b6d4" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.08em' }}>
            ATTEMPT {attemptNumber || 1} — PRIMARY ACTION
          </span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, marginBottom: 8 }}>
          Retry Payment
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          The agent has identified a soft bank decline. The most likely fix is a direct retry —
          90% of similar failures succeed on the first attempt.
        </p>
      </div>

      {/* Payment details card */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '20px 24px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 14 }}>
          TRANSACTION DETAILS
        </div>
        {[
          { label: 'Amount', value: amountStr, highlight: true },
          { label: 'Merchant', value: 'ShopNow' },
          { label: 'Method', value: 'Credit Card •••• 4242' },
          { label: 'Failure Reason', value: 'Soft Decline (Bank Temporary)' },
          { label: 'Retry Window', value: '2 hours remaining' },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
            <span style={{
              fontSize: 12, fontWeight: highlight ? 700 : 500,
              color: highlight ? '#06b6d4' : '#94a3b8',
            }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onSuccess}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(6,182,212,0.35)',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={16} />}
          {isLoading ? 'Opening Checkout...' : 'Retry Payment via Razorpay'}
        </button>

        <button
          onClick={onFail}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.06)', color: '#ef4444',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <XCircle size={14} />
          Simulate Payment Failure
        </button>
      </div>

      <div style={{
        fontSize: 11, color: '#374151', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px',
      }}>
        💡 If this attempt fails, the agent will analyze failure signals and dynamically decide the next recovery action
      </div>
    </div>
  );
}

function AlternatePaymentPanel({ attemptNumber, allExecutions, onSuccess, onFail }) {
  const [selected, setSelected] = useState(null);

  const methods = [
    { id: 'upi_gpay', label: 'Google Pay', sub: 'UPI via GPay', icon: '🔵', color: '#4285f4' },
    { id: 'upi_phonepe', label: 'PhonePe', sub: 'UPI via PhonePe', icon: '🟣', color: '#5f259f' },
    { id: 'upi_paytm', label: 'Paytm', sub: 'UPI via Paytm', icon: '💙', color: '#00b9f1' },
    { id: 'wallet_amazon', label: 'Amazon Pay', sub: 'Wallet balance', icon: '🟠', color: '#ff9900' },
    { id: 'netbanking', label: 'Net Banking', sub: 'Direct bank transfer', icon: '🏦', color: '#10b981' },
  ];

  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 6, padding: '4px 10px', marginBottom: 16,
        }}>
          <Wallet size={11} color="#8b5cf6" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.08em' }}>
            ATTEMPT {attemptNumber || 2} — AGENT DECIDED
          </span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, marginBottom: 8 }}>
          Alternate Payment
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Retry via original card failed. The agent evaluated the failure and dynamically decided to offer alternate payment rails.
        </p>
      </div>

      <div style={{
        background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <XCircle size={14} color="#ef4444" />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          Attempt 1 ({allExecutions?.[0]?.action || 'RETRY'}) failed — Agent dynamically evaluated context & escalated to alternate methods
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {methods.map(m => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 10,
              border: selected === m.id
                ? `2px solid ${m.color}`
                : '1px solid rgba(255,255,255,0.07)',
              background: selected === m.id
                ? `rgba(${m.color.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(',')},0.08)`
                : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22 }}>{m.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{m.label}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{m.sub}</div>
            </div>
            {selected === m.id && (
              <Check size={14} color={m.color} style={{ marginLeft: 'auto' }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onSuccess}
          disabled={!selected}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px 24px', borderRadius: 10, border: 'none', cursor: selected ? 'pointer' : 'not-allowed',
            background: selected
              ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
              : 'rgba(255,255,255,0.05)',
            color: selected ? '#fff' : '#475569', fontSize: 14, fontWeight: 700,
            boxShadow: selected ? '0 4px 20px rgba(139,92,246,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <CheckCircle size={16} />
          Confirm Payment via {selected ? methods.find(m => m.id === selected)?.label : 'Selected Method'}
        </button>
        <button
          onClick={onFail}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.06)', color: '#ef4444',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <XCircle size={14} />
          Simulate Payment Failure
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#374151', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px' }}>
        💡 If this also fails, the agent will analyze customer response and dynamically decide the next recovery action
      </div>
    </div>
  );
}

function PaymentLinkPanel({ attemptNumber, allExecutions, paymentUrl, onSuccess, onFail, syntheticData }) {
  const [copied, setCopied] = useState(false);
  const displayUrl = paymentUrl || 'Generating live Razorpay link...';

  const handleCopy = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl).catch(() => { });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = async () => {
    if (paymentUrl && paymentUrl.startsWith('http')) {
      window.open(paymentUrl, '_blank');
      return;
    }
    // If external link is not yet ready, open real Razorpay checkout modal
    const ok = await loadRazorpayScript();
    if (ok) {
      const options = {
        key: 'rzp_test_TVFY3uRhKlnFE6',
        amount: 499900,
        currency: 'INR',
        name: 'ShopNow',
        description: 'Payment Recovery Link',
        handler: () => { onSuccess(); },
        theme: { color: '#10b981' },
        prefill: {
          name: syntheticData?.customer?.name || 'Customer',
          email: syntheticData?.customer?.email || 'customer@example.com',
          contact: '9876543210',
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    }
  };

  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 6, padding: '4px 10px', marginBottom: 16,
        }}>
          <LinkIcon size={11} color="#10b981" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em' }}>
            ATTEMPT {attemptNumber || 3} — AGENT DECIDED
          </span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, marginBottom: 8 }}>
          Payment Link
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Direct checkout attempts failed. The agent dynamically decided to generate a secure omnichannel Razorpay payment link.
        </p>
      </div>

      {/* Previous failures timeline */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '16px 18px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 12, letterSpacing: '0.08em' }}>
          PREVIOUS FAILED ATTEMPTS
        </div>
        {(allExecutions && allExecutions.length > 1 ? allExecutions.slice(0, -1) : [
          { action: 'RETRY' },
          { action: 'ALTERNATE_PAYMENT' }
        ]).map((item, i) => (
          <div key={item.execution_id || i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <XCircle size={13} color="#ef4444" />
            <span style={{ fontSize: 11, color: '#475569' }}>Attempt {i + 1} — {item.action}</span>
            <span style={{ fontSize: 10, color: '#374151', marginLeft: 'auto' }}>Declined / Timed Out</span>
          </div>
        ))}
      </div>

      {/* Payment link display */}
      <div style={{
        background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12, padding: '20px 24px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', marginBottom: 10 }}>
          SECURE PAYMENT LINK
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, fontSize: 12, color: paymentUrl ? '#10b981' : '#94a3b8', fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayUrl}
          </div>
          <button
            onClick={handleCopy}
            disabled={!paymentUrl}
            title={paymentUrl ? "Copy Payment Link" : "Generating link..."}
            style={{
              padding: '8px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.08)', cursor: paymentUrl ? 'pointer' : 'not-allowed', color: '#10b981',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
          Generated via Razorpay API · Valid for 24 hours · ₹4,999
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleOpenLink}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 24px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)',
            background: 'rgba(16,185,129,0.08)', color: '#10b981',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <ExternalLink size={14} />
          Open Payment Link
        </button>
        <button
          onClick={onSuccess}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
          }}
        >
          <CheckCircle size={16} />
          Simulate: Customer Paid via Link ✓
        </button>
        <button
          onClick={onFail}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.06)', color: '#ef4444',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <XCircle size={14} />
          Simulate: Customer Did Not Pay (Recovery Exhausted)
        </button>
      </div>
    </div>
  );
}

function ApprovalPanel({ decision, onApprove, onReject, isApproving, approveError }) {
  // Decision is loading — still show the panel with a spinner so buttons are visible
  if (!decision) {
    return (
      <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 6, padding: '4px 10px', marginBottom: 16,
          }}>
            <Shield size={11} color="#f59e0b" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em' }}>
              MERCHANT APPROVAL REQUIRED
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0, marginBottom: 6 }}>
            Agent Decision Ready
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            The AI has analyzed the failed payment and recommended an action.
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '28px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Loader2 size={20} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#64748b' }}>Finalizing recommendation — loading decision details...</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            disabled
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 10, border: 'none', cursor: 'not-allowed',
              background: 'rgba(255,255,255,0.06)',
              color: '#64748b', fontSize: 14, fontWeight: 700,
            }}
          >
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Formulating Decision...
          </button>
          <button
            onClick={onReject}
            disabled={isApproving}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.06)', color: '#ef4444',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <X size={16} /> Cancel
          </button>
        </div>
        {approveError && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171',
          }}>
            ⚠ {approveError}
          </div>
        )}
      </div>
    );
  }

  const meta = getMeta(decision.decision);
  const Icon = meta.icon;

  const totalPlan = 1 + (decision.recovery_plan?.length || 0);

  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 6, padding: '4px 10px', marginBottom: 16,
        }}>
          <Shield size={11} color="#f59e0b" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em' }}>
            MERCHANT APPROVAL REQUIRED
          </span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0, marginBottom: 6 }}>
          Agent Decision Ready
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          The AI has analyzed the failed payment and recommended an action. Review and approve to proceed.
        </p>
      </div>

      {/* Decision card */}
      <div style={{
        background: meta.bg, border: `1px solid ${meta.border}`,
        borderRadius: 14, padding: '20px 22px',
        boxShadow: `0 0 30px ${meta.glow}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(0,0,0,0.2)', border: `1px solid ${meta.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={20} color={meta.color} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: meta.color }}>{decision.decision}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{meta.sub}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>
              {Math.round((decision.confidence || 0) * 100)}%
            </div>
            <div style={{ fontSize: 10, color: '#475569' }}>confidence</div>
          </div>
        </div>

        {decision.rationale && (
          <div style={{
            fontSize: 12, color: '#94a3b8', lineHeight: 1.6,
            background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '10px 14px',
            marginBottom: 14, fontStyle: 'italic',
          }}>
            "{decision.rationale}"
          </div>
        )}

        {/* Recovery plan / dynamic recovery strategy */}
        {decision.recovery_plan?.length > 0 ? (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', marginBottom: 8 }}>
              RECOVERY PLAN ({totalPlan} ATTEMPTS)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {[decision.decision, ...decision.recovery_plan.map(s => s.action)].map((action, i) => {
                const m = getMeta(action);
                return (
                  <React.Fragment key={i}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                      background: m.bg, border: `1px solid ${m.border}`, color: m.color,
                    }}>
                      {action}
                    </span>
                    {i < decision.recovery_plan.length && (
                      <ChevronRight size={12} color="#374151" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', marginBottom: 4 }}>
              DYNAMIC AGENTIC RECOVERY
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
              The agent will initiate <strong style={{ color: meta.color }}>{decision.decision}</strong>. If this attempt fails, the agent will dynamically evaluate customer signals and decide the next recovery action in real time.
            </div>
          </div>
        )}
      </div>

      {/* Evidence summary */}
      {decision.evidence?.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>
            EVIDENCE ({decision.evidence.length} SIGNALS)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {decision.evidence.slice(0, 4).map((e, i) => {
              const ev = typeof e === 'object' ? e : { signal: e, importance: 'MEDIUM', description: '' };
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
                    background: ev.importance === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                    color: ev.importance === 'HIGH' ? '#ef4444' : '#f59e0b',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    {ev.importance}
                  </span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>{ev.signal}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{ev.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approve / Reject */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onApprove}
          disabled={isApproving}
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 24px', borderRadius: 10, border: 'none',
            cursor: isApproving ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
            opacity: isApproving ? 0.7 : 1, transition: 'opacity 0.2s',
          }}
        >
          {isApproving
            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            : <Check size={16} />}
          {isApproving ? 'Approving...' : 'Approve & Execute'}
        </button>
        <button
          onClick={onReject}
          disabled={isApproving}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.06)', color: '#ef4444',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <X size={16} /> Reject
        </button>
      </div>
      {approveError && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171',
        }}>
          ⚠ {approveError}
        </div>
      )}
    </div>
  );
}

function OutcomePanel({ allOutcomes, decision, allExecutions, onReset }) {
  const successOutcome = allOutcomes.find(o => o.status === 'SUCCESS');
  const isSuccess = !!successOutcome;
  const totalAttempts = allExecutions.length;

  return (
    <div style={{ padding: '40px 28px', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        border: `3px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 40px ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        {isSuccess
          ? <CheckCircle size={36} color="#10b981" />
          : <XCircle size={36} color="#ef4444" />}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: isSuccess ? '#10b981' : '#ef4444', marginBottom: 6 }}>
          {isSuccess ? 'Payment Recovered!' : 'Recovery Exhausted'}
        </div>
        <div style={{ fontSize: 14, color: '#64748b' }}>
          {isSuccess
            ? `Recovered after ${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''}`
            : `All ${totalAttempts} recovery attempts failed`}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400 }}>
        {[
          { label: 'Amount', value: isSuccess ? `₹${(successOutcome?.actual_recovered_amount || 0).toFixed(0)}` : '₹0', color: isSuccess ? '#10b981' : '#ef4444' },
          { label: 'Attempts Used', value: `${totalAttempts} attempt${totalAttempts !== 1 ? 's' : ''}`, color: '#06b6d4' },
          { label: 'Net Recovery', value: isSuccess ? `₹${Math.max(0, (successOutcome?.actual_net_recovery || 0)).toFixed(0)}` : '₹0', color: '#94a3b8' },
          { label: 'Outcome', value: isSuccess ? 'SUCCESS' : 'FAILED', color: isSuccess ? '#10b981' : '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '16px 18px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8,
        }}
      >
        <RotateCcw size={14} /> Start New Recovery Mission
      </button>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function PaymentRecoveryDashboard({ onExit }) {
  const [phase, setPhase] = useState('idle'); // idle|generating|ready|starting|deciding|awaiting_approval|executing|completed
  const [scenarioId, setScenarioId] = useState(null);
  const [syntheticData, setSyntheticData] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState('00:00');
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState(null);
  const [showAgentMatrix, setShowAgentMatrix] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const consoleRef = useRef(null);

  const { simState, run, traces, timeline } = useScenarioPolling(scenarioId);

  // Derived state
  const decision = timeline?.decisions?.[timeline.decisions.length - 1];
  const allExecutions = timeline?.executions || [];
  const allOutcomes = timeline?.outcomes || [];
  const latestExecution = allExecutions[allExecutions.length - 1];
  const currentAction = latestExecution?.status === 'AWAITING_CUSTOMER' ? latestExecution.action : null;
  const totalPlan = decision ? 1 + (decision.recovery_plan?.length || 0) : 3;
  const attemptNumber = allExecutions.length;

  // Elapsed timer
  useEffect(() => {
    if (!startTime) return;
    const t = setInterval(() => {
      const secs = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(secs / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(t);
  }, [startTime]);

  // Phase transitions from polling
  useEffect(() => {
    if (!run) {
      if (scenarioId) setPhase('deciding');
      return;
    }
    if (run.status === 'COMPLETED' || simState?.status === 'COMPLETED') {
      setPhase('completed');
    } else if (run.status === 'AWAITING_APPROVAL') {
      setPhase('awaiting_approval');
    } else if (run.status === 'CUSTOMER_INTERACTION') {
      setPhase('executing');
    } else if (['RUNNING', 'DECIDING', 'READY_FOR_DECISION'].includes(run.status)) {
      setPhase('deciding');
    }
  }, [run, simState, scenarioId]);

  // Scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [traces]);

  // ── Local synthetic data (used when backend is offline / 502) ────────────────
  const buildLocalSyntheticData = () => ({
    status: 'SUCCESS',
    customer: {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `local-${Date.now()}`,
      name: 'Meera Patel',
      email: 'meera.patel@example.com',
      phone: '+91 98765 43210',
      city: 'Bengaluru, Karnataka (IN)',
      tier: 'Gold Tier VIP',
      tenure: '18 Months (Member since Mar 2023)',
      archetype: 'HIGH_VALUE_RETURNING_CUSTOMER',
      churn_risk: '0.08 (Very Low)',
      fatigue_score: 0.12,
      avg_monthly_spend: '₹4,250',
      total_lifetime_orders: 12,
    },
    order: { item: 'ShopNow Pro Annual Plan', amount: 4999.0, currency: 'INR', failure_simulation: 'Soft Decline (Temporary Bank Network Glitch)' },
    agent: 'PaymentRecoveryAgent',
    context_type: 'PAYMENT_FAILED',
    payment_instruments: {
      primary: { type: 'CREDIT_CARD', label: 'HDFC Bank Visa Platinum Card', last4: '4242', issuer: 'HDFC Bank', status: 'Active (Transient Network Decline)', historical_success: '85%' },
      alternate_rails: [
        { type: 'UPI', vpa: 'meera.patel@okhdfcbank', status: 'Verified & Active', historical_success: '100%' },
        { type: 'NETBANKING', bank: 'HDFC Bank / ICICI Bank', status: 'Available', historical_success: '96%' },
        { type: 'WALLET', provider: 'Amazon Pay / Paytm', status: 'Linked', historical_success: '94%' },
        { type: 'PAYMENT_LINK', channel: 'WhatsApp / SMS Instant Link', status: 'Ready', historical_success: '92%' },
      ],
    },
    specialist_history: {
      label: 'Payment History',
      stats: [
        { title: 'Total Payments', value: '12', detail: 'Last 12 months' },
        { title: 'Success Rate', value: '83%', detail: '10 of 12 successful' },
        { title: 'Soft Decline Recovery', value: '100%', detail: 'Both past declines recovered' },
        { title: 'Avg Monthly Spend', value: '₹4,250', detail: 'High customer LTV' },
      ],
      payment_history: [
        { date: '12 days ago', amount: 4999, status: 'SUCCESS', rail: 'HDFC Visa ••4242', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
        { date: '36 days ago', amount: 2499, status: 'SUCCESS', rail: 'UPI: meera.patel@okhdfcbank', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
        { date: '60 days ago', amount: 4999, status: 'FAILED', rail: 'HDFC Visa ••4242', failure_reason: 'Soft Decline (Issuer Timeout)', recovery_status: 'RECOVERED_ON_RETRY' },
        { date: '84 days ago', amount: 1999, status: 'SUCCESS', rail: 'HDFC Visa ••4242', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
        { date: '108 days ago', amount: 3400, status: 'SUCCESS', rail: 'UPI: meera.patel@okhdfcbank', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
        { date: '132 days ago', amount: 5200, status: 'SUCCESS', rail: 'HDFC Visa ••4242', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
      ],
    },
    evidence_cards: [
      { signal: 'SOFT_DECLINE_PATTERN', label: 'Failure Type', value: 'Recoverable', importance: 'HIGH', cls: 'high' },
      { signal: 'HIGH_HISTORICAL_SUCCESS', label: 'Payment History', value: '83% Success', importance: 'HIGH', cls: 'high' },
      { signal: 'ALTERNATE_RAILS_AVAILABLE', label: 'Alternate Rails', value: 'UPI, Wallet, Link', importance: 'HIGH', cls: 'active' },
      { signal: 'LOW_CONTACT_FATIGUE', label: 'Contact Fatigue', value: 'LOW', importance: 'MEDIUM', cls: 'low' },
    ],
    data_access_audit: {
      agent: 'PaymentRecoveryAgent',
      data_accessed: ['payment_history', 'failure_analysis', 'alternate_instruments', 'customer_fatigue'],
      data_not_accessed: ['b2b_invoice_history', 'mandate_history', 'subscription_history'],
    },
  });

  const handleGenerate = async () => {
    setPhase('generating');
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/scenarios/generate-synthetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: 'PAYMENT_FAILED' }),
      });
      // 502/503/504 = Vite proxy can't reach FastAPI (backend offline) → silent fallback
      if ([502, 503, 504].includes(res.status)) {
        setSyntheticData(buildLocalSyntheticData());
        setPhase('ready');
        return;
      }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setSyntheticData(data);
      setPhase('ready');
    } catch (e) {
      // TypeError = raw network error (no proxy layer)
      if (e instanceof TypeError || /failed to fetch|networkerror/i.test(e.message || '')) {
        setSyntheticData(buildLocalSyntheticData());
        setPhase('ready');
      } else {
        setError(e.message);
        setPhase('idle');
      }
    }
  };

  const handleSimulatePaymentFail = async () => {
    // Open Razorpay; user fails → triggers scenario start
    setIsCheckingOut(true);
    const ok = await loadRazorpayScript();
    if (!ok) {
      setIsCheckingOut(false);
      // Fallback: start scenario directly
      startScenario();
      return;
    }

    try {
      const orderRes = await fetch(`${API_BASE}/demo/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 4999 }),
      });
      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TVFY3uRhKlnFE6',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ShopNow',
        description: 'Purchase — ShopNow Pro Plan',
        order_id: orderData.order_id,
        handler: () => {
          setIsCheckingOut(false);
          alert('Payment succeeded! Close this and try again — choose "Decline Payment" to trigger the recovery agent.');
        },
        theme: { color: '#ef4444' },
        prefill: {
          name: syntheticData?.customer?.name || 'Meera Patel',
          email: syntheticData?.customer?.email || 'meera.patel@example.com',
          contact: '9876543210',
        },
      };

      const safetyTimer = setTimeout(() => {
        setIsCheckingOut(false);
      }, 5000);

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        clearTimeout(safetyTimer);
        setIsCheckingOut(false);
        startScenario();
      });
      rzp.on('payment.closed', () => {
        clearTimeout(safetyTimer);
        setIsCheckingOut(false);
      });
      rzp.open();
    } catch {
      setIsCheckingOut(false);
      startScenario();
    }
  };

  const startScenario = async () => {
    setPhase('starting');
    setStartTime(Date.now());
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/scenarios/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: 'PAYMENT_FAILED',
          customer_id: syntheticData?.customer?.id,
          specialist_context: syntheticData,
        }),
      });
      if ([502, 503, 504].includes(res.status) || !res.ok) {
        const isGateway = [502, 503, 504].includes(res.status);
        setError(isGateway
          ? 'Backend server offline. Run: cd backend && uvicorn app.main:app --reload'
          : `Failed to start scenario (${res.status})`);
        setPhase('ready');
        return;
      }
      const data = await res.json();
      setScenarioId(data.scenario_id);
      setPhase('deciding');
    } catch (e) {
      const isOffline = e instanceof TypeError || /failed to fetch|networkerror/i.test(e.message || '');
      setError(isOffline
        ? 'Backend server offline. Run: cd backend && uvicorn app.main:app --reload'
        : e.message);
      setPhase('ready');
    }
  };

  const handleApprove = async () => {
    if (!run?.run_id) {
      setApproveError('Run not found. Wait a moment and try again.');
      return;
    }
    setIsApproving(true);
    setApproveError(null);
    try {
      const approveRes = await fetch(`${API_BASE}/agent-runs/${run.run_id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'merchant' }),
      });
      if (!approveRes.ok) {
        const err = await approveRes.json().catch(() => ({}));
        throw new Error(err.detail || `Approve failed (${approveRes.status})`);
      }
      const execRes = await fetch(`${API_BASE}/agent-runs/${run.run_id}/execute`, { method: 'POST' });
      if (!execRes.ok) {
        const err = await execRes.json().catch(() => ({}));
        throw new Error(err.detail || `Execute failed (${execRes.status})`);
      }
    } catch (e) {
      console.error('Approve error:', e);
      setApproveError(e.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!run?.run_id) return;
    await fetch(`${API_BASE}/agent-runs/${run.run_id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_by: 'merchant' }),
    });
    setPhase('idle');
    setScenarioId(null);
  };

  const handleResolve = async (response) => {
    if (!latestExecution?.execution_id) return;
    try {
      await fetch(`${API_BASE}/agent-runs/${run.run_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execution_id: latestExecution.execution_id,
          customer_response: response,
        }),
      });
    } catch (e) { console.error(e); }
  };

  const handleRetryPayment = async () => {
    setIsCheckingOut(true);
    const ok = await loadRazorpayScript();
    if (!ok) { setIsCheckingOut(false); return; }

    try {
      const orderRes = await fetch(`${API_BASE}/demo/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 4999 }),
      });
      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TVFY3uRhKlnFE6',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ShopNow',
        description: 'Retry — Recovery Agent',
        order_id: orderData.order_id,
        handler: () => { setIsCheckingOut(false); handleResolve('SUCCESS'); },
        theme: { color: '#06b6d4' },
        prefill: { name: syntheticData?.customer?.name || 'Customer', email: 'customer@example.com' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { setIsCheckingOut(false); handleResolve('FAILED_TIMEOUT'); });
      rzp.on('payment.closed', () => setIsCheckingOut(false));
      rzp.open();
    } catch { setIsCheckingOut(false); }
  };

  const handleReset = () => {
    setPhase('idle');
    setScenarioId(null);
    setSyntheticData(null);
    setError(null);
    setStartTime(null);
    setElapsed('00:00');
  };

  // ── Customer Dossier Card Sub-Component ─────────────────────────────────────
  const renderCustomerDossier = (isModal = false, onClose = null) => {
    const customer = syntheticData?.customer || {
      name: 'Meera Patel',
      email: 'meera.patel@example.com',
      phone: '+91 98765 43210',
      city: 'Bengaluru, Karnataka (IN)',
      tier: 'Gold Tier VIP',
      tenure: '18 Months (Member since Mar 2023)',
      archetype: 'HIGH_VALUE_RETURNING_CUSTOMER',
      churn_risk: '0.08 (Very Low)',
      fatigue_score: 0.12,
      avg_monthly_spend: '₹4,250',
      total_lifetime_orders: 12,
      id: 'cust_meera_78291',
    };

    const order = syntheticData?.order || {
      item: 'ShopNow Pro Annual Plan',
      amount: 4999.0,
      currency: 'INR',
      failure_simulation: 'Soft Decline (Temporary Bank Network Glitch)',
    };

    const instruments = syntheticData?.payment_instruments || {
      primary: {
        type: 'CREDIT_CARD',
        label: 'HDFC Bank Visa Platinum Card',
        last4: '4242',
        issuer: 'HDFC Bank',
        status: 'Active (Transient Network Decline)',
        historical_success: '85%',
      },
      alternate_rails: [
        { type: 'UPI', vpa: 'meera.patel@okhdfcbank', status: 'Verified & Active', historical_success: '100%' },
        { type: 'NETBANKING', bank: 'HDFC Bank / ICICI Bank', status: 'Available', historical_success: '96%' },
        { type: 'WALLET', provider: 'Amazon Pay / Paytm', status: 'Linked', historical_success: '94%' },
        { type: 'PAYMENT_LINK', channel: 'WhatsApp / SMS Instant Link', status: 'Ready', historical_success: '92%' },
      ],
    };

    const history = syntheticData?.specialist_history?.payment_history || [
      { date: '12 days ago', amount: 4999, status: 'SUCCESS', rail: 'HDFC Visa ••4242', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
      { date: '36 days ago', amount: 2499, status: 'SUCCESS', rail: 'UPI: meera.patel@okhdfcbank', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
      { date: '60 days ago', amount: 4999, status: 'FAILED', rail: 'HDFC Visa ••4242', failure_reason: 'Soft Decline (Issuer Timeout)', recovery_status: 'RECOVERED_ON_RETRY' },
      { date: '84 days ago', amount: 1999, status: 'SUCCESS', rail: 'HDFC Visa ••4242', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
      { date: '108 days ago', amount: 3400, status: 'SUCCESS', rail: 'UPI: meera.patel@okhdfcbank', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
      { date: '132 days ago', amount: 5200, status: 'SUCCESS', rail: 'HDFC Visa ••4242', recovery_status: 'FIRST_ATTEMPT_SUCCESS' },
    ];

    return (
      <div style={{
        width: '100%', maxWidth: 840,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(8,13,26,0.98) 100%)',
        border: '1px solid rgba(6,182,212,0.3)',
        borderRadius: 20,
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 35px rgba(6,182,212,0.12)',
        padding: '28px 32px',
        display: 'flex', flexDirection: 'column', gap: 22,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top Ambient Glow */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Dossier Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.25))',
              border: '2px solid #06b6d4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(6,182,212,0.4)',
              color: '#06b6d4', flexShrink: 0, position: 'relative'
            }}>
              <User size={28} />
              <div style={{
                position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%',
                background: '#10b981', border: '2px solid #0b1120', boxShadow: '0 0 8px #10b981'
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {customer.name || 'Meera Patel'}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)',
                  letterSpacing: '0.05em'
                }}>
                  {customer.tier || 'GOLD TIER VIP'}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                  letterSpacing: '0.05em'
                }}>
                  18 MOS LIFETIME
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(6,182,212,0.12)', color: '#38bdf8', border: '1px solid rgba(6,182,212,0.3)',
                  letterSpacing: '0.05em'
                }}>
                  HIGH-VALUE CUSTOMER
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 5, flexWrap: 'wrap', fontSize: 12, color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={12} color="#06b6d4" /> {customer.email || 'meera.patel@example.com'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Phone size={12} color="#06b6d4" /> {customer.phone || '+91 98765 43210'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} color="#06b6d4" /> {customer.city || 'Bengaluru, Karnataka (IN)'}
                </span>
              </div>
            </div>
          </div>

          {isModal && onClose ? (
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94a3b8'
              }}
            >
              <X size={16} />
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              fontSize: 11, fontWeight: 700, color: '#10b981'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              PROFILE LOADED & READY
            </div>
          )}
        </div>

        {/* Transaction Context & Amount at Risk */}
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', flexShrink: 0
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', letterSpacing: '0.06em' }}>
                CURRENT ORDER · AMOUNT AT RISK
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {order.item}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Failure Pattern: <span style={{ color: '#fca5a5' }}>{order.failure_simulation}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>
              ₹{(order.amount || 4999).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Primary Rail: {instruments.primary?.label || 'HDFC Visa ••4242'}
            </div>
          </div>
        </div>

        {/* 12-Month Payment Telemetry Metric Blocks */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', marginBottom: 10 }}>
            12-MONTH HISTORICAL TELEMETRY
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            {[
              { label: 'TOTAL PAYMENTS', value: '12 Orders', sub: 'Last 12 months', color: '#06b6d4', icon: Activity },
              { label: 'HISTORICAL SUCCESS', value: '83% Rate', sub: '10 of 12 successful', color: '#10b981', icon: TrendingUp },
              { label: 'SOFT DECLINE RECOVERY', value: '100% Retried', sub: 'Both past declines recovered', color: '#818cf8', icon: RefreshCw },
              { label: 'AVG MONTHLY SPEND', value: '₹4,250', sub: 'High customer LTV', color: '#fbbf24', icon: Award },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon size={12} color={m.color} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.06em' }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.sub}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Section: Past Transactions Ledger & Payment Instruments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
          {/* Recent Transactions History Ledger */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>
                RECENT PAYMENT LEDGER
              </span>
              <span style={{ fontSize: 10, color: '#06b6d4', fontWeight: 700 }}>Past 6 Attempts</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {history.map((tx, i) => {
                const isFail = tx.status === 'FAILED';
                const dateStr = tx.date.includes('T')
                  ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : tx.date;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 8,
                    background: isFail ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isFail ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.04)',
                    fontSize: 11
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: isFail ? '#ef4444' : '#10b981'
                      }} />
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{tx.rail || 'HDFC Visa ••4242'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#fff' }}>₹{tx.amount.toLocaleString()}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                        background: isFail ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: isFail ? '#ef4444' : '#10b981',
                        border: isFail ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)'
                      }}>
                        {isFail ? 'SOFT DECLINE (RECOVERED)' : 'SUCCESS'}
                      </span>
                      <span style={{ color: '#64748b', fontSize: 10 }}>{dateStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Payment Instruments & Alternate Rails */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>
              REGISTERED RECOVERY RAILS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Primary Card */}
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>HDFC Bank Visa Platinum</div>
                  <div style={{ fontSize: 10, color: '#fca5a5' }}>Primary (•••• 4242) · Prone to soft decline</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.2)', padding: '2px 6px', borderRadius: 4 }}>
                  PRIMARY
                </span>
              </div>

              {/* UPI Alternate */}
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>UPI: meera.patel@okhdfcbank</div>
                  <div style={{ fontSize: 10, color: '#86efac' }}>100% Historical Success · Instant Auth</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                  TIER 2 RAIL
                </span>
              </div>

              {/* Razorpay Payment Link */}
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Razorpay Payment Link (WhatsApp/SMS)</div>
                  <div style={{ fontSize: 10, color: '#7dd3fc' }}>Verified phone: +91 98765 43210</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#06b6d4', background: 'rgba(6,182,212,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                  TIER 3 RAIL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Behavioral Context & Privacy Compliance Strip */}
        <div style={{
          background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} color="#10b981" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
              Data Privacy Audit: <strong style={{ color: '#10b981' }}>Zero Card CVV/PAN stored</strong> · Only issuer telemetry accessed
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>Recovery Strategy:</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#38bdf8' }}>Smart Retry → Alternate UPI → Razorpay Shortlink</span>
          </div>
        </div>

        {/* Actions (only in modal view) */}
        {isModal && onClose && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onClose} style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}>Close</button>
          </div>
        )}
      </div>
    );
  };

  // ── Idle / Ready state ─────────────────────────────────────────────────────
  const renderIdleState = () => (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* Scrollable content area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
      }}>
        {syntheticData ? (
          renderCustomerDossier(false)
        ) : (
          <>
            <div style={{ textAlign: 'center', maxWidth: 500, paddingTop: 40 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', boxShadow: '0 0 30px rgba(239,68,68,0.2)',
              }}>
                <CreditCard size={30} color="#ef4444" />
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', margin: '0 0 12px' }}>
                Payment Recovery Agent
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                Simulate a real payment failure and watch the AI agent execute a multi-step recovery loop —
                RETRY → ALTERNATE PAYMENT → PAYMENT LINK — with full transparency.
              </p>
            </div>

            {/* How it works */}
            <div style={{ display: 'flex', gap: 12, maxWidth: 600, width: '100%' }}>
              {[
                { step: '1', label: 'Generate Customer', sub: 'Synthetic profile with payment history', color: '#06b6d4' },
                { step: '2', label: 'Fail a Payment', sub: 'Real Razorpay checkout (choose decline)', color: '#ef4444' },
                { step: '3', label: 'Agent Recovers', sub: 'Watch the full agentic loop', color: '#10b981' },
              ].map(s => (
                <div key={s.step} style={{
                  flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '16px 14px', textAlign: 'center',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `rgba(${s.color.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(',')},0.1)`,
                    border: `1px solid ${s.color}40`,
                    color: s.color, fontSize: 12, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}>
                    {s.step}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={phase === 'generating'}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '16px 36px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                color: '#fff', fontSize: 15, fontWeight: 800,
                boxShadow: '0 4px 24px rgba(6,182,212,0.4)',
              }}
            >
              {phase === 'generating'
                ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                : <User size={18} />}
              {phase === 'generating' ? 'Generating Profile...' : 'Generate Customer Profile'}
            </button>
          </>
        )}

        {error && (
          <div style={{ color: '#ef4444', fontSize: 12, background: 'rgba(239,68,68,0.08)', padding: '10px 16px', borderRadius: 8 }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── STICKY BOTTOM ACTION BAR (shown only when profile is ready) ── */}
      {syntheticData && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(10,15,30,0.95) 0%, rgba(10,15,30,1) 100%)',
          backdropFilter: 'blur(12px)',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* Step label */}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#64748b', marginRight: 4 }}>
            STEP 2 OF 3
          </div>

          {/* Main CTA */}
          <button
            onClick={handleSimulatePaymentFail}
            disabled={isCheckingOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 32px', borderRadius: 12, border: 'none',
              cursor: isCheckingOut ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff', fontSize: 14, fontWeight: 800,
              boxShadow: '0 4px 24px rgba(239,68,68,0.45)',
              transition: 'all 0.2s', flex: '0 0 auto',
            }}
            onMouseEnter={e => { if (!isCheckingOut) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isCheckingOut
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <CreditCard size={16} />}
            {isCheckingOut ? 'Opening Checkout...' : '🚀 Pay with Razorpay → Trigger Agent'}
          </button>

          {/* Divider */}
          <div style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>or</div>

          {/* Skip link */}
          <button
            onClick={startScenario}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 20px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Zap size={13} /> Skip to Agent (no payment)
          </button>

          {/* Re-gen */}
          <button
            onClick={handleGenerate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 16px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> Re-generate
          </button>
        </div>
      )}
    </div>
  );

  // ── Center panel content ───────────────────────────────────────────────────
  const renderCenter = () => {
    if (phase === 'idle' || phase === 'generating' || phase === 'ready') {
      return renderIdleState();
    }

    if (phase === 'completed') {
      return <OutcomePanel allOutcomes={allOutcomes} decision={decision} allExecutions={allExecutions} onReset={handleReset} />;
    }

    if (phase === 'awaiting_approval') {
      return <ApprovalPanel decision={decision} onApprove={handleApprove} onReject={handleReject} isApproving={isApproving} approveError={approveError} />;
    }

    if (phase === 'deciding' || phase === 'starting') {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(139,92,246,0.08)', border: '2px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(139,92,246,0.2)',
          }}>
            <Brain size={28} color="#8b5cf6" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
              Agent Analyzing...
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Processing evidence and selecting the optimal recovery action
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['TRANSIENT_FAILURE', 'HIGH_HISTORY', 'SOFT_DECLINE', 'LOW_FATIGUE'].map((tag, i) => (
              <span key={tag} style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                color: '#8b5cf6', animation: `fadeIn 0.4s ${i * 0.15}s both`,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // executing phase — show action-specific panel
    if (phase === 'executing') {
      const attempt = attemptNumber || (allExecutions.length > 0 ? allExecutions.length : 1);

      if (currentAction === 'RETRY' || (!currentAction && latestExecution?.action === 'RETRY')) {
        return (
          <RetryPanel
            attemptNumber={attempt}
            onSuccess={handleRetryPayment}
            onFail={() => handleResolve('FAILED_TIMEOUT')}
            isLoading={isCheckingOut}
            amountStr="₹4,999"
          />
        );
      }
      if (currentAction === 'ALTERNATE_PAYMENT' || (!currentAction && latestExecution?.action === 'ALTERNATE_PAYMENT')) {
        return (
          <AlternatePaymentPanel
            attemptNumber={attempt}
            allExecutions={allExecutions}
            onSuccess={() => handleResolve('SUCCESS')}
            onFail={() => handleResolve('FAILED_TIMEOUT')}
          />
        );
      }
      if (currentAction === 'PAYMENT_LINK' || (!currentAction && (latestExecution?.action === 'PAYMENT_LINK' || allExecutions.some(e => e.action === 'PAYMENT_LINK')))) {
        const paymentExec = [...allExecutions].reverse().find(e => e.action === 'PAYMENT_LINK') || latestExecution;
        const url = paymentExec?.payload?.payment_url;
        return (
          <PaymentLinkPanel
            attemptNumber={attempt}
            allExecutions={allExecutions}
            paymentUrl={url}
            syntheticData={syntheticData}
            onSuccess={() => handleResolve('SUCCESS')}
            onFail={() => handleResolve('FAILED_TIMEOUT')}
          />
        );
      }
    }

    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>
        Processing...
      </div>
    );
  };

  const isRunning = !['idle', 'generating', 'ready'].includes(phase);

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1428 100%)',
      display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f1f5f9',
    }}>
      {/* Global CSS */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.97); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Top nav bar */}
      <div style={{
        height: 52, borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
        background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
      }}>
        <button
          onClick={onExit}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#475569', fontSize: 12, padding: '4px 8px', borderRadius: 6,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard size={12} color="#ef4444" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Payment Recovery Agent</span>
          <ChevronRight size={12} color="#374151" />
          <span style={{ fontSize: 12, color: '#475569' }}>Agentic Loop Simulator</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowAgentMatrix(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8,
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.35)',
              color: '#06b6d4', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '0.04em', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
          >
            <Brain size={12} />
            AGENT MATRIX
          </button>
          <button
            onClick={() => setShowDossierModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8,
              background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
              color: '#38bdf8', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '0.04em', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }}
          >
            <User size={12} />
            MEERA'S DOSSIER
          </button>
          {isRunning && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              color: '#10b981',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#10b981',
                boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              AGENT ACTIVE
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: '#374151', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px',
          }}>
            <Shield size={10} /> TEST MODE
          </div>
        </div>
      </div>

      {/* KPI bar — only when running */}
      {isRunning && (
        <KPIBar
          decision={decision}
          allExecutions={allExecutions}
          allOutcomes={allOutcomes}
          run={run}
          elapsed={elapsed}
        />
      )}

      {/* Main 3-column layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: Recovery chain */}
        {isRunning && (
          <div style={{
            width: 220, borderRight: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto', flexShrink: 0, minHeight: 0,
          }}>
            <RecoveryChainPanel
              decision={decision}
              allExecutions={allExecutions}
              allOutcomes={allOutcomes}
              currentAction={currentAction}
              runStatus={run?.status}
            />
          </div>
        )}

        {/* Center: Action panel */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {renderCenter()}
        </div>

        {/* Right: Agent console */}
        {isRunning && (
          <div style={{
            width: 310, borderLeft: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: 0, overflow: 'hidden',
          }}>
            <AgentConsole traces={traces} decision={decision} consoleRef={consoleRef} />
          </div>
        )}
      </div>
      {showAgentMatrix && (
        <AgentDetailPanel agent={SCENARIOS[0]} onClose={() => setShowAgentMatrix(false)} />
      )}
      {showDossierModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflowY: 'auto'
        }} onClick={() => setShowDossierModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 860, maxHeight: '90vh', overflowY: 'auto' }}>
            {renderCustomerDossier(true, () => setShowDossierModal(false))}
          </div>
        </div>
      )}
    </div>
  );
}
