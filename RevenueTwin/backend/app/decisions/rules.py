from typing import Optional, Any

class DeterministicRuleEvaluator:
    @staticmethod
    def evaluate(event: dict, context: Any, agent_profile: Any) -> Optional[str]:
        # Simple evaluation by delegating to the agent's built-in rule python function if it exists.
        # Alternatively, we could parse the text rules. For now, agent profile can supply a callable.
        if hasattr(agent_profile, "evaluate_rules") and callable(agent_profile.evaluate_rules):
            return agent_profile.evaluate_rules(event, context)
            
        return None

rule_evaluator = DeterministicRuleEvaluator()
