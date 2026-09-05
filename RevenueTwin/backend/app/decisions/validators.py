from app.llm.schemas import DecisionOutputBase as DecisionOutput

class DecisionConfidenceEvaluator:
    @staticmethod
    def evaluate(llm_decision: DecisionOutput, rule_decision: str, complexity: str) -> float:
        confidence = llm_decision.confidence
        
        # If rules disagreed with LLM, reduce confidence
        if rule_decision and rule_decision != llm_decision.decision:
            confidence -= 0.2
            
        if complexity == "HIGH":
            confidence -= 0.1
            
        return max(0.0, min(1.0, confidence))

confidence_evaluator = DecisionConfidenceEvaluator()
