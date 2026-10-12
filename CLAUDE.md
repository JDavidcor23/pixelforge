@AGENTS.md

## Design system

The visual language lives in `DESIGN.md` at the repository root — color tokens,
typography, spacing, radius, elevation and component conventions.

It is NOT imported here on purpose: it is a large token contract and loading it
every session is wasteful. Read `DESIGN.md` on demand, and route anything that
touches look and feel through **design-agent** (`.claude/agents/design-agent.md`)
before writing UI.

Pipeline for visual work: **design-agent → frontend-agent → cleancode-agent**.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- After adding or changing living docs (ADRs, `docs/architecture/`, openspec, DESIGN.md), run `/graphify --update`; the commit hook only re-extracts code. Ephemeral docs (handoffs, scratch notes) stay out of the graph — exclude them in `.graphifyignore`.
- graphify flags `packages/tokens/tokens.css` as "sensitive" by name; it is design tokens, not secrets — keep it in the corpus.
