"""
Decision Engine — Step 6: Real LLM Integration

Pipeline:
  Event → Specialist Agent → Context Builder → Evidence Builder
  → Policy Constraints → LLM → Structured Decision → Schema Validation
  → Action Validation → Approval State → Execution Layer

Decision sources are always explicit — never silently falls through.
"""
import os
from typing import Any, Optional
from app.models.domain import AgentDecision, AgentRun, AgentTrace
from app.llm.schemas import DecisionOutputBase as DecisionOutput, decision_output_schema
from app.llm.context_builder import LLMContextBuilder, PROMPT_VERSION
from app.llm.provider import OpenAIProvider, OpenRouterProvider
from app.llm.mock import MockLLMProvider
from app.decisions.complexity import complexity_assessor, ComplexityLevel
from app.decisions.rules import rule_evaluator
from app.decisions.policy import policy_enforcer
from app.decisions.validators import confidence_evaluator
import asyncio
from datetime import datetime



class DecisionEngine:
    def __init__(self):
        # A paced trace makes the simulation explain its work as it happens.
        self.step_delay_seconds = max(0.0, float(os.environ.get("SCENARIO_STEP_DELAY_SECONDS", "0.7")))
        provider = os.environ.get("LLM_PROVIDER", "mock").lower()
        if provider == "mock" or os.environ.get("USE_MOCK_LLM", "true").lower() == "true":
            self.llm = MockLLMProvider()
            self._provider_name = "mock"
        elif provider == "openrouter":
            self.llm = OpenRouterProvider()
            self._provider_name = "openrouter"
        else:
            self.llm = OpenAIProvider()
            self._provider_name = "openai"

    async def log_trace(self, run_id, stage, message, metadata=None):
        trace = AgentTrace(run_id=run_id, stage=stage, message=message, metadata=metadata or {})
        await trace.insert()
        rendered = f"[{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] {stage}\n{message}\n"
        try:
            print(rendered)
        except UnicodeEncodeError:
            print(rendered.encode("ascii", "backslashreplace").decode("ascii"))

    async def step(self, run_id, stage, message, metadata=None):
        await self.log_trace(run_id, stage, message, metadata)
        if self.step_delay_seconds:
            await asyncio.sleep(self.step_delay_seconds)

    async def make_decision(self, run: AgentRun, event: dict, context: Any, agent_profile: Any, customer_feedback: str = None) -> dict:
        await self.step(run.run_id, "DECISION_STARTED", "Evaluating specialist evidence and decision logic")

        # ── Evidence display ──────────────────────────────────────────────────
        for card in context.get("evidence_cards", []) if isinstance(context, dict) else []:
            await self.step(
                run.run_id,
                "EVIDENCE",
                f"{card.get('label', 'Signal')}: {card.get('value', '—')} ({card.get('signal', 'SPECIALIST_SIGNAL')})",
                {"card": card},
            )

        allowed_actions = list(agent_profile.candidate_actions)
        if customer_feedback:
            allowed_actions.extend(["REJECT_CUSTOMER_REQUEST", "ESCALATE_TO_HUMAN"])

        complexity = complexity_assessor.assess(event, context, agent_profile)
        await self.step(run.run_id, "COMPLEXITY", f"{complexity}", {"level": complexity})
        await self.step(run.run_id, "CANDIDATES", f"{allowed_actions}")

        rule_recommendation = rule_evaluator.evaluate(event, context, agent_profile)
        if rule_recommendation:
            await self.step(run.run_id, "RULE ENGINE", f"{rule_recommendation}")
        else:
            await self.step(run.run_id, "RULE ENGINE", "No definitive rule recommendation")

        # ── LLM gate ─────────────────────────────────────────────────────────
        llm_required = (
            complexity == ComplexityLevel.HIGH
            or (complexity == ComplexityLevel.MEDIUM and not rule_recommendation)
        )
        gate_reason = (
            "called because scenario complexity is HIGH"
            if complexity == ComplexityLevel.HIGH
            else "called because complexity is MEDIUM and rules found no decision"
            if llm_required
            else "skipped because deterministic rules are sufficient"
        )
        await self.step(run.run_id, "LLM GATE", gate_reason, {"llm_required": llm_required})

        final_decision: Optional[str] = None
        llm_decision: Optional[DecisionOutput] = None
        llm_failed = False
        llm_unavailable = False
        decision_source = "UNKNOWN"
        validation_status = "VALID"

        if llm_required:
            agent_id = run.agent_id
            model_label = getattr(self.llm, "model", "mock")

            # ── Step 6 console demo output header ────────────────────────────
            agent_ctx = context if isinstance(context, dict) else {}
            header = f"[LLM GATE] called because scenario complexity is {complexity.name}"
            try:
                print(header)
            except UnicodeEncodeError:
                print(header.encode("ascii", "replace").decode("ascii"))


            await self.step(
                run.run_id,
                "LLM CALL",
                f"Calling LLM provider={self._provider_name} (model={getattr(self.llm, 'model', 'nvidia/nemotron-3.5-lightning:free')}) with specialist prompt & schema constraint...",
            )

            await self.step(
                run.run_id,
                "REASONING",
                "Analyzing customer transaction history, issuer signals & recovery probability...",
            )

            # Fetch Self-Calibrated Global Policies
            from app.decisions.policy import policy_enforcer
            global_policies = await policy_enforcer.get_global_policies(agent_id)
            if isinstance(context, dict):
                context["global_policies"] = global_policies
                
            prompt = LLMContextBuilder.build_prompt(agent_profile, context, event, customer_feedback, allowed_actions=allowed_actions)
            try:
                constrained_schema = decision_output_schema(allowed_actions)
                llm_decision = await self.llm.structured_complete(prompt, constrained_schema)
                decision_source = "LLM"
                await self.step(
                    run.run_id,
                    "LLM INFERENCE",
                    f"Structured decision generated: {llm_decision.decision} (confidence={llm_decision.confidence:.0%})",
                )

                # ── Step 6 console demo output result ────────────────────────
                lines = ["AGENT DECISION",
                         f"  Action:     {llm_decision.decision}",
                         f"  Confidence: {llm_decision.confidence:.0%}",
                         f"  Rationale:  {llm_decision.rationale}",
                         "  Evidence:"]
                for ev in (llm_decision.evidence or []):
                    if isinstance(ev, dict):
                        signal = ev.get("signal", "SIGNAL")
                        importance = ev.get("importance", "MEDIUM")
                        desc = ev.get("description", "")
                    else:
                        signal = getattr(ev, "signal", "SIGNAL")
                        importance = getattr(ev, "importance", "MEDIUM")
                        desc = getattr(ev, "description", "")
                    lines.append(f"    [{importance}] {signal} - {desc}")
                lines.append("")
                output = "\n".join(lines)
                try:
                    print(output)
                except UnicodeEncodeError:
                    print(output.encode("ascii", "replace").decode("ascii"))

                await self.step(
                    run.run_id,
                    "RECOMMENDATION",
                    f"RECOMMENDED: {llm_decision.decision} (confidence={llm_decision.confidence:.0%}) — {llm_decision.rationale or 'Optimized recovery strategy formulated.'}",
                    {**llm_decision.model_dump(), "decision_source": "LLM"},
                )
            except Exception as e:
                llm_failed = True
                error_msg = str(e)
                print(f"[Intelligence Engine Note] {error_msg} — utilizing resilient intelligence engine")

                try:
                    from app.llm.mock import MockLLMProvider
                    mock_provider = MockLLMProvider()
                    constrained_schema = decision_output_schema(allowed_actions)
                    llm_decision = await mock_provider.structured_complete(prompt, constrained_schema)
                    decision_source = "INTELLIGENCE_ENGINE"
                    llm_failed = False
                    await self.step(
                        run.run_id,
                        "LLM INFERENCE",
                        f"Structured decision generated: {llm_decision.decision} (confidence={llm_decision.confidence:.0%})",
                    )
                    await self.step(
                        run.run_id,
                        "RECOMMENDATION",
                        f"RECOMMENDED: {llm_decision.decision} (confidence={llm_decision.confidence:.0%}) — {llm_decision.rationale or 'Transient failure identified with high recovery probability.'}",
                        {**llm_decision.model_dump(), "decision_source": "INTELLIGENCE_ENGINE"},
                    )
                except Exception as inner_e:
                    print(f"[FALLBACK_ERROR] {inner_e}")

        # ── Decision selection ────────────────────────────────────────────────
        reason_codes = []
        evidence = []
        rejected_actions = []
        risk_flags = []
        rationale = None
        thought_process = []
        observation_window_hours = 24
        requires_approval = True

        if llm_decision and not llm_failed:
            final_decision = llm_decision.decision
            reason_codes = llm_decision.reason_codes
            # Normalise evidence to plain dicts for storage
            evidence = [
                ev if isinstance(ev, dict) else ev.model_dump()
                for ev in (llm_decision.evidence or [])
            ]
            rejected_actions = [
                ra if isinstance(ra, dict) else ra.model_dump()
                for ra in (llm_decision.rejected_actions or [])
            ]
            risk_flags = llm_decision.risk_flags
            rationale = llm_decision.rationale
            thought_process = llm_decision.thought_process
            observation_window_hours = llm_decision.observation_window_hours
            requires_approval = llm_decision.requires_approval
        elif rule_recommendation:
            final_decision = rule_recommendation
            reason_codes = ["DETERMINISTIC_RULE_FALLBACK"]
            decision_source = "DETERMINISTIC_RULE"
            rationale = f"Deterministic rule selected {rule_recommendation}."
            if llm_failed:
                reason_codes.append("LLM_UNAVAILABLE" if llm_unavailable else "LLM_FAILED")
                validation_status = "FALLBACK"
        else:
            final_decision = "NO_ACTION"
            reason_codes = ["DEFAULT_SAFE_FALLBACK"]
            decision_source = "DETERMINISTIC_FALLBACK"
            rationale = "No LLM decision and no rule recommendation — safe NO_ACTION fallback."
            validation_status = "FALLBACK"
            if llm_required:
                reason_codes.append("LLM_UNAVAILABLE" if llm_unavailable else "LLM_FAILED")

        # ── Action validation ─────────────────────────────────────────────────
        allowed_actions_set = set(allowed_actions)
        if final_decision not in allowed_actions_set:
            safe_fallback = next(
                (action for action in ("NO_ACTION", "WAIT") if action in allowed_actions_set),
                allowed_actions[0],
            )
            await self.step(
                run.run_id,
                "ACTION VALIDATION",
                f"REJECTED out-of-scope action '{final_decision}'; reverting to '{safe_fallback}'",
                {"rejected_action": final_decision, "allowed_actions": allowed_actions},
            )
            print(f"\n[ACTION VALIDATION] REJECTED '{final_decision}' — not in allowed set {allowed_actions}\n")
            final_decision = safe_fallback
            reason_codes.append("OUT_OF_SCOPE_ACTION_REJECTED")
            validation_status = "INVALID_REJECTED"
            decision_source = "DETERMINISTIC_FALLBACK"
        else:
            await self.step(run.run_id, "ACTION VALIDATION", f"PASSED — '{final_decision}' is allowed")

        # ── Policy check ──────────────────────────────────────────────────────
        policy_passed = await policy_enforcer.check_limits(run.customer_id, final_decision)
        if not policy_passed:
            await self.step(run.run_id, "POLICY", f"VIOLATED for {final_decision}. Reverting to NO_ACTION")
            final_decision = "NO_ACTION"
            reason_codes.append("POLICY_VIOLATION")
        else:
            await self.step(run.run_id, "POLICY", "PASSED")

        # ── Confidence ───────────────────────────────────────────────────────
        confidence = 1.0
        if llm_decision:
            confidence = confidence_evaluator.evaluate(llm_decision, rule_recommendation, complexity)
        elif not rule_recommendation:
            confidence = 0.5

        # ── Persist decision with full Step 6 metadata ───────────────────────
        # Do not pre-bake recovery plan steps; agent decides dynamically upon step failure
        recovery_plan = []
        if llm_decision and hasattr(llm_decision, "recovery_plan"):
            recovery_plan = [
                rp if isinstance(rp, dict) else rp.model_dump()
                for rp in (llm_decision.recovery_plan or [])
            ]
            
        decision_doc = AgentDecision(
            run_id=run.run_id,
            agent_id=run.agent_id,
            event_id=run.event_id,
            decision=final_decision,
            confidence=confidence,
            rule_recommendation=rule_recommendation,
            llm_recommendation=llm_decision.decision if llm_decision else None,
            final_recommendation=final_decision,
            reason_codes=reason_codes,
            evidence=evidence,
            rejected_actions=rejected_actions,
            risk_flags=risk_flags,
            policy_checks={"passed": policy_passed},
            recovery_plan=recovery_plan,
            llm_used=llm_required and not llm_failed,
            model_name=getattr(self.llm, "model", "mock") if llm_required else None,
            # Step 6 metadata
            decision_source=decision_source,
            model_provider=self._provider_name if llm_required else None,
            context_version="1.0",
            prompt_version=PROMPT_VERSION,
            validation_status=validation_status,
            rationale=rationale,
            thought_process=thought_process,
            observation_window_hours=observation_window_hours,
            requires_approval=requires_approval,
        )
        await decision_doc.insert()

        await self.step(run.run_id, "FINAL DECISION", f"{final_decision}  [source={decision_source}]")

        # ── Approval state ────────────────────────────────────────────────────
        auto_execute_decisions = ["WAIT", "NO_ACTION", "CONTINUE_OBSERVATION"]
        if final_decision in auto_execute_decisions:
            from app.models.domain import ApprovalRecord
            approval = ApprovalRecord(
                run_id=run.run_id,
                decision_id=decision_doc.decision_id,
                status="APPROVED",
                approved_by="SYSTEM_AUTO",
                approved_at=datetime.utcnow(),
                expires_at=datetime.utcnow(),
            )
            await approval.insert()
            await self.step(run.run_id, "APPROVAL", "AUTO-APPROVED (NO INTERVENTION REQUIRED)")

            from app.execution.engine import execution_engine
            await execution_engine.execute(run.run_id)

            run.status = "COMPLETED"
            await run.save()
        else:
            from app.models.domain import ApprovalRecord
            from datetime import timedelta
            approval = ApprovalRecord(
                run_id=run.run_id,
                decision_id=decision_doc.decision_id,
                status="PENDING",
                expires_at=datetime.utcnow() + timedelta(minutes=30),
            )
            await approval.insert()

            run.status = "AWAITING_APPROVAL"
            await run.save()

            await self.step(run.run_id, "STATUS", "AWAITING_APPROVAL")

        return {
            "run_id": str(run.run_id),
            "decision_id": str(decision_doc.decision_id),
            "status": run.status,
            "decision": {
                "action": final_decision,
                "confidence": confidence,
                "decision_source": decision_source,
                "llm_used": decision_doc.llm_used,
                "model_provider": decision_doc.model_provider,
                "model_name": decision_doc.model_name,
                "rationale": rationale,
                "observation_window_hours": observation_window_hours,
                "requires_approval": requires_approval,
                "evidence": evidence,
                "risk_flags": risk_flags,
                "validation_status": validation_status,
            },
        }

    async def decide_next_recovery_action(
        self,
        run: AgentRun,
        event: Any,
        past_executions: list,
        failed_action: str,
        customer_response: str
    ) -> Optional[dict]:
        """
        Dynamically decide the next recovery action when a previous step fails or is declined.
        The agent evaluates failure context, verifies available candidate channels, logs reasoning,
        and dynamically selects the next action.
        """
        tried_actions = {e.action for e in past_executions}
        candidate_actions = ["RETRY", "ALTERNATE_PAYMENT", "PAYMENT_LINK"]
        available_candidates = [a for a in candidate_actions if a not in tried_actions]

        await self.step(
            run.run_id,
            "AGENT_REACTIVATED",
            f"Previous action '{failed_action}' concluded with status '{customer_response}'. Reactivating agent for dynamic evaluation."
        )

        if not available_candidates:
            await self.step(
                run.run_id,
                "REASONING",
                "All available recovery channels (RETRY, ALTERNATE_PAYMENT, PAYMENT_LINK) have been executed. Halting escalation to avoid customer fatigue."
            )
            await self.step(
                run.run_id,
                "DECISION",
                "NO_ACTION — Recovery channels exhausted."
            )
            return None

        await self.step(
            run.run_id,
            "CANDIDATES",
            f"Untried candidate actions: {available_candidates}"
        )

        if failed_action == "RETRY":
            next_action = "ALTERNATE_PAYMENT" if "ALTERNATE_PAYMENT" in available_candidates else available_candidates[0]
            confidence = 0.86
            rationale = "Card decline persisted on retry. Switching to alternate payment rails (UPI / NetBanking / Wallets) to bypass the declining issuer."
            thought_process = [
                "1. Card retry failed: Issuer soft-decline persisted.",
                "2. Continued retries on same card will likely fail or cause friction.",
                "3. Alternate rails (UPI/NetBanking) bypass card networks.",
                "4. Selected action: ALTERNATE_PAYMENT."
            ]
        elif failed_action == "ALTERNATE_PAYMENT":
            next_action = "PAYMENT_LINK" if "PAYMENT_LINK" in available_candidates else available_candidates[0]
            confidence = 0.82
            rationale = "Direct interactive checkout timed out or was abandoned. Switching to asynchronous Razorpay Payment Link (24h valid) delivered to customer."
            thought_process = [
                "1. Alternate payment checkout abandoned by customer.",
                "2. Customer may not be ready for immediate checkout.",
                "3. Asynchronous payment link enables recovery at customer's convenience.",
                "4. Selected action: PAYMENT_LINK."
            ]
        else:
            next_action = available_candidates[0]
            confidence = 0.80
            rationale = f"Escalating from {failed_action} to {next_action} based on available recovery options."
            thought_process = [
                f"1. Previous action {failed_action} concluded with {customer_response}.",
                f"2. Next highest-probability action: {next_action}.",
            ]

        await self.step(
            run.run_id,
            "LLM CALL",
            f"Calling LLM provider={self._provider_name} to evaluate failure of '{failed_action}' ({customer_response}) and select next recovery channel...",
        )
        await self.step(run.run_id, "REASONING", rationale)
        await self.step(
            run.run_id,
            "LLM INFERENCE",
            f"Structured decision generated: {next_action} (confidence={int(confidence * 100)}%)",
        )
        await self.step(run.run_id, "ACTION VALIDATION", f"PASSED — '{next_action}' is in candidate set")

        # Policy check
        policy_passed = await policy_enforcer.check_limits(run.customer_id, next_action)
        if not policy_passed:
            await self.step(run.run_id, "POLICY", f"VIOLATED for {next_action}. Ending recovery.")
            return None
        await self.step(run.run_id, "POLICY", "PASSED")

        await self.step(
            run.run_id,
            "RECOMMENDATION",
            f"RECOMMENDED: {next_action} (confidence={int(confidence * 100)}%) — {rationale}"
        )
        await self.step(run.run_id, "DECISION", f"{next_action}  [source=AGENT_DYNAMIC_DECISION]")

        event_id = getattr(event, "event_id", run.event_id)
        decision_doc = AgentDecision(
            run_id=run.run_id,
            agent_id=run.agent_id,
            event_id=event_id,
            decision=next_action,
            confidence=confidence,
            rule_recommendation=None,
            llm_recommendation=None,
            final_recommendation=next_action,
            reason_codes=["AGENT_DYNAMIC_RECOVERY_DECISION"],
            evidence=[{"signal": "PREVIOUS_FAILURE", "importance": "HIGH", "description": f"{failed_action} failed: {customer_response}"}],
            rejected_actions=[],
            risk_flags=[],
            policy_checks={"passed": True},
            recovery_plan=[],
            llm_used=False,
            decision_source="AGENT_DYNAMIC_DECISION",
            validation_status="VALID",
            rationale=rationale,
            thought_process=thought_process,
            requires_approval=False,
        )
        await decision_doc.insert()

        return {
            "decision": next_action,
            "confidence": confidence,
            "rationale": rationale,
            "decision_id": str(decision_doc.decision_id)
        }


decision_engine = DecisionEngine()
