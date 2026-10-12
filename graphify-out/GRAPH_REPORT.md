# Graph Report - game-builder  (2026-10-12)

## Corpus Check
- 541 files · ~294,804 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3376 nodes · 8733 edges · 213 communities (139 shown, 70 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 124 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7131528`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- useCanvasOverlay.hook.ts
- core/ts-core.ts
- sprite-pipeline.ts
- useTopBar.hook.ts
- focus-ring.ts
- sounds.store.ts
- mod.rs
- WasmDocument
- lib/timeline-view.ts
- tweak-mapping.test.ts
- useEditorPrefsStore
- index.tsx
- sound-library.ts
- pixel-core.ts
- timeline-ops.ts
- devDependencies
- mascot-scene-state.ts
- useBottomToolbar.hook.ts
- sound-timeline.slice.ts
- history.rs
- src-ts/index.ts
- AssetGrid.tsx
- constants/index.ts
- FOCUS_RING
- ts-core.judgment-day-round2.test.ts
- useDescribeWithAI.hook.ts
- slices.ts
- src-ts/ts-core.ts
- PixelForge IA (AGENTS.md overview)
- WasmPixelCore
- useMixExport.hook.ts
- downscale.rs
- audio-engine.ts
- ApiKeyField.tsx
- ColorPicker.tsx
- scripts
- mascot-scene.ts
- useGeneratePanel.hook.ts
- constants/timeline-view.ts
- wasm-pixel-core.differential.fuzz.test.ts
- compilerOptions
- quantize.rs
- dependencies
- devDependencies
- useCanvasInteraction.hook.ts
- AnimateTab.tsx
- useSettingsPanel.hook.ts
- useSoundsStore
- PixelKernels
- core/package.json
- export-utils.ts
- 5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization)
- compilerOptions
- TimelineTracks.tsx
- types/timeline-view.ts
- useAnimateTab.hook.ts
- tokens/package.json
- useSoundDetailHeader.hook.ts
- WasmPixelCore (diagram node, behind flag)
- include
- useSpriteEditorStore
- delete-account/index.ts
- quantize.ts
- audio-storage.service.ts
- ElevenLabs AI sound generation
- assets.store.ts
- index.test.ts
- useColorPicker.hook.ts
- D6: Flat Rust API, No Serde Decision
- Phase 7: Rust Document/History
- edit-history Capability
- build-wasm.mjs
- resolve-core.ts
- useSpriteEditorStore.hook.ts
- 2026-10-11 — Resizing a sprite without losing its layers
- Phase 5: Rust Flood-Fill
- bindings.rs (diagram node, only wasm-bindgen boundary)
- Phase 1: Flatten Buffer + IndexedDB Persistence
- bench/flood-fill.bench.ts
- TweakPanel.tsx
- core/tsconfig.json
- elevenlabs.ts
- Rust/Wasm core migration boundary
- DocumentRepository port (load/save/remove)
- useTimelineShortcuts.hook.ts
- useDeleteAccountDialog.hook.ts
- wasm-document-core.test.ts
- PixelForge Architecture Overview
- installFakeDom
- useSynthAssetSync.hook.ts
- quantize-downscale.fuzz.test.ts
- pixel-core Capability
- ADR 0002: Single dispatch(cmd) seam; core owns the document
- workspace-build Capability
- 0008 — Lossless canvas resize with a cut-strips undo entry
- computeMascotSceneState
- scripts
- CanvasArea.tsx
- tokens/tsconfig.json
- check-bench.ts
- useSaveIndicator.hook.ts
- wasm-bindgen Copy-In/Copy-Out Mechanism
- useEditorUIStore
- Zustand store (diagram node)
- audio-engine.test.ts
- Phased Migration Approach (0-7)
- types/audio.ts
- persistence.ts
- Stage 6: Publishing to AWS (planned)
- Granular selector golden rule
- editor/package.json
- Inspector.tsx
- mascot-font.ts
- mascot-city.ts
- --pf-* CSS custom properties
- /implementar command
- D6: flat Rust API surface, u32 handles, no serde
- App.tsx
- zustand-agent definition
- src/types/index.ts
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
- ai-generation.ts
- auth.service.ts
- LoginPage.tsx
- LibrarySidebar.tsx
- useAuthForm.hook.ts
- useAuthStore
- color-utils.ts
- ShortcutsPopover.tsx
- tsKernels
- useAssetsPanel.hook.ts
- wasm-pixel-core.undo-memory.baseline.test.ts
- LeftSidebar.tsx
- flood-fill.fuzz.test.ts
- VariationCard.tsx
- auth.types.ts
- colors.test.ts

## God Nodes (most connected - your core abstractions)
1. `useSpriteEditorStore` - 97 edges
2. `useSoundsStore` - 89 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 67 edges
5. `MOTION` - 59 edges
6. `Document` - 52 edges
7. `useEditorUIStore` - 46 edges
8. `putPixel()` - 40 edges
9. `WasmDocument` - 38 edges
10. `dispatchCommandSwitch()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `AI-notes vs owner-voice authorship layers` --semantically_similar_to--> `Authorship of documents (AI notes vs featured docs)`  [INFERRED] [semantically similar]
  .claude/skills/architecture-decision/SKILL.md → AGENTS.md
- `KernelRow` --references--> `tsKernels`  [EXTRACTED]
  apps/editor/src/lib/downscale.oracle-parity.test.ts → packages/core/src-ts/ts-core.ts
- `KernelRow` --references--> `tsKernels`  [EXTRACTED]
  apps/editor/src/lib/quantize.oracle-parity.test.ts → packages/core/src-ts/ts-core.ts
- `Phase 4: packages/core Rust Scaffold` --references--> `Ownership & Borrowing (&[u8] vs Vec<u8>)`  [EXTRACTED]
  openspec/changes/migrate-to-rust-core/tasks.md → packages/core/LEARNING.md
- `Stage 6: Publishing to AWS (planned)` --conceptually_related_to--> `ADR 0005: pnpm monorepo split`  [INFERRED]
  docs/lifecycle.svg → docs/adr/0005-monorepo-split.md

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

## Communities (213 total, 70 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (73): HashMap, History, HistoryEntry, bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of() (+65 more)

### Community 1 - "useCanvasOverlay.hook.ts"
Cohesion: 0.24
Nodes (9): CURSOR_POSITION_FALLBACK, SPRITE_EDITOR_VIEWPORT, CanvasOverlay(), useCanvasOverlay(), PositionFields(), usePositionFields(), UsePositionFieldsReturn, useCursorPixel() (+1 more)

### Community 2 - "core/ts-core.ts"
Cohesion: 0.05
Nodes (77): SPRITE_EDITOR_HISTORY, RenderPixelsToCanvasOptions, unpackRgba(), DirtyRect, DocReplaceFrameInput, FrameId, LayerId, LayerMetaPatch (+69 more)

### Community 3 - "sprite-pipeline.ts"
Cohesion: 0.11
Nodes (34): AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_SIZES, SPRITE_IMPORT_ACCEPT, SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MIN_FRAMES, base64ToNativePixels(), decodeGeneratedSprite(), estimateRetroDiffusionCost() (+26 more)

### Community 4 - "useTopBar.hook.ts"
Cohesion: 0.39
Nodes (8): SPRITE_DOCUMENT_DEFAULT_NAME, useTopBar(), useCanRedo(), useCanUndo(), useFrameCount(), useRedo(), useResetPanelSizes(), useUndo()

### Community 5 - "focus-ring.ts"
Cohesion: 0.15
Nodes (15): DISABLED_STATE, MOTION, SoundDetailHeaderProps, DeleteSoundDialog(), DescribeWithAISection(), ImportRow(), NewSoundPopoverProps, PresetSection() (+7 more)

### Community 6 - "sounds.store.ts"
Cohesion: 0.07
Nodes (45): ADSR_DEFAULTS, ADSR_LIMITS, ADSR_VIEW, DEFAULT_VOLUME, ELEVENLABS_API_TIMEOUT, FILTER_DEFAULTS, FILTER_LIMITS, FILTER_TYPES (+37 more)

### Community 7 - "mod.rs"
Cohesion: 0.08
Nodes (48): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+40 more)

