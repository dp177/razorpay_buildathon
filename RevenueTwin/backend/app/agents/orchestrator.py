from typing import Dict, Any
from app.events.schemas import RevenueEventSchema
from app.agents.registry import agent_registry
from app.models.domain import AgentRun, AgentTrace, RevenueEvent
from app.events.event_store import event_deduplicator, event_prioritizer
from app.events.event_bus import event_bus
from app.intelligence.service import intelligence_service
from datetime import datetime
import asyncio

class MasterRevenueOrchestrator:
    def __init__(self):
        # We don't subscribe to event.normalized here because the API endpoints
        # call process_event directly to get a synchronous return value.
        pass
        
    async def log_trace(self, run_id, stage, message, metadata=None, event_type=None):
        trace = AgentTrace(
            run_id=run_id,
            stage=stage,
            message=message,
            metadata=metadata or {},
            event_type=event_type
        )
        await trace.insert()
        print(f"[{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] {stage}\n{message}\n")

    async def handle_normalized_event(self, event_data: dict):
        event = RevenueEventSchema(**event_data)
        # 1. Deduplicate
        if event_deduplicator.is_duplicate(event):
            await event_bus.publish("event.duplicate", event.model_dump())
            return {"status": "DUPLICATE_EVENT"}
            
        # 2. Priority
        priority = event_prioritizer.calculate_priority(event)
        
        # 3. Find specialist agent
        agent = agent_registry.get_agent_for_event(event.event_type)
        if not agent:
            await event_bus.publish("event.unsupported", event.model_dump())
            return {"status": "UNSUPPORTED_EVENT"}
            
        # 4. Save the event in DB
        db_event = RevenueEvent(**event.model_dump())
        await db_event.insert()
        
        # 5. Create AgentRun
        run = AgentRun(
            agent_id=agent.agent_id,
            event_id=db_event.event_id,
            customer_id=event.customer_id,
            status="QUEUED",
            priority=priority
        )
        await run.insert()
        
        await self.log_trace(run.run_id, "EVENT", f"{event.event_type} detected", {"priority": priority}, event.event_type)
        
        # 6. Emit agent.started
        run.status = "STARTING"
        await run.save()
        await self.log_trace(run.run_id, "ROUTING", f"{agent.name} selected")
        await event_bus.publish("agent.started", {"run_id": str(run.run_id)})
        
        # 7. Request Context
        run.status = "CONTEXT_RETRIEVAL"
        await run.save()
        await self.log_trace(run.run_id, "CONTEXT", f"Customer intelligence context requested")
        await event_bus.publish("agent.context_requested", {"run_id": str(run.run_id)})
        
        try:
            # Fetch specialist context — each agent gets ONLY its own data
            context = await intelligence_service.get_specialist_context(event.customer_id, agent.agent_id)
            
            # Context size varies by agent type
            context_summary = context.get("agent", agent.agent_id) if isinstance(context, dict) else str(type(context).__name__)
            
            await self.log_trace(run.run_id, "CONTEXT", f"Specialist context built for {agent.name}", {"agent": agent.agent_id})
            await event_bus.publish("agent.context_retrieved", {"run_id": str(run.run_id), "agent": agent.agent_id})
            
            # 8. Ready for decision
            run.status = "READY_FOR_DECISION"
            await run.save()
            await self.log_trace(run.run_id, "AGENT", "Ready for decision")
            await event_bus.publish("agent.ready_for_decision", {"run_id": str(run.run_id)})
            
            return {
                "status": "SUCCESS",
                "run_id": str(run.run_id),
                "agent_id": agent.agent_id
            }
            
        except Exception as e:
            run.status = "FAILED"
            await run.save()
            await self.log_trace(run.run_id, "AGENT", f"Failed: {str(e)}")
            await event_bus.publish("agent.failed", {"run_id": str(run.run_id), "error": str(e)})

    async def process_event(self, event: RevenueEventSchema):
        # Entry point for direct API calls to ensure it gets normalized/published
        await event_bus.publish("event.detected", event.model_dump())
        
        # In a fully decoupled system, we would just publish 'event.normalized'
        # and let the subscriber handle it. But to return the result to the HTTP 
        # response instantly, we call it directly and manually emit the bus event.
        res = await self.handle_normalized_event(event.model_dump())
        await event_bus.publish("event.normalized", event.model_dump())
        return res

master_orchestrator = MasterRevenueOrchestrator()
