"""
Step 6 canonical decision output schema.

Evidence items use {signal, importance, description} (not {signal, value})
as specified in the Step 6 requirements. All specialist agents share this
output contract but are constrained to their own allowed action set via
the dynamic schema factory.
"""
from pydantic import BaseModel, Field, create_model
from typing import List, Dict, Any, Optional, Literal, Type


class EvidenceItem(BaseModel):
    """A single structured evidence signal returned by the LLM."""
    signal: str          # e.g. "HIGH_PURCHASE_INTENT"
    importance: str      # "HIGH" | "MEDIUM" | "LOW"
    description: str     # concise, human-readable explanation (no CoT)


class RejectedAction(BaseModel):
    action: str
    reason: str


class RecoveryStepBase(BaseModel):
    """A future step in a temporal recovery plan."""
    action: str
    delay_hours: int
    condition: str


class DecisionOutputBase(BaseModel):
    """Canonical Step 6 LLM decision output — all specialist agents."""
    decision: str
    confidence: float = Field(ge=0.0, le=1.0)

    # Multi-step planning
    recovery_plan: List[RecoveryStepBase] = Field(default_factory=list)

    # Step 6 evidence format: structured signal cards, not plain reason_codes
    evidence: List[EvidenceItem] = Field(default_factory=list)
    thought_process: List[str] = Field(default_factory=list)
    rationale: str = ""                    # concise decision rationale (no CoT)
    observation_window_hours: int = 24     # how long to observe before re-evaluating
    requires_approval: bool = True         # must a human approve this action?

    # Backwards-compatible fields kept for internal engine use
    reason_codes: List[str] = Field(default_factory=list)
    rejected_actions: List[RejectedAction] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)
    next_step: str = "REQUEST_APPROVAL"


def decision_output_schema(allowed_actions: List[str]) -> Type[DecisionOutputBase]:
    """
    Return a constrained schema whose `decision` field is a Literal of this
    agent's allowed actions. This ensures the LLM cannot select an action
    outside its policy even if structured output is bypassed.
    """
    if not allowed_actions:
        raise ValueError("An agent must define at least one candidate action")
    action_literal = Literal.__getitem__(tuple(allowed_actions))
    
    # Constrain both the primary decision and the recovery plan steps
    ConstrainedRecoveryStep = create_model(
        "AgentConstrainedRecoveryStep",
        __base__=RecoveryStepBase,
        action=(action_literal, ...),
    )
    
    return create_model(
        "AgentConstrainedDecisionOutput",
        __base__=DecisionOutputBase,
        decision=(action_literal, ...),
        recovery_plan=(List[ConstrainedRecoveryStep], Field(default_factory=list))
    )