### Community 8 - "WasmDocument"
Cohesion: 0.08
Nodes (13): Box, DispatchResult, clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill() (+5 more)

### Community 9 - "lib/timeline-view.ts"
Cohesion: 0.09
Nodes (40): SECONDS_PER_MINUTE, CLIP_KEY_SHORTCUTS, CLIP_WAVE, TIMELINE_LAYOUT, soundDragSession, collectSnapEdges(), snapThresholdSeconds(), snapTime() (+32 more)

### Community 10 - "tweak-mapping.test.ts"
Cohesion: 0.21
Nodes (14): DEFAULT_DECAY_SHARE, TWEAK_PARAMS, TWEAK_RANGES, TWEAK_SLIDER, applyTweak(), clamp(), fromPosition(), Range (+6 more)

### Community 11 - "useEditorPrefsStore"
Cohesion: 0.15
Nodes (14): SPRITE_EDITOR_PALETTE, PREFS_STORAGE_KEY, useColorInputs(), UseColorInputsParams, useSaveColor(), useSetRetroDiffusionApiKey(), useEditorPrefsStore, createIntegrationsSlice() (+6 more)

### Community 12 - "index.tsx"
Cohesion: 0.07
Nodes (39): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+31 more)

### Community 13 - "sound-library.ts"
Cohesion: 0.07
Nodes (58): DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, ELEVENLABS_DEFAULT_VOICE_ID, FALLBACK_SOUND_NAME, IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES, LONG_DURATION_DECIMALS (+50 more)

### Community 14 - "pixel-core.ts"
Cohesion: 0.05
Nodes (41): getPixelCoreEnvOverride(), Command, DispatchResult, isPixelCoreImpl(), PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, readEnvOverride(), readLocalStorageOverride() (+33 more)

### Community 15 - "timeline-ops.ts"
Cohesion: 0.07
Nodes (63): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME, GAIN_DB_MAX, GAIN_DB_MIN (+55 more)

### Community 16 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 17 - "mascot-scene-state.ts"
Cohesion: 0.10
Nodes (33): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_BOLT_Y_OFFSET, GROUND_ENEMY (+25 more)

