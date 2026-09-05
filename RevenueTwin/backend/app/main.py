from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path

# Load local development credentials before importing the decision engine.
# .env is intentionally ignored and must never be committed.
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from app.db.connection import init_db
from app.agents import register_all_agents
from app.api.endpoints import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    register_all_agents()
    
    from app.simulation.monitor import proactive_monitor
    await proactive_monitor.start()
    
    yield
    
    await proactive_monitor.stop()

app = FastAPI(lifespan=lifespan, title="RevenueTwin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(api_router, prefix="/api")
