# FinQuest — AMAD 2026 pitch

## One sentence

FinQuest is gamified financial education for Saudi young adults: try a major commitment before signing it, compare three calculated futures, and turn the insight into one small self-reported quest with an explainable future-self companion.

## The problem

A budgeting dashboard explains where money went. It does not make the emotional trade-off in a new five-year commitment feel concrete. Young adults can see that a payment fits today while missing the balloon reserve, emergency-fund pressure, goal delay, and opportunity cost that follow.

## The mechanism

1. Enter a short personal snapshot and optional goal amount, or load Sara's synthetic demo profile.
2. Adjust a real-feeling car offer: price, deposit, term, and final payment.
3. A deterministic 120-month engine compares financing now, buying a practical used car, and building the deposit first.
4. Optional sensitivity presets start from the calm baseline and show how one deliberately changed assumption shifts the modeled result.
5. Fِي, the future-self companion, gives a short grounded Arabic explanation. AI can explain supplied facts; it never calculates the figures.
6. The user starts one of four local quests, records progress, confirms completion, and sees XP, consistency, badges, and a modeled before/after effect.

## Why it is distinctive

The interface is not another fintech dashboard. The same recognizable future self reacts across paths and moods, so an abstract trade-off becomes a conversation with the person who inherits it. The experience stays trustworthy because the emotional layer never owns the mathematics.

## AMAD fit

- **Financial education:** a major commitment becomes an understandable simulation.
- **Gamification:** selectable quests create a complete start–progress–complete–reward loop.
- **Generative AI for fintech:** a guarded low-cost model explains deterministic facts in Arabic.
- **Customer experience:** short onboarding, Saudi conversational copy, RTL, responsive layouts, and graceful offline fallback.
- **Data analysis:** three paths plus scenario sensitivity expose causality, not a decorative score.

AMAD officially lists these relevant tracks and evaluates innovation, technical implementation, data analysis, user experience, and feasibility: [official AMAD site](https://amad.tuwaiq.edu.sa/).

## Feasibility and bank path

This hackathon prototype uses local profiles and synthetic data; it does not claim an Alinma partnership or move money. A production path could add consented open-banking inputs, bank-approved product schedules, authenticated quest verification, and bank-side guardrails. The deterministic engine and compact AI facts boundary remain useful in that architecture.

## Success metrics

- Users who complete one decision comparison.
- Users who can correctly explain installment versus effective monthly vehicle obligation.
- Quest start, progress, and self-reported completion rates.
- Change in confidence before and after comparing paths.
- AI fallback rate and contradiction rate (target: zero displayed numeric contradictions).

## Truthful implementation boundary

Implemented and deployed at https://finquest-app-mu.vercel.app/: personal/demo onboarding, migrated local persistence, active goal timing, keyboard-safe car-offer editing, three deterministic futures, baseline-first sensitivity comparisons, intent-aware quest CTAs, guarded OpenRouter endpoint, deterministic fallback, accessible modal dialogs, expressive local SVG future self, and complete local quest progression.

Not implemented: authentication, real bank accounts, live product pricing, money movement, behavior verification, human usability results, or an official bank partnership.