### Community 18 - "useBottomToolbar.hook.ts"
Cohesion: 0.21
Nodes (12): SPRITE_EDITOR_TOOLS, BottomToolbar(), useBottomToolbar(), ICON_MAP, ToolButton(), ToolButtonProps, useOnionSkinEnabled(), useSetShowGrid() (+4 more)

### Community 19 - "sound-timeline.slice.ts"
Cohesion: 0.12
Nodes (30): DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, HISTORY_LIMIT, MAX_PX_PER_SECOND, MIN_PX_PER_SECOND, ZOOM_SLIDER_STEP_PX, ZOOM_STEP, EMPTY_HISTORY (+22 more)

### Community 20 - "history.rs"
Cohesion: 0.15
Nodes (25): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+17 more)

### Community 21 - "src-ts/index.ts"
Cohesion: 0.09
Nodes (40): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+32 more)

### Community 22 - "AssetGrid.tsx"
Cohesion: 0.20
Nodes (9): AssetFolderTree(), ICON_MAP, AssetGrid(), AssetGridProps, AssetsPanel(), AssetsPanelProps, AssetTile(), AssetTileProps (+1 more)

### Community 23 - "constants/index.ts"
Cohesion: 0.05
Nodes (50): clampSize(), handler(), json(), NOTE: width/height are what was REQUESTED, which for an animation is the, RetroDiffusionApiResponse, stripDataUri(), AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS, AI_QUALITY_SAMPLE_NATIVE_SIZE (+42 more)

### Community 24 - "FOCUS_RING"
Cohesion: 0.12
Nodes (22): DeleteAccountDialog(), DeleteAccountDialogProps, AccountDeletedNotice(), useAccountDeletedNotice(), ModalPortal(), ModalPortalProps, SettingsPanel(), SettingsPanelProps (+14 more)

### Community 25 - "ts-core.judgment-day-round2.test.ts"
Cohesion: 0.08
Nodes (49): packPoints(), packRgba(), RGBA_BYTE_SHIFT, frameToSerializedFrame(), layerToSerializedLayer(), CoreState, createCoreState(), currentActiveLayerId() (+41 more)

### Community 26 - "useDescribeWithAI.hook.ts"
Cohesion: 0.23
Nodes (9): AI_KIND_OPTIONS, NEW_SOUND_AUTOFOCUS, NEXT_KEYS, PREVIOUS_KEYS, useDescribeWithAI(), autofocusSelector(), getFocusable(), useNewSoundPopover() (+1 more)

### Community 27 - "slices.ts"
Cohesion: 0.15
Nodes (20): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_TIMELINE, createInitialFrame(), createInitialLayer(), initialLayer, createCompoundSlice(), createDocumentStatusSlice(), createLayerSlice() (+12 more)

### Community 28 - "src-ts/ts-core.ts"
Cohesion: 0.14
Nodes (26): buildPalette(), CHANNELS, diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect() (+18 more)

### Community 29 - "PixelForge IA (AGENTS.md overview)"
Cohesion: 0.08
Nodes (27): cleancode-agent definition, test-agent (referenced), cleancode-agent (invoked when done), frontend-agent definition, Reference to clean-code-agent.md, Reference to frontend-agent.md, Reference to AGENTS.md as single source of truth, Reference to AGENTS.md build pipeline (+19 more)

### Community 30 - "WasmPixelCore"
Cohesion: 0.10
Nodes (5): DispatchResult, PixelCore, clampRectToCanvas(), decodeNames(), WasmPixelCore

### Community 31 - "useMixExport.hook.ts"
Cohesion: 0.11
Nodes (21): WAV_EXTENSION, createAudioObjectUrl(), encodeWav(), floatToInt16(), MockAudioBuffer, writeString(), writeWavHeader(), downloadBlob() (+13 more)

### Community 32 - "downscale.rs"
Cohesion: 0.16
Nodes (21): FnMut, alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color() (+13 more)

### Community 33 - "audio-engine.ts"
Cohesion: 0.22
Nodes (8): AudioEngine, buildSynthChain(), calculateDefaultDuration(), createWhiteNoiseBuffer(), mapFilterType(), msToSec(), AudioSynthSlice, SynthParameters

### Community 34 - "ApiKeyField.tsx"
Cohesion: 0.47
Nodes (4): ApiKeyField(), ApiKeyFieldProps, useApiKeyField(), UseApiKeyFieldResult

### Community 35 - "ColorPicker.tsx"
Cohesion: 0.18
Nodes (11): COLOR_PICKER, ColorInputs(), ColorInputsProps, HueSlider(), HueSliderProps, useHueSlider(), UseHueSliderParams, SaturationValueSquare() (+3 more)

### Community 36 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 37 - "mascot-scene.ts"
Cohesion: 0.17
Nodes (20): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+12 more)

### Community 38 - "useGeneratePanel.hook.ts"
Cohesion: 0.09
Nodes (31): AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE, ALPHA_TRANSPARENT_THRESHOLD, ASSET_TYPE_EXAMPLE_CHIPS, ASSET_TYPE_PROMPT_PLACEHOLDER, ASSET_TYPE_STYLE_BY_QUALITY, ASSET_TYPES, DEFAULT_GAME_TEMPLATE_ID, GAME_TEMPLATE_OFF_SUMMARY (+23 more)

