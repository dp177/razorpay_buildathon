from uuid import UUID
from datetime import datetime, timedelta
from app.models.domain import ExecutionRecord, ApprovalRecord, ActionOutcome, AgentRun, RevenueEvent, AuditLog, AgentTrace, AgentDecision
from app.execution.adapters.test_adapter import TestActionExecutor
from app.execution.idempotency import IdempotencyKeyGenerator
from app.execution.validators import execution_validator
import os

class ExecutionEngine:
    def __init__(self):
        self.executor = TestActionExecutor()
        
    async def log_audit(self, actor: str, actor_type: str, action: str, resource_type: str, resource_id: str, result: str):
        log = AuditLog(actor=actor, actor_type=actor_type, action=action, resource_type=resource_type, resource_id=resource_id, result=result)
        await log.insert()
        
    async def log_trace(self, run_id: UUID, stage: str, message: str):
        trace = AgentTrace(run_id=run_id, stage=stage, message=message)
        await trace.insert()
        print(f"[{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] {stage}\n{message}\n")

    async def approve(self, run_id: UUID, approved: bool, approved_by: str) -> ApprovalRecord:
        approval = await ApprovalRecord.find_one(ApprovalRecord.run_id == run_id)
        if not approval:
            run = await AgentRun.find_one(AgentRun.run_id == run_id)
            if not run:
                raise ValueError("Agent run not found")
            decision = await AgentDecision.find_one(AgentDecision.run_id == run_id)
            approval = ApprovalRecord(
                run_id=run_id,
                decision_id=decision.decision_id if decision else run_id,
                status="PENDING",
                expires_at=datetime.utcnow() + timedelta(minutes=30),
            )
            await approval.insert()
            
        if approval.status != "PENDING":
            if approval.status == "APPROVED" and approved:
                return approval
            raise ValueError(f"Approval is already {approval.status}")
            
        approval.approved = approved
        approval.approved_by = approved_by
        approval.approved_at = datetime.utcnow()
        
        if approved:
            approval.status = "APPROVED"
            await self.log_trace(run_id, "APPROVAL", "APPROVED")
            await self.log_audit(approved_by, "MERCHANT", "APPROVE", "APPROVAL", str(approval.approval_id), "SUCCESS")
        else:
            approval.status = "REJECTED"
            await self.log_trace(run_id, "APPROVAL", "REJECTED")
            await self.log_audit(approved_by, "MERCHANT", "REJECT", "APPROVAL", str(approval.approval_id), "SUCCESS")
            
        await approval.save()
        return approval

    async def execute(self, run_id: UUID) -> ExecutionRecord:
        approval = await ApprovalRecord.find_one(ApprovalRecord.run_id == run_id)
        if not approval or approval.status != "APPROVED":
            raise ValueError("Approval not found or not in APPROVED state")
            
        run = await AgentRun.find_one(AgentRun.run_id == approval.run_id)
        decision = await AgentDecision.find_one(AgentDecision.decision_id == approval.decision_id)
        if not decision and run:
            decision = await AgentDecision.find_one(AgentDecision.run_id == run.run_id)
        if not decision:
            import asyncio
            for _ in range(8):
                await asyncio.sleep(0.5)
                decision = await AgentDecision.find_one(AgentDecision.run_id == approval.run_id)
                if decision:
                    break
        if not decision:
            raise ValueError("Decision record not found for this run. Wait for agent to finalize.")
        event = await RevenueEvent.find_one(RevenueEvent.event_id == run.event_id) if (run and run.event_id) else None
        merchant_id = event.merchant_id if event else UUID("00000000-0000-0000-0000-000000000000")
        
        ik = IdempotencyKeyGenerator.generate(merchant_id, run.run_id, decision.decision)
        existing_exec = await ExecutionRecord.find_one(ExecutionRecord.idempotency_key == ik)
        if existing_exec:
            await self.log_trace(run.run_id, "EXECUTION", "Duplicate execution blocked. Returning existing execution.")
            return existing_exec
            
        event_type = event.event_type if event else "PAYMENT_FAILED"
        is_fresh = await execution_validator.validate_stale_decision(run.customer_id, event_type)
        if not is_fresh:
            await self.log_audit("SYSTEM", "SYSTEM", "EXECUTE", "EXECUTION", str(ik), "BLOCKED_STALE")
            raise ValueError("Decision is stale (Already Recovered)")
            
        is_policy_valid = await execution_validator.validate_policy_limits(run.customer_id, decision.decision)
        if not is_policy_valid:
            await self.log_audit("SYSTEM", "SYSTEM", "EXECUTE", "EXECUTION", str(ik), "BLOCKED_POLICY")
            raise ValueError("Execution blocked by policy limits")
            
        if decision.decision == "ESCALATE_TO_VOICE":
            await self.log_trace(run.run_id, "EXECUTION", "Delegating to Voice Recovery Agent...")
            execution = ExecutionRecord(
                idempotency_key=ik,
                run_id=run.run_id,
                merchant_id=merchant_id,
                customer_id=run.customer_id,
                action=decision.decision,
                status="COMPLETED",
                payload={"delegated_to": "voice_recovery"}
            )
            await execution.insert()
            
            run.status = "COMPLETED"
            run.completed_at = datetime.utcnow()
            await run.save()
            
            # Spawn new run
            from app.decisions.engine import decision_engine
            from app.agents.registry import agent_registry
            from app.intelligence.service import intelligence_service
            import asyncio
            
            new_run = AgentRun(
                customer_id=run.customer_id,
                event_id=run.event_id,
                agent_id="voice_recovery"
            )
            await new_run.insert()
            
            agent = agent_registry.get_agent("voice_recovery")
            context = await intelligence_service.get_specialist_context(run.customer_id, "voice_recovery")
            
            # Fire and forget
            asyncio.create_task(decision_engine.make_decision(new_run, event.model_dump() if event else {}, context, agent.profile))
            
            return execution

        amount_at_risk = event.amount_at_risk if event else 4999.0
        payload = {"amount_at_risk": amount_at_risk}
        
        # REAL TOOL EXECUTION
        if decision.decision == "PAYMENT_LINK":
            await self.log_trace(run.run_id, "EXECUTION", "Agent is using real tool: Razorpay API to generate payment link...")
            from app.execution.adapters import razorpay_adapter
            payment_url = await razorpay_adapter.generate_payment_link(amount_at_risk, str(run.run_id))
            if payment_url:
                payload["payment_url"] = payment_url
                await self.log_trace(run.run_id, "EXECUTION", f"Razorpay Link Generated: {payment_url}")
            else:
                await self.log_trace(run.run_id, "EXECUTION", "Failed to generate real payment link. Using fallback simulation.")

        execution = ExecutionRecord(
            idempotency_key=ik,
            run_id=run.run_id,
            merchant_id=merchant_id,
            customer_id=run.customer_id,
            action=decision.decision,
            status="AWAITING_CUSTOMER",
            payload=payload
        )
        await execution.insert()
        
        await self.log_trace(run.run_id, "EXECUTION", "Started. Waiting for customer interaction.")
        await self.log_audit("SYSTEM", "SYSTEM", "EXECUTE", "EXECUTION", str(execution.execution_id), "STARTED")
        
        # Update run status toCUSTOMER_INTERACTION
        run.status = "CUSTOMER_INTERACTION"
        await run.save()
        
        return execution

    async def resolve_execution(self, execution_id: UUID, customer_response: str) -> ActionOutcome:
        execution = await ExecutionRecord.find_one(ExecutionRecord.execution_id == execution_id)
        if not execution:
            raise ValueError("Execution record not found")
            
        if execution.status != "AWAITING_CUSTOMER":
            raise ValueError(f"Execution is not awaiting customer, it is {execution.status}")
            
        run = await AgentRun.find_one(AgentRun.run_id == execution.run_id)
        event = await RevenueEvent.find_one(RevenueEvent.event_id == run.event_id)
        decision = await AgentDecision.find_one(AgentDecision.run_id == run.run_id)

        try:
            # We mock the executor result based on the explicit customer_response ("SUCCESS" or "FAILED")
            # If success, they recover the expected amount. If failure, they recover 0.
            expected_recovery = event.amount_at_risk * (decision.confidence if decision else 0.5)
            
            result = {
                "status": customer_response,
                "recovered_amount": expected_recovery if customer_response == "SUCCESS" else 0.0,
                "intervention_cost": 0.50 # fixed cost for demo
            }
            
            execution.status = "COMPLETED"
            
            await self.log_trace(run.run_id, "OBSERVATION", f"Customer response detected: {customer_response}")
            
            outcome = ActionOutcome(
                execution_id=execution.execution_id,
                run_id=run.run_id,
                event_id=event.event_id,
                customer_id=run.customer_id,
                action=execution.action,
                status=result["status"],
                amount_at_risk=event.amount_at_risk,
                expected_incremental_recovery=expected_recovery,
                actual_recovered_amount=result["recovered_amount"],
                intervention_cost=result["intervention_cost"],
                actual_net_recovery=result["recovered_amount"] - result["intervention_cost"],
                completed_at=datetime.utcnow()
            )
            await outcome.insert()
            
            await self.log_trace(run.run_id, "OUTCOME", f"Status: {outcome.status}")
            await self.log_trace(run.run_id, "RECOVERY", f"Rs. {outcome.actual_recovered_amount}")
            await self.log_trace(run.run_id, "NET RECOVERY", f"Rs. {outcome.actual_net_recovery}")
            
            # Write to AgentMemory
            from app.models.domain import AgentMemory
            learning_value = f"Action {execution.action} resulted in {customer_response}."
            if customer_response != "SUCCESS":
                learning_value += f" Reason: customer was unresponsive or declined."
            
            memory_doc = AgentMemory(
                agent_id=run.agent_id,
                customer_id=run.customer_id,
                memory_key=f"outcome_{execution.execution_id}",
                memory_value=learning_value
            )
            await memory_doc.insert()
            await self.log_trace(run.run_id, "MEMORY", f"Learning saved: {learning_value}")
            
            if customer_response == "SUCCESS" or customer_response == "PROMISE_FULFILLED" or customer_response == "OFFER_ACCEPTED":
                # Conclude the run
                run.status = "COMPLETED"
                run.completed_at = datetime.utcnow()
                await run.save()
            else:
                # FAILURE! Agent dynamically reasons about the failure and decides the next step
                past_executions = await ExecutionRecord.find(ExecutionRecord.run_id == run.run_id).to_list()
                
                from app.decisions.engine import decision_engine
                next_decision = await decision_engine.decide_next_recovery_action(
                    run=run,
                    event=event,
                    past_executions=past_executions,
                    failed_action=execution.action,
                    customer_response=customer_response
                )
                
                if next_decision:
                    next_action = next_decision["decision"]
                    
                    from app.execution.idempotency import IdempotencyKeyGenerator
                    ik = IdempotencyKeyGenerator.generate(event.merchant_id, run.run_id, next_action)
                    
                    payload = {"amount_at_risk": event.amount_at_risk}
                    if next_action == "PAYMENT_LINK":
                        await self.log_trace(run.run_id, "EXECUTION", "Agent is invoking real tool: Razorpay API to generate payment link...")
                        from app.execution.adapters import razorpay_adapter
                        payment_url = await razorpay_adapter.generate_payment_link(event.amount_at_risk, str(run.run_id))
                        if payment_url:
                            payload["payment_url"] = payment_url
                            await self.log_trace(run.run_id, "EXECUTION", f"Razorpay Link Generated: {payment_url}")
                        else:
                            await self.log_trace(run.run_id, "EXECUTION", "Failed to generate real payment link. Using fallback simulation.")
                    
                    new_execution = ExecutionRecord(
                        idempotency_key=ik,
                        run_id=run.run_id,
                        merchant_id=event.merchant_id,
                        customer_id=run.customer_id,
                        action=next_action,
                        status="AWAITING_CUSTOMER",
                        payload=payload
                    )
                    await new_execution.insert()
                    
                    await self.log_trace(run.run_id, "EXECUTION", f"Started dynamically decided action: {next_action}. Waiting for customer interaction.")
                    await self.log_audit("SYSTEM", "SYSTEM", "EXECUTE_DYNAMIC_STEP", "EXECUTION", str(new_execution.execution_id), "STARTED")
                    
                    run.status = "CUSTOMER_INTERACTION"
                    await run.save()
                else:
                    await self.log_trace(run.run_id, "AGENT", "Recovery loop concluded. All actions exhausted.")
                    run.status = "COMPLETED"
                    run.completed_at = datetime.utcnow()
                    await run.save()
            
        except Exception as e:
            execution.status = "FAILED"
            await self.log_trace(run.run_id, "EXECUTION", f"Failed to resolve: {str(e)}")
            raise e
            
        finally:
            await execution.save()
            
        return outcome

execution_engine = ExecutionEngine()
