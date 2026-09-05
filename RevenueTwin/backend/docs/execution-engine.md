# Execution Engine & Outcomes

The Execution Engine bridge the gap between the `AWAITING_APPROVAL` decision state and actual downstream action execution. It handles idempotency, real-time validations, state-machine tracking, and outcome calculations.

## 1. Approval Layer
When the Decision Engine completes, the run stops in `AWAITING_APPROVAL` and an `ApprovalRecord` is generated with a default expiration window (e.g., 30 minutes). 

Merchants must explicitly approve the action via `POST /api/agent-runs/{run_id}/approve`.
If they approve, the status shifts to `APPROVED`, preparing it for execution. 
If they reject or it expires, the run shifts to `CANCELLED` or `EXPIRED`.

## 2. Idempotency & Safety
Before executing an approved action, the engine generates an idempotency key using `hash(merchant_id:run_id:action)`. 
It ensures that an approved execution is **only ever executed exactly once**. Subsequent triggers to execute the run will simply return the existing execution state.

The system also runs the **Execution Validator**:
- **Stale Decision Protection**: Ensures the customer hasn't already recovered their revenue organically between the time of the decision and the time of merchant approval.
- **Policy Check**: Re-evaluates frequency limits (e.g., maximum retention offers) to ensure they haven't been breached by another parallel execution.

## 3. Test Adapters
For safety, RevenueTwin forces execution into `TEST_MODE`. Actions are routed to the `TestActionExecutor` which acts as a simulated adapter. 
Instead of sending real API requests (e.g., Stripe, SendGrid), the Test adapter simulates execution and deterministically returns success or failure, computing realistic intervention costs.

## 4. Outcomes & Net Recovery
The ultimate goal of RevenueTwin is to compute **Actual Net Recovery**. 
Once an action completes (and the observation window passes), an `ActionOutcome` record is generated capturing:
- `amount_at_risk` (e.g., ₹4,999)
- `expected_incremental_recovery` (e.g., ₹4,049 based on 81% confidence)
- `actual_recovered_amount` (e.g., ₹4,999)
- `intervention_cost` (e.g., ₹0 for alternate payment, or ₹150 for a retention offer)
- `actual_net_recovery` (recovered - cost)

These tracked outcomes form the foundation of the analytics dashboard and future automatic self-learning feedback loops.