### Community 39 - "constants/timeline-view.ts"
Cohesion: 0.09
Nodes (32): ADD_TO_TIMELINE_KEY, ALT_KEY, ALT_KEY_LABEL, CLIP_INSPECTOR, CLOCK_CENTISECONDS, MAC_PLATFORM_PATTERN, MOD_KEY, MOD_KEY_LABEL (+24 more)

### Community 40 - "wasm-pixel-core.differential.fuzz.test.ts"
Cohesion: 0.06
Nodes (30): here, makeDoc(), pkgAvailable, pkgDir, RED, SCENARIOS, STROKE_POINTS, wasmJsPath (+22 more)

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

### Community 45 - "useCanvasInteraction.hook.ts"
Cohesion: 0.22
Nodes (14): screenToPixel(), ADR-0008, useCanvasSizePopover(), bresenhamLine(), KonvaPointerEvent, useCanvasInteraction(), useCanvasSelection(), useActiveTool() (+6 more)

### Community 46 - "AnimateTab.tsx"
Cohesion: 0.11
Nodes (19): ASSET_LIBRARY_IMPORT_ACCEPT, CREATE_METHODS, AiResultCard(), AiResultCardProps, AnimateTab(), capitalizeWords(), AssetTypeSelector(), ICON_MAP (+11 more)

### Community 47 - "useSettingsPanel.hook.ts"
Cohesion: 0.20
Nodes (16): useSettingsPanel(), UseSettingsPanelResult, API_KEY_HELP_URL, API_KEY_PROVIDER, API_KEY_SAVED_FEEDBACK_MS, ElevenLabsError, generateMusic(), generateSFX() (+8 more)

### Community 48 - "useSoundsStore"
Cohesion: 0.10
Nodes (27): DELETE_SOUND_KEYS, SOUND_KIND_LABELS, SOUND_NAME_MAX_LENGTH, VOLUME_RANGE, TRACK_KIND_ICON, getAssetKind(), getAssetSource(), useSoundEditorLayout() (+19 more)

### Community 49 - "PixelKernels"
Cohesion: 0.07
Nodes (21): here, source, wasmPath, here, wasmPath, here, sourceCanvas, wasmPath (+13 more)

### Community 50 - "core/package.json"
Cohesion: 0.10
Nodes (19): devDependencies, @types/node, typescript, vitest, exports, @types/node, typescript, vitest (+11 more)

### Community 51 - "export-utils.ts"
Cohesion: 0.13
Nodes (23): SPRITE_EDITOR_CANVAS, getDrawOffset(), renderPixelsToCanvas(), downloadCanvasAsPng(), exportFrameAsPng(), exportSpriteSheetAsPng(), layersToBase64(), pixelBufferToDataUri() (+15 more)

