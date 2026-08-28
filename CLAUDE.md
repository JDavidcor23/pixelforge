@AGENTS.md

## Design system

The visual language lives in `DESIGN.md` at the repository root — color tokens,
typography, spacing, radius, elevation and component conventions.

It is NOT imported here on purpose: it is a large token contract and loading it
every session is wasteful. Read `DESIGN.md` on demand, and route anything that
touches look and feel through **design-agent** (`.claude/agents/design-agent.md`)
before writing UI.

Pipeline for visual work: **design-agent → frontend-agent → cleancode-agent**.
