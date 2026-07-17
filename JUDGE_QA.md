# Judge Q&A

## Is this a budgeting app?

No. Budget data is the starting material. The product's core is decision rehearsal: it connects one commitment to cash-flow pressure, liquidity, goal timing, opportunity cost, future-self explanation, and a behavioral quest.

## Where is the AI?

The optional `/api/explain` server function sends a compact calculated-facts object to `google/gemini-3.1-flash-lite`. The model may explain those facts in short Arabic. It cannot receive the full profile or user-written chat, calculate new figures, add unapproved numbers, or give advice. A complete deterministic response is always available.

The route is live on the submission URL. Invalid requests are rejected before any provider call, and the browser bundle contains no server key.

## What happens if AI fails or the budget is exhausted?

Nothing in the decision flow breaks. The chat shows the local grounded explanation and labels it as local. Calls are deliberate, cached, short, rate-limited, timed out, and bounded to 120 output tokens.

## Are the financial results trustworthy?

They are reproducible outputs of a transparent educational model, not promises. Inputs and assumptions are visible. The engine models 120 months of income growth, spending inflation, savings/investment growth, financing, balloon reserve, debt service, depreciation, shortfall, goal timing, and liquidity. A monthly existing-debt input uses a disclosed 12-month educational approximation because remaining term/balance is not collected. It is not a certified affordability or credit model.

## Is that a real Alinma offer or customer profile?

No. FinQuest is labeled as an AMAD hackathon prototype. Sara is synthetic. Personal values stay in local browser storage, and personal age/city are not invented. Financing uses a visible educational effective-rate assumption, not a live quote, approval, or bank product schedule.

## Does completing a quest prove behavior or move money?

No. Progress and completion are explicitly self-reported inside the prototype. No bank account, payment, or transfer is connected. A production bank integration could verify an opt-in action with consent.

## Why only the car decision?

It is one complete vertical slice with enough depth to survive scrutiny. The same architecture can support housing, travel, and investment later, but showing four unfinished engines would weaken the MVP.

## What data-analysis capability is demonstrated?

Three deterministic paths, a monthly timeline, liquidity/pressure metrics, opportunity cost, goal timing, unfunded shortfall, and sensitivity presets that change one assumption and rerun the engine.

## How is privacy handled?

The prototype has no backend profile store or authentication. Profile and progress data stay in local storage. The AI payload excludes name, city, occupation, transactions, and full profile data. Only the API route sees the server key.

## What must change for production?

Regulatory and model validation; authenticated encrypted storage; consent and data-retention controls; bank-approved product/fee inputs; distributed abuse controls; accessibility and security audits; human usability testing; and explicit bank/legal approval for any brand or product claim.