### Community 52 - "5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization)"
Cohesion: 0.12
Nodes (17): ADR 0006: DocumentRepository port + IndexedDB adapter, 5-phase scale-up plan (limits, persistence, segments, windowed export, virtualization), Triggers to resume scalability work, Chunking / segmentation, Cursor-based pagination, HTTP adaptive streaming (HLS, MPEG-DASH), List virtualization / windowing, LRU cache (+9 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 54 - "TimelineTracks.tsx"
Cohesion: 0.11
Nodes (16): TRACK_COLOR, TRACK_KIND_OPTIONS, AddTrackRow(), Playhead(), PlayheadProps, usePlayhead(), PlayheadCap(), TimelineRuler() (+8 more)

### Community 55 - "types/timeline-view.ts"
Cohesion: 0.11
Nodes (25): GAIN_SMOOTHING_S, MIX_EXPORT, PLAYBACK_SCHEDULE_LEAD_S, dbToGain(), effectiveGain(), hasSoloTrack(), buildMixGraph(), disposeMixGraph() (+17 more)

### Community 56 - "useAnimateTab.hook.ts"
Cohesion: 0.13
Nodes (23): ANIMATE_DEFAULT_MOTION_ID, ANIMATE_MOTIONS_BY_ASSET_TYPE, BOTTOM_PANEL_TABS, RECENT_ASSETS_LIMIT, RETRO_DIFFUSION_CHARACTER_ANIMATION_PROMPT(), RETRO_DIFFUSION_MOTION_REJECTED_HINT, RETRO_DIFFUSION_OBJECT_ANIMATION_PROMPT(), SPRITE_ANIMATION (+15 more)

### Community 57 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 58 - "useSoundDetailHeader.hook.ts"
Cohesion: 0.13
Nodes (25): NAME_VISIBLE_TAIL_LENGTH, audioBufferCache, buffers, decodeFromUrl(), inflight, formatDuration(), getAssetKindLabel(), splitNameForTruncation() (+17 more)

### Community 59 - "WasmPixelCore (diagram node, behind flag)"
Cohesion: 0.31
Nodes (9): D7: Wasm linear-memory views, rebuilt per dispatch, WebAssembly JS<->Wasm boundary copy cost, src-ts/resolve-core.ts module, src-ts/wasm-core.ts module, PixelCore port (diagram node), PixelKernels (diagram node), TsPixelCore (diagram node, DEFAULT), wasm-pack -> pkg/ (diagram node) (+1 more)

### Community 60 - "include"
Cohesion: 0.12
Nodes (15): compilerOptions, paths, plugins, target, exclude, extends, include, node_modules (+7 more)

### Community 61 - "useSpriteEditorStore"
Cohesion: 0.21
Nodes (25): TimelineBar(), getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useCopySelectedFrames(), useCurrentFrameIndex() (+17 more)

### Community 62 - "delete-account/index.ts"
Cohesion: 0.40
Nodes (4): CORS_HEADERS, Envelope, fail(), respond()

### Community 63 - "quantize.ts"
Cohesion: 0.33
Nodes (9): QUANTIZE_DEFAULTS, buildPalette(), Centroid, dist2(), nearest(), quantizePixels(), saturation(), WeightedPoint (+1 more)

### Community 64 - "audio-storage.service.ts"
Cohesion: 0.18
Nodes (9): getSupabaseAnonKey(), getSupabaseUrl(), AUDIO_STORAGE_BUCKET, supabase, buildFilePath(), generateId(), StorageError, uploadAudio() (+1 more)

### Community 65 - "ElevenLabs AI sound generation"
Cohesion: 0.15
Nodes (14): ElevenLabs integration bugs (music endpoint, duration, TTS model, body buffering), Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, Response streaming, apps/editor/api/ai Vercel Functions proxy (diagram node) (+6 more)

### Community 66 - "assets.store.ts"
Cohesion: 0.08
Nodes (35): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, ANIMATION_PIPELINE_VERSION, GENERATION_HISTORY_LIMIT, GENERATION_HISTORY_STORAGE_KEY, ASSET_LIBRARY_LIMIT, isNonEmptyString(), isPngDataUri() (+27 more)

### Community 67 - "index.test.ts"
Cohesion: 0.08
Nodes (21): DOCUMENT_SCHEMA_VERSION, timelineToDocumentPayload(), toStrokePoints, BLUE, GREEN, make2x2Buffer(), RED, setupWithSelection() (+13 more)

### Community 68 - "useColorPicker.hook.ts"
Cohesion: 0.29
Nodes (11): useColorPalette(), ActiveColorType, hexToRgba(), rgbaToHex(), useColorPicker(), usePalette(), usePrimaryColor(), useRemoveColor() (+3 more)

### Community 69 - "D6: Flat Rust API, No Serde Decision"
Cohesion: 0.20
Nodes (11): D5: Two Seams (PixelKernels/PixelCore) Decision, D6: Flat Rust API, No Serde Decision, D7: Wasm-Memory-Backed Views Decision, Rust Document Struct, PixelKernels Interface, Dirty-Pair Cache-Refresh Contract, Phase 4: packages/core Rust Scaffold, Hexagonal Split: Domain Module vs bindings.rs (+3 more)

### Community 70 - "Phase 7: Rust Document/History"
Cohesion: 0.21
Nodes (13): Phase 7 Document/PixelCore Bench Result, D3: Core Owns Document Decision, Default Core Implementation Stays TS Decision, PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, PixelCore Interface Fallback Decision (+5 more)

### Community 71 - "edit-history Capability"
Cohesion: 0.17
Nodes (13): Every Document Mutation Is Undoable (Phase 2c), Command Union Type, D4: Dirty-Rect History Decision, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), edit-history Capability, Dirty-Rect Patch History Decision, Bounded History Retention Requirement (+5 more)

### Community 72 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 73 - "resolve-core.ts"
Cohesion: 0.26
Nodes (11): isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels(), here, pkgAvailable, wasmPath, withRuntimeTrapFallback() (+3 more)

### Community 74 - "useSpriteEditorStore.hook.ts"
Cohesion: 0.17
Nodes (21): useLayerPanel(), useDrawPanel(), usePropertiesTab(), UsePropertiesTabReturn, useActiveLayerId(), useActiveLayerOpacity(), useAddLayer(), useClipboard() (+13 more)

### Community 75 - "2026-10-11 — Resizing a sprite without losing its layers"
Cohesion: 0.18
Nodes (12): Deferred: scaling the sound editor to thousands of assets, AI notes README, Scalable assets in the browser - research notes, 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Lessons, Options and tradeoffs, Result (+4 more)

### Community 76 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.21
Nodes (12): Phase 5 Flood-Fill Bench Result (2.3-2.6x, Target 3x Not Met), Phase 5f Scanline Bench Result (Ratio Narrows, Absolute Faster), Phase 6 Quantize/Downscale Bench Result, Scanline Span-Fill Rewrite (Phase 5f), Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, Flat Table Replaces Per-Cell HashMap, No Recursion in Flood-Fill (Stack Overflow Risk) (+4 more)

### Community 77 - "bindings.rs (diagram node, only wasm-bindgen boundary)"
Cohesion: 0.22
Nodes (9): D9: pkg/ committed, CI drift check, packages/core/src Rust modules, bindings.rs (diagram node, only wasm-bindgen boundary), document.rs (diagram node), downscale.rs (diagram node), flood_fill.rs (diagram node), history.rs (diagram node), pixels/mod.rs (diagram node) (+1 more)

### Community 78 - "Phase 1: Flatten Buffer + IndexedDB Persistence"
Cohesion: 0.22
Nodes (9): D12: Local-First Persistence ADR, D13: idb Library for IndexedDB, D1: Flat RGBA Buffer Decision, D2: Copy-on-Write Mutation Decision, D8: IndexedDB Persistence Decision, DocumentRepository Port, IndexedDbDocumentRepository Adapter, Local Draft Recovery Requirement (+1 more)

