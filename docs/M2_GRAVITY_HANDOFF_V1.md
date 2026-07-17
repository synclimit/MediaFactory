# MediaFactory M2 - Gravity Handoff V1

## Purpose

This document defines development guardrails for Mode 2 implementation.

The goal is to prevent the same issues encountered during M1 development.

---

# Rule 01

Build Sequentially

Do NOT build all M2 features simultaneously.

Development order must follow:

Task 01

↓

Task 02

↓

Task 03

↓

...

↓

Task 15

No skipping.

---

# Rule 02

No Hidden Logic

Every major decision must be visible in UI.

Examples:

Output Count

AI Recommendation

Shuffle Strength

Validation Status

Queue Status

Users should never wonder:

"Why did the system do this?"

---

# Rule 03

Validation First

Validation logic must be implemented before queue integration.

Priority:

Validation

↓

Queue

↓

Rendering

Never reverse this order.

---

# Rule 04

Single Source of Truth

Source Pool is the only source collection.

Do not create:

temporary source arrays

shadow source states

duplicate source stores

All systems must read from Source Pool.

---

# Rule 05

Global Audio Profile

Audio Processing Profile is global.

Never create:

per-track processing

per-output processing

hidden audio overrides

for M2 V1.

---

# Rule 06

Preview Is Source-Based

Preview must use source tracks.

Preview must NOT use generated outputs.

Reason:

Output generation may create dozens of outputs.

Previewing outputs would be inefficient.

---

# Rule 07

No Silent Failures

Every blocked action must provide feedback.

Examples:

Queue blocked

Invalid naming

Missing sources

Duplicate names

User must always know why.

---

# Rule 08

Create New Configuration

Must reset:

Sources

Metadata

Processing

Naming

Preview

Planner

Validation

Temporary calculations

Must NOT reset:

Queue

Pipeline

Completed jobs

---

# Rule 09

Queue Safety

Queue must never accept:

invalid configurations

empty outputs

duplicate queue items

corrupted payloads

---

# Rule 10

Configuration Signature

Queue duplicate detection must use:

Configuration Signature

instead of only output filenames.

Signature should include:

Sources

Audio Profile

Target Duration

Output Count

Naming Mode

Shuffle Strength

Output Diversity

---

# Rule 11

Developer Mode

Debug panels must exist.

Examples:

Source Count

Output Count

Validation State

Queue Signature

Duplicate Detection

Planner Statistics

Developer Mode only.

Hidden in production.

---

# Rule 12

Acceptance Test Driven Development

No feature may be marked complete until:

M2_ACCEPTANCE_TEST_V1.md

passes.

---

# Rule 13

Pipeline Compatibility

M2 queue objects must remain compatible with:

Existing Pipeline

Existing Queue

Existing Rendering System

No breaking changes.

---

# Rule 14

Future Expansion

M2 V1 must leave room for:

M2 Advanced Processing

M4 Cover System

M5 AI Audio Features

without major architecture rewrites.

---

# Definition Of Done

M2 is complete only when:

All implementation tasks completed.

All acceptance tests passed.

No critical bugs remain.

No queue corruption exists.

No reset failures exist.

No duplicate queue insertion exists.

Only then may M2 be marked:

READY FOR PRODUCTION.
