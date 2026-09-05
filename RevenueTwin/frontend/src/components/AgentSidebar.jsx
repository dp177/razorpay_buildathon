import React, { useState, useEffect } from "react";
import {
  CreditCard, TrendingDown, ShoppingCart, LogIn, RefreshCcw,
  Clock, Zap, Brain, Activity, Target,
  Cpu, Network, Search, Filter, ChevronRight,
  Play, Radio, Wifi, Database, Lock, MessageSquare,
  BarChart2, Eye
} from "lucide-react";
import { SCENARIOS } from "../config/agents";

const AGENT_DEFS = [
  {
    id: "PAYMENT_FAILED",
    agentName: "Payment Recovery Agent",
    segment: "PAYMENT",
    segmentColor: "#6366f1",
    segmentGlow: "rgba(99,102,241,0.18)",
    icon: CreditCard,
    objective: "Recover failed payments by identifying root cause and selecting the best retry or alternate path.",
    tools: ["Payment History Scanner", "Failure Classifier", "Alternate Route Engine", "Retry Optimizer"],
    toolIcons: [Database, Search, Network, RefreshCcw],
    capabilities: ["Soft Decline Detection", "Hard Decline Routing", "UPI Fallback", "Link Generation"],
    signals: ["Decline Code", "Success Rate", "Retry Window", "Fatigue Score"],
    decisionSpeed: "1.2s", accuracy: "94%", recoveryRate: "68%",
  },
  {
    id: "PAYMENT_DEGRADATION",
    agentName: "Payment Degradation Agent",
    segment: "PAYMENT",
    segmentColor: "#f59e0b",
    segmentGlow: "rgba(245,158,11,0.18)",
    icon: TrendingDown,
    objective: "Detect and respond to declining payment success rates before they become critical.",
    tools: ["Trend Analyzer", "Gateway Router", "Anomaly Detector", "Impact Scorer"],
    toolIcons: [BarChart2, Network, Search, Target],
    capabilities: ["30-day Trend Analysis", "PSP Comparison", "Routing Optimization", "Alerting"],
    signals: ["Success Rate", "Gateway Health", "Error Burst", "Revenue Impact"],
    decisionSpeed: "0.9s", accuracy: "91%", recoveryRate: "72%",
  },
  {
    id: "CART_ABANDONMENT",
    agentName: "Cart Recovery Agent",
    segment: "CART",
    segmentColor: "#10b981",
    segmentGlow: "rgba(16,185,129,0.18)",
    icon: ShoppingCart,
    objective: "Recover abandoned shopping sessions while avoiding unnecessary customer contact.",
    tools: ["Session Analyzer", "Intent Scorer", "Reminder Engine", "Fatigue Guard"],
    toolIcons: [Eye, Brain, MessageSquare, Lock],
    capabilities: ["Behavioral Scoring", "Cart Value Analysis", "Optimal Timing", "Suppression Logic"],
    signals: ["Purchase Intent", "Cart Value", "Session Depth", "Fatigue Index"],
    decisionSpeed: "0.7s", accuracy: "89%", recoveryRate: "41%",
  },
  {
    id: "CHECKOUT_DROPOFF",
    agentName: "Checkout Agent",
    segment: "CHECKOUT",
    segmentColor: "#3b82f6",
    segmentGlow: "rgba(59,130,246,0.18)",
    icon: LogIn,
    objective: "Re-engage customers who dropped off during checkout at specific friction points.",
    tools: ["Friction Detector", "Stage Classifier", "Payment Suggester", "Resume Engine"],
    toolIcons: [Search, Filter, CreditCard, Play],
    capabilities: ["Stage Mapping", "Friction Point ID", "Alternate Payment", "Session Resume"],
    signals: ["Drop-off Stage", "Time on Page", "Error Codes", "Device Type"],
    decisionSpeed: "0.8s", accuracy: "92%", recoveryRate: "55%",
  },
  {
    id: "SUBSCRIPTION_PAYMENT_FAILURE",
    agentName: "Subscription Recovery Agent",
    segment: "SUBSCRIPTION",
    segmentColor: "#8b5cf6",
    segmentGlow: "rgba(139,92,246,0.18)",
    icon: RefreshCcw,
    objective: "Recover failed subscription payments while preserving long-term customer retention.",
    tools: ["Tenure Analyzer", "Engagement Tracker", "Plan Optimizer", "Dunning Engine"],
    toolIcons: [Clock, Activity, Target, Zap],
    capabilities: ["Churn Risk Scoring", "Grace Period Logic", "Plan Downgrade", "Smart Retry Timing"],
    signals: ["Tenure Score", "Engagement Level", "LTV Score", "Failure Reason"],
    decisionSpeed: "1.4s", accuracy: "96%", recoveryRate: "79%",
  },
];