### Community 79 - "bench/flood-fill.bench.ts"
Cohesion: 0.22
Nodes (4): here, mazePool, uniformPool, wasmPath

### Community 80 - "TweakPanel.tsx"
Cohesion: 0.18
Nodes (10): TransportProps, TweakPanel(), TweakPanelProps, useTweakPanel(), TweakSlider(), TweakSliderProps, TweakSliderVariant, VARIANT_CLASSES (+2 more)

### Community 81 - "core/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, outDir, exclude, extends, include, node_modules, ../../tsconfig.base.json (+2 more)

### Community 82 - "elevenlabs.ts"
Cohesion: 0.29
Nodes (7): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES

### Community 83 - "Rust/Wasm core migration boundary"
Cohesion: 0.25
Nodes (9): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), Rust/Wasm core migration boundary, VITE_PIXEL_CORE runtime flag, Hexagonal ports & adapters (PixelCore, DocumentRepository), Roadmap (Supabase, Phaser.js scene builder, AWS publish) (+1 more)

### Community 84 - "DocumentRepository port (load/save/remove)"
Cohesion: 0.29
Nodes (7): DocumentRepository port (load/save/remove), D12: local-first, cloud sync deferred, document-persistence.controller.ts, indexeddb-document.repository.service.ts, DocumentRepository port, Local-first persistence, IndexedDB adapter (diagram node, DEFAULT)

### Community 85 - "useTimelineShortcuts.hook.ts"
Cohesion: 0.20
Nodes (12): SNAP_GRID_SECONDS, resolveTimelineShortcut(), TimelineEditor(), useTimelineEditor(), TimelineTopBar(), isTextEntry(), NUDGE_ACTIONS, runAction() (+4 more)

### Community 86 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.25
Nodes (9): getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS, DELETE_ACCOUNT_CONFIRM_WORD, DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE, DELETE_ACCOUNT_ERROR_MESSAGES, isDeleteAccountConfirmed() (+1 more)

### Community 87 - "wasm-document-core.test.ts"
Cohesion: 0.24
Nodes (6): baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 88 - "PixelForge Architecture Overview"
Cohesion: 0.19
Nodes (13): ADR 0001: Flat pixel buffer, copy-on-write per batch, ADR 0003: Dirty-rect patches for undo history, ADR 0004: Rust/Wasm boundary shape, ADR 0005: pnpm monorepo split, ADR 0007: Local-first persistence model, The monorepo and Rust/WebAssembly migration, explained simply, Study guide: moving the editor from Next.js to Vite, Vercel monorepos (Root Directory, Ignored Build Step) (+5 more)

### Community 89 - "installFakeDom"
Cohesion: 1.00
Nodes (3): installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext()

### Community 90 - "useSynthAssetSync.hook.ts"
Cohesion: 0.12
Nodes (20): MINI_WAVE, MINI_WAVE_BAR_COUNT, TWEAK_REGENERATE_DEBOUNCE_MS, WAVE_PEAK_COUNT, computePeaks(), normalizePeaks(), resamplePeaks(), areSynthParamsEqual() (+12 more)

### Community 91 - "quantize-downscale.fuzz.test.ts"
Cohesion: 0.25
Nodes (7): DOWNSCALE_SEEDS, here, pkgAvailable, QUANTIZE_SEEDS, randInt(), randomBuffer(), wasmPath

### Community 92 - "pixel-core Capability"
Cohesion: 0.22
Nodes (9): Phase 0 TS Baseline Benchmarks, Rust/Wasm Core Migration Intent, pixel-core Capability, Full Canvas Repaint Performance Requirement, Implementation-Agnostic Pixel Operations Requirement, Lossless Pixel Round-Trip Requirement, Judgment-Day Blind-Judge Review Process, Phase 6: Rust Quantize/Downscale (+1 more)

### Community 93 - "ADR 0002: Single dispatch(cmd) seam; core owns the document"
Cohesion: 0.33
Nodes (6): ADR 0002: Single dispatch(cmd) seam; core owns the document, D4: dirty-rect before/after patches, stable-id addressing, core/commands.ts module, core/history.ts module, src-ts/ts-core.ts module, Dirty-rect, not deep-clone, undo history

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

### Community 98 - "CanvasArea.tsx"
Cohesion: 0.21
Nodes (19): SPRITE_EDITOR_KEYBOARD, CanvasArea(), KonvaPointerEvent, useCanvasPanning(), useCanvasZoom(), useKeyboardShortcuts(), useCopySelection(), useCutSelection() (+11 more)

### Community 99 - "tokens/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, composite, outDir, extends, include, **/*.ts, ../../tsconfig.base.json

### Community 100 - "check-bench.ts"
Cohesion: 0.32
Nodes (7): Benchmark, BenchResults, findByPrefix(), Group, groupTitle(), main(), Thresholds

### Community 101 - "useSaveIndicator.hook.ts"
Cohesion: 0.39
Nodes (6): SaveIndicator(), useSaveIndicator(), useIsPersistent(), useSaveError(), useSaveStatus(), SaveIndicator

