# Tiding Agent Packet

This directory contains the overnight build packet for a clean-room rewrite of
the Inker-style backend for TRMNL e-ink screens.

Start with:

- `overnight-agent-prompt.md` for the local agent entry prompt.
- `medium-model-playbook.md` for cheaper-model execution rules and handoff
  shape.
- `physical-device-verification.md` for the final ST-10/ST-12 TRMNL evidence
  runbook.
- `protocol.md` for clean-room and dirty-room boundaries.
- `architecture.md` for the target system shape.
- `product-stories.md` for the user-story inventory and reproduction targets.
- `completion-criteria.md` for the final gates.

Default execution should use a medium-cost model. Keep work in small,
story-linked slices with explicit checks and evidence. Write handoffs as if the
next agent has no chat history and only average planning ability: exact story,
exact gap, exact files, exact checks, exact evidence, and exact stop rule.
Escalate to a stronger model only for clean-room/legal ambiguity, new dependency
or architecture decisions, repeated failures, multi-page visual design judgment,
or final completion review.

Medium-model work must not receive broad tasks such as "finish the UI",
"polish the designer", or "complete frontend parity" without a concrete story
ID, route, behavior, screenshot/API/test target, and a small file set. Split
those requests into several bounded slices before implementation.

At the current stage, most remaining work should be framed as medium-model
verification slices. Prefer proving or fixing ST-10 and ST-12 with exact
device/browser/BMP evidence over reopening broad planning, architecture, or UI
framework decisions.

The intended project license is Apache-2.0. The previous fork/original project
must be treated as GPL-contaminated for clean-room work unless a specific file is
documented as authored by this project owner and handled by the dirty-room path.
