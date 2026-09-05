<p align="center">
  <img src="https://img.shields.io/badge/RevenueTwin-Autonomous%20Recovery-blueviolet?style=for-the-badge&logo=robot&logoColor=white" alt="RevenueTwin"/>
</p>

<h1 align="center">RevenueTwin</h1>
<h3 align="center">Autonomous Revenue Recovery Digital Twin · Powered by Multi-Agent AI</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/MongoDB-Beanie-47A248?style=flat-square&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/LLM-Llama%204%20Scout-FF6F00?style=flat-square&logo=meta&logoColor=white"/>
  <img src="https://img.shields.io/badge/Razorpay-API%20Integrated-0066FF?style=flat-square&logo=razorpay&logoColor=white"/>
  <img src="https://img.shields.io/badge/Agents-10%20Specialists-E91E63?style=flat-square&logo=openai&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tests-13%20Passed-4CAF50?style=flat-square&logo=pytest&logoColor=white"/>
</p>

<p align="center">
  <b>10 specialist AI agents</b> autonomously detect, decide, execute, and learn from revenue recovery actions across payments, carts, subscriptions, B2B receivables, and more — with <b>real Razorpay API integration</b>, <b>LLM-powered reasoning</b>, and <b>full observability</b>.
</p>

---

## Table of Contents

