# Graph Report - game-builder  (2026-10-11)

## Corpus Check
- 525 files · ~285,953 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3267 nodes · 8427 edges · 215 communities (139 shown, 72 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92efc66b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- auth.service.ts
- core/ts-core.ts
- types/timeline-view.ts
- PropertiesTab.tsx
- document-persistence.controller.ts
- types/audio.ts
- mod.rs
- WasmDocument
- src/types/index.ts
- tweak-mapping.ts
- export-utils.ts
- index.tsx
- sound-library.ts
- pixel-core.ts
- timeline-ops.ts
- devDependencies
- mascot-scene-state.ts
- useCanvasInteraction.hook.ts
- sound-timeline.slice.ts
- history.rs
- WasmPixelCore
- wasm-pixel-core-resolver.ts
- constants/index.ts
- LoginPage.tsx
- TweakSlider.tsx
- useKeyboardShortcuts.hook.ts
- useMixExport.hook.ts
- src-ts/ts-core.ts
- PixelForge IA (AGENTS.md overview)
- useGeneratePanel.hook.ts
- useSoundDetailHeader.hook.ts
- downscale.rs
- useSynthAssetSync.hook.ts
- TrapSafePixelCore
- ColorPicker.tsx
- scripts
- mascot-scene.ts
- useSoundsStore
- timeline-shortcuts.ts
- commands.ts
- compilerOptions
- quantize.rs
- dependencies
- devDependencies
- RgbaColor
- AnimateTab.tsx
- useSettingsPanel.hook.ts
- sprite-pipeline.ts
- PixelKernels
- core/package.json
- types/timeline.ts
- 5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization)
- compilerOptions
- focus-ring.ts
- timeline-player.ts
- ts-core.judgment-day-round2.test.ts
- tokens/package.json
- audio-engine.ts
- index.test.ts
- include
- useSpriteEditorStore
- delete-account/index.ts
- quantize.oracle-parity.test.ts
- audio-storage.service.ts
- ElevenLabs AI sound generation
- assets.store.ts
- core.slice.real-trap.test.ts
- useEditorPrefsStore
- useClipInspector.hook.ts
- Phase 7: Rust Document/History
- edit-history Capability
- build-wasm.mjs
- kernels.ts
- audio-engine.test.ts
- 2026-10-11 — Resizing a sprite without losing its layers
- Phase 5: Rust Flood-Fill
- color-utils.ts
- prefs.store.ts
- sound-timeline.slice.test.ts
- document.ts
- core/tsconfig.json
- elevenlabs.ts
- Rust/Wasm core migration boundary
- PixelCore
- installFakeDom
- motion.ts
- wasm-document-core.test.ts
- PixelForge Architecture Overview
- WasmPixelCore (diagram node, behind flag)
- useColorPicker.hook.ts
- useDeleteAccountDialog.hook.ts
- pixel-core Capability
- useDocumentPersistence.hook.ts
- workspace-build Capability
- 0008 — Lossless canvas resize with a cut-strips undo entry
- computeMascotSceneState
- scripts
- useAssetsPanel.hook.ts
- tokens/tsconfig.json
- check-bench.ts
- useSaveIndicator.hook.ts
- src-ts/index.ts
- useSpriteEditorStore.hook.ts
- Zustand store (diagram node)
- document-persistence.controller.wasm-gate.test.ts
- VariationCard.tsx
- D6: Flat Rust API, No Serde Decision
- quantize-downscale.fuzz.test.ts
- useAnimateTab.hook.ts
- Granular selector golden rule
- editor/package.json
- constants/timeline-view.ts
- GoogleButton.tsx
- mascot-city.ts
- --pf-* CSS custom properties
- /implementar command
- D6: flat Rust API surface, u32 handles, no serde
- bindings.rs (diagram node, only wasm-bindgen boundary)
- zustand-agent definition
- createEmptyBuffer
- clean-pkg-gitignore.mjs
- tsconfig.json
- rules-agent definition
- ADR template
- Learning-log template
- AI-notes vs owner-voice authorship layers
- Geist font Google Fonts <link>
- lucide-react
- @pixelforge/tokens
- react
- tailwindcss
- @vitejs/plugin-react
- @vitest/ui
- editor/postcss.config.mjs
- apps/editor README env vars
- vercel.json
- eslint.config.mjs
- next.config.ts
- landing/postcss.config.mjs
- Canvas (Konva) colors.ts mirror exception
- D1: PixelBuffer{w,h,data:Uint8ClampedArray}
- D3: core owns the document
- D11: DESIGN.md stays at repo root
- Measured Rust vs TS results table
- Client-side localStorage API key storage
- Rust/Wasm core with TS reference
- Figma dynamic page loading precedent
- Google Maps tiles/LOD precedent
- Reference counting
- /implementar command (Pencil -> code pipeline)
- mascot-sprite.ts
- Full review checklist
- No magic values rule
- Per-app navigation rules
- Component/hook/service separation
- 5 Zustand antipatterns
- Store-of-slices pattern
- cleancode-agent (referenced)
- Contextual Skill Loading rule
- design-agent (referenced)
- frontend-agent (referenced)
- CI job: test / bench / typecheck
- #root + main.tsx mount point
- apps/editor pnpm scripts
- vercel-functions-dev.ts
- DESIGN.md not imported, read on demand
- High-density functional grid layout
- Synthetic Architect design system
- D2: copy-on-write per batch
- D5: PixelKernels under PixelCore (two seams)
- D13: idb library over raw indexedDB API
- AI-notes vs owner-written authorship policy
- pnpm workspaces (monorepo)
- React Server Components and 'use client'
- SPA (Single Page Application)
- SSR vs CSR
- Vite build tool
- Code map: where each piece lives
- flood-fill/quantize/downscale modules
- Hexagonal ports & adapters
- Reproducible Wasm builds gated in CI
- Content-addressable / immutable data
- Flyweight pattern
- Shadow mode / dark launch
- Design tools guide (impeccable + Emil Kowalski skills + Pencil)
- Emil Kowalski motion/polish skills
- PixelForge vision lifecycle diagram (SVG)
- @theme inline Tailwind token mapping
- pixelforge-core
- pnpm workspace packages config
- Product principles (intent-first, equal AI/manual paths)
- Sprite editor feature (Konva, AI gen)
- retro-diffusion-utils.ts
- Phase 1: Flatten Buffer + IndexedDB Persistence
- mascot-font.ts
- LibrarySidebar.tsx
- bench/flood-fill.bench.ts
- LeftSidebar.tsx
- wasm-pixel-core.undo-memory.baseline.test.ts
- useTimelineShortcuts.hook.ts
- BottomPanel.tsx
- useLayerPanel.hook.ts
- flood-fill.fuzz.test.ts
- DocumentRepository port (load/save/remove)
- ADR 0002: Single dispatch(cmd) seam; core owns the document
- wasm-bindgen Copy-In/Copy-Out Mechanism
- ui.slice.ts
- colors.test.ts
- Phased Migration Approach (0-7)
- Stage 6: Publishing to AWS (planned)