### Community 102 - "wasm-bindgen Copy-In/Copy-Out Mechanism"
Cohesion: 0.33
Nodes (6): Phase 4 Wasm vs TS Kernel Bench (Near-Memcpy Loss), Phase 7g Store-Loop Bench Result (Wasm Slower Unbatched), Wasm Artifact Size Budget Requirement, Batching Amortizes the Fixed Per-Call Cost, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 103 - "useEditorUIStore"
Cohesion: 0.17
Nodes (23): CANVAS_MIN_SIZE, INSPECTOR_TABS, SPRITE_EDITOR_LAYOUT, useAssetLibraryPersistence(), createIndexedDbAssetLibraryRepository(), useSpriteEditorLayout(), useInspector(), useBottomPanelHeight() (+15 more)

### Community 104 - "Zustand store (diagram node)"
Cohesion: 0.25
Nodes (9): D10: packages/tokens source-exported, no build step, packages/tokens, apps/landing (diagram node), DocumentRepository port (diagram node), Hooks layer (diagram node), packages/tokens (diagram node), Supabase project sync (diagram node, planned), UI layer (diagram node) (+1 more)

### Community 105 - "audio-engine.test.ts"
Cohesion: 0.33
Nodes (11): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+3 more)

### Community 106 - "Phased Migration Approach (0-7)"
Cohesion: 0.33
Nodes (6): core-parity-gate Capability, Phased Migration Approach (0-7), Baseline Benchmarks Recorded Before Porting, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Phase 0: Gates (CI, Scripts, Characterization Tests)

### Community 107 - "types/audio.ts"
Cohesion: 0.16
Nodes (22): NewAssetInput, AudioLibrarySlice, AudioPlaybackSlice, AudioUISlice, SoundTimelineSlice, AudioAssetSource, AudioAssetTag, ElevenLabsMode (+14 more)

### Community 108 - "persistence.ts"
Cohesion: 0.06
Nodes (56): ASSET_ANIMATIONS_STORE, ASSET_DB_NAME, ASSET_DB_VERSION, ASSET_GENERATIONS_STORE, DOCUMENT_AUTOSAVE_DEBOUNCE_MS, DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_STORE_NAME (+48 more)

### Community 109 - "Stage 6: Publishing to AWS (planned)"
Cohesion: 0.50
Nodes (4): Stage 4: Assets (planned), Stage 5: Game building (planned), Stage 6: Publishing to AWS (planned), Stage 7: Operations (planned)

### Community 110 - "Granular selector golden rule"
Cohesion: 0.40
Nodes (5): Zustand granular selector check, Zustand granular selectors always, Core rules shared by both apps, Granular selector golden rule, Konva layer / Zustand store sync

### Community 111 - "editor/package.json"
Cohesion: 0.40
Nodes (4): license, name, private, version

### Community 112 - "Inspector.tsx"
Cohesion: 0.17
Nodes (10): CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), ColorPicker, ICON_MAP, Inspector(), TAB_PANELS, OpacitySlider() (+2 more)

### Community 113 - "mascot-font.ts"
Cohesion: 0.21
Nodes (12): rgbaToString(), GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, TITLE_TEXT, drawGlyph(), drawGlyphGlow() (+4 more)

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

### Community 118 - "App.tsx"
Cohesion: 0.15
Nodes (13): App(), LoginPage(), useLoginPage(), ResetPasswordPage(), EditorLayout(), useEditorLayout(), getLandingUrl(), EDITOR_NAV_ITEMS (+5 more)

### Community 119 - "zustand-agent definition"
Cohesion: 0.67
Nodes (3): Reference to zustand-agent.md, zustand-agent definition, zustand-agent reference

### Community 120 - "src/types/index.ts"
Cohesion: 0.05
Nodes (82): TRANSPARENT_COLOR, makeFullBuffer(), rgbaToHex(), makeDoc(), makeDoc(), BucketStats, dominantColor(), downscalePixels() (+74 more)

### Community 151 - "mascot-sprite.ts"
Cohesion: 0.12
Nodes (17): MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, drawBlaster(), drawMascot(), FillRectCall, BlasterBoltState (+9 more)

### Community 165 - "vercel-functions-dev.ts"
Cohesion: 0.32
Nodes (5): Handler, METHODS_WITHOUT_BODY, readBody(), toWebRequest(), vercelFunctionsDev()

### Community 197 - "ai-generation.ts"
Cohesion: 0.15
Nodes (16): AIJobsState, IDLE_JOB, IDLE, useAIJobsStore, AIJob, AnimateResult, AssetLibrarySnapshot, GameTemplateId (+8 more)

### Community 198 - "auth.service.ts"
Cohesion: 0.18
Nodes (10): DELETE_ACCOUNT_ERROR_CODE, deleteAccount(), DeleteAccountEnvelope, GoogleUserMetadata, ProfileRow, toDeleteAccountErrorCode(), DeleteAccountErrorCode, DeleteAccountFailure (+2 more)

### Community 199 - "LoginPage.tsx"
Cohesion: 0.19
Nodes (9): AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, GoogleButton(), GoogleButtonProps, GoogleIcon(), HEADING (+1 more)