- [The Problem](#-the-problem)
- [What RevenueTwin Does](#-what-revenuetwin-does)
- [System Architecture](#-system-architecture)
- [The 10 Specialist Agents](#-the-10-specialist-agents)
- [Decision Pipeline Deep Dive](#-decision-pipeline-deep-dive)
- [The Agentic Recovery Loop](#-the-agentic-recovery-loop)
- [LLM Integration & Resilience](#-llm-integration--resilience)
- [Razorpay API Integration](#-razorpay-api-integration)
- [Data Model](#-data-model)
- [Self-Calibrating Policy System](#-self-calibrating-policy-system)
- [Frontend Observatory](#-frontend-observatory)
- [API Reference](#-api-reference)
- [Test Suite](#-test-suite)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)

---

## 🚨 The Problem

Every payment platform silently bleeds revenue. Failed payments, abandoned carts, churning subscriptions, aging receivables — these are **recoverable** losses that go unrecovered because existing solutions are rule-based, reactive, and one-size-fits-all.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     THE SILENT REVENUE HEMORRHAGE                                │
├──────────────────────────────────┬───────────────┬───────────────────────────────┤
│  Revenue Leak Type               │  Industry Loss │  Current "Solution"          │
├──────────────────────────────────┼───────────────┼───────────────────────────────┤
│  Payment Failures (soft decline) │   5-10%       │  Dumb retry at fixed intervals│
│  Cart Abandonment                │   ~70%        │  Generic email blast          │
│  Checkout Dropoff                │   25-40%      │  ❌ Nothing                   │
│  Subscription Churn              │   5-7%/month  │  Manual outreach              │
│  B2B Receivables Aging           │   30-60 day   │  Collections calls            │
│  Mandate / Autopay Failures      │   3-8%        │  ❌ Nothing                   │
│  Payment Degradation (systemic)  │   Varies      │  ❌ Manual monitoring          │
└──────────────────────────────────┴───────────────┴───────────────────────────────┘
```

**The core issue:** These are fundamentally *different* problems that require *different* expertise, *different* data, and *different* actions. A one-size-fits-all retry engine can't handle them.

---

## 🧠 What RevenueTwin Does

RevenueTwin is a **Digital Twin** of a merchant's entire revenue pipeline. It deploys **10 domain-specialist AI agents**, each with isolated context, isolated actions, and isolated policies, to autonomously recover revenue across every leak type.

```mermaid
graph LR
    subgraph "Revenue Events (Input)"
        E1["💳 Payment Failed"]
        E2["🛒 Cart Abandoned"]
        E3["🔄 Subscription Churn"]
        E4["📋 Invoice Overdue"]
        E5["⚡ Payment Degradation"]
        E6["📱 Mandate Failure"]
    end

    subgraph "RevenueTwin (Processing)"
        EB["Event Bus<br/>Detect → Deduplicate → Prioritize"]
        OR["Master Orchestrator<br/>Route to Specialist"]
        DE["Decision Engine<br/>Rules + LLM + Policy"]
        EX["Execution Engine<br/>Approve → Execute → Observe"]
    end

    subgraph "Outcomes (Output)"
        O1["✅ Revenue Recovered"]
        O2["📊 Net Recovery Calculated"]
        O3["🧠 Agent Memory Updated"]
        O4["📋 Policy Self-Calibrated"]
    end

    E1 & E2 & E3 & E4 & E5 & E6 --> EB --> OR --> DE --> EX --> O1 & O2 & O3 & O4
```

### The Closed-Loop Promise

Unlike traditional dunning systems that stop at "retry and pray," RevenueTwin closes the entire loop:

```mermaid
graph TD
    A["🔍 DETECT<br/>Revenue leak event detected"] --> B["🧠 CONTEXT<br/>Specialist context built<br/>for this agent ONLY"]
    B --> C["⚖️ DECIDE<br/>LLM + Rules + Policy<br/>= Structured Decision"]
    C --> D["👤 APPROVE<br/>Merchant reviews<br/>evidence & rationale"]
    D --> E["⚡ EXECUTE<br/>Real Razorpay API call<br/>or simulated action"]
    E --> F["👁️ OBSERVE<br/>Customer response<br/>tracked over time"]
    F --> G{"Success?"}
    G -- "✅ Yes" --> H["💰 RECOVER<br/>Net recovery calculated<br/>Agent memory updated"]
    G -- "❌ No" --> I["🔄 RE-ACTIVATE<br/>Agent wakes up<br/>reasons about failure<br/>picks next action"]
    I --> C
    H --> J["📈 CALIBRATE<br/>Outcomes feed back<br/>into policy constraints"]
    J -.-> C

    style A fill:#667eea,color:#fff
    style C fill:#f093fb,color:#fff
    style E fill:#4facfe,color:#fff
    style H fill:#43e97b,color:#fff
    style I fill:#fa709a,color:#fff
    style J fill:#a18cd1,color:#fff
```

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend — React 19 + Vite"
        UI["Revenue Loss Landing"]
        SV["Scenario View<br/>10 Agent Types"]
        PRD["Payment Recovery<br/>Dashboard"]
        OBS["Agent Observatory<br/>Real-time Traces"]
    end

    subgraph "API Layer — FastAPI"
        EP["REST Endpoints<br/>/api/*"]
        SC["Scenario Engine<br/>/api/scenarios/*"]
        AG["Agent API<br/>/api/agents/*"]
    end

    subgraph "Core Intelligence"
        direction TB
        EB2["Event Bus<br/>Pub/Sub"]
        MO["Master Orchestrator"]
        AR["Agent Registry<br/>10 Specialists"]

        subgraph "Decision Pipeline"
            CX["Complexity Assessor"]
            RE["Rule Engine"]
            LG["LLM Gate"]
            LLM["LLM Provider<br/>OpenRouter / OpenAI / Mock"]
            AV["Action Validator"]
            PC["Policy Enforcer"]
            CS["Confidence Scorer"]
        end

        subgraph "Execution Pipeline"
            AP["Approval Layer"]
            IK["Idempotency Guard"]
            SD["Stale Decision Validator"]
            TA["Test Adapter / Razorpay Adapter"]
            OM["Outcome Measurer"]
        end
    end

    subgraph "Intelligence Layer"
        IS["Customer Intelligence<br/>Service"]
        FC["Feature Calculator<br/>30+ behavioral features"]
        SP["Specialist Context<br/>Builders"]
        SY["Synthetic Data<br/>Generator"]
        AM["Agent Memory<br/>Persistent Learnings"]
    end

    subgraph "Data Layer — MongoDB"
        CU[("Customers")]
        EV[("Revenue Events")]
        RN[("Agent Runs")]
        TR[("Agent Traces")]
        DC[("Decisions")]
        EX[("Executions")]
        AO[("Action Outcomes")]
        AL[("Audit Logs")]
        GP[("Global Policies")]
        MM[("Agent Memory")]
    end

    subgraph "Background"
        PM["Proactive Monitor<br/>Payment Degradation<br/>Daemon"]
        PCL["Policy Calibrator<br/>Self-Healing Rules"]
    end

    UI & SV & PRD --> EP & SC & AG
    EP --> EB2 --> MO --> AR
    AR --> CX --> RE --> LG --> LLM
    LLM --> AV --> PC --> CS
    CS --> AP --> IK --> SD --> TA --> OM
    MO --> IS --> FC & SP & SY
    SP --> AM
    OM --> MM & AL
    OM -.-> PCL -.-> GP
    PM -.-> EB2

    TA --> CU & EV & RN & TR & DC & EX & AO & AL & GP & MM
```

---

## 🤖 The 10 Specialist Agents

Each agent has its own **decision profile**, **context builder**, **system prompt**, **allowed actions**, and **hard constraints**. No two agents share the same data, prompt, or action set.

```mermaid
graph TB
    subgraph "Consumer Revenue Recovery"
        A1["🛒 Cart Recovery Agent<br/>───────────────<br/>Trigger: CART_ABANDONMENT<br/>Actions: RESUME_CHECKOUT,<br/>REMINDER, INCENTIVE,<br/>NO_ACTION"]
        A2["💳 Payment Recovery Agent<br/>───────────────<br/>Trigger: PAYMENT_FAILED<br/>Actions: RETRY,<br/>ALTERNATE_PAYMENT,<br/>PAYMENT_LINK, CARD_UPDATE,<br/>ESCALATE_TO_VOICE, NO_ACTION"]
        A3["🚪 Checkout Recovery Agent<br/>───────────────<br/>Trigger: CHECKOUT_DROPOFF<br/>Actions: RESUME_SESSION,<br/>SIMPLIFY_CHECKOUT,<br/>REMINDER, NO_ACTION"]
        A4["🔄 Subscription Recovery<br/>───────────────<br/>Trigger: SUB_PAYMENT_FAILURE<br/>Actions: RETRY_BILLING,<br/>DOWNGRADE_OFFER,<br/>GRACE_PERIOD, NO_ACTION"]
        A5["🛡️ Churn Prevention Agent<br/>───────────────<br/>Trigger: CHURN_RISK<br/>Actions: RETENTION_OFFER,<br/>ENGAGEMENT_CAMPAIGN,<br/>PAUSE_SUBSCRIPTION,<br/>NO_ACTION"]
    end

    subgraph "B2B & Enterprise Recovery"
        A6["📋 B2B Receivables Agent<br/>───────────────<br/>Trigger: RECEIVABLE_OVERDUE<br/>Actions: PAYMENT_REMINDER,<br/>ESCALATE, OFFER_TERMS,<br/>NO_ACTION"]
        A7["📱 Mandate Recovery Agent<br/>───────────────<br/>Trigger: MANDATE_FAILURE<br/>Actions: RE_PRESENT,<br/>MANDATE_UPDATE,<br/>ALTERNATE_DEBIT, NO_ACTION"]
        A8["🤝 Promise-to-Pay Agent<br/>───────────────<br/>Trigger: PROMISE_TO_PAY_DUE<br/>Actions: SEND_REMINDER,<br/>ESCALATE,<br/>RESTRUCTURE, NO_ACTION"]
    end

    subgraph "Infrastructure & Escalation"
        A9["⚡ Payment Degradation Agent<br/>───────────────<br/>Trigger: PAYMENT_DEGRADATION<br/>Actions: SWITCH_GATEWAY,<br/>ALERT_MERCHANT,<br/>PAUSE_RETRIES, NO_ACTION"]
        A10["📞 Voice Recovery Agent<br/>───────────────<br/>Trigger: VOICE_RECOVERY<br/>Actions: INITIATE_CALL,<br/>SCHEDULE_CALLBACK,<br/>SEND_VOICEMAIL, NO_ACTION"]
    end

    style A1 fill:#667eea,color:#fff
    style A2 fill:#f093fb,color:#fff
    style A3 fill:#4facfe,color:#fff
    style A4 fill:#43e97b,color:#000
    style A5 fill:#fa709a,color:#fff
    style A6 fill:#a18cd1,color:#fff
    style A7 fill:#ffecd2,color:#000
    style A8 fill:#fcb69f,color:#000
    style A9 fill:#ff6b6b,color:#fff
    style A10 fill:#ffd93d,color:#000
```

### Agent Context Isolation (No "Prompt Bleed")

This is the critical architectural guarantee: **each agent sees ONLY its own data**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTEXT ISOLATION MATRIX                             │
├──────────────────────┬────────┬──────┬───────┬──────┬────────┬─────────────┤
│  Data Field          │  Cart  │ Pay  │  Sub  │  B2B │Mandate │  Voice      │
├──────────────────────┼────────┼──────┼───────┼──────┼────────┼─────────────┤
│  cart_history         │   ✅   │  ❌  │  ❌   │  ❌  │   ❌   │    ❌       │
│  product_affinity     │   ✅   │  ❌  │  ❌   │  ❌  │   ❌   │    ❌       │
│  payment_history      │   ❌   │  ✅  │  ❌   │  ❌  │   ❌   │    ✅       │
│  issuer_signals       │   ❌   │  ✅  │  ❌   │  ❌  │   ❌   │    ❌       │
│  subscription_tenure  │   ❌   │  ❌  │  ✅   │  ❌  │   ❌   │    ❌       │
│  plan_details         │   ❌   │  ❌  │  ✅   │  ❌  │   ❌   │    ❌       │
│  invoice_history      │   ❌   │  ❌  │  ❌   │  ✅  │   ❌   │    ❌       │
│  payment_terms        │   ❌   │  ❌  │  ❌   │  ✅  │   ❌   │    ❌       │
│  mandate_schedule     │   ❌   │  ❌  │  ❌   │  ❌  │   ✅   │    ❌       │
│  call_history         │   ❌   │  ❌  │  ❌   │  ❌  │   ❌   │    ✅       │
│  notification_fatigue │   ✅   │  ✅  │  ✅   │  ✅  │   ✅   │    ✅       │
└──────────────────────┴────────┴──────┴───────┴──────┴────────┴─────────────┘
```

---

## ⚙️ Decision Pipeline Deep Dive

Every revenue event flows through a rigorous, fully observable 12-stage pipeline:

```mermaid
sequenceDiagram
    participant E as Revenue Event
    participant EB as Event Bus
    participant DD as Deduplicator
    participant PR as Prioritizer
    participant OR as Orchestrator
    participant AR as Agent Registry
    participant IS as Intelligence Service
    participant CX as Complexity Assessor
    participant RE as Rule Engine
    participant LG as LLM Gate
    participant LLM as LLM Provider
    participant AV as Action Validator
    participant PC as Policy Enforcer
    participant CS as Confidence Scorer
    participant DB as MongoDB

    E->>EB: event.detected
    EB->>DD: Check duplicate
    DD-->>EB: Unique ✅
    EB->>PR: Calculate priority
    PR-->>OR: CRITICAL (₹4,999)

    OR->>AR: Find specialist agent
    AR-->>OR: Payment Recovery Agent

    OR->>DB: Save RevenueEvent + AgentRun
    OR->>IS: Get specialist context

    IS->>IS: Build specialist-only context
    IS->>IS: Load Agent Memory (last 10)
    IS-->>OR: Isolated context + learnings

    OR->>CX: Assess complexity
    CX-->>OR: HIGH (amount > ₹1000)

    OR->>RE: Evaluate deterministic rules
    RE-->>OR: No definitive rule

    OR->>LG: LLM required?
    Note over LG: HIGH complexity +<br/>no rule = YES

    LG->>LLM: Specialist prompt +<br/>constrained schema
    LLM-->>LG: Structured decision:<br/>RETRY (83% confidence)

    LG->>AV: Validate action ∈ allowed set
    AV-->>LG: PASSED ✅

    LG->>PC: Check policy limits
    PC-->>LG: PASSED ✅

    LG->>CS: Compute adjusted confidence
    CS-->>OR: 0.83

    OR->>DB: Save AgentDecision
    OR->>DB: Create ApprovalRecord
    OR-->>E: AWAITING_APPROVAL
```

### The LLM Gate — When Intelligence Is Actually Needed

Not every event needs an LLM call. The complexity gate minimizes cost and latency:

```mermaid
graph TD
    A["Incoming Event"] --> B{"Complexity?"}

    B -- "LOW<br/>(amount < ₹100)" --> C["Rule Engine ONLY<br/>No LLM call<br/>~0ms latency"]
    B -- "MEDIUM<br/>(₹100 - ₹1000)" --> D{"Rule found<br/>a decision?"}
    B -- "HIGH<br/>(amount > ₹1000)" --> E["LLM ALWAYS called<br/>Full specialist prompt"]

    D -- "Yes" --> F["Use rule decision<br/>Skip LLM<br/>~0ms latency"]
    D -- "No" --> E

    E --> G["LLM Call via OpenRouter"]
    G --> H{"LLM succeeded?"}

    H -- "Valid JSON ✅" --> I["Use LLM decision<br/>source = LLM"]
    H -- "Malformed JSON" --> J["3-step lenient parse<br/>Patch defaults → Validate"]
    H -- "Timeout / Error" --> K["Cascade to fallback model"]

    J --> L{"Repaired?"}
    L -- "Yes" --> I
    L -- "No" --> M["DETERMINISTIC_FALLBACK<br/>Safe NO_ACTION"]

    K --> N{"Fallback succeeded?"}
    N -- "Yes" --> I
    N -- "No" --> O["INTELLIGENCE_ENGINE<br/>Mock provider fallback"]
    O --> M

    style C fill:#43e97b,color:#000
    style F fill:#43e97b,color:#000
    style I fill:#667eea,color:#fff
    style M fill:#fa709a,color:#fff
```

---

## 🔄 The Agentic Recovery Loop

This is what makes RevenueTwin fundamentally different from a retry engine. Agents don't just fire-and-forget — they **observe, reason, and adapt**:

```mermaid
stateDiagram-v2
    [*] --> QUEUED : Event Detected

    QUEUED --> STARTING : Agent Selected
    STARTING --> CONTEXT_RETRIEVAL : Context Requested
    CONTEXT_RETRIEVAL --> READY_FOR_DECISION : Context Built

    READY_FOR_DECISION --> DECIDING : Decision Engine Invoked
    DECIDING --> AWAITING_APPROVAL : Decision Made

    AWAITING_APPROVAL --> APPROVED : Merchant Approves
    AWAITING_APPROVAL --> REJECTED : Merchant Rejects
    AWAITING_APPROVAL --> NEGOTIATION : Customer Counter-offers

    NEGOTIATION --> DECIDING : Re-evaluate with feedback

    APPROVED --> EXECUTING : Execution Started
    EXECUTING --> CUSTOMER_INTERACTION : Action Dispatched

    CUSTOMER_INTERACTION --> COMPLETED : Customer Pays ✅
    CUSTOMER_INTERACTION --> AGENT_REACTIVATED : Customer Ignores ❌

    AGENT_REACTIVATED --> DECIDING : Agent reasons about failure\nPicks next action dynamically

    REJECTED --> COMPLETED : Run Cancelled
    COMPLETED --> [*] : Outcome Recorded\nMemory Updated\nPolicy Calibrated
```

### Dynamic Multi-Step Recovery Example

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT RECOVERY — DYNAMIC LOOP                          │
│                                                                              │
│  Step 1: Agent decides → RETRY (83% confidence)                             │
│          Rationale: "Soft decline from issuer. Retry window open 2h."       │
│          ↓                                                                   │
│          Customer Response: ❌ PAYMENT_FAILED (retry also declined)          │
│                                                                              │
│  Step 2: Agent REACTIVATES → evaluates failure                              │
│          Reasoning: "Card retry failed. Issuer soft-decline persisted.      │
│           Switching to alternate payment rails (UPI/NetBanking)."           │
│          Agent decides → ALTERNATE_PAYMENT (86% confidence)                 │
│          ↓                                                                   │
│          Customer Response: ❌ IGNORED (checkout abandoned)                  │
│                                                                              │
│  Step 3: Agent REACTIVATES → evaluates failure                              │
│          Reasoning: "Interactive checkout timed out. Customer may not be    │
│           ready. Switching to async Razorpay Payment Link (24h valid)."     │
│          Agent decides → PAYMENT_LINK (82% confidence)                      │
│          ⚡ Razorpay API called → Real payment link generated               │
│          ↓                                                                   │
│          Customer Response: ✅ PURCHASED via payment link!                   │
│                                                                              │
│  Outcome: ₹4,999 RECOVERED | Net: ₹4,998.50 | 3 steps, fully autonomous   │
│  Memory: "RETRY failed for this customer. ALTERNATE_PAYMENT abandoned.      │
│           PAYMENT_LINK succeeded — prefer async for this customer."          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 LLM Integration & Resilience

### Provider Architecture

```mermaid
graph TB
    subgraph "LLM Provider Hierarchy"
        P1["OpenRouter Provider<br/>───────────────<br/>Primary: Llama 4 Scout<br/>Fallback 1: Nemotron 3.5<br/>Fallback 2: Minimax M2.7<br/>Fallback 3: Gemma 4 31B"]

        P2["OpenAI Provider<br/>───────────────<br/>GPT-4o-mini<br/>Native structured output"]

        P3["Mock Provider<br/>───────────────<br/>Deterministic responses<br/>For testing & fallback"]
    end

    subgraph "Resilience Stack"
        R1["1. Complexity Gate<br/>Skip LLM for LOW events"]
        R2["2. Model Cascading<br/>Try primary → fallback"]
        R3["3. Lenient JSON Parse<br/>Repair malformed responses"]
        R4["4. Schema Validation<br/>Pydantic Literal constraint"]
        R5["5. Action Validation<br/>Engine-level reject"]
        R6["6. Decision Provenance<br/>Always record source"]
    end

    P1 --> R1 --> R2 --> R3 --> R4 --> R5 --> R6

    style P1 fill:#667eea,color:#fff
    style P2 fill:#43e97b,color:#000
    style P3 fill:#ffd93d,color:#000
```

### Structured Decision Output

Every LLM decision is constrained to this schema (invalid actions are rejected at the Pydantic level):

```json
{
  "decision": "RETRY",
  "confidence": 0.83,
  "thought_process": [
    "Failure analysis: soft decline from bank, not a hard block. RETRY is safe.",
    "Historical data: customer has 90% success rate on this payment method.",
    "Fatigue check: zero recent recovery contacts — customer is receptive.",
    "Recovery plan: RETRY → ALTERNATE_PAYMENT → PAYMENT_LINK."
  ],
  "evidence": [
    { "signal": "TRANSIENT_FAILURE", "importance": "HIGH", "description": "Temporary bank decline — not a permanent block." },
    { "signal": "HIGH_PAYMENT_HISTORY", "importance": "HIGH", "description": "9 of 10 payments succeeded." },
    { "signal": "SOFT_DECLINE_SIGNAL", "importance": "HIGH", "description": "Retry window open for 2 hours." },
    { "signal": "LOW_CONTACT_FATIGUE", "importance": "MEDIUM", "description": "No recent recovery attempts." }
  ],
  "rationale": "Soft bank decline with strong history. Immediate retry is highest-probability.",
  "observation_window_hours": 2,
  "requires_approval": true,
  "reason_codes": ["TRANSIENT_FAILURE", "HIGH_SUCCESS_RATE", "SOFT_DECLINE"],
  "rejected_actions": [
    { "action": "NO_ACTION", "reason": "83% recovery probability — inaction loses this payment." },
    { "action": "CARD_UPDATE", "reason": "Card not blocked — update not warranted for soft decline." }
  ],
  "risk_flags": ["RETRY_WINDOW_EXPIRES_IN_2H"]
}
```

---

## 💳 Razorpay API Integration

RevenueTwin doesn't just recommend — it **executes**. When the Payment Recovery Agent decides `PAYMENT_LINK`, the system generates a **real Razorpay Payment Link**:

```mermaid
sequenceDiagram
    participant Agent as Payment Recovery Agent
    participant DE as Decision Engine
    participant EE as Execution Engine
    participant RA as Razorpay Adapter
    participant RZ as Razorpay API
    participant DB as MongoDB

    Agent->>DE: Decide: PAYMENT_LINK (82%)
    DE->>DB: Save AgentDecision
    DE->>EE: Execute approved action

    EE->>EE: Generate idempotency key
    EE->>EE: Validate not stale
    EE->>EE: Check policy limits

    EE->>RA: generate_payment_link(₹4,999)
    RA->>RZ: POST /v1/payment_links
    Note over RA,RZ: amount: 499900 paise<br/>currency: INR<br/>reference_id: rec_<run_id>_<ts>

    RZ-->>RA: { short_url: "https://rzp.io/i/abc123" }
    RA-->>EE: Payment link URL

    EE->>DB: Save ExecutionRecord<br/>payload.payment_url = short_url
    EE-->>Agent: AWAITING_CUSTOMER

    Note over Agent: Customer clicks link<br/>Pays via UPI/Card/NetBanking
```

---

## 📊 Data Model

RevenueTwin uses **28 MongoDB collections** managed via Beanie ODM with full async support:

```mermaid
erDiagram
    Customer ||--o{ Order : places
    Customer ||--o{ Cart : creates
    Customer ||--o{ Payment : makes
    Customer ||--o{ Subscription : subscribes
    Customer ||--o{ Invoice : receives
    Customer ||--o{ Notification : gets
    Customer ||--o{ RevenueEvent : triggers

    RevenueEvent ||--|| AgentRun : spawns
    AgentRun ||--o{ AgentTrace : logs
    AgentRun ||--o{ AgentDecision : produces
    AgentDecision ||--|| ApprovalRecord : requires
    ApprovalRecord ||--|| ExecutionRecord : enables
    ExecutionRecord ||--|| ActionOutcome : measures

    ActionOutcome }o--|| AgentMemory : teaches
    ActionOutcome }o--|| GlobalPolicy : calibrates
    AgentRun }o--|| SimulationState : simulates

    Cart ||--o{ CartItem : contains
    Cart ||--|| CheckoutSession : starts
    Order ||--o{ OrderItem : contains
    Order ||--o{ Return : may_have
    Return ||--|| Refund : triggers

    Subscription ||--o{ SubscriptionEvent : logs
    Invoice ||--o{ PromiseToPay : promises

    Customer {
        UUID id PK
        string name
        string email
        string archetype
        dict behavior_profile
        dict current_state
    }

    AgentRun {
        UUID run_id PK
        string agent_id
        UUID event_id FK
        UUID customer_id FK
        string status
        string priority
    }

    AgentDecision {
        UUID decision_id PK
        UUID run_id FK
        string decision
        float confidence
        string decision_source
        string model_provider
        string validation_status
        list evidence
        string rationale
    }

    ActionOutcome {
        UUID outcome_id PK
        UUID execution_id FK
        float amount_at_risk
        float actual_recovered_amount
        float intervention_cost
        float actual_net_recovery
    }
```

### Behavioral Feature Engineering

The Intelligence Layer computes **30+ behavioral features** from raw data:

```
┌───────────────────────────────────────────────────────────────────────┐
│                    FEATURE CALCULATOR OUTPUT                          │
├─────────────────────────┬─────────────────────────┬──────────────────┤
│  Order Features          │  Payment Features        │  Risk Signals   │
├─────────────────────────┼─────────────────────────┼──────────────────┤
│  purchase_frequency      │  payment_success_rate    │  churn_risk     │
│  orders_last_30d         │  payment_failure_rate    │  payment_       │
│  orders_last_90d         │  method_success_rate     │   reliability   │
│  average_order_value     │  retry_success_rate      │  notification_  │
│  median_order_value      │                          │   fatigue       │
│  purchase_recency_days   │                          │                 │
│  gross_revenue           │                          │                 │
│  net_revenue             │                          │                 │
│  customer_lifetime_value │                          │                 │
├─────────────────────────┼─────────────────────────┼──────────────────┤
│  Cart Features           │  Notification Features   │  B2B Features   │
├─────────────────────────┼─────────────────────────┼──────────────────┤
│  cart_abandonment_rate   │  response_rate           │  avg_invoice_   │
│  checkout_completion_    │  ignore_rate             │   delay_days    │
│   rate                   │  notification_fatigue    │  overdue_rate   │
│  checkout_abandonment_   │                          │  promise_to_pay │
│   rate                   │                          │   success_rate  │
│  return_rate             │                          │  promise_break_ │
│  refund_rate             │                          │   rate          │
└─────────────────────────┴─────────────────────────┴──────────────────┘
```

---

## 🔁 Self-Calibrating Policy System

The system **learns from its own outcomes** and automatically adjusts agent constraints:

```mermaid
graph LR
    A["Action Outcomes<br/>Database"] --> B["Policy Calibrator<br/>Aggregates per-action<br/>success rates"]
    B --> C{"Success rate<br/>< 40%?"}
    C -- "Yes" --> D["Generate GlobalPolicy<br/>'Do NOT use RETRY —<br/>historical rate is 35%'"]
    C -- "No" --> E["No action needed"]
    D --> F["Inject into LLM prompt<br/>as hard_constraint"]
    F --> G["Agent reads constraint<br/>Avoids failing action"]
    G --> H["Better outcomes"]
    H --> A

    style D fill:#fa709a,color:#fff
    style F fill:#667eea,color:#fff
    style H fill:#43e97b,color:#000
```

---

## 🖥️ Frontend Observatory

The frontend provides a **real-time agent observatory** — watching agents think, decide, and act:

### Three Main Views

| View | Purpose | Size |
|------|---------|------|
| **Revenue Loss Landing** | Select from 10 agent scenario types, generate synthetic data, launch live scenarios | ~40KB |
| **Scenario View** | Universal view for all 10 agent types — traces, evidence, approval, execution | ~57KB |
| **Payment Recovery Dashboard** | Dedicated agentic loop dashboard with multi-step recovery visualization | ~98KB |

### What You See in Real-Time

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🤖 Payment Recovery Agent — Live Scenario                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ TRACE LOG (live streaming) ──────────────────────────────────────────┐   │
│  │  [14:32:01] EVENT      PAYMENT_FAILED detected                       │   │
│  │  [14:32:01] ROUTING    Payment Recovery Agent selected                │   │
│  │  [14:32:02] CONTEXT    Specialist context built                       │   │
│  │  [14:32:02] EVIDENCE   TRANSIENT_FAILURE: Soft decline (HIGH)        │   │
│  │  [14:32:03] EVIDENCE   HIGH_PAYMENT_HISTORY: 9/10 success (HIGH)     │   │
│  │  [14:32:03] EVIDENCE   LOW_CONTACT_FATIGUE: No recent contact (MED)  │   │
│  │  [14:32:04] COMPLEXITY HIGH                                           │   │
│  │  [14:32:04] LLM GATE   Called — scenario complexity is HIGH           │   │
│  │  [14:32:05] LLM CALL   Calling Llama 4 Scout via OpenRouter...       │   │
│  │  [14:32:06] REASONING  Analyzing transaction history & issuer signals │   │
│  │  [14:32:07] LLM RESULT RETRY (83% confidence)                        │   │
│  │  [14:32:07] POLICY     PASSED ✅                                      │   │
│  │  [14:32:08] DECISION   RETRY [source=LLM]                            │   │
│  │  [14:32:08] STATUS     AWAITING_APPROVAL                             │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ EVIDENCE CARDS ──────────────────────────────────────────────────────┐   │
│  │  🔴 HIGH  TRANSIENT_FAILURE     Temporary bank decline               │   │
│  │  🔴 HIGH  HIGH_PAYMENT_HISTORY  9 of 10 payments succeeded           │   │
│  │  🔴 HIGH  SOFT_DECLINE_SIGNAL   Retry window open 2 hours            │   │
│  │  🟡 MED   LOW_CONTACT_FATIGUE   No recent recovery contacts          │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ ACTION ──────────────────────────────────────────────────────────────┐   │
│  │  Recommended: RETRY (83% confidence)                                  │   │
│  │  Rationale: "Soft bank decline with strong payment history."          │   │
│  │                                                                       │   │
│  │  [ ✅ APPROVE ]  [ ❌ REJECT ]  [ 💬 NEGOTIATE ]                     │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/agents` | List all 10 specialist agents with status |
| `GET` | `/api/agents/{id}` | Agent details, allowed actions, data access |
| `POST` | `/api/agents/{id}/decide` | Trigger a decision for a specific agent |
| `POST` | `/api/events` | Submit a revenue event |
| `GET` | `/api/agent-runs/{id}/traces` | Stream agent reasoning traces |
| `GET` | `/api/agent-runs/{id}/decision` | Get the structured decision |
| `POST` | `/api/agent-runs/{id}/approve` | Merchant approves action |
| `POST` | `/api/agent-runs/{id}/reject` | Merchant rejects action |
| `POST` | `/api/agent-runs/{id}/execute` | Execute the approved action |
| `POST` | `/api/agent-runs/{id}/resolve` | Record customer response |
| `POST` | `/api/agent-runs/{id}/negotiate` | Customer counter-offer loop |
| `GET` | `/api/agent-runs/{id}/timeline` | Full lifecycle timeline |
| `GET` | `/api/llm/health` | LLM provider health check |
| `POST` | `/api/policies/calibrate` | Trigger policy self-calibration |

### Scenario System

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/scenarios/generate-synthetic` | Generate synthetic customer + context |
| `POST` | `/api/scenarios/start` | Launch a live agent scenario |
| `GET` | `/api/scenarios/{id}/context` | Get specialist context for scenario |
| `GET` | `/api/scenarios/{id}/evidence` | Get evidence cards |
| `GET` | `/api/scenarios/{id}/data-access` | Audit data access |

---

## ✅ Test Suite

13 tests covering the **12 Step-6 requirements** plus a bonus specialist uniqueness test:

```
┌────┬─────────────────────────────────────────────────────────┬──────────┐
│  # │  Test                                                    │  Status  │
├────┼─────────────────────────────────────────────────────────┼──────────┤
│  1 │  Cart agent receives ONLY cart context                   │    ✅    │
│  2 │  B2B agent receives ONLY B2B context                     │    ✅    │
│  3 │  Subscription agent receives ONLY subscription context   │    ✅    │
│  4 │  LLM returns valid action from allowed set               │    ✅    │
│  5 │  Invalid action is schema-rejected (Pydantic Literal)    │    ✅    │
│  6 │  Invalid JSON is handled (fail-closed, never execute)    │    ✅    │
│  7 │  LLM timeout is handled gracefully                       │    ✅    │
│  8 │  LLM unavailable → DETERMINISTIC_FALLBACK                │    ✅    │
│  9 │  Missing context doesn't crash prompt builder            │    ✅    │
│ 10 │  Every decision has all required metadata fields          │    ✅    │
│ 11 │  No API key / secret exposed in any response             │    ✅    │
│ 12 │  No production payment execution occurs                  │    ✅    │
│ 13 │  All 10 specialist prompts are unique and distinct        │    ✅    │
└────┴─────────────────────────────────────────────────────────┴──────────┘
```

Run tests:
```bash
cd backend
python -m pytest tests/ -v
```

---

## 🛠️ Tech Stack

```mermaid
graph TB
    subgraph "Frontend"
        R["React 19"]
        V["Vite 8"]
        L["Lucide React"]
        CSS["Vanilla CSS<br/>25KB Design System"]
    end

    subgraph "Backend"
        FA["FastAPI"]
        PY["Python 3.12"]
        BE["Beanie ODM"]
        MO["Motor<br/>Async MongoDB"]
    end

    subgraph "Intelligence"
        OR["OpenRouter API"]
        OA["OpenAI SDK"]
        LM["Llama 4 Scout"]
        NM["Nemotron 3.5"]
        GM["Gemma 4 31B"]
        PD["Pydantic v2<br/>Structured Output"]
    end

    subgraph "Infrastructure"
        MG[("MongoDB")]
        RZ["Razorpay SDK<br/>Payment Links"]
        PT["Pytest<br/>13 Tests"]
    end

    R & V & L & CSS --> FA
    FA --> BE --> MO --> MG
    FA --> OR --> LM & NM & GM
    FA --> OA
    FA --> PD
    FA --> RZ

    style R fill:#61DAFB,color:#000
    style FA fill:#009688,color:#fff
    style LM fill:#FF6F00,color:#fff
    style MG fill:#47A248,color:#fff
    style RZ fill:#0066FF,color:#fff
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB (local or Atlas)
- OpenRouter API key (free tier works)
- Razorpay test API keys (optional)

### Backend Setup

```bash
cd RevenueTwin/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn motor beanie pydantic python-dotenv openai razorpay

# Configure environment
cp .env.example .env
# Edit .env with your keys:
#   OPENROUTER_API_KEY=your_key
#   MONGODB_URI=mongodb://localhost:27017
#   RZP_TEST_KEY=your_razorpay_test_key (optional)

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd RevenueTwin/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Run Tests

```bash
cd RevenueTwin/backend
python -m pytest tests/ -v
```

---

## 📁 Project Structure

```
RevenueTwin/
├── backend/
│   ├── app/
│   │   ├── main.py                          # FastAPI app + lifespan
│   │   ├── config.py                        # Settings
│   │   │
│   │   ├── agents/                          # 🤖 10 Specialist Agents
│   │   │   ├── base.py                      # BaseAgent + AgentDecisionProfile
│   │   │   ├── registry.py                  # Agent Registry (singleton)
│   │   │   ├── orchestrator.py              # Master Revenue Orchestrator
│   │   │   ├── payment_recovery/agent.py    # Payment Recovery Agent
│   │   │   ├── cart_recovery/agent.py       # Cart Recovery Agent
│   │   │   ├── checkout_recovery/agent.py   # Checkout Recovery Agent
│   │   │   ├── subscription_recovery/       # Subscription Recovery Agent
│   │   │   ├── churn_prevention/            # Churn Prevention Agent
│   │   │   ├── receivables/                 # B2B Receivables Agent
│   │   │   ├── mandate_recovery/            # Mandate Recovery Agent
│   │   │   ├── promise_to_pay/              # Promise-to-Pay Agent
│   │   │   ├── payment_degradation/         # Payment Degradation Agent
│   │   │   └── voice_recovery/              # Voice Recovery Agent
│   │   │
│   │   ├── decisions/                       # ⚖️ Decision Engine
│   │   │   ├── engine.py                    # Core pipeline (510 lines)
│   │   │   ├── complexity.py                # Complexity assessor
│   │   │   ├── rules.py                     # Rule evaluator
│   │   │   ├── policy.py                    # Policy enforcer
│   │   │   └── validators.py                # Confidence evaluator
│   │   │
│   │   ├── execution/                       # ⚡ Execution Engine
│   │   │   ├── engine.py                    # Approve → Execute → Observe (298 lines)
│   │   │   ├── idempotency.py               # Idempotency key generator
│   │   │   ├── validators.py                # Stale decision + policy checks
│   │   │   └── adapters/
│   │   │       ├── test_adapter.py          # Simulated executor
│   │   │       └── razorpay_adapter.py      # Real Razorpay Payment Links
│   │   │
│   │   ├── intelligence/                    # 🧠 Customer Intelligence
│   │   │   ├── service.py                   # Intelligence service
│   │   │   ├── features.py                  # 30+ behavioral features
│   │   │   ├── schemas.py                   # Context & feature schemas
│   │   │   └── specialist/
│   │   │       ├── contexts.py              # Per-agent context builders
│   │   │       └── synthetic.py             # Synthetic data generator
│   │   │
│   │   ├── llm/                             # 🤖 LLM Layer
│   │   │   ├── provider.py                  # OpenRouter + OpenAI providers
│   │   │   ├── mock.py                      # Mock provider for testing
│   │   │   ├── context_builder.py           # Specialist prompt assembler
│   │   │   ├── schemas.py                   # DecisionOutput + dynamic schema
│   │   │   └── prompts/                     # 10 specialist prompt modules
│   │   │       ├── cart_recovery.py
│   │   │       ├── payment_recovery.py
│   │   │       ├── b2b_receivables.py
│   │   │       └── ... (10 total)
│   │   │
│   │   ├── events/                          # 📡 Event System
│   │   │   ├── event_bus.py                 # Pub/Sub event bus
│   │   │   ├── event_store.py               # Deduplicator + prioritizer
│   │   │   ├── event_engine.py              # Event processing
│   │   │   └── event_types.py               # Canonical event types
│   │   │
│   │   ├── simulation/                      # 🎮 Simulation Engine
│   │   │   ├── engine.py                    # Virtual clock + time advancement
│   │   │   ├── customer_behavior.py         # Deterministic behavior model
│   │   │   └── monitor.py                   # Proactive anomaly detection
│   │   │
│   │   ├── policies/                        # 📋 Self-Calibrating Policies
│   │   │   └── calibrator.py                # Outcome → constraint generator
│   │   │
│   │   ├── models/
│   │   │   └── domain.py                    # 28 MongoDB document models
│   │   │
│   │   ├── api/                             # 🌐 API Routes
│   │   │   ├── endpoints.py                 # Core REST endpoints
│   │   │   ├── agents.py                    # Agent descriptions
│   │   │   ├── scenarios.py                 # Scenario management
│   │   │   ├── simulation.py                # Simulation endpoints
│   │   │   └── demo.py                      # Demo helpers
│   │   │
│   │   └── db/
│   │       └── connection.py                # MongoDB + Beanie init
│   │
│   ├── tests/                               # 🧪 Test Suite
│   │   ├── test_llm_integration.py          # 13 Step-6 tests
│   │   ├── test_agents.py                   # Agent registry tests
│   │   ├── test_intelligence.py             # Intelligence tests
│   │   └── test_health.py                   # Health check tests
│   │
│   └── docs/                                # 📚 Internal Documentation
│       ├── decision-engine.md
│       ├── execution-engine.md
│       ├── customer-intelligence.md
│       ├── data-model.md
│       ├── event-engine.md
│       └── feature-definitions.md
│
└── frontend/
    ├── src/
    │   ├── App.jsx                          # Router (3 views)
    │   ├── index.css                        # 25KB design system
    │   ├── pages/
    │   │   ├── RevenueLossLanding.jsx        # Agent selection (~40KB)
    │   │   ├── ScenarioView.jsx              # Universal scenario view (~57KB)
    │   │   └── PaymentRecoveryDashboard.jsx  # Agentic loop dashboard (~98KB)
    │   ├── components/
    │   │   ├── AgentDetailPanel.jsx           # Agent detail view (~76KB)
    │   │   ├── AgentSidebar.jsx               # Sidebar navigation (~18KB)
    │   │   └── observatory/
    │   │       ├── CustomerJourney.jsx        # Journey visualization
    │   │       └── JourneyNode.jsx            # Journey node component
    │   └── hooks/
    │       └── useScenarioPolling.js          # Real-time trace polling
    ├── package.json
    └── vite.config.js
```

---

<p align="center">
  <b>Built with ❤️ for the Razorpay Buildathon</b>
  <br/>
  <sub>10 Agents · 28 Collections · 30+ Features · 13 Tests · 1 Mission: Recover Every Rupee</sub>
</p>