## God Nodes (most connected - your core abstractions)
1. `useSoundsStore` - 89 edges
2. `useSpriteEditorStore` - 89 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 65 edges
5. `MOTION` - 57 edges
6. `Document` - 52 edges
7. `putPixel()` - 40 edges
8. `useEditorUIStore` - 40 edges
9. `WasmDocument` - 38 edges
10. `dispatchCommandSwitch()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `AI-notes vs owner-voice authorship layers` --semantically_similar_to--> `Authorship of documents (AI notes vs featured docs)`  [INFERRED] [semantically similar]
  .claude/skills/architecture-decision/SKILL.md → AGENTS.md
- `KernelRow` --references--> `tsKernels`  [EXTRACTED]
  apps/editor/src/lib/downscale.oracle-parity.test.ts → packages/core/src-ts/ts-core.ts
- `Infinite Canvas pattern` --conceptually_related_to--> `PixelForge IA (AGENTS.md overview)`  [INFERRED]
  apps/editor/src/sprites/features/canvas/README.md → AGENTS.md
- `NEXT_PUBLIC_EDITOR_URL var` --conceptually_related_to--> `PixelForge IA (AGENTS.md overview)`  [INFERRED]
  apps/landing/README.md → AGENTS.md
- `Sound editor capabilities` --conceptually_related_to--> `PixelForge IA (AGENTS.md overview)`  [INFERRED]
  PRODUCT.md → AGENTS.md

## Import Cycles
- 4-file cycle: `apps/editor/src/lib/core/core-config.ts -> apps/editor/src/lib/core/pixel-core.ts -> apps/editor/src/lib/core/ts-core.ts -> apps/editor/src/lib/core/kernels.ts -> apps/editor/src/lib/core/core-config.ts`
- 5-file cycle: `apps/editor/src/lib/core/core-config.ts -> apps/editor/src/lib/core/wasm-pixel-core-resolver.ts -> apps/editor/src/lib/core/pixel-core.ts -> apps/editor/src/lib/core/ts-core.ts -> apps/editor/src/lib/core/kernels.ts -> apps/editor/src/lib/core/core-config.ts`

## Hyperedges (group relationships)
- **Rust/Wasm core CI quality gates** — _github_workflows_ci_rust_core_job, _github_workflows_ci_wasm_size_budget, _github_workflows_ci_drift_check, _github_workflows_ci_cargo_deny_check [EXTRACTED 0.95]
- **design-agent -> frontend-agent -> cleancode-agent pipeline** — agents_design_agent_ref, agents_frontend_agent_ref, agents_cleancode_agent_ref, _claude_agents_frontend_agent_frontendagent, _claude_agents_clean_code_agent_cleancodeagent [EXTRACTED 0.95]
- **Rust domain modules -> bindings.rs -> wasm-pack pkg/ build pipeline** — docs_architecture_svg_rust_document_rs, docs_architecture_svg_rust_history_rs, docs_architecture_svg_rust_pixels_mod_rs, docs_architecture_svg_rust_flood_fill_rs, docs_architecture_svg_rust_quantize_rs, docs_architecture_svg_rust_downscale_rs, docs_architecture_svg_rust_bindings_rs, docs_architecture_svg_wasm_pack_pkg [EXTRACTED 1.00]
- **Two-Seam Wasm Boundary Architecture** — openspec_changes_migrate_to_rust_core_design_pixelkernels_interface, openspec_changes_migrate_to_rust_core_design_document_struct, openspec_changes_migrate_to_rust_core_design_d5_two_seams [EXTRACTED 1.00]
- **Judgment-Day Review and Fix Cycle** — openspec_changes_migrate_to_rust_core_tasks_judgment_day_process, openspec_changes_migrate_to_rust_core_design_command_undoability_decision, packages_core_learning_trap_poisons_object [INFERRED 0.75]
- **DocumentRepository port with IndexedDB (default) and Supabase (planned) adapters** — docs_architecture_svg_documentrepository_port, docs_architecture_svg_indexeddb_adapter, docs_architecture_svg_supabase_planned, docs_adr_0006_indexeddb_persistence_port_doc [INFERRED 0.85]
- **PixelCore port & adapters seam (TsPixelCore / WasmPixelCore / PixelKernels)** — docs_architecture_svg_pixelcore_port, docs_architecture_svg_tspixelcore, docs_architecture_svg_wasmpixelcore, docs_architecture_svg_pixelkernels [INFERRED 0.85]
- **Discovering the Real Wasm Boundary Performance Cost** — packages_core_learning_wasm_bindgen_copy_mechanism, packages_core_learning_scanline_rewrite_note, openspec_changes_migrate_to_rust_core_baseline_bench_phase5f_scanline_result [INFERRED 0.85]
- **Granular Zustand selector convention enforced across agents** — _claude_agents_frontend_agent_zustand_granular_selectors, _claude_agents_clean_code_agent_zustand_granular_selectors, _claude_agents_zustand_agent_granular_selector_pattern, _claude_agents_rules_agent_core_rules [INFERRED 0.85]

## Communities (215 total, 72 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (73): HashMap, History, HistoryEntry, bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of() (+65 more)

### Community 1 - "auth.service.ts"
Cohesion: 0.10
Nodes (21): AccountDeletedNotice(), useAccountDeletedNotice(), ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS, DELETE_ACCOUNT_COPY, DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE, DELETE_ACCOUNT_ERROR_CODE, DELETE_ACCOUNT_ERROR_MESSAGES, mapDeleteAccountError() (+13 more)

### Community 2 - "core/ts-core.ts"
Cohesion: 0.07
Nodes (62): unpackRgba(), DirtyRect, LayerRef, bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory() (+54 more)

### Community 3 - "types/timeline-view.ts"
Cohesion: 0.11
Nodes (20): TRACK_COLOR, TRACK_KIND_OPTIONS, AddTrackRow(), useAddTrackRow(), TimelineClip, TimelineTracks(), TimelineTracksProps, TrackHeader (+12 more)

### Community 4 - "PropertiesTab.tsx"
Cohesion: 0.20
Nodes (11): CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), ColorPicker(), OpacitySlider(), OpacitySliderProps, PropertiesTab(), usePropertiesTab() (+3 more)

### Community 5 - "document-persistence.controller.ts"
Cohesion: 0.17
Nodes (14): LOCAL_DRAFT_DOCUMENT_ID, DocumentPersistenceDeps, DocumentPersistenceStoreApi, NOOP_CONTROLLER, startDocumentPersistence(), emptyPayload(), fakeStorage, makeFakeStore() (+6 more)

### Community 6 - "types/audio.ts"
Cohesion: 0.06
Nodes (63): ADSR_DEFAULTS, ADSR_LIMITS, ADSR_VIEW, DEFAULT_VOLUME, ELEVENLABS_API_TIMEOUT, FILTER_DEFAULTS, FILTER_LIMITS, FILTER_TYPES (+55 more)

### Community 7 - "mod.rs"
Cohesion: 0.08
Nodes (48): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+40 more)

### Community 8 - "WasmDocument"
Cohesion: 0.08
Nodes (13): Box, DispatchResult, clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill() (+5 more)

### Community 9 - "src/types/index.ts"
Cohesion: 0.14
Nodes (25): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_TIMELINE, createInitialFrame(), createInitialLayer(), initialLayer, createCompoundSlice(), createDocumentStatusSlice(), createLayerSlice() (+17 more)

### Community 10 - "tweak-mapping.ts"
Cohesion: 0.23
Nodes (13): DEFAULT_DECAY_SHARE, TWEAK_PARAMS, TWEAK_RANGES, applyTweak(), clamp(), fromPosition(), Range, synthParamsToTweaks() (+5 more)

### Community 11 - "export-utils.ts"
Cohesion: 0.14
Nodes (24): getDrawOffset(), renderPixelsToCanvas(), RenderPixelsToCanvasOptions, screenToPixel(), HistoryPatch, ResizeStrip, downloadCanvasAsPng(), exportFrameAsPng() (+16 more)

### Community 12 - "index.tsx"
Cohesion: 0.07
Nodes (39): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+31 more)

### Community 13 - "sound-library.ts"
Cohesion: 0.06
Nodes (65): AI_KIND_OPTIONS, DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, ELEVENLABS_DEFAULT_VOICE_ID, FALLBACK_SOUND_NAME, IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES (+57 more)

### Community 14 - "pixel-core.ts"
Cohesion: 0.04
Nodes (53): makeDoc(), mockGetPixelCoreEnvOverride, mockTryResolveWasmPixelCore, ContractCase, GREEN, implementations, makeDoc(), RED (+45 more)

### Community 15 - "timeline-ops.ts"
Cohesion: 0.08
Nodes (50): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME, GAIN_DB_MAX, GAIN_DB_MIN (+42 more)

### Community 16 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 17 - "mascot-scene-state.ts"
Cohesion: 0.10
Nodes (33): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_BOLT_Y_OFFSET, GROUND_ENEMY (+25 more)

### Community 18 - "useCanvasInteraction.hook.ts"
Cohesion: 0.12
Nodes (27): CANVAS_SIZE_OPTIONS, SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_VIEWPORT, ADR-0008, useCanvasSizePopover(), CanvasArea(), getDrawOffset(), GridOverlay() (+19 more)

### Community 19 - "sound-timeline.slice.ts"
Cohesion: 0.20
Nodes (21): EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory(), withoutAsset() (+13 more)

### Community 20 - "history.rs"
Cohesion: 0.15
Nodes (25): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+17 more)

### Community 21 - "WasmPixelCore"
Cohesion: 0.16
Nodes (4): DispatchResult, clampRectToCanvas(), decodeNames(), WasmPixelCore

### Community 22 - "wasm-pixel-core-resolver.ts"
Cohesion: 0.21
Nodes (12): getPixelCoreEnvOverride(), isPixelCoreImpl(), PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, readEnvOverride(), readLocalStorageOverride(), resolveCore(), resolveCoreImpl() (+4 more)

### Community 23 - "constants/index.ts"
Cohesion: 0.07
Nodes (35): clampSize(), handler(), json(), NOTE: width/height are what was REQUESTED, which for an animation is the, RetroDiffusionApiResponse, stripDataUri(), ANIMATE_CHARACTER_MOTIONS, ANIMATE_CUSTOM_MOTION_PLACEHOLDER (+27 more)

### Community 24 - "LoginPage.tsx"
Cohesion: 0.09
Nodes (33): App(), AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, useAuthForm(), HEADING, LoginPage() (+25 more)

### Community 25 - "TweakSlider.tsx"
Cohesion: 0.29
Nodes (6): PERCENT_SCALE, TweakSliderProps, TweakSliderVariant, VARIANT_CLASSES, useTweakSlider(), UseTweakSliderParams

### Community 26 - "useKeyboardShortcuts.hook.ts"
Cohesion: 0.20
Nodes (17): SPRITE_DOCUMENT_DEFAULT_NAME, SPRITE_EDITOR_KEYBOARD, useTopBar(), useKeyboardShortcuts(), useActiveTool(), useCanRedo(), useCanUndo(), useCopySelection() (+9 more)

### Community 27 - "useMixExport.hook.ts"
Cohesion: 0.13
Nodes (18): WAV_EXTENSION, MIX_EXPORT, TIMELINE_ERRORS, buffers, decodeFromUrl(), inflight, createAudioObjectUrl(), decodeAudioBlob() (+10 more)

### Community 28 - "src-ts/ts-core.ts"
Cohesion: 0.15
Nodes (25): buildPalette(), diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect(), fillSpanRow() (+17 more)

### Community 29 - "PixelForge IA (AGENTS.md overview)"
Cohesion: 0.08
Nodes (27): cleancode-agent definition, test-agent (referenced), cleancode-agent (invoked when done), frontend-agent definition, Reference to clean-code-agent.md, Reference to frontend-agent.md, Reference to AGENTS.md as single source of truth, Reference to AGENTS.md build pipeline (+19 more)

### Community 30 - "useGeneratePanel.hook.ts"
Cohesion: 0.12
Nodes (18): AI_SPRITE_SIZES, ALPHA_TRANSPARENT_THRESHOLD, ASSET_TYPE_EXAMPLE_CHIPS, ASSET_TYPE_PROMPT_PLACEHOLDER, ASSET_TYPE_STYLE, ASSET_TYPES, isCanvasBlank(), isLayerDataBlank() (+10 more)

### Community 31 - "useSoundDetailHeader.hook.ts"
Cohesion: 0.11
Nodes (30): NAME_VISIBLE_TAIL_LENGTH, audioBufferCache, buildUniqueName(), formatDuration(), getAssetKindLabel(), splitNameForTruncation(), soundDragSession, SoundDetailHeader() (+22 more)

### Community 32 - "downscale.rs"
Cohesion: 0.16
Nodes (21): FnMut, alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color() (+13 more)

### Community 33 - "useSynthAssetSync.hook.ts"
Cohesion: 0.20
Nodes (12): TWEAK_REGENERATE_DEBOUNCE_MS, WAVE_PEAK_COUNT, areSynthParamsEqual(), getAssetSource(), releaseObjectUrl(), renderSynthSound(), SoundDetail(), useSoundDetail() (+4 more)

### Community 35 - "ColorPicker.tsx"
Cohesion: 0.18
Nodes (11): COLOR_PICKER, ColorInputs(), ColorInputsProps, HueSlider(), HueSliderProps, useHueSlider(), UseHueSliderParams, SaturationValueSquare() (+3 more)

### Community 36 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 37 - "mascot-scene.ts"
Cohesion: 0.17
Nodes (20): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+12 more)

### Community 38 - "useSoundsStore"
Cohesion: 0.10
Nodes (29): DELETE_SOUND_KEYS, NEW_SOUND_AUTOFOCUS, SOUND_KIND_LABELS, ADD_TO_TIMELINE_KEY, FILES_DRAG_TYPE, OPEN_SOUND_KEY, getAssetKind(), useSoundEditorLayout() (+21 more)

### Community 39 - "timeline-shortcuts.ts"
Cohesion: 0.19
Nodes (14): ALT_KEY, ALT_KEY_LABEL, MAC_PLATFORM_PATTERN, MOD_KEY, MOD_KEY_LABEL, ALT_KEYS, isMacPlatform(), modKeyLabel() (+6 more)

### Community 40 - "commands.ts"
Cohesion: 0.10
Nodes (14): Command, DispatchResult, FrameId, LayerId, LayerMetaPatch, SerializedFrame, SerializedLayer, ADR-0008 (+6 more)

### Community 41 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, jsx, lib, moduleDetection, noEmit, paths, target, types (+13 more)

### Community 42 - "quantize.rs"
Cohesion: 0.24
Nodes (19): alpha_threshold_boundary_is_inclusive_on_the_high_side(), build(), build_palette(), Centroid, colors_zero_still_yields_one_centroid_not_zero(), dist2(), keeps_fully_transparent_pixels_transparent(), nearest() (+11 more)

### Community 43 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, colord, idb, konva, @pixelforge/core, react-dom, react-konva, react-router-dom (+13 more)

### Community 44 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, babel-plugin-react-compiler, fake-indexeddb, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+13 more)

### Community 45 - "RgbaColor"
Cohesion: 0.16
Nodes (17): rgbaToHex(), rowsToBuffer(), LegacyFrame, LegacyLayer, legacyLayerToPayload(), LegacyMigrationResult, LegacyPersistedState, legacyStateToPayload() (+9 more)

### Community 46 - "AnimateTab.tsx"
Cohesion: 0.12
Nodes (17): AiResultCard(), AiResultCardProps, AnimateTab(), capitalizeWords(), AssetTypeSelector(), ICON_MAP, CreateMethodToggle(), ICON_MAP (+9 more)

### Community 47 - "useSettingsPanel.hook.ts"
Cohesion: 0.20
Nodes (16): useSettingsPanel(), UseSettingsPanelResult, API_KEY_HELP_URL, API_KEY_PROVIDER, API_KEY_SAVED_FEEDBACK_MS, ElevenLabsError, generateMusic(), generateSFX() (+8 more)

### Community 48 - "sprite-pipeline.ts"
Cohesion: 0.17
Nodes (21): QUANTIZE_DEFAULTS, getActiveKernelsAsync(), resizeNearest(), buildPalette(), Centroid, dist2(), nearest(), quantizePixels() (+13 more)

### Community 49 - "PixelKernels"
Cohesion: 0.06
Nodes (22): here, source, wasmPath, here, wasmPath, here, sourceCanvas, wasmPath (+14 more)

### Community 50 - "core/package.json"
Cohesion: 0.10
Nodes (19): devDependencies, @types/node, typescript, vitest, exports, @types/node, typescript, vitest (+11 more)

### Community 51 - "types/timeline.ts"
Cohesion: 0.15
Nodes (24): collectSnapEdges(), snapThresholdSeconds(), snapTime(), snapClipMove(), TimelineClipProps, DragOrigin, DragView, snapEdge() (+16 more)

### Community 52 - "5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization)"
Cohesion: 0.12
Nodes (17): ADR 0006: DocumentRepository port + IndexedDB adapter, 5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization), Triggers to resume scalability work, Chunking / segmentation, Cursor-based pagination, HTTP adaptive streaming (HLS, MPEG-DASH), List virtualization / windowing, LRU cache (+9 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 54 - "focus-ring.ts"
Cohesion: 0.12
Nodes (22): DISABLED_STATE, FOCUS_RING, MOTION, DescribeWithAISection(), ImportRow(), NewSoundPopoverProps, PresetSection(), TransportProps (+14 more)

### Community 55 - "timeline-player.ts"
Cohesion: 0.20
Nodes (12): dbToGain(), effectiveGain(), hasSoloTrack(), buildMixGraph(), disposeMixGraph(), MixGraph, renderMix(), TimelinePlayer (+4 more)

### Community 56 - "ts-core.judgment-day-round2.test.ts"
Cohesion: 0.08
Nodes (49): packPoints(), packRgba(), RGBA_BYTE_SHIFT, frameToSerializedFrame(), layerToSerializedLayer(), toStrokePoints, CoreState, createCoreState() (+41 more)

### Community 57 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 58 - "audio-engine.ts"
Cohesion: 0.18
Nodes (10): AudioEngine, buildSynthChain(), calculateDefaultDuration(), createWhiteNoiseBuffer(), mapFilterType(), msToSec(), NewAssetInput, AudioSynthSlice (+2 more)

### Community 59 - "index.test.ts"
Cohesion: 0.13
Nodes (12): timelineToDocumentPayload(), BLUE, GREEN, make2x2Buffer(), RED, setupWithSelection(), TRANSPARENT, emptyPixels() (+4 more)

### Community 60 - "include"
Cohesion: 0.12
Nodes (15): compilerOptions, paths, plugins, target, exclude, extends, include, node_modules (+7 more)

### Community 61 - "useSpriteEditorStore"
Cohesion: 0.19
Nodes (25): getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useClipboard(), useCommitTransformation(), useCopySelectedFrames() (+17 more)

### Community 62 - "delete-account/index.ts"
Cohesion: 0.40
Nodes (4): CORS_HEADERS, Envelope, fail(), respond()

### Community 63 - "quantize.oracle-parity.test.ts"
Cohesion: 0.10
Nodes (17): mockGetPixelCoreEnvOverride, coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require, wasmPath (+9 more)

### Community 64 - "audio-storage.service.ts"
Cohesion: 0.18
Nodes (9): getSupabaseAnonKey(), getSupabaseUrl(), AUDIO_STORAGE_BUCKET, supabase, buildFilePath(), generateId(), StorageError, uploadAudio() (+1 more)

### Community 65 - "ElevenLabs AI sound generation"
Cohesion: 0.15
Nodes (14): ElevenLabs integration bugs (music endpoint, duration, TTS model, body buffering), Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, Response streaming, apps/editor/api/ai Vercel Functions proxy (diagram node) (+6 more)

### Community 66 - "assets.store.ts"
Cohesion: 0.12
Nodes (26): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, ANIMATION_PIPELINE_VERSION, GENERATION_HISTORY_LIMIT, GENERATION_HISTORY_STORAGE_KEY, isNonEmptyString(), isPngDataUri(), isPositiveFiniteNumber() (+18 more)

### Community 67 - "core.slice.real-trap.test.ts"
Cohesion: 0.22
Nodes (7): here, instances, pkgAvailable, pkgDir, ProbeWasmPixelCore, wasmJsPath, wasmPath

### Community 68 - "useEditorPrefsStore"
Cohesion: 0.13
Nodes (20): SPRITE_EDITOR_TOOLS, useCanvasSelection(), useColorInputs(), UseColorInputsParams, BottomToolbar(), useBottomToolbar(), ICON_MAP, ToolButton() (+12 more)

### Community 69 - "useClipInspector.hook.ts"
Cohesion: 0.29
Nodes (9): VOLUME_RANGE, TRACK_KIND_ICON, buildSliders(), formatFade(), formatGain(), formatSpeed(), useClipInspector(), useTrackHeader() (+1 more)

### Community 70 - "Phase 7: Rust Document/History"
Cohesion: 0.21
Nodes (13): Phase 7 Document/PixelCore Bench Result, D3: Core Owns Document Decision, Default Core Implementation Stays TS Decision, PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, PixelCore Interface Fallback Decision (+5 more)

### Community 71 - "edit-history Capability"
Cohesion: 0.17
Nodes (13): Every Document Mutation Is Undoable (Phase 2c), Command Union Type, D4: Dirty-Rect History Decision, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), edit-history Capability, Dirty-Rect Patch History Decision, Bounded History Retention Requirement (+5 more)

### Community 72 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 73 - "kernels.ts"
Cohesion: 0.13
Nodes (15): ensureWasmResolving(), getActiveKernels(), mockBase64ToNativePixels, mockGetPixelCoreEnvOverride, isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels() (+7 more)

### Community 74 - "audio-engine.test.ts"
Cohesion: 0.33
Nodes (11): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+3 more)

### Community 75 - "2026-10-11 — Resizing a sprite without losing its layers"
Cohesion: 0.18
Nodes (12): Deferred: scaling the sound editor to thousands of assets, AI notes README, Scalable assets in the browser - research notes, 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Lessons, Options and tradeoffs, Result (+4 more)

### Community 76 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.21
Nodes (12): Phase 5 Flood-Fill Bench Result (2.3-2.6x, Target 3x Not Met), Phase 5f Scanline Bench Result (Ratio Narrows, Absolute Faster), Phase 6 Quantize/Downscale Bench Result, Scanline Span-Fill Rewrite (Phase 5f), Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, Flat Table Replaces Per-Cell HashMap, No Recursion in Flood-Fill (Stack Overflow Risk) (+4 more)

### Community 77 - "color-utils.ts"
Cohesion: 0.26
Nodes (9): SPRITE_EDITOR_COLORS, hexToHsv(), hexToRgba(), hsvToHex(), getDrawOffset(), GridBackground(), GridBackgroundProps, renderCheckerboardToCanvas() (+1 more)

### Community 78 - "prefs.store.ts"
Cohesion: 0.23
Nodes (9): SPRITE_EDITOR_PALETTE, createIntegrationsSlice(), IntegrationsSlice, createPaletteSlice(), createViewPrefsSlice(), createViewportSlice(), PaletteSlice, ViewPrefsSlice (+1 more)

### Community 79 - "sound-timeline.slice.test.ts"
Cohesion: 0.17
Nodes (11): DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, HISTORY_LIMIT, MAX_PX_PER_SECOND, MIN_PX_PER_SECOND, ZOOM_SLIDER_STEP_PX, ZOOM_STEP, countClipsForAsset() (+3 more)

### Community 80 - "document.ts"
Cohesion: 0.18
Nodes (12): DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_SCHEMA_VERSION, DOCUMENT_STORE_NAME, LEGACY_SPRITE_EDITOR_STORAGE_KEY, PixelForgeDB, GREEN, legacyLayer() (+4 more)

### Community 81 - "core/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, outDir, exclude, extends, include, node_modules, ../../tsconfig.base.json (+2 more)

### Community 82 - "elevenlabs.ts"
Cohesion: 0.29
Nodes (7): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES

### Community 83 - "Rust/Wasm core migration boundary"
Cohesion: 0.25
Nodes (9): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), Rust/Wasm core migration boundary, VITE_PIXEL_CORE runtime flag, Hexagonal ports & adapters (PixelCore, DocumentRepository), Roadmap (Supabase, Phaser.js scene builder, AWS publish) (+1 more)

### Community 85 - "installFakeDom"
Cohesion: 1.00
Nodes (3): installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext()

### Community 86 - "motion.ts"
Cohesion: 0.12
Nodes (19): DeleteAccountDialog(), DeleteAccountDialogProps, EditorLayout(), useEditorLayout(), ModalPortal(), ModalPortalProps, ApiKeyField(), ApiKeyFieldProps (+11 more)

### Community 87 - "wasm-document-core.test.ts"
Cohesion: 0.24
Nodes (6): baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 88 - "PixelForge Architecture Overview"
Cohesion: 0.19
Nodes (13): ADR 0001: Flat pixel buffer, copy-on-write per batch, ADR 0003: Dirty-rect patches for undo history, ADR 0004: Rust/Wasm boundary shape, ADR 0005: pnpm monorepo split, ADR 0007: Local-first persistence model, The monorepo and Rust/WebAssembly migration, explained simply, Study guide: moving the editor from Next.js to Vite, Vercel monorepos (Root Directory, Ignored Build Step) (+5 more)

### Community 89 - "WasmPixelCore (diagram node, behind flag)"
Cohesion: 0.31
Nodes (9): D7: Wasm linear-memory views, rebuilt per dispatch, WebAssembly JS<->Wasm boundary copy cost, src-ts/resolve-core.ts module, src-ts/wasm-core.ts module, PixelCore port (diagram node), PixelKernels (diagram node), TsPixelCore (diagram node, DEFAULT), wasm-pack -> pkg/ (diagram node) (+1 more)

### Community 90 - "useColorPicker.hook.ts"
Cohesion: 0.29
Nodes (11): useColorPalette(), ActiveColorType, hexToRgba(), rgbaToHex(), useColorPicker(), usePalette(), usePrimaryColor(), useRemoveColor() (+3 more)

### Community 91 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.39
Nodes (5): getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, DELETE_ACCOUNT_CONFIRM_WORD, isDeleteAccountConfirmed()

### Community 92 - "pixel-core Capability"
Cohesion: 0.22
Nodes (9): Phase 0 TS Baseline Benchmarks, Rust/Wasm Core Migration Intent, pixel-core Capability, Full Canvas Repaint Performance Requirement, Implementation-Agnostic Pixel Operations Requirement, Lossless Pixel Round-Trip Requirement, Judgment-Day Blind-Judge Review Process, Phase 6: Rust Quantize/Downscale (+1 more)

### Community 93 - "useDocumentPersistence.hook.ts"
Cohesion: 0.22
Nodes (10): DOCUMENT_AUTOSAVE_DEBOUNCE_MS, useDocumentPersistence(), UseDocumentPersistenceResult, DocumentPersistenceController, FlushFn, registerDocumentPersistenceFlush(), createInMemoryDocumentRepository(), createIndexedDbDocumentRepository() (+2 more)

### Community 94 - "workspace-build Capability"
Cohesion: 0.22
Nodes (9): D9: Commit pkg/, CI Rebuild-Diff Decision, Sound Editor Feature-Parity Checklist, Sprite Editor Feature-Parity Checklist, Commit pkg/ + CI Rebuild-Diff Decision, workspace-build Capability, Developer Experience Budgets Requirement, Independent App Deployment Requirement, Server-Side Secrets Stay Server-Side Requirement (+1 more)

### Community 95 - "0008 — Lossless canvas resize with a cut-strips undo entry"
Cohesion: 0.25
Nodes (7): 0008 — Lossless canvas resize with a cut-strips undo entry, Consequences, Context, Decision, Options considered, Performance budget / acceptance, Prior art

### Community 96 - "computeMascotSceneState"
Cohesion: 0.18
Nodes (16): MascotScene(), useMascotScene(), UseMascotSceneResult, clamp01(), computeAirDodgeOffset(), computeBolt(), computeEnemy(), computeLevelWipeY() (+8 more)

### Community 97 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, bench, build, dev, preview, test, test:watch, typecheck

### Community 98 - "useAssetsPanel.hook.ts"
Cohesion: 0.24
Nodes (10): ASSET_FOLDERS, animationSheetCache, sheetsById, downloadFromHref(), downloadJson(), AssetFolderTreeProps, FolderId, useAssetsPanel() (+2 more)

### Community 99 - "tokens/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, composite, outDir, extends, include, **/*.ts, ../../tsconfig.base.json

### Community 100 - "check-bench.ts"
Cohesion: 0.32
Nodes (7): Benchmark, BenchResults, findByPrefix(), Group, groupTitle(), main(), Thresholds

### Community 101 - "useSaveIndicator.hook.ts"
Cohesion: 0.39
Nodes (6): SaveIndicator(), useSaveIndicator(), useIsPersistent(), useSaveError(), useSaveStatus(), SaveIndicator

### Community 102 - "src-ts/index.ts"
Cohesion: 0.09
Nodes (40): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+32 more)

### Community 103 - "useSpriteEditorStore.hook.ts"
Cohesion: 0.19
Nodes (28): INSPECTOR_TABS, useBottomPanel(), useSpriteEditorLayout(), useCreateTab(), useInspector(), useBottomPanelHeight(), useBottomPanelTab(), useCreateAssetType() (+20 more)

### Community 104 - "Zustand store (diagram node)"
Cohesion: 0.25
Nodes (9): D10: packages/tokens source-exported, no build step, packages/tokens, apps/landing (diagram node), DocumentRepository port (diagram node), Hooks layer (diagram node), packages/tokens (diagram node), Supabase project sync (diagram node, planned), UI layer (diagram node) (+1 more)

### Community 105 - "document-persistence.controller.wasm-gate.test.ts"
Cohesion: 0.33
Nodes (5): emptyPayload(), fakeStorage, makeFakeStore(), mockResolveCoreImpl, mockWaitForWasmModule

### Community 106 - "VariationCard.tsx"
Cohesion: 0.47
Nodes (5): TONE_CLASSES, VariationCard(), VariationCardProps, VariationCardState, VariationCardTone

### Community 107 - "D6: Flat Rust API, No Serde Decision"
Cohesion: 0.20
Nodes (11): D5: Two Seams (PixelKernels/PixelCore) Decision, D6: Flat Rust API, No Serde Decision, D7: Wasm-Memory-Backed Views Decision, Rust Document Struct, PixelKernels Interface, Dirty-Pair Cache-Refresh Contract, Phase 4: packages/core Rust Scaffold, Hexagonal Split: Domain Module vs bindings.rs (+3 more)

### Community 108 - "quantize-downscale.fuzz.test.ts"
Cohesion: 0.25
Nodes (7): DOWNSCALE_SEEDS, here, pkgAvailable, QUANTIZE_SEEDS, randInt(), randomBuffer(), wasmPath

### Community 109 - "useAnimateTab.hook.ts"
Cohesion: 0.19
Nodes (15): ANIMATE_DEFAULT_MOTION_ID, ANIMATE_MOTIONS_BY_ASSET_TYPE, RETRO_DIFFUSION_CHARACTER_ANIMATION_PROMPT(), RETRO_DIFFUSION_MOTION_REJECTED_HINT, RETRO_DIFFUSION_OBJECT_ANIMATION_PROMPT(), generateAnimationWithRetroDiffusion(), sliceAnimationSheet(), AnimateResult (+7 more)

### Community 110 - "Granular selector golden rule"
Cohesion: 0.40
Nodes (5): Zustand granular selector check, Zustand granular selectors always, Core rules shared by both apps, Granular selector golden rule, Konva layer / Zustand store sync

### Community 111 - "editor/package.json"
Cohesion: 0.40
Nodes (4): license, name, private, version

### Community 112 - "constants/timeline-view.ts"
Cohesion: 0.07
Nodes (49): SNAP_GRID_SECONDS, CLIP_INSPECTOR, CLIP_KEY_SHORTCUTS, CLIP_WAVE, CLOCK_CENTISECONDS, GAIN_SMOOTHING_S, PLAYBACK_SCHEDULE_LEAD_S, PLAYHEAD_LARGE_STEP_MULTIPLIER (+41 more)

### Community 113 - "GoogleButton.tsx"
Cohesion: 0.50
Nodes (3): GoogleButton(), GoogleButtonProps, GoogleIcon()

### Community 114 - "mascot-city.ts"
Cohesion: 0.19
Nodes (15): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+7 more)

### Community 115 - "--pf-* CSS custom properties"
Cohesion: 0.67
Nodes (4): DESIGN.md vs tokens.css conflict note, Violet accent reserved for AI surfaces, Four-step dark ladder color tokens, --pf-* CSS custom properties

### Community 116 - "/implementar command"
Cohesion: 0.50
Nodes (4): /implementar command, Reference to find-animation-opportunities skill, Reference to impeccable skill, mcp__pencil__* tools usage

### Community 117 - "D6: flat Rust API surface, u32 handles, no serde"
Cohesion: 0.50
Nodes (4): D6: flat Rust API surface, u32 handles, no serde, D6 elaboration: flat methods, u32 handles, rgba:u32, TsPixelCore adapter, WasmPixelCore adapter

### Community 118 - "bindings.rs (diagram node, only wasm-bindgen boundary)"
Cohesion: 0.22
Nodes (9): D9: pkg/ committed, CI drift check, packages/core/src Rust modules, bindings.rs (diagram node, only wasm-bindgen boundary), document.rs (diagram node), downscale.rs (diagram node), flood_fill.rs (diagram node), history.rs (diagram node), pixels/mod.rs (diagram node) (+1 more)

### Community 119 - "zustand-agent definition"
Cohesion: 0.67
Nodes (3): Reference to zustand-agent.md, zustand-agent definition, zustand-agent reference

### Community 120 - "createEmptyBuffer"
Cohesion: 0.07
Nodes (63): TRANSPARENT_COLOR, makeFullBuffer(), DocReplaceFrameInput, applyEntry(), px(), StrokeState, BucketStats, dominantColor() (+55 more)

### Community 151 - "mascot-sprite.ts"
Cohesion: 0.12
Nodes (17): MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, drawBlaster(), drawMascot(), FillRectCall, BlasterBoltState (+9 more)

### Community 165 - "vercel-functions-dev.ts"
Cohesion: 0.32
Nodes (5): Handler, METHODS_WITHOUT_BODY, readBody(), toWebRequest(), vercelFunctionsDev()

### Community 197 - "retro-diffusion-utils.ts"
Cohesion: 0.11
Nodes (28): AI_SPRITE_DEFAULT_SIZE, RETRO_DIFFUSION_ANIMATION_STYLE_PREFIX, RETRO_DIFFUSION_ROUTE, SPRITE_ANIMATION, SPRITE_IMPORT_DEFAULT_FRAMES, SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MIN_FRAMES, base64ToNativePixels() (+20 more)

### Community 198 - "Phase 1: Flatten Buffer + IndexedDB Persistence"
Cohesion: 0.22
Nodes (9): D12: Local-First Persistence ADR, D13: idb Library for IndexedDB, D1: Flat RGBA Buffer Decision, D2: Copy-on-Write Mutation Decision, D8: IndexedDB Persistence Decision, DocumentRepository Port, IndexedDbDocumentRepository Adapter, Local Draft Recovery Requirement (+1 more)

### Community 199 - "mascot-font.ts"
Cohesion: 0.21
Nodes (12): rgbaToString(), GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, TITLE_TEXT, drawGlyph(), drawGlyphGlow() (+4 more)

### Community 200 - "LibrarySidebar.tsx"
Cohesion: 0.13
Nodes (14): LIBRARY_FILTERS, SoundEditorLayout(), DeleteSoundDialog(), LibraryEmptyState(), LibraryEmptyStateProps, LibraryFilters(), useLibraryFilters(), LibrarySidebar() (+6 more)

### Community 201 - "bench/flood-fill.bench.ts"
Cohesion: 0.22
Nodes (4): here, mazePool, uniformPool, wasmPath

### Community 202 - "LeftSidebar.tsx"
Cohesion: 0.24
Nodes (7): LeftSidebar(), useLeftSidebar(), LayerItem(), LayerItemProps, useLayerItem(), UseLayerItemProps, LayerPanel()

### Community 203 - "wasm-pixel-core.undo-memory.baseline.test.ts"
Cohesion: 0.25
Nodes (7): here, makeDoc(), pkgAvailable, pkgDir, RED, wasmJsPath, wasmPath

### Community 204 - "useTimelineShortcuts.hook.ts"
Cohesion: 0.13
Nodes (17): deleteClip(), resolveTimelineShortcut(), ClipInspector(), TimelineEditor(), useTimelineEditor(), TimelineToolbar(), useTimelineToolbar(), TimelineTopBar() (+9 more)

### Community 205 - "BottomPanel.tsx"
Cohesion: 0.13
Nodes (15): BottomPanel(), ICON_MAP, AssetFolderTree(), ICON_MAP, AssetGrid(), AssetGridProps, AssetsPanel(), AssetsPanelProps (+7 more)

### Community 206 - "useLayerPanel.hook.ts"
Cohesion: 0.30
Nodes (10): useLayerPanel(), useDrawPanel(), useAddLayer(), useLayersMetadata(), useRemoveLayer(), useReorderLayers(), useSetActiveLayer(), useToggleLayerLock() (+2 more)

### Community 207 - "flood-fill.fuzz.test.ts"
Cohesion: 0.25
Nodes (4): here, pkgAvailable, SEEDS, wasmPath

### Community 208 - "DocumentRepository port (load/save/remove)"
Cohesion: 0.29
Nodes (7): DocumentRepository port (load/save/remove), D12: local-first, cloud sync deferred, document-persistence.controller.ts, indexeddb-document.repository.service.ts, DocumentRepository port, Local-first persistence, IndexedDB adapter (diagram node, DEFAULT)

### Community 209 - "ADR 0002: Single dispatch(cmd) seam; core owns the document"
Cohesion: 0.33
Nodes (6): ADR 0002: Single dispatch(cmd) seam; core owns the document, D4: dirty-rect before/after patches, stable-id addressing, core/commands.ts module, core/history.ts module, src-ts/ts-core.ts module, Dirty-rect, not deep-clone, undo history

### Community 210 - "wasm-bindgen Copy-In/Copy-Out Mechanism"
Cohesion: 0.33
Nodes (6): Phase 4 Wasm vs TS Kernel Bench (Near-Memcpy Loss), Phase 7g Store-Loop Bench Result (Wasm Slower Unbatched), Wasm Artifact Size Budget Requirement, Batching Amortizes the Fixed Per-Call Cost, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 211 - "ui.slice.ts"
Cohesion: 0.38
Nodes (5): DEFAULT_ASSET_TYPE, DEFAULT_CREATE_METHOD, RESIZABLE_PANELS, createUISlice(), EditorUIStore

### Community 212 - "colors.test.ts"
Cohesion: 0.40
Nodes (3): COLORS, tokensCss, tokensCssPath

### Community 213 - "Phased Migration Approach (0-7)"
Cohesion: 0.33
Nodes (6): core-parity-gate Capability, Phased Migration Approach (0-7), Baseline Benchmarks Recorded Before Porting, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Phase 0: Gates (CI, Scripts, Characterization Tests)

### Community 214 - "Stage 6: Publishing to AWS (planned)"
Cohesion: 0.50
Nodes (4): Stage 4: Assets (planned), Stage 5: Game building (planned), Stage 6: Publishing to AWS (planned), Stage 7: Operations (planned)

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **656 isolated node(s):** `METHODS_WITHOUT_BODY`, `Handler`, `DeleteAccountEnvelope`, `GoogleUserMetadata`, `ProfileRow` (+651 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 867 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `FOCUS_RING` connect `focus-ring.ts` to `auth.service.ts`, `ColorPicker.tsx`, `PropertiesTab.tsx`, `types/audio.ts`, `LibrarySidebar.tsx`, `VariationCard.tsx`, `LeftSidebar.tsx`, `BottomPanel.tsx`, `AnimateTab.tsx`, `constants/timeline-view.ts`, `GoogleButton.tsx`, `types/timeline.ts`, `motion.ts`, `LoginPage.tsx`, `useSoundDetailHeader.hook.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `useSoundsStore` connect `useSoundsStore` to `useSynthAssetSync.hook.ts`, `types/timeline-view.ts`, `useClipInspector.hook.ts`, `types/audio.ts`, `LibrarySidebar.tsx`, `tweak-mapping.ts`, `useTimelineShortcuts.hook.ts`, `sound-library.ts`, `sound-timeline.slice.test.ts`, `constants/timeline-view.ts`, `types/timeline.ts`, `sound-timeline.slice.ts`, `useMixExport.hook.ts`, `useSoundDetailHeader.hook.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `MOTION` connect `focus-ring.ts` to `auth.service.ts`, `types/timeline-view.ts`, `ColorPicker.tsx`, `LibrarySidebar.tsx`, `VariationCard.tsx`, `LeftSidebar.tsx`, `BottomPanel.tsx`, `AnimateTab.tsx`, `GoogleButton.tsx`, `types/timeline.ts`, `motion.ts`, `LoginPage.tsx`, `useSoundDetailHeader.hook.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `METHODS_WITHOUT_BODY`, `Handler`, `DeleteAccountEnvelope` to the rest of the system?**
  _656 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Should `auth.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1010752688172043 - nodes in this community are weakly interconnected._