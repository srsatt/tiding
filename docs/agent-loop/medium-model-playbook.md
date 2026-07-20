# Medium-Model Playbook

Use this playbook when running a cheaper or lower-quality model. The goal is to
remove guesswork, not to lower the quality bar.

## Default Scope

Pick exactly one slice:

- one product story from `docs/agent-loop/product-stories.md`; or
- one backlog item from `docs/backlog.md`; or
- one failing test/build/browser check.

Do not accept broad tasks such as "finish UI", "polish designer", "clean
architecture", "close remaining stories", or "improve frontend". Split them
before editing.

For the current late-stage project state, default to verification and closure
slices rather than replanning. A medium model should be able to handle:

- ST-10 captive-portal/device-onboarding evidence collection.
- ST-12 physical TRMNL 1-bit BMP/display evidence collection.
- focused regressions discovered while collecting that evidence.
- small documentation fixes that make the current evidence easier to audit.

For ST-10/ST-12, follow
`docs/agent-loop/physical-device-verification.md` exactly. Do not invent a
different evidence shape.

Do not start a new architecture pass, dependency review, UI framework rewrite,
or broad frontend redesign unless the slice first records a concrete failing
story/backlog item that cannot be closed with the current architecture.

## Slice Checklist

Before editing, write this checklist locally:

- Story/backlog ID:
- User-visible behavior or technical gate:
- Current evidence/gap in `docs/completion-report.md`:
- Files to inspect:
- Files likely to edit:
- Focused check:
- Browser/API/BMP/MCP evidence needed:
- Stop rule:

If the likely edit set is larger than roughly five source files plus docs/tests,
split the task and record the split in `docs/backlog.md`.

## Verification Ladder

Use the cheapest evidence that proves the claim:

1. Source inspection for static architecture or dependency gates.
2. Focused unit/integration test for data, rendering, API, and model behavior.
3. Browser automation only for user workflows, visual layout, designer behavior,
   and story evidence.
4. BMP inspection for render/device stories.
5. Physical-device evidence only for stories that require actual TRMNL/device
   behavior.

Never mark a story satisfied from a lower rung if the story explicitly requires
a higher rung.

## Documentation Duties

Every completed slice updates the evidence trail:

- `docs/completion-report.md` for story status and proof.
- `docs/backlog.md` for user feedback, discovered gaps, or completed backlog
  evidence.
- `docs/provenance/clean-room-log.md` or `dirty-room-log.md` for inputs,
  produced files, verification, and boundaries.
- `docs/provenance/dependency-log.md` when dependencies change.

No docs-only completion claim is valid without command, browser, API, BMP, MCP,
or physical-device evidence.

## Handoff Packet

End every pause or commit with this exact shape:

- Done:
- Verified:
- Not verified:
- Next slice:
- Escalate if:

`Next slice` must name one story/backlog ID, likely files, and the first command
or browser page to check.

## Stronger-Model Escalation

Escalate only when the slice needs one of these:

- GPL or clean-room boundary judgment.
- New dependency or architecture direction.
- Cross-cutting refactor across multiple feature areas.
- Multi-page visual design judgment.
- Final completion audit.
- The same focused failure repeats twice with no new evidence.

Routine implementation, focused tests, source splitting, backlog grooming,
completion-report updates, and single-page browser evidence stay medium-model
work.