### Community 200 - "LibrarySidebar.tsx"
Cohesion: 0.16
Nodes (12): LIBRARY_FILTERS, LibraryEmptyState(), LibraryEmptyStateProps, LibraryFilters(), useLibraryFilters(), LibrarySidebar(), useLibrarySidebar(), NewSoundPopover() (+4 more)

### Community 201 - "useAuthForm.hook.ts"
Cohesion: 0.36
Nodes (8): useAuthForm(), useResetPasswordPage(), AUTH_COPY, AUTH_DEFAULT_ERROR_MESSAGE, AUTH_ERROR_MESSAGES, RESET_PASSWORD_REDIRECT_DELAY_MS, EDITOR_ROUTES, mapAuthError()

### Community 202 - "useAuthStore"
Cohesion: 0.32
Nodes (8): isSupabaseConfigured(), useAuthSession(), authService, getInitial(), useAccountMenu(), useAuthStore, createAuthSlice(), AuthStore

### Community 203 - "color-utils.ts"
Cohesion: 0.26
Nodes (9): SPRITE_EDITOR_COLORS, hexToHsv(), hexToRgba(), hsvToHex(), getDrawOffset(), GridBackground(), GridBackgroundProps, renderCheckerboardToCanvas() (+1 more)

### Community 204 - "ShortcutsPopover.tsx"
Cohesion: 0.27
Nodes (6): KeyChip(), KeyChipProps, ShortcutsPopover(), ShortcutsPopoverProps, TipBarProps, ToolButtonProps

### Community 205 - "tsKernels"
Cohesion: 0.11
Nodes (15): resolveCoreImpl(), ensureWasmResolving(), getActiveKernels(), getActiveKernelsAsync(), mockGetPixelCoreEnvOverride, coreEntryPath, coreRoot, KernelRow (+7 more)

### Community 206 - "useAssetsPanel.hook.ts"
Cohesion: 0.14
Nodes (18): ASSET_FOLDERS, animationSheetCache, sheetsById, downloadFromHref(), downloadJson(), readFileAsDataUrl(), readImageDimensions(), readLibraryImageFile() (+10 more)

### Community 207 - "wasm-pixel-core.undo-memory.baseline.test.ts"
Cohesion: 0.25
Nodes (7): here, makeDoc(), pkgAvailable, pkgDir, RED, wasmJsPath, wasmPath

### Community 208 - "LeftSidebar.tsx"
Cohesion: 0.24
Nodes (7): LeftSidebar(), useLeftSidebar(), LayerItem(), LayerItemProps, useLayerItem(), UseLayerItemProps, LayerPanel()

### Community 209 - "flood-fill.fuzz.test.ts"
Cohesion: 0.25
Nodes (4): here, pkgAvailable, SEEDS, wasmPath

### Community 210 - "VariationCard.tsx"
Cohesion: 0.47
Nodes (5): TONE_CLASSES, VariationCard(), VariationCardProps, VariationCardState, VariationCardTone

### Community 211 - "auth.types.ts"
Cohesion: 0.33
Nodes (5): AuthActions, AuthFormMode, AuthState, AuthStatus, AuthUser

### Community 212 - "colors.test.ts"
Cohesion: 0.40
Nodes (3): COLORS, tokensCss, tokensCssPath

## Ambiguous Edges - Review These
- `src-ts/resolve-core.ts module` → `ADR 0004: Rust/Wasm boundary shape`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **671 isolated node(s):** `DeleteAccountDialogProps`, `HEADING`, `SUBTEXT`, `AuthFormProps`, `SUBMIT_LABEL` (+666 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 886 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `src-ts/resolve-core.ts module` and `ADR 0004: Rust/Wasm boundary shape`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `FOCUS_RING` connect `FOCUS_RING` to `ApiKeyField.tsx`, `ColorPicker.tsx`, `sprite-pipeline.ts`, `focus-ring.ts`, `sounds.store.ts`, `LoginPage.tsx`, `LibrarySidebar.tsx`, `lib/timeline-view.ts`, `ShortcutsPopover.tsx`, `AnimateTab.tsx`, `TweakPanel.tsx`, `LeftSidebar.tsx`, `VariationCard.tsx`, `Inspector.tsx`, `TimelineTracks.tsx`, `AssetGrid.tsx`, `useSoundDetailHeader.hook.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `MOTION` connect `focus-ring.ts` to `ApiKeyField.tsx`, `ColorPicker.tsx`, `sprite-pipeline.ts`, `LoginPage.tsx`, `LibrarySidebar.tsx`, `lib/timeline-view.ts`, `ShortcutsPopover.tsx`, `AnimateTab.tsx`, `TweakPanel.tsx`, `LeftSidebar.tsx`, `VariationCard.tsx`, `Inspector.tsx`, `TimelineTracks.tsx`, `AssetGrid.tsx`, `FOCUS_RING`, `useSoundDetailHeader.hook.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `tsKernels` connect `tsKernels` to `resolve-core.ts`, `bench/flood-fill.bench.ts`, `PixelKernels`, `flood-fill.fuzz.test.ts`, `src-ts/index.ts`, `src/types/index.ts`, `quantize-downscale.fuzz.test.ts`, `src-ts/ts-core.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `DeleteAccountDialogProps`, `HEADING`, `SUBTEXT` to the rest of the system?**
  _671 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Should `core/ts-core.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05269497139415839 - nodes in this community are weakly interconnected._