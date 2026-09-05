import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from mongomock_motor import AsyncMongoMockClient
from beanie import init_beanie
from app.models.domain import (
    Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
    Payment, Return, Refund, Subscription, SubscriptionEvent,
    Invoice, PromiseToPay, Notification, RecoveryAction,
    RevenueEvent, AgentModel, AgentRun, AgentDecision, AgentTrace,
    AgentMemory, ApprovalRecord, ExecutionRecord, ActionOutcome,
    SimulationState, AuditLog,
)

ALL_DOCUMENT_MODELS = [
    Customer, Product, Order, OrderItem, Cart, CartItem, CheckoutSession,
    Payment, Return, Refund, Subscription, SubscriptionEvent,
    Invoice, PromiseToPay, Notification, RecoveryAction,
    RevenueEvent, AgentModel, AgentRun, AgentDecision, AgentTrace,
    AgentMemory, ApprovalRecord, ExecutionRecord, ActionOutcome,
    SimulationState, AuditLog,
]


@pytest.fixture(scope="function", autouse=True)
async def init_mock_db():
    client = AsyncMongoMockClient()
    await init_beanie(
        document_models=ALL_DOCUMENT_MODELS,
        database=client.get_database("test_db"),
    )


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
