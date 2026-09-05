import asyncio
import random
from typing import Dict, Any

class ProactiveMonitor:
    def __init__(self):
        self.running = False
        self.interval = 10 # Check every 10 seconds (for demo)
        self.current_success_rate = 0.95
        self.threshold = 0.60
        
    async def start(self):
        print("[ProactiveMonitor] Starting background monitoring daemon...")
        self.running = True
        asyncio.create_task(self._loop())
        
    async def stop(self):
        self.running = False
        
    async def _loop(self):
        while self.running:
            await asyncio.sleep(self.interval)
            
            # Simulate a fluctuating success rate
            # In a real system, this would query a TSDB or stream processing engine
            fluctuation = random.uniform(-0.05, 0.05)
            self.current_success_rate = max(0.0, min(1.0, self.current_success_rate + fluctuation))
            
            # Occasionally force a big drop for demo purposes
            if random.random() < 0.05:
                self.current_success_rate -= 0.40
                
            print(f"[ProactiveMonitor] Global Payment Success Rate: {self.current_success_rate*100:.1f}%")
            
            if self.current_success_rate < self.threshold:
                print(f"[ProactiveMonitor] ALARM! Success rate dropped below {self.threshold*100}%! Triggering Agent...")
                await self._trigger_agent()
                
                # Reset rate so we don't spam
                self.current_success_rate = 0.95
                
    async def _trigger_agent(self):
        from app.events.event_engine import event_engine
        
        event_payload = {
            "amount_at_risk": 50000.0, 
            "metadata": {
                "system_level_anomaly": True,
                "current_rate": self.current_success_rate,
                "affected_gateways": ["razorpay", "stripe"],
                "reason": "Sudden drop in authorization rates on BIN 411111"
            }
        }
        
        # Fire a PAYMENT_DEGRADATION event, which the orchestrator maps to the Payment Degradation Agent
        # We need a system-level customer ID for this, or we can just use a dummy one
        import uuid
        from app.models.domain import Customer
        
        # Find or create a 'system' customer for global events
        system_customer = await Customer.find_one(Customer.email == "system@merchant.local")
        if not system_customer:
            system_customer = Customer(
                name="System Operations",
                email="system@merchant.local",
                phone="+0000000000",
                customer_segments=["SYSTEM"],
                behavior_profile={},
                current_state={"status": "ACTIVE"}
            )
            await system_customer.insert()
            
        from app.models.domain import RevenueEvent
        event = RevenueEvent(
            customer_id=system_customer.id,
            merchant_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
            event_type="PAYMENT_DEGRADATION",
            amount_at_risk=0.0
        )
        
        # Clear deduplication just in case
        from app.events.event_store import event_deduplicator
        dedup_key = f"{event.customer_id}:{event.event_type}"
        event_deduplicator.seen_events.pop(dedup_key, None)
        
        await event_engine.publish_event(event)

proactive_monitor = ProactiveMonitor()
