# Customer Intelligence Layer

## Overview
The Customer Intelligence Layer is responsible for translating raw event history (orders, payments, checkouts, etc.) into structured evidence that specialist agents can use to make deterministic recovery decisions.

## Architecture

1. **CustomerIntelligenceService (`app/intelligence/service.py`)**
   The primary access point. Agents will not query raw database collections directly. Instead, they request a `CustomerContext` which contains a synthesized timeline and pre-calculated features.

2. **FeatureCalculator (`app/intelligence/features.py`)**
   A deterministic engine that takes arrays of historical events and computes behavior metrics (e.g. `payment_success_rate`, `notification_fatigue`).

3. **CustomerContext (`app/intelligence/schemas.py`)**
   The standardized "packet" of evidence sent to the agent's decision engine.

## Usage
```python
from app.intelligence.service import intelligence_service

context = await intelligence_service.get_customer_context(customer_id)
# context.relevant_behavior_features.payment_success_rate
# context.recent_history (Timeline)
# context.risk_signals
```

## Constraints
- Do not pass the entire database history to agents (LLMs). Use the synthesized `CustomerContext`.
- Features must be derived strictly from actual historical events, never assigned arbitrarily.
