# Event Engine & Agent Triggers

RevenueTwin implements an event-driven architecture using an asynchronous pub/sub model to decouple event detection from agent orchestration.

## Lifecycle of a Revenue Event

1. **Detection**: Events are detected via scheduled scanners (`event_detector.py`) or received via the external API simulator.
2. **Normalization**: The raw data is validated against the strong `RevenueEventSchema` inside `event_normalizer.py`.
3. **Ingestion**: The event is published to the `event_bus` as `event.detected`.
4. **Orchestration**: The `MasterRevenueOrchestrator` receives the normalized event and begins processing:
   - **Deduplication**: Validates the customer hasn't had the same event type inside a recent window (`event_store.py`).
   - **Prioritization**: Ranks the event (LOW, MEDIUM, HIGH, CRITICAL) based on `amount_at_risk`.
   - **Routing**: Identifies the correct specialist agent via `AgentRegistry`.
5. **Agent Run Creation**: An `AgentRun` is instantiated in the `QUEUED` state.
6. **Context Retrieval**: The Orchestrator calls the `CustomerIntelligenceService` to retrieve relevant, tailored history for the specific agent.
7. **Execution**: The Agent halts at `READY_FOR_DECISION` awaiting Step 4's logic.

## Event Types
Currently supported events:
- `PAYMENT_FAILED`
- `PAYMENT_DEGRADATION`
- `CART_ABANDONMENT`
- `CHECKOUT_DROPOFF`
- `SUBSCRIPTION_PAYMENT_FAILURE`
- `SUBSCRIPTION_CHURN_RISK`
- `RECEIVABLE_OVERDUE`
- `MANDATE_FAILURE`
- `PROMISE_TO_PAY_DUE`
- `PROMISE_TO_PAY_BROKEN`
- `VOICE_RECOVERY_REQUIRED`

## Agent Trace System
Every meaningful step in the orchestrator generates a structured `AgentTrace` record. These traces form the foundation of the Agent Observatory UI, allowing merchants to see exactly *why* and *how* an agent made a decision, without exposing unreadable LLM chain-of-thought.

Stages:
- `EVENT`
- `ROUTING`
- `CONTEXT`
- `AGENT`
- `DECISION` (Next Phase)
- `ACTION` (Next Phase)
