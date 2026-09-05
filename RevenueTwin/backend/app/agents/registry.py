from typing import Dict, List, Optional
from app.agents.base import BaseAgent

class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}

    def register(self, agent: BaseAgent):
        self._agents[agent.agent_id] = agent

    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        return self._agents.get(agent_id)

    def get_agent_for_event(self, event_type: str) -> Optional[BaseAgent]:
        target = event_type.lower()
        for agent in self._agents.values():
            supported = [e.lower() for e in agent.supported_event_types]
            if target in supported:
                return agent
        return None

    def list_agents(self) -> List[BaseAgent]:
        return list(self._agents.values())

agent_registry = AgentRegistry()
