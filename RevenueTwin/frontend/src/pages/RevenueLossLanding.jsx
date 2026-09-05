import React, { useState } from 'react';
import { 
  Activity, ArrowRight, Zap, Shield, Brain, Sparkles, 
  ChevronRight, RefreshCw, Layers, BarChart2, CheckCircle2, 
  Cpu, Radio, Eye, Check, X
} from 'lucide-react';
import { SCENARIOS } from '../config/agents';
import AgentDetailPanel from '../components/AgentDetailPanel';

export default function RevenueLossLanding({ onSelectScenario }) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedAgentForModal, setSelectedAgentForModal] = useState(null);
  const [selectedArchStep, setSelectedArchStep] = useState(0);

  const categories = [
    { id: 'ALL', label: 'All Specialists (10)' },
    { id: 'PAYMENT', label: 'Payment Failures' },
    { id: 'CHECKOUT', label: 'Cart & Checkout' },
    { id: 'SUBSCRIPTION', label: 'Subscriptions' },
    { id: 'ENTERPRISE', label: 'B2B & Voice' },
  ];

  const getCategoryForScenario = (id) => {
    if (['PAYMENT_FAILED', 'PAYMENT_DEGRADATION'].includes(id)) return 'PAYMENT';
    if (['CART_ABANDONMENT', 'CHECKOUT_DROPOFF'].includes(id)) return 'CHECKOUT';
    if (['SUBSCRIPTION_PAYMENT_FAILURE', 'SUBSCRIPTION_CHURN'].includes(id)) return 'SUBSCRIPTION';
    return 'ENTERPRISE';
  };

  const filteredScenarios = activeCategory === 'ALL' 
    ? SCENARIOS 
    : SCENARIOS.filter(s => getCategoryForScenario(s.id) === activeCategory);

  const flagshipScenario = SCENARIOS.find(s => s.id === 'PAYMENT_FAILED');

  const ARCH_STEPS = [
    {
      step: '01', title: 'Real-Time Signal Ingestion',
      tag: 'WEBHOOK', icon: Activity, color: '#fb7185',
      summary: 'Payment gateways dispatch decline codes, issuer metadata, and transaction error signatures instantly.',
      detail: 'Captures soft declines (insufficient funds, temporary bank timeouts) vs hard declines (fraud blocks, expired cards) without delay.'
    },
    {
      step: '02', title: 'Context & History Gathering',
      tag: 'INTELLIGENCE', icon: Layers, color: '#38bdf8',
      summary: 'Synthesizes customer 12-month payment history, card BIN reliability, and active contact fatigue scores.',
      detail: 'Guarantees the agent never spams customers or retries payments on permanently dead cards.'
    },
    {
      step: '03', title: 'OpenRouter LLM Structured Reasoning',
      tag: 'NEMOTRON-3.5', icon: Brain, color: '#06b6d4',
      summary: 'Multi-factor reasoning engine weighs failure severity and selects the optimal recovery action with confidence scoring.',
      detail: 'Produces structured JSON schema decisions with clear rationale and contingency plans rather than following rigid static scripts.'
    },
    {
      step: '04', title: 'Deterministic Guardrails & Policies',
      tag: '100% SAFEGUARD', icon: Shield, color: '#fbbf24',
      summary: 'Strict business rules enforce maximum retry attempts, minimum confidence thresholds, and merchant approval boundaries.',
      detail: 'Safety rules always supersede LLM output. If an action violates merchant policy, the agent automatically pivots to a compliant alternative.'
    },
    {
      step: '05', title: 'Live Multi-Rail Tool Execution',
      tag: 'RAZORPAY API', icon: Zap, color: '#10b981',
      summary: 'Executes actions via live Razorpay API: Smart Retries, Alternate Payment Rails, and official Payment Shortlinks.',
      detail: 'Generates authenticated payment links (https://rzp.io/rzp/...) delivered via SMS/WhatsApp with real-time payment tracking.'
    },
    {
      step: '06', title: 'Closed-Loop Reactivation & Memory',
      tag: 'ADAPTIVE LOOP', icon: RefreshCw, color: '#818cf8',
      summary: 'Continuously monitors customer response. If an attempt fails, the agent reactivates to orchestrate next escalation tier.',
      detail: 'Records all recovery outcomes into persistent memory vectors to refine routing probabilities for future transactions.'
    },
  ];

  return (
    <div className="app-layout" style={{ background: '#030712', color: '#f8fafc', overflowY: 'auto' }}>
      {/* Topbar */}
      <div style={{
        height: 60,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(3,7,18,0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 20,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(6,182,212,0.4)'
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>RevenueTwin</span>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
                letterSpacing: '0.05em'
              }}>v2.4 ENTERPRISE CORE</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Live System Status Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            fontSize: 11, fontWeight: 700, color: '#10b981'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            10 SPECIALISTS ACTIVE
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
            fontSize: 11, fontWeight: 700, color: '#818cf8'
          }}>
            <Zap size={11} color="#818cf8" />
            RAZORPAY API LIVE
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)',
            fontSize: 11, fontWeight: 700, color: '#38bdf8'
          }}>
            <Brain size={11} color="#38bdf8" />
            OPENROUTER LLM READY
          </div>

          <button
            onClick={() => setSelectedAgentForModal(flagshipScenario)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)',
              color: '#06b6d4', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '0.04em', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,182,212,0.12)'}
          >
            <BarChart2 size={13} />
            AGENT MATRIX
          </button>
        </div>
      </div>

      {/* Main Landing Content */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '48px 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 52,
      }}>

        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          position: 'relative',
        }}>
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
            width: 580, height: 280,
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(6,182,212,0.12) 50%, transparent 80%)',
            pointerEvents: 'none', zIndex: 0, filter: 'blur(50px)',
          }} />

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 24,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
            fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em',
            boxShadow: '0 0 24px rgba(56,189,248,0.12)',
            position: 'relative', zIndex: 1
          }}>
            <Sparkles size={13} color="#38bdf8" />
            AUTONOMOUS MULTI-AGENT REVENUE RECOVERY
          </div>

          <h1 style={{
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            margin: 0,
            maxWidth: 920,
            background: 'linear-gradient(135deg, #ffffff 10%, #e2e8f0 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            position: 'relative', zIndex: 1
          }}>
            Self-Governing AI Specialists That Turn Lost Revenue Into Cashflow
          </h1>

          <p style={{
            fontSize: 16,
            color: '#94a3b8',
            maxWidth: 720,
            lineHeight: 1.6,
            margin: 0,
            position: 'relative', zIndex: 1
          }}>
            Detect revenue loss events in real time. Dynamic LLM reasoning evaluates customer signals, enforces merchant policies, and executes omnichannel recovery actions autonomously with zero hardcoded sequences.
          </p>

          {/* Hero CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => onSelectScenario(flagshipScenario)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 28px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 24px rgba(6,182,212,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(6,182,212,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(6,182,212,0.4)'; }}
            >
              Launch Live Agentic Loop
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => setSelectedAgentForModal(flagshipScenario)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#f8fafc', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            >
              <BarChart2 size={16} color="#06b6d4" />
              Inspect Agent Capability Matrix
            </button>
          </div>

          {/* Architecture Proof Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 12, position: 'relative', zIndex: 1 }}>
            {[
              { text: '10 Autonomous Specialists', icon: Cpu, color: '#38bdf8' },
              { text: 'Sub-Second Latency (<1.2s)', icon: Zap, color: '#10b981' },
              { text: '100% Policy Guardrails', icon: Shield, color: '#fbbf24' },
              { text: 'Official Razorpay SDK Integration', icon: CheckCircle2, color: '#06b6d4' },
            ].map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 11, fontWeight: 700, color: '#94a3b8'
                }}>
                  <Icon size={12} color={badge.color} />
                  <span>{badge.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flagship Spotlight: Payment Recovery Agent (Live Agentic Loop) */}
        {flagshipScenario && (
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(8,13,26,0.95) 100%)',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: 22,
            padding: '36px 40px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 35px rgba(6,182,212,0.14)',
          }}>
            {/* Ambient Corner Glow */}
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 240, height: 240,
              background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 6,
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff',
                    letterSpacing: '0.08em', boxShadow: '0 0 14px rgba(6,182,212,0.5)'
                  }}>
                    FLAGSHIP LIVE DEMO
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>·</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                    Full 3-Tier Dynamic Agentic Loop
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Interactive Simulation Ready</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 36, alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, marginBottom: 12, letterSpacing: '-0.02em' }}>
                    Payment Failure Autonomous Recovery
                  </h2>
                  <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.65, margin: 0, marginBottom: 20 }}>
                    Experience the complete closed-loop agent: Evaluates bank decline signals, autonomously formulates Smart Retries, dynamically pivots to Alternate Payment Rails, and dispatches real Razorpay Payment Links with zero hardcoded steps.
                  </p>

                  {/* Highlights */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {[
                      { label: 'Real Razorpay API Tool', color: '#06b6d4' },
                      { label: 'OpenRouter LLM Inference', color: '#818cf8' },
                      { label: 'Dynamic Multi-Step Loop', color: '#10b981' },
                      { label: 'Merchant Policy Guardrails', color: '#fbbf24' },
                      { label: 'Continuous Agent Memory', color: '#a78bfa' },
                    ].map((pill, i) => (
                      <span key={i} style={{
                        fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6,
                        background: `${pill.color}15`, border: `1px solid ${pill.color}35`,
                        color: pill.color
                      }}>
                        ✓ {pill.label}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      onClick={() => onSelectScenario(flagshipScenario)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        padding: '14px 28px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
                        color: '#fff', fontSize: 14, fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 24px rgba(6,182,212,0.4)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(6,182,212,0.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(6,182,212,0.4)'; }}
                    >
                      Launch Live Agentic Loop
                      <ArrowRight size={16} />
                    </button>

                    <button
                      onClick={() => setSelectedAgentForModal(flagshipScenario)}
                      style={{
                        padding: '13px 20px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#38bdf8', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <BarChart2 size={15} />
                      Capability Matrix
                    </button>
                  </div>
                </div>

                {/* Mini Architecture Flow Visual */}
                <div style={{
                  background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>
                    AUTONOMOUS RECOVERY PATHWAY
                  </div>

                  {[
                    { step: '1', name: 'Smart Retry', desc: 'Auto-scheduled based on soft decline history', color: '#06b6d4', icon: RefreshCw },
                    { step: '2', name: 'Alternate Rails', desc: 'Dynamic escalation to UPI / Wallets / NetBanking', color: '#818cf8', icon: Layers },
                    { step: '3', name: 'Razorpay Payment Link', desc: 'Autonomous shortlink generation & omnichannel SMS/WhatsApp delivery', color: '#10b981', icon: Zap },
                  ].map((st, i) => {
                    const Icon = st.icon;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${st.color}18`, border: `1px solid ${st.color}45`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: st.color, flexShrink: 0
                        }}>
                          <Icon size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{st.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{st.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Architecture Flow Visualizer (Mind Blown Section) */}
        <div style={{
          background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22, padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em', marginBottom: 4 }}>
                AUTONOMOUS SYSTEM ARCHITECTURE
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>
                How RevenueTwin Turns Payment Failures into Cashflow
              </h2>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Click any step to inspect technical telemetry
            </div>
          </div>

          {/* Interactive Steps Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12
          }}>
            {ARCH_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = selectedArchStep === idx;
              return (
                <div
                  key={step.step}
                  onClick={() => setSelectedArchStep(idx)}
                  style={{
                    padding: '16px 14px', borderRadius: 12, cursor: 'pointer',
                    background: isSelected ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1.5px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 20px rgba(6,182,212,0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: `${step.color}15`, border: `1px solid ${step.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: step.color
                    }}>
                      <Icon size={14} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: isSelected ? '#06b6d4' : '#64748b' }}>
                      {step.step}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 800, color: isSelected ? '#fff' : '#cbd5e1', lineHeight: 1.3 }}>
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Inspector for Selected Architecture Step */}
          {ARCH_STEPS[selectedArchStep] && (
            <div style={{
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(6,182,212,0.25)',
              borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 20
            }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                    background: `${ARCH_STEPS[selectedArchStep].color}18`, color: ARCH_STEPS[selectedArchStep].color,
                    border: `1px solid ${ARCH_STEPS[selectedArchStep].color}40`, letterSpacing: '0.06em'
                  }}>
                    {ARCH_STEPS[selectedArchStep].tag}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {ARCH_STEPS[selectedArchStep].title}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 4 }}>
                  {ARCH_STEPS[selectedArchStep].summary}
                </div>
                <div style={{ fontSize: 12, color: '#38bdf8', lineHeight: 1.4 }}>
                  → {ARCH_STEPS[selectedArchStep].detail}
                </div>
              </div>

              <button
                onClick={() => setSelectedAgentForModal(flagshipScenario)}
                style={{
                  padding: '10px 18px', borderRadius: 8,
                  background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)',
                  color: '#06b6d4', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                Inspect in Capability Matrix <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Category Filters Header & Scenario Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
                Explore All 10 Revenue Loss Specialists
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Select a specialist to observe its intelligence gathering, decision reasoning, and execution tools.
              </p>
            </div>

            {/* Filter Tabs */}
            <div style={{
              display: 'flex', gap: 6, padding: 4, borderRadius: 10,
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)'
            }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 8,
                    background: activeCategory === cat.id ? 'rgba(99,102,241,0.25)' : 'transparent',
                    color: activeCategory === cat.id ? '#c7d2fe' : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: activeCategory === cat.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 22,
          }}>
            {filteredScenarios.map(scenario => {
              const Icon = scenario.icon;
              const isFlagship = scenario.id === 'PAYMENT_FAILED';
              return (
                <div
                  key={scenario.id}
                  style={{
                    background: isFlagship ? 'rgba(6,182,212,0.05)' : 'rgba(15,23,42,0.6)',
                    border: isFlagship ? '1px solid rgba(6,182,212,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 18,
                    padding: '26px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = isFlagship ? '#06b6d4' : '#818cf8';
                    e.currentTarget.style.boxShadow = isFlagship 
                      ? '0 12px 30px rgba(6,182,212,0.2)' 
                      : '0 12px 30px rgba(99,102,241,0.18)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isFlagship ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isFlagship ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.12)',
                      border: isFlagship ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(99,102,241,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isFlagship ? '#06b6d4' : '#818cf8',
                    }}>
                      <Icon size={20} />
                    </div>

                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                      background: isFlagship ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isFlagship ? '#06b6d4' : '#64748b',
                      border: isFlagship ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      letterSpacing: '0.06em'
                    }}>
                      {isFlagship ? 'CLOSED-LOOP' : 'AUTONOMOUS'}
                    </span>
                  </div>

                  <div style={{ fontSize: 17, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>
                    {scenario.name}
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', marginBottom: 10 }}>
                    {scenario.agentName}
                  </div>

                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, flex: 1, marginBottom: 20 }}>
                    {scenario.desc}
                  </div>

                  {/* Actions Row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', gap: 8
                  }}>
                    <button
                      onClick={() => setSelectedAgentForModal(scenario)}
                      style={{
                        background: 'transparent', border: 'none',
                        color: '#64748b', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                    >
                      <Eye size={13} />
                      Inspect Matrix
                    </button>

                    <button
                      onClick={() => onSelectScenario(scenario)}
                      style={{
                        background: isFlagship ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.15)',
                        border: isFlagship ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(99,102,241,0.35)',
                        borderRadius: 8, padding: '6px 12px',
                        color: isFlagship ? '#06b6d4' : '#818cf8',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      Launch <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architectural Comparison: Autonomous Agents vs Legacy Rules */}
        <div style={{
          background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22, padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 20
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em', marginBottom: 4 }}>
              TECHNICAL COMPARISON
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>
              Why Autonomous Agents Win Over Traditional Rule Engines
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, width: '25%' }}>CAPABILITY</th>
                  <th style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 800, width: '37%' }}>TRADITIONAL STATIC RULES</th>
                  <th style={{ padding: '12px 16px', color: '#06b6d4', fontWeight: 800, width: '38%' }}>REVENUETWIN AUTONOMOUS AGENT</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    cap: 'Decision Logic',
                    legacy: 'Rigid if/else code trees; breaks on unexpected issuer error codes or multi-factor signals.',
                    agent: 'Structured LLM reasoning with confidence calibration and graceful deterministic fallbacks.'
                  },
                  {
                    cap: 'Recovery Execution',
                    legacy: 'One-and-done single attempt; stops immediately if retry is rejected by bank.',
                    agent: 'Dynamic 3-tier closed-loop escalation: Smart Retries → Alternate Rails → Razorpay Payment Links.'
                  },
                  {
                    cap: 'Customer Experience',
                    legacy: 'Spams customer repeatedly on card failures; triggers customer irritation and bank card blocks.',
                    agent: 'Deterministic 7-day contact fatigue guardrails strictly cap frequency and select quiet channels.'
                  },
                  {
                    cap: 'Payment Tool Integration',
                    legacy: 'Requires merchant to manually generate payment links in merchant dashboard.',
                    agent: 'Automated Razorpay SDK tool dispatches genuine shortlinks (https://rzp.io/rzp/...) in seconds.'
                  },
                  {
                    cap: 'Continuous Memory',
                    legacy: 'No memory of previous attempt outcomes across sessions; stateless execution.',
                    agent: 'Maintains long-term customer interaction vectors to continuously optimize future recovery probability.'
                  },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f1f5f9' }}>{row.cap}</td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', lineHeight: 1.5 }}>
                      <span style={{ color: '#ef4444', marginRight: 6 }}>✕</span>
                      {row.legacy}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#e2e8f0', lineHeight: 1.5, background: 'rgba(6,182,212,0.03)' }}>
                      <span style={{ color: '#06b6d4', marginRight: 6 }}>✓</span>
                      {row.agent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real System Architecture Strip (Honest & Transparent) */}
        <div style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18,
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
        }}>
          {[
            { title: 'Zero Hardcoded Rules', desc: 'Dynamic agent loops reason over signals in real time rather than following static trees.', icon: Brain, color: '#818cf8' },
            { title: 'Live Razorpay API Tools', desc: 'Seamlessly creates test orders and generates live payment shortlinks via official SDK.', icon: Zap, color: '#06b6d4' },
            { title: 'Deterministic Guardrails', desc: 'Self-calibrated policies guarantee limits, contact fatigue scores, and merchant approvals.', icon: Shield, color: '#10b981' },
            { title: 'Agent Memory & Learning', desc: 'Records past attempt outcomes to refine future routing and prevent repetitive customer contact.', icon: RefreshCw, color: '#f59e0b' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{ display: 'flex', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${item.color}15`, border: `1px solid ${item.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.color, flexShrink: 0
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Global Capability Matrix Modal */}
      {selectedAgentForModal && (
        <AgentDetailPanel
          agent={selectedAgentForModal}
          onClose={() => setSelectedAgentForModal(null)}
        />
      )}
    </div>
  );
}
