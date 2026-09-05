# Data Model Documentation

This document describes the primary data structures that support RevenueTwin's Step 2 (Customer Intelligence).

## Core Collections
- **customers**: Stable identity information (name, email, archetype).
- **products**: E-commerce / Subscription products and pricing details.

## Behavioral Collections
- **carts** & **cart_items**: Tracks add-to-cart events, cart values, and abandonment.
- **checkout_sessions**: Tracks progress through checkout steps (CART -> CONFIRMATION) and session duration.
- **orders** & **order_items**: Confirmed purchases representing gross revenue.
- **payments**: All transaction attempts, including failures, success, and payment methods (e.g. UPI, CREDIT_CARD).
- **returns** & **refunds**: Records of product returns and corresponding refunded amounts, reducing net revenue.

## Subscription & B2B
- **subscriptions** & **subscription_events**: Tracks recurring revenue plans, status, and lifecycle events (PAUSED, CANCELLED).
- **invoices**: B2B billing records, tracking due dates and days overdue.
- **promise_to_pay**: Commitments to settle invoices, used to derive reliability (broken vs. fulfilled promises).

## Communication & Actions
- **notifications**: Records of outbound comms (EMAIL, SMS) and user engagement (OPENED, IGNORED) to determine fatigue.
- **recovery_actions**: Historical records of agent interventions and their outcomes.

These collections form the foundational history that the `FeatureCalculator` uses to compute dynamic metrics in the `CustomerContext` packet.
