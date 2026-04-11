# Skill Registry — game-builder (PixelForge)

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

Generated: 2026-04-09

---

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| Building web components, pages, applications — visual/UI tasks | frontend-design | (claude plugin) |
| Creating/modifying components, pages, UI features | frontend-agent | `.claude/agents/frontend-agent.md` |
| After frontend-agent finishes; reviewing and fixing code quality | cleancode-agent | `.claude/agents/clean-code-agent.md` |
| Creating or refactoring Zustand stores | zustand-agent | `.claude/agents/zustand-agent.md` |
| Structure, naming, patterns guidance (read-only) | rules-agent | `.claude/agents/rules-agent.md` |
| Adversarial parallel code review ("judgment day", "dual review") | judgment-day | `~/.claude/skills/judgment-day/SKILL.md` |
| Creating pull requests (issue-first enforcement) | branch-pr | `~/.claude/skills/branch-pr/SKILL.md` |
| Creating GitHub issues (bug report or feature request) | issue-creation | `~/.claude/skills/issue-creation/SKILL.md` |
| Creating new AI agent skills | skill-creator | `~/.claude/skills/skill-creator/SKILL.md` |
| Discovering and installing agent skills | find-skills | `~/.claude/skills/find-skills/SKILL.md` |
| Writing Go tests, Bubbletea TUI testing | go-testing | `~/.claude/skills/go-testing/SKILL.md` |
| Persistent memory — always active | engram:memory | (MCP plugin) |

---

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### frontend-agent
- Component = JSX only. All logic in `use*.hook.ts`, all API calls in `*.service.ts`
- Hooks consume the store, components never access Zustand directly
- Tailwind only — no `style={{}}` (except dynamic calculated values like `width: \`${n}%\``), no CSS files
- Zustand granular selectors: `useStore(s => s.field)` — never destructure
- No `any` — all types in `src/types/`, props typed with interfaces
- No magic values — constants in `src/constants/` with UPPER_SNAKE_CASE
- `'use client'` only when needed (useState, useEffect, useRef, browser APIs, event handlers)
- `next/image` for images, `next/link` or `useRouter` for navigation — never `window.location`
- Import order: React/external → components → hooks → services → constants/types
- No `console.log` — only `console.error` in catch blocks
- Before generating UI, use frontend-design plugin. After finishing, invoke cleancode-agent
- **Canvas Rule**: Always use the "Infinite Canvas" pattern for editors (100% parent size + `ResizeObserver`). Implement drawing logic with central-offset coordinates (in `canvas-renderer.ts`) to handle zoom/pan correctly.

### cleancode-agent
- Read all files → apply full checklist → fix directly → run `npm run build` → report
- Checklist covers: separation of responsibilities, Zustand selectors, TypeScript strictness, Tailwind-only styles, magic values, navigation, Next.js patterns, import order
- Components must have zero useState/business logic — extract to hooks
- Zustand: no destructuring, no API calls in store, immutable updates, store from hooks only
- No `any`, no `console.log`, no `<img>`, no `<a href>` for internal links
- After finishing, invoke test-agent

### zustand-agent
- File naming: `useNameStore.store.ts` — export only the hook, never the store directly
- ALWAYS granular selectors: `useStore(s => s.field)` — never destructure
- Immutable updates: `set(s => ({ items: [...s.items, item] }))` — never mutate
- No API calls inside the store — fetching belongs in services
- Store consumed only from hooks, never from JSX components
- With `persist` middleware: use `partialize` to exclude transient state (loading, UI flags)
- Local component state (modals, hover) stays in useState, not Zustand

### judgment-day
- Orchestrator NEVER reviews code itself — launches two blind parallel judge sub-agents
- Judges classify warnings as `real` (normal user can trigger) or `theoretical` (contrived scenario)
- After Round 1: present verdict to user, ASK before fixing — only fix after user confirms
- Round 2+: only re-judge if confirmed CRITICALs remain; real WARNINGs fixed inline without re-judge
- APPROVED = 0 confirmed CRITICALs + 0 confirmed real WARNINGs (theoretical/suggestions may remain)
- After 2 fix iterations with remaining issues → ASK user whether to continue or ESCALATE
- Fix Agent must search for same pattern across ALL files in scope, not just the flagged one

### branch-pr
- Every PR MUST link an approved issue (`Closes #N` / `Fixes #N` / `Resolves #N`)
- Every PR MUST have exactly one `type:*` label (bug, feature, docs, refactor, chore, breaking-change)
- Branch naming: `type/description` — regex `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- Conventional commits: `type(scope): description` — no Co-Authored-By trailers
- Run shellcheck on modified scripts before pushing
- PR body must include: linked issue, PR type, summary, changes table, test plan, contributor checklist

### issue-creation
- MUST use a template (Bug Report or Feature Request) — blank issues disabled
- Every issue gets `status:needs-review` automatically — wait for `status:approved` before opening PR
- Search existing issues for duplicates before creating
- Bug report requires: description, steps to reproduce, expected vs actual behavior, OS, agent, shell
- Feature request requires: problem description, proposed solution, affected area
- Questions go to Discussions, not issues

### skill-creator
- Skill structure: `skills/{name}/SKILL.md` + optional `assets/` and `references/`
- Frontmatter required: name, description (with Trigger), license (Apache-2.0), metadata (author, version)
- Start with critical patterns, keep code examples minimal, include Commands section
- No Keywords section (agent searches frontmatter). No web URLs in references (local paths only)
- After creating, register in AGENTS.md

### find-skills
- Search with `npx skills find [query]` — specific keywords work better than generic
- Install with `npx skills add <owner/repo@skill> -g -y` for global install
- If no skills found: offer to help directly, suggest `npx skills init` for custom skill
- Browse available skills at skills.sh

### go-testing
- Table-driven tests: `[]struct{name, input, expected, wantErr}` with `t.Run(tt.name, ...)`
- Bubbletea TUI: test Model.Update() directly for state, teatest.NewTestModel for full flows
- Golden file testing: `testdata/*.golden` with `-update` flag to regenerate
- Mock system dependencies via interfaces, use `t.TempDir()` for file operations
- Skip integration tests with `-short` flag

---

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | `AGENTS.md` | Index — references agent files below |
| frontend-agent | `.claude/agents/frontend-agent.md` | Referenced by AGENTS.md |
| cleancode-agent | `.claude/agents/clean-code-agent.md` | Referenced by AGENTS.md |
| zustand-agent | `.claude/agents/zustand-agent.md` | Referenced by AGENTS.md |
| rules-agent | `.claude/agents/rules-agent.md` | Referenced by AGENTS.md |
| CLAUDE.md | `CLAUDE.md` | Project-level conventions and core rules |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