function PulsingDot({ color, active }) {
  return React.createElement("span", {
    style: { position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }
  },
    active && React.createElement("span", {
      style: {
        position: "absolute", inset: 0, borderRadius: "50%", background: color,
        animation: "agentPing 1.5s ease-in-out infinite", opacity: 0.5,
      }
    }),
    React.createElement("span", {
      style: {
        position: "relative", width: 8, height: 8, borderRadius: "50%",
        background: active ? color : "#cbd5e1",
      }
    })
  );
}

function StatPill({ label, value, color }) {
  return React.createElement("div", {
    style: {
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "5px 8px", borderRadius: 8,
      background: color + "14", border: "1px solid " + color + "28",
      flex: 1,
    }
  },
    React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color, lineHeight: 1.1 } }, value),
    React.createElement("span", { style: { fontSize: 8.5, color: "#94a3b8", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" } }, label)
  );
}

export default function AgentSidebar({ activeScenarioDef, setActiveScenarioDef, scenarioId }) {
  const [expandedId, setExpandedId] = useState(activeScenarioDef?.id);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (activeScenarioDef?.id) setExpandedId(activeScenarioDef.id);
  }, [activeScenarioDef?.id]);

  const handleSelect = (agentDef) => {
    const scenarioDef = SCENARIOS.find(s => s.id === agentDef.id);
    if (scenarioDef) setActiveScenarioDef(scenarioDef);
    setExpandedId(expandedId === agentDef.id ? null : agentDef.id);
  };

  return (
    <div style={{
      width: 272, borderRight: "1px solid #e2e8f0", background: "#fff",
      display: "flex", flexDirection: "column", flexShrink: 0,
      overflowY: "auto", overflowX: "hidden",
    }}>
      <div style={{
        padding: "13px 14px 10px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(99,102,241,0.5)",
          }}>
            <Cpu size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#f8fafc", letterSpacing: "0.07em" }}>REVENUE AGENTS</div>
            <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.04em" }}>Autonomous Recovery Suite</div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 9px",
          background: "rgba(255,255,255,0.04)", borderRadius: 7,
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <PulsingDot color="#10b981" active={true} />
          <span style={{ fontSize: 9.5, color: "#64748b", fontFamily: "JetBrains Mono, monospace" }}>
            {AGENT_DEFS.length} agents active
          </span>
        </div>
      </div>

      <div style={{ padding: "10px 8px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        {AGENT_DEFS.map((agent) => {
          const Icon = agent.icon;
          const isExpanded = expandedId === agent.id;
          const isSelected = activeScenarioDef?.id === agent.id;
          const isRunning = scenarioId && isSelected;

          return (
            <div key={agent.id} style={{
              borderRadius: 12, overflow: "hidden",
              border: isSelected ? ("1.5px solid " + agent.segmentColor) : "1.5px solid #e8edf3",
              background: isSelected ? "#fff" : "#fafbfc",
              boxShadow: isSelected
                ? ("0 0 0 3px " + agent.segmentGlow + ", 0 4px 20px " + agent.segmentGlow)
                : "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.25s ease",
            }}>
              <button onClick={() => handleSelect(agent)} style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: 9, padding: "10px 11px",
                background: "transparent", border: "none", cursor: "pointer",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: isSelected
                    ? ("linear-gradient(135deg, " + agent.segmentColor + "ee, " + agent.segmentColor + "aa)")
                    : "#f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isSelected ? ("0 3px 10px " + agent.segmentGlow) : "none",
                  transition: "all 0.25s",
                }}>
                  <Icon size={16} color={isSelected ? "#fff" : "#94a3b8"} />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{
                    fontSize: 11.5, fontWeight: 700, lineHeight: 1.2, marginBottom: 4,
                    color: isSelected ? agent.segmentColor : "#1e293b",
                  }}>
                    {agent.agentName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      fontSize: 8.5, padding: "1px 6px", borderRadius: 4,
                      background: agent.segmentColor + "18",
                      color: agent.segmentColor, fontWeight: 700, letterSpacing: "0.07em",
                    }}>{agent.segment}</span>
                    {isRunning && (
                      <span style={{
                        display: "flex", alignItems: "center", gap: 3,
                        color: "#10b981", fontSize: 9, fontWeight: 700,
                        fontFamily: "JetBrains Mono, monospace",
                      }}>
                        <Radio size={8} /> LIVE
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <PulsingDot color={agent.segmentColor} active={isRunning} />
                  <span style={{
                    color: "#94a3b8", display: "flex",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.22s",
                  }}>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div style={{
                  borderTop: "1px solid " + agent.segmentColor + "20",
                  padding: "11px 11px 13px",
                  background: "linear-gradient(180deg, " + agent.segmentGlow + " 0%, transparent 80%)",
                }}>
                  <p style={{
                    fontSize: 10.5, color: "#475569", lineHeight: 1.6, marginBottom: 11,
                    borderLeft: "2.5px solid " + agent.segmentColor,
                    paddingLeft: 8, fontStyle: "italic",
                  }}>
                    {agent.objective}
                  </p>

                  <div style={{ display: "flex", gap: 5, marginBottom: 11 }}>
                    <StatPill label="Speed" value={agent.decisionSpeed} color={agent.segmentColor} />
                    <StatPill label="Accuracy" value={agent.accuracy} color={agent.segmentColor} />
                    <StatPill label="Recovery" value={agent.recoveryRate} color={agent.segmentColor} />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{
                      fontSize: 8.5, fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.08em", marginBottom: 5,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <Wifi size={9} color={agent.segmentColor} /> INTELLIGENCE SIGNALS
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {agent.signals.map(sig => (
                        <span key={sig} style={{
                          fontSize: 9.5, padding: "2px 6px", borderRadius: 4,
                          background: "#f1f5f9", color: "#475569",
                          border: "1px solid #e2e8f0", fontWeight: 500,
                        }}>{sig}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{
                      fontSize: 8.5, fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.08em", marginBottom: 5,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <Cpu size={9} color={agent.segmentColor} /> AGENT TOOLS
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {agent.tools.map((tool, ti) => {
                        const ToolIcon = agent.toolIcons[ti];
                        const toolActive = tick % agent.tools.length === ti;
                        return (
                          <div key={tool} style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "5px 8px", borderRadius: 7,
                            background: toolActive ? (agent.segmentColor + "10") : "#f8fafc",
                            border: "1px solid " + (toolActive ? agent.segmentColor + "30" : "#edf1f7"),
                            transition: "all 0.5s ease",
                          }}>
                            <ToolIcon size={11} color={toolActive ? agent.segmentColor : "#b0bec5"} />
                            <span style={{
                              fontSize: 10.5, flex: 1,
                              color: toolActive ? "#1e293b" : "#64748b",
                              fontWeight: toolActive ? 600 : 400,
                            }}>{tool}</span>
                            {toolActive && (
                              <span style={{
                                fontSize: 8, fontWeight: 700, color: agent.segmentColor,
                                fontFamily: "JetBrains Mono, monospace",
                                letterSpacing: "0.04em",
                              }}>ACTIVE</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: 11 }}>
                    <div style={{
                      fontSize: 8.5, fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.08em", marginBottom: 5,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <Zap size={9} color={agent.segmentColor} /> CAPABILITIES
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {agent.capabilities.map(cap => (
                        <span key={cap} style={{
                          fontSize: 9.5, padding: "2px 6px", borderRadius: 4,
                          background: agent.segmentColor + "15", color: agent.segmentColor,
                          border: "1px solid " + agent.segmentColor + "28", fontWeight: 600,
                        }}>{cap}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const scenario = SCENARIOS.find(s => s.id === agent.id);
                      if (scenario) setActiveScenarioDef(scenario);
                    }}
                    style={{
                      width: "100%", padding: "8px",
                      borderRadius: 8, border: "none", cursor: "pointer",
                      background: "linear-gradient(135deg, " + agent.segmentColor + ", " + agent.segmentColor + "bb)",
                      color: "#fff", fontSize: 10.5, fontWeight: 700,
                      letterSpacing: "0.06em", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6,
                      boxShadow: "0 4px 14px " + agent.segmentGlow,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    <Play size={10} /> SIMULATE AGENT
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        padding: "10px 14px", borderTop: "1px solid #f1f5f9",
        background: "#fafafa", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 0 3px rgba(16,185,129,0.15)" }} />
          <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>Neural inference online</span>
        </div>
        <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.5 }}>
          All decisions autonomous | Test environment
        </div>
      </div>

      <style>{`
        @keyframes agentPing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
