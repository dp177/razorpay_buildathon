from collections import defaultdict
from app.models.domain import ActionOutcome, GlobalPolicy

class PolicyCalibrator:
    async def run_calibration(self):
        print("[PolicyCalibrator] Starting dynamic policy calibration run...")
        outcomes = await ActionOutcome.find_all().to_list()
        
        if not outcomes:
            print("[PolicyCalibrator] No historical data to calibrate from.")
            return {"status": "skipped", "reason": "no data"}
            
        # We need to map outcomes to agents. But ActionOutcome doesn't have agent_id.
        # Wait, ActionOutcome does have run_id. We can fetch AgentRun, but for demo let's assume global mapping or just use a dummy aggregation.
        # Let's map action -> outcome status
        stats = defaultdict(lambda: {"total": 0, "success": 0})
        for outcome in outcomes:
            stats[outcome.action]["total"] += 1
            # Assuming any recovered amount > 0 is success for the calibration, or status == SUCCESS
            if outcome.actual_recovered_amount > 0 or outcome.status in ("SUCCESS", "PROMISE_FULFILLED"):
                stats[outcome.action]["success"] += 1
                
        new_policies_created = 0
        for action, data in stats.items():
            if data["total"] >= 2: # Very low threshold for demo purposes
                success_rate = data["success"] / data["total"]
                print(f"[PolicyCalibrator] Action {action} success rate: {success_rate*100:.1f}% ({data['success']}/{data['total']})")
                
                if success_rate < 0.40: # If it fails more than 60% of the time
                    # Check if policy already exists
                    existing = await GlobalPolicy.find_one(
                        GlobalPolicy.target_action == action,
                        GlobalPolicy.is_active == True
                    )
                    if not existing:
                        print(f"[PolicyCalibrator] 🚨 ALARM! {action} is failing terribly. Generating Self-Healing Policy...")
                        
                        # Generate constraint
                        constraint = f"SYSTEM SELF-HEALING CONSTRAINT: Do NOT use the {action} action as it has a historically poor success rate ({success_rate*100:.1f}%). Prioritize other alternatives."
                        
                        # We apply it to payment_recovery for the demo
                        policy = GlobalPolicy(
                            agent_id="payment_recovery",
                            target_action=action,
                            constraint_rule=constraint,
                            reason=f"Empirical success rate fell to {success_rate*100:.1f}%"
                        )
                        await policy.insert()
                        new_policies_created += 1
                        print(f"[PolicyCalibrator] ✅ Rule injected into Agent's brain: {constraint}")
                        
        print(f"[PolicyCalibrator] Calibration complete. Generated {new_policies_created} new rules.")
        return {"status": "success", "new_rules": new_policies_created}

policy_calibrator = PolicyCalibrator()
