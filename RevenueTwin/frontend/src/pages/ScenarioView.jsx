import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity, Shield, Clock, User, RotateCcw, Play, Pause,
  ChevronRight, CheckCircle, Circle, ArrowRight, Eye,
  Maximize2, AlertTriangle, Calendar, Database, Lock, Unlock,
  Check, X, XCircle, RotateCw, HandMetal,
  CreditCard, Phone, ShoppingCart, MessageSquare, Loader2
} from 'lucide-react';
import { SCENARIOS } from '../config/agents';
import { useScenarioPolling } from '../hooks/useScenarioPolling';
import AgentDetailPanel from '../components/AgentDetailPanel';
import '../index.css';

const API_BASE = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '4173')
  ? '/api'
  : 'http://127.0.0.1:8000/api';

function localSyntheticFor(scenario) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `local-${Date.now()}`;
  const first = (scenario.agentName || 'Customer').split(' ')[0];
  const name = `${first} Demo`;
  return {
    status: 'SUCCESS',
    customer: {
      id,
      name,
      email: `${first.toLowerCase()}.demo@example.com`,
      archetype: 'SYNTHETIC_DEMO_CUSTOMER',
    },
    agent: scenario.agentName,
    context_type: scenario.id,
    specialist_history: {
      label: (scenario.contextCards && scenario.contextCards[0]?.title) || 'Customer History',
      stats: (scenario.evidenceRows || []).map((row) => ({
        title: row.label,
        value: row.valueLabel,
        detail: row.sub,
      })),
    },
    evidence_cards: (scenario.evidenceRows || []).map((row) => ({
      signal: row.label,
      label: row.label,
      value: row.valueLabel,
      importance: 'HIGH',
      cls: row.cls,
    })),
    data_access_audit: {
      agent: scenario.agentName,
      data_accessed: (scenario.contextCards || []).map((c) => c.title),
      data_not_accessed: [],
    },
  };
}

function safeStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return val.signal || val.label || val.value || val.name || JSON.stringify(val);
  }
  return String(val);
}

const PAYMENT_METHODS = [
  {
    id: 'gpay',
    name: 'Google Pay',
    shortName: 'GPay',
    icon: '🅶',
    color: '#4285F4',
    gradient: 'linear-gradient(135deg, #4285F4, #34A853)',
    badge: 'UPI',
    upiId: 'meera@oksbi',
    desc: 'Pay via Google Pay UPI',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    shortName: 'PhonePe',
    icon: '🅿',
    color: '#5f259f',
    gradient: 'linear-gradient(135deg, #5f259f, #8b4cc8)',
    badge: 'UPI',
    upiId: 'meera@ybl',
    desc: 'Pay via PhonePe UPI',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    shortName: 'Paytm',
    icon: '🅿',
    color: '#00BAF2',
    gradient: 'linear-gradient(135deg, #00BAF2, #0070ba)',
    badge: 'Wallet',
    upiId: 'meera@paytm',
    desc: 'Pay via Paytm Wallet / UPI',
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    shortName: 'AmazonPay',
    icon: '🅐',
    color: '#FF9900',
    gradient: 'linear-gradient(135deg, #FF9900, #e47911)',
    badge: 'Wallet',
    upiId: 'meera@apl',
    desc: 'Pay via Amazon Pay balance',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    shortName: 'NetBank',
    icon: '🏦',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    badge: 'Bank',
    upiId: null,
    desc: 'Pay via your bank account',
  },
];

