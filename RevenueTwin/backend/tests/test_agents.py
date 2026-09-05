import pytest
from app.agents.registry import agent_registry
from app.agents import register_all_agents
from app.agents.base import BaseAgent


def test_registry_has_10_agents():
    register_all_agents()
    agents = agent_registry.list_agents()
    assert len(agents) == 10


def test_all_agents_have_unique_ids():
    register_all_agents()
    agents = agent_registry.list_agents()
    ids = set(a.agent_id for a in agents)
    assert len(ids) == 10


def test_all_implement_base_agent():
    register_all_agents()
    agents = agent_registry.list_agents()
    for a in agents:
        assert isinstance(a, BaseAgent)


@pytest.mark.asyncio
async def test_event_routing():
    register_all_agents()

    # Maps event_type → real agent_id (no "agent_" prefix)
    event_mappings = {
        "PAYMENT_FAILED": "payment_recovery",
        "PAYMENT_DEGRADATION": "payment_degradation",
        "CHECKOUT_DROPOFF": "checkout_recovery",
        "CART_ABANDONMENT": "cart_recovery",
        "SUBSCRIPTION_PAYMENT_FAILURE": "subscription_recovery",
        "SUBSCRIPTION_CHURN_RISK": "churn_prevention",
        "RECEIVABLE_OVERDUE": "receivables",
        "MANDATE_FAILURE": "mandate_recovery",
        "PROMISE_TO_PAY_BROKEN": "promise_to_pay",
        "VOICE_RECOVERY_REQUIRED": "voice_recovery",
    }

    for event_type, expected_id in event_mappings.items():
        agent = agent_registry.get_agent_for_event(event_type)
        assert agent is not None, f"Agent not found for {event_type}"
        assert agent.agent_id == expected_id, (
            f"For {event_type}: expected '{expected_id}' but got '{agent.agent_id}'"
        )


@pytest.mark.asyncio
async def test_unsupported_event_routing():
    register_all_agents()
    agent = agent_registry.get_agent_for_event("UNKNOWN_EVENT")
    assert agent is None
