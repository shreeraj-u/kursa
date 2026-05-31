# Kursa Deep Profiling — Current State & Path Forward

**Purpose:** Strategy doc for product/engineering — how Kursa approaches deep profiling and the path to a true learning advisor.  
**Date:** May 2026

---

## Executive summary

Kursa has a strong static profile model and a compute-then-interpret pattern in insights. The gap is **persistent memory**: episodic log, semantic memories, and automatic profile enrichment. The intelligence layer build closes that gap.

**Mental model shift:** What event happened → persist → compute → update profile → distill memory → retrieve context → LLM narrates.

---

## Three layers

| Layer | Storage | Role |
|-------|---------|------|
| Structural profile | Prisma Profile + relations | Queryable facts |
| Episodic log | `CareerEvent` | Timestamped career activity |
| Semantic memory | `UserMemory` | Distilled facts with provenance |

---

## Current gaps

- Observations in RAM only
- Resume data partially discarded on onboarding
- No check-ins or journal persistence
- AI reads static snapshots only

---

## Build sequence

1. Schema + intake fixes  
2. Event ingestion + profile deltas + context assembler  
3. Journal + check-ins UI  
4. Memory distillation  
5. Background jobs (BullMQ)  
6. Review prep + relevance + path regen prompts  

See [intelligence-layer.md](./intelligence-layer.md) for implementation detail.