function PaymentMethodModal({ onClose, onConfirm }) {
  const [activeMethod, setActiveMethod] = useState(PAYMENT_METHODS[0]);
  const [upiInput, setUpiInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerifyUpi = async () => {
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1200));
    setVerified(true);
    setVerifying(false);
  };

  const handlePay = () => {
    onConfirm(activeMethod);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: 520,
        maxHeight: '90vh',
        background: 'linear-gradient(145deg, #0f1729, #111827)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 20,
        boxShadow: '0 0 60px rgba(99,102,241,0.25), 0 25px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: '#818cf8', marginBottom: 4 }}>
              ALTERNATE PAYMENT RAILS • AGENT ESCALATION
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
              Choose Payment Method
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Agent recovered ₹4,999 via alternate payment rail
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, lineHeight: 1
            }}
          >×</button>
        </div>

        {/* Amount strip */}
        <div style={{
          margin: '0 24px',
          marginTop: 16,
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.1))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em' }}>AMOUNT DUE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>₹4,999</div>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#10b981',
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 6, padding: '4px 10px', letterSpacing: '0.08em'
          }}>
            SECURE CHECKOUT
          </div>
        </div>

        {/* Payment tabs */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', marginBottom: 10 }}>
            SELECT PAYMENT METHOD
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.id}
                onClick={() => { setActiveMethod(method); setVerified(false); setUpiInput(''); }}
                style={{
                  flex: '0 0 auto',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: activeMethod.id === method.id
                    ? `1.5px solid ${method.color}`
                    : '1.5px solid rgba(255,255,255,0.08)',
                  background: activeMethod.id === method.id
                    ? `linear-gradient(135deg, ${method.color}22, ${method.color}11)`
                    : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  transition: 'all 0.2s ease',
                  minWidth: 72,
                  position: 'relative',
                  outline: 'none'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: method.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, boxShadow: activeMethod.id === method.id ? `0 4px 16px ${method.color}44` : 'none',
                  transition: 'box-shadow 0.2s'
                }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: '-0.02em' }}>
                    {method.shortName.slice(0,2).toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: activeMethod.id === method.id ? method.color : '#64748b', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {method.shortName}
                </div>
                <div style={{
                  position: 'absolute', top: -5, right: -5,
                  fontSize: 7, fontWeight: 800,
                  background: method.gradient, color: '#fff',
                  borderRadius: 4, padding: '1px 4px', letterSpacing: '0.06em'
                }}>
                  {method.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Method detail panel */}
        <div style={{ padding: '16px 24px', flex: 1 }}>
          <div style={{
            padding: 16, borderRadius: 12,
            border: `1px solid ${activeMethod.color}33`,
            background: `linear-gradient(135deg, ${activeMethod.color}0d, rgba(0,0,0,0.2))`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: activeMethod.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${activeMethod.color}44`
              }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>
                  {activeMethod.shortName.slice(0,2).toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{activeMethod.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{activeMethod.desc}</div>
              </div>
            </div>

            {activeMethod.upiId ? (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 6 }}>
                  UPI ID
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={upiInput || activeMethod.upiId}
                    onChange={e => { setUpiInput(e.target.value); setVerified(false); }}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 8,
                      border: verified ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#f1f5f9', fontSize: 12, fontFamily: 'monospace',
                      outline: 'none', transition: 'border-color 0.2s'
                    }}
                    placeholder="Enter UPI ID"
                  />
                  <button
                    onClick={handleVerifyUpi}
                    disabled={verifying || verified}
                    style={{
                      padding: '9px 14px', borderRadius: 8, border: 'none',
                      background: verified ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
                      color: verified ? '#10b981' : '#818cf8',
                      cursor: verified ? 'default' : 'pointer',
                      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em'
                    }}
                  >
                    {verifying ? '...' : verified ? '✓ VERIFIED' : 'VERIFY'}
                  </button>
                </div>
                {verified && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✓</span> Meera S. — UPI account verified
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)'
              }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  You will be redirected to your bank's secure portal to complete the payment.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 10
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            style={{
              flex: 2, padding: '11px 16px', borderRadius: 10,
              border: 'none',
              background: activeMethod.gradient,
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: `0 4px 20px ${activeMethod.color}44`,
              transition: 'opacity 0.2s'
            }}
          >
            Pay ₹4,999 via {activeMethod.name}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScenarioView({ activeScenarioDef, setActiveScenarioDef, onExit }) {
  const [scenarioId, setScenarioId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [advancing, setAdvancing] = useState(null);
  const [agentPhase, setAgentPhase] = useState('IDLE');
  const consoleRef = useRef(null);

  const [syntheticData, setSyntheticData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'merchant'
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedAgentPanel, setSelectedAgentPanel] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const { simState, run, traces, timeline, error } = useScenarioPolling(scenarioId);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const launchRazorpayCheckout = async (isRetry = false) => {
    setIsCheckingOut(true);
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Failed to load Razorpay SDK");
      setIsCheckingOut(false);
      return;
    }
    try {
      const orderRes = await fetch('http://127.0.0.1:8000/api/demo/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 4999 })
      });
      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TVFY3uRhKlnFE6',
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ShopNow",
        description: isRetry ? "Retry Transaction" : "Test Transaction",
        order_id: orderData.order_id,
        handler: function (response) {
            setIsCheckingOut(false);
            if (isRetry) {
                handleResolve('SUCCESS');
            } else {
                alert("Payment successful! This demo requires a payment failure to activate the recovery agent. Please close and try again, intentionally failing the payment.");
            }
        },
        prefill: {
            name: "Meera",
            email: "meera@example.com",
            contact: "9999999999"
        },
        theme: {
            color: isRetry ? "#10b981" : "#6366f1"
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
         setIsCheckingOut(false);
         if (isRetry) {
             handleResolve('FAILED_TIMEOUT'); 
         } else {
             handleStartScenario(syntheticData);
         }
      });
      
      rzp1.on('payment.closed', function() {
         setIsCheckingOut(false);
      });
      
      rzp1.open();
    } catch (err) {
      console.error(err);
      setIsCheckingOut(false);
    }
  };

  const flatEntries = useMemo(() => {
    const arr = [];
    let dIndex = 0;
    (traces || []).forEach((t, i) => {
      let tagClass = (t.stage || '').toLowerCase().replace(/\s+/g, '').replace('engine', '');
      if (tagClass === 'finaldecision') tagClass = 'decision';
      
      let tagLabel = t.stage;
      if (tagLabel === 'LLM GATE') tagLabel = 'LLM GATE';
      if (tagLabel === 'LLM CALL') { tagLabel = 'LLM CALL'; tagClass = 'llmcall'; }
      if (tagLabel === 'LLM INFERENCE') { tagLabel = 'LLM INFERENCE'; tagClass = 'llminference'; }
      if (tagLabel === 'LLM') tagLabel = 'REASONING';
      
      const isDecision = t.stage === 'FINAL DECISION';
      const isLLMEnd = t.stage === 'LLM' && typeof t.message === 'string' && t.message.includes('RECOMMENDED:');
      const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour12: false });

      if (isLLMEnd) {
        const d = timeline?.decisions?.[dIndex];
        if (d && d.evidence) {
          d.evidence.forEach((e, ei) => {
              const isObj = typeof e === 'object' && e !== null;
              const signal = isObj ? e.signal || 'SIGNAL' : 'SIGNAL';
              const val = isObj ? (e.description || e.value || '') : safeStr(e);
              arr.push({
                key: `ev-${i}-${ei}`,
                timeStr,
                tagClass: 'evidence',
                tagLabel: 'EVIDENCE',
                msgNode: <><span className="console-msg-highlight">{signal}</span> -- {val}</>
              });
          });
        }
        
        if (d && d.thought_process) {
          d.thought_process.forEach((tp, tpi) => {
              arr.push({
                key: `tp-${i}-${tpi}`,
                timeStr,
                tagClass: 'llm',
                tagStyle: {background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8'},
                tagLabel: 'THINKING',
                msgNode: tp
              });
          });
        }
        
        if (d && d.rationale) {
          arr.push({
              key: `rat-${i}`,
              timeStr,
              tagClass: 'llm',
              tagLabel: 'REASONING',
              msgNode: `Specialist rationale: "${d.rationale}"`
          });
        }
        return;
      }
      
      if (isDecision) {
        const d = timeline?.decisions?.[dIndex];
        dIndex++;
        
        const hasLLM = d && d.llm_used;
        
        if (!hasLLM && d && d.evidence) {
          d.evidence.forEach((e, ei) => {
              const isObj = typeof e === 'object' && e !== null;
              const signal = isObj ? e.signal || 'SIGNAL' : 'SIGNAL';
              const val = isObj ? (e.description || e.value || '') : safeStr(e);
              arr.push({
                key: `ev-fb-${i}-${ei}`,
                timeStr,
                tagClass: 'evidence',
                tagLabel: 'EVIDENCE',
                msgNode: <><span className="console-msg-highlight">{signal}</span> -- {val}</>
              });
          });
        }
        
        if (!hasLLM && d && d.rationale) {
          arr.push({
              key: `rat-fb-${i}`,
              timeStr,
              tagClass: 'llm',
              tagLabel: 'REASONING',
              msgNode: `Rationale: "${d.rationale}"`
          });
        }
        
        arr.push({
          key: `dec-${i}`,
          timeStr,
          tagClass: 'decision',
          tagLabel: 'DECISION',
          msgNode: <><span className="console-msg-highlight">{d ? d.decision : t.message}</span>{d && ` (Confidence: ${(d.confidence * 100).toFixed(0)}%)`}</>
        });
        
        if (d && d.recovery_plan && d.recovery_plan.length > 0) {
            arr.push({
                key: `plan-${i}`,
                timeStr,
                tagClass: 'decision',
                tagLabel: 'TEMPORAL PLAN',
                msgNode: (
                    <div style={{ marginTop: 8, padding: 12, background: 'rgba(56,189,248,0.05)', border: '1px dashed rgba(56,189,248,0.2)', borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', marginBottom: 6, letterSpacing: '0.05em' }}>MULTI-STEP RECOVERY PLAN</div>
                        {d.recovery_plan.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4, fontSize: 11 }}>
                                <div style={{ color: '#94a3b8', width: 40 }}>Step {idx+1}</div>
                                <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{step.action}</div>
                                <div style={{ color: '#475569', fontSize: 10 }}>({step.delay_hours > 0 ? `Wait ${step.delay_hours}h` : 'Immediate'}) {step.condition}</div>
                            </div>
                        ))}
                    </div>
                )
            });
        }
        
        return;
      }
      
      if (t.stage === 'STATUS' && typeof t.message === 'string' && t.message.includes('AWAITING_APPROVAL')) {
          arr.push({
              key: `await-${i}`,
              timeStr,
              tagClass: 'merchant',
              tagLabel: 'MERCHANT',
              msgNode: <>Approval required before execution<button className="console-btn awaiting">Awaiting</button></>
          });
          return;
      }

      if (t.stage === 'APPROVAL') {
          arr.push({
              key: `app-${i}`,
              timeStr,
              tagClass: 'merchant',
              tagLabel: 'MERCHANT',
              msgNode: <>Action <span className="console-msg-highlight">{safeStr(t.message)}</span> by merchant</>
          });
          return;
      }

      const hiddenRawStages = ['EVIDENCE'];
      if (hiddenRawStages.includes(t.stage)) {
          return;
      }

      let rawMsg = safeStr(t.message);

      arr.push({
          key: `trace-${i}`,
          timeStr,
          tagClass,
          tagLabel,
          msgNode: rawMsg
      });
    });
    return arr;
  }, [traces, timeline]);

  useEffect(() => {
    if (flatEntries.length > visibleCount) {
      const timer = setTimeout(() => {
        setVisibleCount(v => v + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [flatEntries.length, visibleCount]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [traces, timeline]);

  useEffect(() => {
    setSyntheticData(null);
    setScenarioId(null);
    setAgentPhase('IDLE');
    setAdvancing(null);
    setLaunchError(null);
    setActiveTab('user');
    setVisibleCount(0);
  }, [activeScenarioDef?.id]);

  useEffect(() => {
    if (!run) {
      if (scenarioId && isStarting) setAgentPhase('STARTING');
      else if (!scenarioId) setAgentPhase('IDLE');
      return;
    }
    if (simState?.status === 'COMPLETED') { setAgentPhase('COMPLETED'); return; }
    if (advancing) { setAgentPhase('PAUSED_FOR_ADVANCE'); return; }
    if (run.status === 'AWAITING_APPROVAL' || run.status === 'RUNNING' || run.status === 'DECIDING') {
      setAgentPhase('RUNNING');
    } else if (run.status === 'CUSTOMER_INTERACTION') {
      setAgentPhase('CUSTOMER_INTERACTION');
    } else if (run.status === 'COMPLETED') {
      const hasOutcome = timeline?.outcomes?.length > 0;
      if (hasOutcome) setAgentPhase('COMPLETED');
      else setAgentPhase('AWAITING_RERUN');
    } else {
      setAgentPhase('RUNNING');
    }
  }, [run, simState, advancing, scenarioId, isStarting, timeline]);

  const handleStartScenario = async (overrideData) => {
    const dataToUse = overrideData && overrideData.customer ? overrideData : syntheticData;
    setIsStarting(true);
    setScenarioId(null);
    setVisibleCount(0);
    setAgentPhase('STARTING');
    setLaunchError(null);
    try {
      const res = await fetch(`${API_BASE}/scenarios/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: activeScenarioDef.id,
          customer_id: dataToUse?.customer?.id,
          specialist_context: dataToUse
        })
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `Scenario could not start (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (!data.scenario_id) throw new Error('The server did not return a scenario ID.');
      if (data.specialist_context) setSyntheticData(data.specialist_context);
      setScenarioId(data.scenario_id);
      setAgentPhase('RUNNING');
    } catch (e) {
      console.error(e);
      setAgentPhase('IDLE');
      setLaunchError(e.message || 'Unable to start the live scenario.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleGenerateSynthetic = async () => {
    if (!activeScenarioDef?.id || isGenerating) return;
    setIsGenerating(true);
    setLaunchError(null);
    try {
      const res = await fetch(`${API_BASE}/scenarios/generate-synthetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: activeScenarioDef.id })
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `Customer data could not be generated (HTTP ${res.status})`);
      }
      const data = await res.json();
      setSyntheticData(data);
      if (activeScenarioDef.id !== 'PAYMENT_FAILED') {
        await handleStartScenario(data);
      }
    } catch (e) {
      console.error(e);
      const offline = e instanceof TypeError || /failed to fetch|networkerror/i.test(e.message || '');
      if (offline && activeScenarioDef) {
        const localData = localSyntheticFor(activeScenarioDef);
        setSyntheticData(localData);
        if (activeScenarioDef.id !== 'PAYMENT_FAILED') {
          await handleStartScenario(localData);
        }
        return;
      }
      setLaunchError(e.message || 'Unable to generate customer data.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (approve) => {
    if (!run?.run_id) return;
    try {
      await fetch(`${API_BASE}/agent-runs/${run.run_id}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'merchant' })
      });
      if (approve) {
        await fetch(`${API_BASE}/agent-runs/${run.run_id}/execute`, { method: 'POST' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (customer_response) => {
    if (!run?.run_id) return;
    try {
      const executions = timeline?.executions || [];
      const latestExecution = executions[executions.length - 1];
      if (!latestExecution?.execution_id) return;
      await fetch(`${API_BASE}/agent-runs/${run.run_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execution_id: latestExecution.execution_id,
          customer_response: customer_response
        })
      });
    } catch (e) { console.error(e); }
  };

  const handleNegotiate = async () => {
    if (!run?.run_id || !feedbackText.trim()) return;
    try {
      const executions = timeline?.executions || [];
      const latestExecution = executions[executions.length - 1];
      if (!latestExecution?.execution_id) return;
      await fetch(`${API_BASE}/agent-runs/${run.run_id}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execution_id: latestExecution.execution_id,
          customer_feedback: feedbackText
        })
      });
      setFeedbackText('');
      setShowFeedbackInput(false);
    } catch (e) { console.error(e); }
  };

  const handleAdvanceTime = async (hours) => {
    if (!scenarioId || advancing) return;
    setAdvancing(hours);
    setAgentPhase('PAUSED_FOR_ADVANCE');
    try {
      const res = await fetch(`${API_BASE}/simulation/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId, hours })
      });
      const data = await res.json();
      if (data.status === 'AGENT_REACTIVATED') setAgentPhase('RUNNING');
      else if (data.status === 'COMPLETED') setAgentPhase('COMPLETED');
      else setAgentPhase('AWAITING_RERUN');
    } catch (e) { console.error(e); }
    finally { setAdvancing(null); }
  };

  const handleRunAgent = async () => {
    if (!run?.run_id) return;
    setAgentPhase('RUNNING');
    try { await fetch(`${API_BASE}/agent-runs/${run.run_id}/decide`, { method: 'POST' }); }
    catch (e) { console.error(e); }
  };

  const handleReset = () => {
    setScenarioId(null);
    setVisibleCount(0);
    setAgentPhase('IDLE');
    setAdvancing(null);
    setSyntheticData(null);
    setLaunchError(null);
  };

  const decision = timeline?.decisions?.[timeline.decisions.length - 1];
  const approval = timeline?.approvals?.[timeline.approvals.length - 1];
  const isAwaitingApproval = run?.status === 'AWAITING_APPROVAL';
  const isCompleted = simState?.status === 'COMPLETED';
  const outcome = timeline?.outcomes?.[timeline.outcomes.length - 1];

  const executions = timeline?.executions || [];
  const latestExecution = executions[executions.length - 1];

  let userActionLabel = 'Respond to Agent';
  let userActionSub = 'Simulate the customer response';
  let userActionValue = 'SUCCESS';
  let UserActionIcon = CheckCircle;
  let showUserAction = false;

  if (run?.status === 'CUSTOMER_INTERACTION' && latestExecution) {
    showUserAction = true;
    switch(latestExecution.action) {
      case 'RETRY':
      case 'MANDATE_RETRY':
        userActionLabel = 'Attempt Payment Again';
        userActionSub = 'Customer retries the payment';
        userActionValue = 'SUCCESS';
        UserActionIcon = RotateCw;
        break;
      case 'ALTERNATE_PAYMENT':
        userActionLabel = 'Provide Alternate Payment';
        userActionSub = 'Customer enters new payment details';
        userActionValue = 'SUCCESS';
        UserActionIcon = CreditCard;
        break;
      case 'PAYMENT_LINK':
        userActionLabel = 'Pay via Link';
        userActionSub = 'Customer clicks and pays via the link';
        userActionValue = 'SUCCESS';
        UserActionIcon = CheckCircle;
        break;
      case 'VOICE_CALL':
        userActionLabel = 'Answer Call & Pay';
        userActionSub = 'Customer answers the voice agent and agrees to pay';
        userActionValue = 'SUCCESS';
        UserActionIcon = Phone;
        break;
      case 'REMINDER':
      case 'SEND_REMINDER':
        userActionLabel = 'Acknowledge & Pay';
        userActionSub = 'Customer sees the reminder and pays';
        userActionValue = 'SUCCESS';
        UserActionIcon = CheckCircle;
        break;
      case 'RESUME_CHECKOUT':
        userActionLabel = 'Complete Checkout';
        userActionSub = 'Customer returns and finishes checkout';
        userActionValue = 'SUCCESS';
        UserActionIcon = ShoppingCart;
        break;
      case 'PROMISE_TO_PAY':
        userActionLabel = 'Make Promise to Pay';
        userActionSub = 'Customer promises to pay by next week';
        userActionValue = 'PROMISE_MADE';
        UserActionIcon = Clock;
        break;
      case 'PLAN_CHANGE':
      case 'RETENTION_OFFER':
        userActionLabel = 'Accept Offer';
        userActionSub = 'Customer accepts the retention offer or new plan';
        userActionValue = 'SUCCESS';
        UserActionIcon = CheckCircle;
        break;
      default:
        userActionLabel = 'Respond Positively';
        userActionSub = 'Customer responds to the action';
        userActionValue = 'SUCCESS';
        UserActionIcon = MessageSquare;
        break;
    }
  }

  const getJourneyNodeStatus = (node) => {
    if (!run) return 'pending';
    if (node.isFuture) {
      if (node.key === 'customer_response' && traces.some(t => t.stage === 'OBSERVATION' && t.message !== 'No customer response detected yet.')) return 'completed';
      if (node.key === 'outcome' && outcome) return outcome.status === 'SUCCESS' ? 'completed' : 'failed';
      return 'pending';
    }
    if (node.isAgent) return 'agent';
    if (node.isEvent) return 'current';
    return 'completed';
  };

  return (<>
    <div className="app-layout">
      {/* TOP BAR */}
      <div className="app-topbar">
        <div className="topbar-logo" style={{ cursor: 'pointer' }} onClick={onExit}>
          <Activity size={20} />
          <span>RevenueTwin</span>
        </div>
        <div className="topbar-center">
          <span className="topbar-agent-name">Agent Observatory <ChevronRight size={14} style={{display:'inline', verticalAlign:'middle'}}/> {activeScenarioDef.agentName}</span>
          <span className={`topbar-status ${scenarioId ? 'active' : 'idle'}`}>
            {scenarioId ? (isCompleted ? 'COMPLETED' : '● ACTIVE') : 'IDLE'}
          </span>
        </div>
        <div className="topbar-right">
          <div className="test-mode-badge"><Shield size={12} />Test Mode</div>
          {simState?.virtual_time && (
            <div className="sim-time-badge">
              <Calendar size={12} /> Simulation Time
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {new Date(simState.virtual_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          )}
          <div className="topbar-profile">M</div>
        </div>
      </div>

      <div className="app-body">
        {/* LEFT SIDEBAR (SCENARIOS & AGENTS) */}
        <div className="app-sidebar">
          <div className="sidebar-section-title">REVENUE LOSS FACTORS</div>
          {SCENARIOS.map(s => {
            const Icon = s.icon;
            const isActive = activeScenarioDef.id === s.id;
            const isRunning = isActive && scenarioId;
            return (
              <button key={s.id} className={`sidebar-item ${isActive ? 'active' : ''}`} onClick={() => setActiveScenarioDef(s)}>
                <Icon size={15} />
                <span style={{ flex: 1 }}>{s.name}</span>
                {isRunning && <span className="sidebar-badge">1</span>}
                <span className={`sidebar-dot ${isRunning ? 'active' : 'idle'}`}></span>
              </button>
            );
          })}
          <div className="sidebar-section-title" style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>AUTONOMOUS SPECIALISTS</span>
            <span style={{ fontSize: 9, color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(16,185,129,0.3)' }}>
              10 ONLINE
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto' }}>
            {SCENARIOS.map(s => {
              const AgentIcon = s.icon || Eye;
              return (
                <button
                  key={'agent-' + s.id}
                  className="sidebar-item"
                  style={{ fontSize: 11, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => setSelectedAgentPanel(s)}
                >
                  <AgentIcon size={13} color="#38bdf8" />
                  <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.agentName}
                  </span>
                  <span style={{
                    fontSize: 8, color: '#06b6d4', fontWeight: 800,
                    background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
                    borderRadius: 4, padding: '2px 5px', letterSpacing: '0.04em'
                  }}>
                    AGENT SPECS
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="app-left-area">
          <div className="app-left-content">
            {!scenarioId ? (
              <div className="idle-state" style={{flex:1}}>
                <div className="idle-icon"><activeScenarioDef.icon size={32} /></div>
                <div className="idle-title">{activeScenarioDef.name}</div>
                <div className="idle-desc">{activeScenarioDef.desc}</div>
                {(!syntheticData || activeScenarioDef.id !== 'PAYMENT_FAILED') && (
                  <button type="button" className="btn-start-agent" onClick={handleGenerateSynthetic} disabled={isGenerating}>
                    <User size={14} />{isGenerating ? 'GENERATING...' : 'GENERATE & START'}
                  </button>
                )}
                {syntheticData && !isStarting && activeScenarioDef.id !== 'PAYMENT_FAILED' && (
                  <button className="btn-start-agent" style={{marginTop: 10, background: 'var(--green)'}} onClick={() => handleStartScenario(syntheticData)}>
                    <Play size={14} />START SCENARIO
                  </button>
                )}
                {syntheticData && !isStarting && activeScenarioDef.id === 'PAYMENT_FAILED' && (
                  <button className="btn-start-agent" style={{marginTop: 10, background: 'var(--indigo)'}} onClick={() => launchRazorpayCheckout(false)}>
                    {isCheckingOut ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />} 
                    {isCheckingOut ? " OPENING CHECKOUT..." : " PAY WITH RAZORPAY"}
                  </button>
                )}

                {launchError && <div style={{ color: 'var(--red)', marginTop: 10, fontSize: 12 }}>{launchError}</div>}
              </div>
            ) : (
              <>
                {/* COLUMN 1: JOURNEY TRACK */}
                <div style={{ width: '220px', padding: '24px 16px', borderRight: '1px solid var(--border)' }}>
                  <div className="journey-header">
                    <div className="journey-title">Customer Journey</div>
                  </div>
                  <div className="journey-track">
                    {activeScenarioDef.journey.map((node, idx) => {
                      const Icon = node.icon;
                      const status = getJourneyNodeStatus(node, idx);
                      let iconClass = 'pending';
                      if (status === 'completed') iconClass = 'completed';
                      if (status === 'current') iconClass = 'current';
                      if (status === 'agent') iconClass = 'agent';
                      if (status === 'failed') iconClass = 'current';

                      return (
                        <React.Fragment key={node.key}>
                          <div className="journey-node animate-fade-in" style={{ animationDelay: `${idx * 0.06}s` }}>
                            <div className={`journey-node-icon ${iconClass}`}><Icon size={18} /></div>
                            <div className="journey-node-label">{node.label}</div>
                          </div>
                          {idx < activeScenarioDef.journey.length - 1 && (
                            <div className={`journey-connector ${status === 'completed' || status === 'current' || status === 'agent' ? 'done' : ''}`}></div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 2: AGENT CONSOLE */}
                <div className="console-wrap">
                  <div className="console-header">
                    <div className="console-title">Agent Console</div>
                    <div className="console-filters">
                      <span className="console-filter active"><div className="console-filter-dot" style={{background: '#818cf8'}}></div>All</span>
                      <span className="console-filter"><div className="console-filter-dot" style={{background: '#c4b5fd'}}></div>User</span>
                      <span className="console-filter"><div className="console-filter-dot" style={{background: '#6ee7b7'}}></div>Agent</span>
                      <span className="console-filter"><div className="console-filter-dot" style={{background: '#d1d5db'}}></div>System</span>
                    </div>
                  </div>
                  <div className="console-body" ref={consoleRef}>
                    {flatEntries.slice(0, visibleCount).map(entry => (
                      <div className="console-entry animate-fade-in" key={entry.key}>
                        <span className="console-time">{entry.timeStr}</span>
                        <span className={`console-tag ${entry.tagClass}`} style={entry.tagStyle}>{entry.tagLabel}</span>
                        <span className="console-msg">{entry.msgNode}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMN 3: RIGHT PANEL */}
                <div className="actions-panel">
                  <div className="actions-tabs">
                    <button className={`action-tab ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>
                      <User size={14} /> User Action
                    </button>
                    <button className={`action-tab ${activeTab === 'merchant' ? 'active' : ''}`} onClick={() => setActiveTab('merchant')}>
                      <Activity size={14} /> Merchant Action
                    </button>
                  </div>
                  
                  <div className="actions-body">
                    {activeTab === 'merchant' ? (
                      <div>
                        <div style={{fontSize: 13, fontWeight: 700, marginBottom: 16}}>Merchant Controls</div>
                        {isAwaitingApproval ? (
                          <>
                            <button className="merchant-action-btn approve" onClick={() => handleApprove(true)}>
                              <div className="merchant-action-icon"><Check size={16} /></div>
                              <div style={{flex: 1}}>
                                <div className="sim-action-text">Approve Action</div>
                                <div className="sim-action-sub">Approve the recommended action</div>
                              </div>
                            </button>
                            <button className="merchant-action-btn reject" onClick={() => handleApprove(false)}>
                              <div className="merchant-action-icon"><X size={16} /></div>
                              <div style={{flex: 1}}>
                                <div className="sim-action-text">Reject Action</div>
                                <div className="sim-action-sub">Reject the recommended action</div>
                              </div>
                            </button>
                          </>
                        ) : (
                          <div style={{fontSize: 12, color: 'var(--text-muted)', marginBottom: 20}}>
                            No agent actions are currently awaiting approval.
                          </div>
                        )}
                        <button className="merchant-action-btn pause" onClick={() => handleAdvanceTime(0)}>
                          <div className="merchant-action-icon"><Pause size={16} /></div>
                          <div style={{flex: 1}}>
                            <div className="sim-action-text">Pause Scenario</div>
                            <div className="sim-action-sub">Pause the current scenario</div>
                          </div>
                        </button>
                        <button className="merchant-action-btn cancel" onClick={handleReset}>
                          <div className="merchant-action-icon"><XCircle size={16} /></div>
                          <div style={{flex: 1}}>
                            <div className="sim-action-text">Cancel Scenario</div>
                            <div className="sim-action-sub">Cancel the scenario</div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{fontSize: 13, fontWeight: 700, marginBottom: 16}}>Simulate Customer Response</div>
                        {showUserAction ? (
                          <>
                            <button className="sim-action-btn" onClick={() => {
                                const latestExecution = timeline?.executions?.[timeline?.executions?.length - 1];
                                const action = latestExecution?.action;

                                // Actions that require Razorpay payment before resolving SUCCESS
                                const PAYMENT_ACTIONS = ['RETRY', 'MANDATE_RETRY', 'PAYMENT_LINK', 'REMINDER', 'SEND_REMINDER', 'RESUME_CHECKOUT'];

                                if (action === 'ALTERNATE_PAYMENT') {
                                    // Show payment method picker → then Razorpay
                                    setShowPaymentModal(true);
                                } else if (PAYMENT_ACTIONS.includes(action)) {
                                    // Go through Razorpay; success handler calls handleResolve('SUCCESS')
                                    launchRazorpayCheckout(true);
                                } else {
                                    // Non-payment actions: VOICE_CALL, PROMISE_TO_PAY, PLAN_CHANGE,
                                    // RETENTION_OFFER, ASSIST, etc. — resolve directly
                                    handleResolve(userActionValue);
                                }
                            }}>
                              <div className="sim-action-icon">{isCheckingOut ? <Loader2 size={18} className="animate-spin" /> : <UserActionIcon size={18} />}</div>
                              <div style={{flex: 1}}>
                                <div className="sim-action-text">{isCheckingOut ? "OPENING SECURE CHECKOUT..." : userActionLabel}</div>
                                <div className="sim-action-sub">{isCheckingOut ? "Loading Razorpay test widget" : userActionSub}</div>
                              </div>
                              {/* Badge showing whether this action involves Razorpay */}
                              {(() => {
                                const action = latestExecution?.action;
                                const needsPay = ['RETRY','MANDATE_RETRY','PAYMENT_LINK','REMINDER','SEND_REMINDER','RESUME_CHECKOUT','ALTERNATE_PAYMENT'].includes(action);
                                return needsPay ? (
                                  <div style={{
                                    fontSize: 8, fontWeight: 800, letterSpacing: '0.07em',
                                    color: '#818cf8', background: 'rgba(99,102,241,0.15)',
                                    border: '1px solid rgba(99,102,241,0.3)',
                                    borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap'
                                  }}>RAZORPAY</div>
                                ) : null;
                              })()}
                            </button>

                            {/* FORCE SUCCESS */}
                            <button
                              className="sim-action-btn"
                              onClick={() => handleResolve('SUCCESS')}
                              style={{
                                border: '1px solid rgba(16,185,129,0.45)',
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.1))',
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                            >
                              <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.06), transparent)',
                                animation: 'shimmer 2.5s infinite',
                                pointerEvents: 'none'
                              }} />
                              <div className="sim-action-icon" style={{ background: 'rgba(16,185,129,0.25)', color: '#10b981' }}>
                                <CheckCircle size={18} />
                              </div>
                              <div style={{flex: 1}}>
                                <div className="sim-action-text" style={{ color: '#10b981' }}>⚡ Simulate SUCCESS</div>
                                <div className="sim-action-sub">Force a successful outcome for any agent action</div>
                              </div>
                              <div style={{
                                fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
                                color: '#10b981', background: 'rgba(16,185,129,0.15)',
                                border: '1px solid rgba(16,185,129,0.3)',
                                borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap'
                              }}>INSTANT</div>
                            </button>

                            <button className="sim-action-btn" onClick={() => setShowFeedbackInput(true)}>
                              <div className="sim-action-icon"><HandMetal size={18} /></div>
                              <div style={{flex: 1}}>
                                <div className="sim-action-text">Provide Feedback</div>
                                <div className="sim-action-sub">Customer sends a custom message or question</div>
                              </div>
                            </button>
                            {showFeedbackInput && (
                               <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12 }}>
                                 <textarea 
                                   value={feedbackText}
                                   onChange={(e) => setFeedbackText(e.target.value)}
                                   placeholder="e.g. 'I don't have a card but I have UPI'"
                                   style={{ width: '100%', height: 60, padding: 8, border: '1px solid var(--border)', borderRadius: 4, marginBottom: 8 }}
                                 />
                                 <div style={{display: 'flex', gap: 8}}>
                                   <button onClick={() => setShowFeedbackInput(false)} style={{flex:1, padding: '6px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent'}}>Cancel</button>
                                   <button onClick={handleNegotiate} style={{flex:2, padding: '6px', borderRadius: 4, background: 'var(--indigo)', color: '#fff', border: 'none'}}>Send</button>
                                 </div>
                               </div>
                            )}
                            <button className="sim-action-btn" onClick={() => handleResolve('FAILED_TIMEOUT')}>
                              <div className="sim-action-icon"><Clock size={18} /></div>
                              <div style={{flex: 1}}>
                                <div className="sim-action-text">Ignore / No Response</div>
                                <div className="sim-action-sub">Customer does not respond</div>
                              </div>
                            </button>
                          </>
                        ) : isCompleted ? (
                          <div style={{fontSize: 12, color: 'var(--text-muted)'}}>
                            <div style={{marginBottom: 12, color: 'var(--text-secondary)'}}>
                              This scenario has concluded. If the agent took NO_ACTION, no customer interaction was required.
                            </div>
                            <button className="sim-action-btn" onClick={handleReset} style={{justifyContent: 'center', background: 'rgba(255,255,255,0.03)'}}>
                              Start New Scenario
                            </button>
                          </div>
                        ) : (
                          <div style={{fontSize: 12, color: 'var(--text-muted)'}}>
                            Waiting for the agent to execute an action before the customer can respond.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* DOCK */}
          <div className="app-dock">
            <button className="btn-dock" disabled><Pause size={13} />Pause</button>
            <button className="btn-dock" disabled={!scenarioId || !!advancing} onClick={() => handleAdvanceTime(1)}>
              <Clock size={13} />+1 Hour
            </button>
            <button className="btn-dock" disabled={!scenarioId || !!advancing} onClick={() => handleAdvanceTime(6)}>
              <Clock size={13} />+6 Hours
            </button>
            <button className="btn-dock primary" disabled={!scenarioId || !!advancing} onClick={() => handleAdvanceTime(24)}>
              <Clock size={13} />+24 Hours
            </button>
            <button className="btn-dock" disabled={!scenarioId} onClick={() => handleAdvanceTime(168)}>
              <Calendar size={13} />+7 Days
            </button>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Scenario Progress 
              <div style={{ width: 120, height: 4, background: 'var(--border)', borderRadius: 2, display: 'inline-block', marginLeft: 12, verticalAlign: 'middle' }}>
                <div style={{ width: '54%', height: '100%', background: 'var(--indigo)', borderRadius: 2 }}></div>
              </div>
              <span style={{marginLeft: 8}}>54%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    {selectedAgentPanel && (
      <AgentDetailPanel agent={selectedAgentPanel} onClose={() => setSelectedAgentPanel(null)} />
    )}
    {showPaymentModal && (
      <PaymentMethodModal
        onClose={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); setPaymentProcessing(false); }}
        onConfirm={async (method) => {
          setSelectedPaymentMethod(method);
          setPaymentProcessing(true);
          setShowPaymentModal(false);
          await launchRazorpayCheckout(true);
          setPaymentProcessing(false);
          setSelectedPaymentMethod(null);
        }}
      />
    )}
  </>);
}
