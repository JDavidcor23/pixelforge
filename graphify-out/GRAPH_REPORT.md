# Graph Report - game-builder  (2026-10-24)

## Corpus Check
- 614 files · ~340,110 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4002 nodes · 10150 edges · 247 communities (160 shown, 83 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4cb6efe6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- createEmptyBuffer
- ai/retro-diffusion.ts
- pixel-core.ts
- timeline-ops.ts
- assets.store.ts
- stores/index.ts
- ts-core.judgment-day-round3.test.ts
- index.tsx
- animation.ts
- sound-library.ts
- mod.rs
- lib/timeline-view.ts
- animation-job-ledger.ts
- constants/index.ts
- WasmDocument
- src/types/index.ts
- animate.ts
- useEditorUIStore
- types/timeline-view.ts
- ColorPicker.tsx
- PixelKernels
- src-ts/index.ts
- useCanvasInteraction.hook.ts
- useSpriteEditorStore.hook.ts
- auth.service.ts
- audio-engine.ts
- useTopBar.hook.ts
- AIAnimation
- animation-limits.ts
- mascot-scene-state.ts
- useImportSpriteSheet.hook.ts
- history.rs
- pixellab-animate-harness.ts
- sprite-pipeline.ts
- devDependencies
- WasmPixelCore
- useCreateSound.hook.ts
- audio-storage.service.ts
- QualitySamplePreview.tsx
- persistence.ts
- file-menu.ts
- legacy-draft-migration.service.ts
- wasm-pixel-core.differential.fuzz.test.ts
- tsKernels
- src-ts/ts-core.ts
- AnimateTab.tsx
- useEditorPrefsStore
- audio-encoder.ts
- useDeleteAccountDialog.hook.ts
- focus-ring.ts
- downscale.rs
- server-animation-sync.ts
- useAssetsPanel.hook.ts
- sound-timeline.slice.ts
- animation.types.ts
- mascot-scene.ts
- useDescribeWithAI.hook.ts
- Inspector.tsx
- commands.ts
- quantize.rs
- dependencies
- pixellab-animation.service.ts
- SoundListItem.tsx
- collect-ai-jobs/index.ts
- constants/audio.ts
- PixelForge IA (AGENTS.md)
- audio-engine.test.ts
- timeline-player.ts
- useTimelinePlayback.hook.ts
- slices.ts
- useClipInspector.hook.ts
- BottomToolbar.tsx
- PixelKernels Interface
- document.ts
- mascot-city.ts
- tokens/package.json
- AudioAsset
- useDocumentPersistence.hook.ts
- sprite-save-as
- scripts
- lucide-react
- BottomPanel.tsx
- DocumentRepository port
- Synthetic Architect design system
- scripts
- core/ts-core.ts
- animation-history.ts
- Animation flow (PixelLab)
- include
- Zustand store (diagram node)
- Five-phase scaling plan
- Phase 7: Rust Document/History
- edit-history Capability
- core/package.json
- build-wasm.mjs
- tweak-mapping.test.ts
- Phased Migration Approach (0-7)
- RgbaColor
- Cancel an in-flight AI generation
- apps/editor/api/ai/ functions
- Phase 5: Rust Flood-Fill
- AssetType
- compilerOptions
- ai-generation.ts
- Handoff 2 of 2 — give attack animations their own model
- computeMascotSceneState
- devDependencies
- useSoundsStore
- wasm-document-core.test.ts
- resolve-core.ts
- elevenlabs.ts
- mascot-font.ts
- SpriteEditorLayout.tsx
- constants/timeline-view.ts
- useSaveIndicator.hook.ts
- compilerOptions
- PixelForge Architecture Overview
- WasmPixelCore (diagram node, behind flag)
- bindings.rs (diagram node, only wasm-bindgen boundary)
- Rust/Wasm core migration
- useImportLibraryAssets.hook.ts
- workspace-build Capability
- 0011 — Lock an explicit animation reference (canvas frame or Asset)
- quantize-downscale.fuzz.test.ts
- vercel-functions-dev.ts
- useReferencePicker.hook.ts
- mascot-sprite.ts
- tokens/tsconfig.json
- 0008 — Lossless canvas resize with a cut-strips undo entry
- 0009 — Animation provider port and animation harness
- Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)
- pixel-core Capability
- PixelCore
- check-bench.ts
- cleancode-agent definition
- 0012 — Preset motion text is the editable action field, not hidden boilerplate
- 2026-10-15 — When "just add a note" quietly breaks your own animation
- useCanvasOverlay.hook.ts
- 2026-10-11 — Resizing a sprite without losing its layers
- core/tsconfig.json
- 0013 — Each motion preset picks its PixelLab animation model
- mascot.types.ts
- wasm-bindgen Copy-In/Copy-Out Mechanism
- bench/flood-fill.bench.ts
- editor/package.json
- Animation motion detail
- colors.test.ts
- delete-account/index.ts
- Granular selector golden rule
- /implementar command
- D6: flat Rust API surface, u32 handles, no serde
- Animation reference lock
- Infinite Canvas pattern
- YouTube/Netflix MPEG-DASH/HLS precedent
- clean-pkg-gitignore.mjs
- tsconfig.json
- Reference to zustand-agent.md
- ADR template
- Learning-log template
- architecture-decision skill
- editor/postcss.config.mjs
- vercel.json
- eslint.config.mjs
- next.config.ts
- landing/postcss.config.mjs
- D1: PixelBuffer{w,h,data:Uint8ClampedArray}
- D3: core owns the document
- D11: DESIGN.md stays at repo root
- Measured Rust vs TS results table
- Client-side localStorage API key storage
- Rust/Wasm core with TS reference
- Scalable assets in the browser - research notes
- Figma dynamic page loading precedent
- Google Maps tiles/LOD precedent
- Reference counting
- /implementar command (Pencil -> code pipeline)
- Full review checklist
- No magic values rule
- Per-app navigation rules
- Component/hook/service separation
- rules-agent definition
- 5 Zustand antipatterns
- Store-of-slices pattern
- Reference to AGENTS.md as single source of truth
- cleancode-agent (referenced)
- Contextual Skill Loading rule
- design-agent (referenced)
- frontend-agent (referenced)
- AI-notes vs owner-voice authorship layers
- CI job: test / bench / typecheck
- rules-agent
- zustand-agent
- Geist font Google Fonts <link>
- #root + main.tsx mount point
- NEXT_PUBLIC_EDITOR_URL var
- D2: copy-on-write per batch
- D5: PixelKernels under PixelCore (two seams)
- D13: idb library over raw indexedDB API
- AI-notes vs owner-written authorship policy
- AI notes README
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
- Cursor-based pagination
- Flyweight pattern
- List virtualization / windowing
- LRU cache
- Memory budget
- Metadata / blob separation
- Performance budget
- Prefetching / read-ahead buffer
- Response streaming
- Shadow mode / dark launch
- Design tools guide (impeccable + Emil Kowalski skills + Pencil)
- Emil Kowalski motion/polish skills
- PixelForge vision lifecycle diagram (SVG)
- colors.ts / tokens.css sync requirement
- @theme inline Tailwind token mapping
- pixelforge-core
- pnpm workspace packages config
- PixelForge IA product purpose
- Product principles (intent-first, equal AI/manual paths)
- Sound editor capabilities
- Sprite Studio v3 · Create tab simplification (AI-first)
- @pixelforge/tokens
- types/audio.ts
- 0010 — The canvas is always a named Assets item
- react
- D6: Flat Rust API, No Serde Decision
- 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go
- tailwindcss
- @vitejs/plugin-react
- @vitest/ui
- Handoff 1 of 2 — merge `feat/animation-editing` into `master`
- LoginPage.tsx

## God Nodes (most connected - your core abstractions)
1. `useSpriteEditorStore` - 98 edges
2. `useSoundsStore` - 89 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 69 edges
5. `MOTION` - 63 edges
6. `Document` - 52 edges
7. `AssetType` - 46 edges
8. `useEditorUIStore` - 44 edges
9. `putPixel()` - 40 edges
10. `useAssetsStore` - 39 edges

## Surprising Connections (you probably didn't know these)
- `Hexagonal architecture / Ports & Adapters` --semantically_similar_to--> `PixelCore hexagonal port`  [INFERRED] [semantically similar]
  docs/adr/0009-animation-provider-port-and-harness.md → README.md
- `VITE_PIXEL_CORE / pf:core override` --semantically_similar_to--> `PixelCore hexagonal port`  [INFERRED] [semantically similar]
  apps/editor/README.md → README.md
- `Repository pattern for audio persistence` --semantically_similar_to--> `DocumentRepository port`  [INFERRED] [semantically similar]
  docs/ai-notes/deferred-audio-asset-scalability.md → README.md
- `ANIMATION_HARNESS motion catalogue` --semantically_similar_to--> `Animation flow (PixelLab)`  [INFERRED] [semantically similar]
  docs/adr/0009-animation-provider-port-and-harness.md → apps/editor/src/lib/README.md
- `Retro Diffusion num_images parameter` --semantically_similar_to--> `generateSpriteWithRetroDiffusion`  [INFERRED] [semantically similar]
  docs/ai-notes/future-improvements/ai-sprite-variations.md → apps/editor/src/lib/README.md

## Import Cycles
- 4-file cycle: `apps/editor/src/lib/core/core-config.ts -> apps/editor/src/lib/core/pixel-core.ts -> apps/editor/src/lib/core/ts-core.ts -> apps/editor/src/lib/core/kernels.ts -> apps/editor/src/lib/core/core-config.ts`
- 5-file cycle: `apps/editor/src/lib/core/core-config.ts -> apps/editor/src/lib/core/wasm-pixel-core-resolver.ts -> apps/editor/src/lib/core/pixel-core.ts -> apps/editor/src/lib/core/ts-core.ts -> apps/editor/src/lib/core/kernels.ts -> apps/editor/src/lib/core/core-config.ts`

## Hyperedges (group relationships)
- **Rust/Wasm core CI quality gates** — _github_workflows_ci_rust_core_job, _github_workflows_ci_wasm_size_budget, _github_workflows_ci_drift_check, _github_workflows_ci_cargo_deny_check [EXTRACTED 0.95]
- **Rust domain modules -> bindings.rs -> wasm-pack pkg/ build pipeline** — docs_architecture_svg_rust_document_rs, docs_architecture_svg_rust_history_rs, docs_architecture_svg_rust_pixels_mod_rs, docs_architecture_svg_rust_flood_fill_rs, docs_architecture_svg_rust_quantize_rs, docs_architecture_svg_rust_downscale_rs, docs_architecture_svg_rust_bindings_rs, docs_architecture_svg_wasm_pack_pkg [EXTRACTED 1.00]
- **Two-Seam Wasm Boundary Architecture** — openspec_changes_migrate_to_rust_core_design_pixelkernels_interface, openspec_changes_migrate_to_rust_core_design_document_struct, openspec_changes_migrate_to_rust_core_design_d5_two_seams [EXTRACTED 1.00]
- **Design-agent to frontend-agent to clean-code-agent pipeline** — agents_design_agent, agents_frontend_agent, agents_clean_code_agent [EXTRACTED 1.00]
- **Judgment-Day Review and Fix Cycle** — openspec_changes_migrate_to_rust_core_tasks_judgment_day_process, openspec_changes_migrate_to_rust_core_design_command_undoability_decision, packages_core_learning_trap_poisons_object [INFERRED 0.75]
- **Repository pattern shared across sprite and audio persistence** — docs_ai_notes_deferred_audio_repository_pattern, readme_documentrepository_port, docs_ai_notes_deferred_audio_adr0006_ref [INFERRED 0.75]
- **AnimationProvider port and PixelLab adapter pattern** — docs_adr_0009_animationprovider_port, docs_adr_0009_pixellab_adapter, apps_editor_src_lib_readme_animation_flow [INFERRED 0.85]
- **DocumentRepository port with IndexedDB (default) and Supabase (planned) adapters** — docs_architecture_svg_documentrepository_port, docs_architecture_svg_indexeddb_adapter, docs_architecture_svg_supabase_planned, docs_adr_0006_indexeddb_persistence_port_doc [INFERRED 0.85]
- **PixelCore port & adapters seam (TsPixelCore / WasmPixelCore / PixelKernels)** — docs_architecture_svg_pixelcore_port, docs_architecture_svg_tspixelcore, docs_architecture_svg_wasmpixelcore, docs_architecture_svg_pixelkernels [INFERRED 0.85]
- **Discovering the Real Wasm Boundary Performance Cost** — packages_core_learning_wasm_bindgen_copy_mechanism, packages_core_learning_scanline_rewrite_note, openspec_changes_migrate_to_rust_core_baseline_bench_phase5f_scanline_result [INFERRED 0.85]
- **Granular Zustand selector convention enforced across agents** — _claude_agents_frontend_agent_zustand_granular_selectors, _claude_agents_clean_code_agent_zustand_granular_selectors, _claude_agents_zustand_agent_granular_selector_pattern, _claude_agents_rules_agent_core_rules [INFERRED 0.85]

## Communities (247 total, 83 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (73): HashMap, History, HistoryEntry, bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of() (+65 more)

### Community 1 - "createEmptyBuffer"
Cohesion: 0.06
Nodes (63): TRANSPARENT_COLOR, installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext(), makeFullBuffer(), StrokeState, BucketStats, dominantColor() (+55 more)

### Community 2 - "ai/retro-diffusion.ts"
Cohesion: 0.14
Nodes (20): clampSize(), handler(), json(), RetroDiffusionApiResponse, stripDataUri(), RETRO_DIFFUSION_DEFAULT_STRENGTH, RETRO_DIFFUSION_DEFAULT_STYLE, RETRO_DIFFUSION_ENDPOINT (+12 more)

### Community 3 - "pixel-core.ts"
Cohesion: 0.05
Nodes (42): getPixelCoreEnvOverride(), Command, DispatchResult, isPixelCoreImpl(), PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, readEnvOverride(), readLocalStorageOverride() (+34 more)

### Community 4 - "timeline-ops.ts"
Cohesion: 0.05
Nodes (69): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME (+61 more)

### Community 5 - "assets.store.ts"
Cohesion: 0.14
Nodes (15): useAssetLibraryPersistence(), persistAnimationHistory(), persistGenerationHistory(), createIndexedDbAssetLibraryRepository(), AssetItemKind, evictedIds(), LibraryEntry, mergeNewest() (+7 more)

### Community 6 - "stores/index.ts"
Cohesion: 0.21
Nodes (11): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_TIMELINE, createInitialFrame(), createInitialLayer(), initialLayer, createDocumentStatusSlice(), createLayerSlice(), createTimelineSlice() (+3 more)

### Community 7 - "ts-core.judgment-day-round3.test.ts"
Cohesion: 0.04
Nodes (55): packPoints(), packRgba(), RGBA_BYTE_SHIFT, here, makeDoc(), pkgAvailable, pkgDir, RED (+47 more)

### Community 8 - "index.tsx"
Cohesion: 0.07
Nodes (40): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+32 more)

### Community 9 - "animation.ts"
Cohesion: 0.04
Nodes (71): handler(), json(), ANIMATION_ALREADY_RUNNING_ERROR, ANIMATION_BUSY_MESSAGE, ANIMATION_CANCEL_HINT, ANIMATION_CANCEL_LABEL, ANIMATION_CHECK_AGAIN_LABEL, ANIMATION_DISCARD_HINT (+63 more)

### Community 10 - "sound-library.ts"
Cohesion: 0.08
Nodes (41): FALLBACK_SOUND_NAME, LONG_DURATION_DECIMALS, LONG_DURATION_THRESHOLD_S, MINI_WAVE, MINI_WAVE_BAR_COUNT, PLACEHOLDER_PEAKS, SECONDS_PER_HOUR, SECONDS_PER_MINUTE (+33 more)

### Community 11 - "mod.rs"
Cohesion: 0.08
Nodes (48): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+40 more)

### Community 12 - "lib/timeline-view.ts"
Cohesion: 0.09
Nodes (43): CLIP_WAVE, TIMELINE_LAYOUT, soundDragSession, collectSnapEdges(), snapThresholdSeconds(), snapTime(), clipAriaLabel(), clipBarCount() (+35 more)

### Community 13 - "animation-job-ledger.ts"
Cohesion: 0.10
Nodes (48): ANIMATION_RECOVER_FAILED_PREFIX, ANIMATION_RECOVER_PROCESSING_STATE, ANIMATION_RECOVER_SUCCESS_NOTICE, ANIMATION_RECOVER_UNREACHABLE_STATE, ANIMATION_JOB_LEDGER_SETTLED_LIMIT, ANIMATION_JOB_LEDGER_STORAGE_KEY, createLedgerRecoverDeps(), saveAnimationToAssets() (+40 more)

### Community 14 - "constants/index.ts"
Cohesion: 0.06
Nodes (50): AI_QUALITY_SAMPLE_NATIVE_SIZE, AI_QUALITY_SAMPLE_SEED, AI_QUALITY_SAMPLE_SRC, AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE, AI_SPRITE_SIZES, ALPHA_TRANSPARENT_THRESHOLD, ANIMATE_CUSTOM_MOTION_PLACEHOLDER, ASSET_LIBRARY_IMPORT_ACCEPT (+42 more)

### Community 15 - "WasmDocument"
Cohesion: 0.08
Nodes (13): Box, DispatchResult, clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill() (+5 more)

### Community 16 - "src/types/index.ts"
Cohesion: 0.09
Nodes (35): getDrawOffset(), renderPixelsToCanvas(), RenderPixelsToCanvasOptions, screenToPixel(), composeHorizontalSheet(), computeHorizontalSheetLayout(), ADR-0009, HistoryPatch (+27 more)

### Community 17 - "animate.ts"
Cohesion: 0.10
Nodes (28): describeDetail(), handler(), json(), PixelLabSubmitResponse, readEnv(), recordServerJob(), validBody, ANIMATION_DESCRIPTION_TOO_LONG_ERROR (+20 more)

### Community 18 - "useEditorUIStore"
Cohesion: 0.14
Nodes (28): BOTTOM_PANEL_TABS, DEFAULT_QUALITY_TIER, QUALITY_RECOMMENDATION_BY_ASSET_TYPE, RESIZABLE_PANELS, useBottomPanel(), useSpriteEditorLayout(), useCreateTab(), useBottomPanelHeight() (+20 more)

### Community 19 - "types/timeline-view.ts"
Cohesion: 0.14
Nodes (19): TRACK_COLOR, TRACK_KIND_OPTIONS, resolveTimelineShortcut(), isTextEntry(), NUDGE_ACTIONS, runAction(), shouldIgnore(), useTimelineShortcuts() (+11 more)

### Community 20 - "ColorPicker.tsx"
Cohesion: 0.18
Nodes (11): COLOR_PICKER, ColorInputs(), ColorInputsProps, HueSlider(), HueSliderProps, useHueSlider(), UseHueSliderParams, SaturationValueSquare() (+3 more)

### Community 21 - "PixelKernels"
Cohesion: 0.06
Nodes (22): here, source, wasmPath, here, wasmPath, here, pkgAvailable, SEEDS (+14 more)

### Community 22 - "src-ts/index.ts"
Cohesion: 0.09
Nodes (39): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+31 more)

### Community 23 - "useCanvasInteraction.hook.ts"
Cohesion: 0.11
Nodes (39): SPRITE_EDITOR_KEYBOARD, SPRITE_EDITOR_TOOLS, SPRITE_EDITOR_VIEWPORT, CanvasArea(), bresenhamLine(), KonvaPointerEvent, useCanvasInteraction(), KonvaPointerEvent (+31 more)

### Community 24 - "useSpriteEditorStore.hook.ts"
Cohesion: 0.13
Nodes (47): useLeftSidebar(), useLayerPanel(), usePropertiesTab(), UsePropertiesTabReturn, getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback() (+39 more)

### Community 25 - "auth.service.ts"
Cohesion: 0.05
Nodes (53): App(), useAuthForm(), LoginPage(), useLoginPage(), ResetPasswordPage(), useResetPasswordPage(), EditorLayout(), useEditorLayout() (+45 more)

### Community 26 - "audio-engine.ts"
Cohesion: 0.24
Nodes (7): AudioEngine, buildSynthChain(), calculateDefaultDuration(), createWhiteNoiseBuffer(), mapFilterType(), msToSec(), SynthParameters

### Community 27 - "useTopBar.hook.ts"
Cohesion: 0.20
Nodes (17): FILE_MENU_ENTRY_KIND, FILE_MENU_LABELS, SAVE_AS_ERRORS, SPRITE_DOCUMENT_DEFAULT_NAME, buildFileMenuEntries(), isMenuDismissKey(), isOutsideMenu(), runSaveAs() (+9 more)

### Community 28 - "AIAnimation"
Cohesion: 0.14
Nodes (17): GENERATION_HISTORY_LIMIT, GENERATION_HISTORY_STORAGE_KEY, ASSET_LIBRARY_LIMIT, ParsedAnimationHistory, ASSET_TYPES, isAssetType(), isFiniteNumber(), isNonEmptyString() (+9 more)

### Community 29 - "animation-limits.ts"
Cohesion: 0.17
Nodes (17): ANIMATION_FRAME_OPTIONS, ANIMATION_FRAMES_INVALID_ERROR, ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR, ANIMATION_FRAMES_OVER_BUDGET_ERROR, ANIMATION_NOT_SQUARE_ERROR, ANIMATION_TOO_LARGE_ERROR, DEFAULT_ANIMATION_MODEL, PIXELLAB_MAX_SIZE (+9 more)

### Community 30 - "mascot-scene-state.ts"
Cohesion: 0.10
Nodes (33): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_BOLT_Y_OFFSET, GROUND_ENEMY (+25 more)

### Community 31 - "useImportSpriteSheet.hook.ts"
Cohesion: 0.11
Nodes (31): IMPORT_SPRITE_SHEET_ERRORS, SPRITE_ANIMATION, SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MAX_NATIVE_SIZE, pixelBufferToDataUri(), decodeSheet(), decodeSingle(), FILE_READERS (+23 more)

### Community 32 - "history.rs"
Cohesion: 0.15
Nodes (25): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+17 more)

### Community 33 - "pixellab-animate-harness.ts"
Cohesion: 0.08
Nodes (30): PIXELLAB_ANIMATE_PATHS, PIXELLAB_MAX_FRAMES, PIXELLAB_MIN_FRAMES, ANIMATION_HARNESS, buildAnimationAction(), CHARACTER_MOTIONS, findAnimationMotion(), SUBJECT_MOTIONS (+22 more)

### Community 34 - "sprite-pipeline.ts"
Cohesion: 0.08
Nodes (42): AI_SPRITE_DEFAULT_SIZE, QUANTIZE_DEFAULTS, ensureWasmResolving(), getActiveKernels(), getActiveKernelsAsync(), base64ToNativePixels(), buildPalette(), Centroid (+34 more)

### Community 35 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, babel-plugin-react-compiler, fake-indexeddb, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+13 more)

### Community 36 - "WasmPixelCore"
Cohesion: 0.17
Nodes (4): DispatchResult, clampRectToCanvas(), decodeNames(), WasmPixelCore

### Community 37 - "useCreateSound.hook.ts"
Cohesion: 0.09
Nodes (36): DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, ELEVENLABS_DEFAULT_VOICE_ID, IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES, MODE_TO_TAG, MPEG_MIME_TYPE (+28 more)

### Community 38 - "audio-storage.service.ts"
Cohesion: 0.24
Nodes (6): AUDIO_STORAGE_BUCKET, buildFilePath(), generateId(), StorageError, uploadAudio(), UploadResult

### Community 39 - "QualitySamplePreview.tsx"
Cohesion: 0.11
Nodes (20): DeleteAccountDialog(), DeleteAccountDialogProps, AccountDeletedNotice(), useAccountDeletedNotice(), ModalPortal(), ModalPortalProps, ApiKeyField(), ApiKeyFieldProps (+12 more)

### Community 40 - "persistence.ts"
Cohesion: 0.15
Nodes (12): ASSET_ANIMATIONS_STORE, ASSET_DB_NAME, ASSET_DB_VERSION, ASSET_GENERATIONS_STORE, LEGACY_SPRITE_EDITOR_STORAGE_KEY, SPRITE_EDITOR_STORAGE_KEY, ADR-0009, StoreName (+4 more)

### Community 41 - "file-menu.ts"
Cohesion: 0.11
Nodes (28): DIALOG_FOCUS_TRAP_KEY, FILE_EXTENSION_PATTERN, FILE_MENU_COPY, FILE_MENU_DISMISS_KEY, FILE_MENU_ITEM_IDS, IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS, IMPORT_FILE_ERROR_NOTICE_COPY, IMPORT_SPRITE_SHEET_COPY (+20 more)

### Community 42 - "legacy-draft-migration.service.ts"
Cohesion: 0.19
Nodes (12): DOCUMENT_SCHEMA_VERSION, startDocumentPersistence(), LegacyFrame, LegacyLayer, legacyLayerToPayload(), LegacyMigrationResult, LegacyPersistedState, legacyStateToPayload() (+4 more)

### Community 43 - "wasm-pixel-core.differential.fuzz.test.ts"
Cohesion: 0.15
Nodes (13): setIdSeed(), here, makeDoc(), makeMultiDoc(), pair(), pick(), pkgAvailable, pkgDir (+5 more)

### Community 44 - "tsKernels"
Cohesion: 0.11
Nodes (14): mockGetPixelCoreEnvOverride, KernelRow, coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require (+6 more)

### Community 45 - "src-ts/ts-core.ts"
Cohesion: 0.14
Nodes (26): buildPalette(), CHANNELS, diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect() (+18 more)

### Community 46 - "AnimateTab.tsx"
Cohesion: 0.17
Nodes (15): AiResultCard(), AiResultCardProps, DANGER_BUTTON, REFERENCE_CHIP(), REFERENCE_PICKER_TILE, REFERENCE_PICKER_TILE_CAPTION, SECONDARY_BUTTON, SECTION_LABEL (+7 more)

### Community 47 - "useEditorPrefsStore"
Cohesion: 0.10
Nodes (25): SPRITE_EDITOR_CANVAS, PREFS_STORAGE_KEY, getDrawOffset(), GridOverlay(), GridOverlayProps, useColorInputs(), UseColorInputsParams, useColorPalette() (+17 more)

### Community 48 - "audio-encoder.ts"
Cohesion: 0.33
Nodes (6): createAudioObjectUrl(), encodeWav(), floatToInt16(), MockAudioBuffer, writeString(), writeWavHeader()

### Community 49 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.25
Nodes (9): getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS, DELETE_ACCOUNT_CONFIRM_WORD, DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE, DELETE_ACCOUNT_ERROR_MESSAGES, isDeleteAccountConfirmed() (+1 more)

### Community 50 - "focus-ring.ts"
Cohesion: 0.09
Nodes (33): DISABLED_STATE, FOCUS_RING, MOTION, LIBRARY_FILTERS, TONE_CLASSES, DeleteSoundDialog(), DescribeWithAISection(), useDescribeWithAI() (+25 more)

### Community 51 - "downscale.rs"
Cohesion: 0.16
Nodes (21): FnMut, alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color() (+13 more)

### Community 52 - "server-animation-sync.ts"
Cohesion: 0.06
Nodes (51): AI_JOB_ASSET_TYPE_MAX_LENGTH, AI_JOB_FRAME_EXTENSION, AI_JOB_FRAME_INDEX_PAD, AI_JOB_KIND_ANIMATION, AI_JOB_LABEL_MAX_LENGTH, AI_JOB_PROVIDER_PIXELLAB, AI_JOB_RECORD_TIMEOUT_MS, AI_JOB_STATUS_COMPLETED (+43 more)

### Community 53 - "useAssetsPanel.hook.ts"
Cohesion: 0.18
Nodes (12): DEFAULT_ASSET_TYPE, buildAssetLibraryItems(), ADR-0010, ADR-0011, downloadFromHref(), downloadJson(), FolderId, ADR-0010 (+4 more)

### Community 54 - "sound-timeline.slice.ts"
Cohesion: 0.11
Nodes (37): CLIP_KEY_SHORTCUTS, EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory() (+29 more)

### Community 55 - "animation.types.ts"
Cohesion: 0.06
Nodes (36): AI_JOBS_STORAGE_KEY, ReferenceChipProps, AIJobsState, IDLE_ANIMATE_JOB, IDLE_JOB, IDLE, IDLE_ANIMATE, PENDING (+28 more)

### Community 56 - "mascot-scene.ts"
Cohesion: 0.15
Nodes (21): rgbaToString(), AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX (+13 more)

### Community 57 - "useDescribeWithAI.hook.ts"
Cohesion: 0.18
Nodes (16): AI_KIND_OPTIONS, NEW_SOUND_AUTOFOCUS, ElevenLabsError, generateMusic(), generateSFX(), generateTTS(), getApiKeyOrThrow(), getElevenLabsApiKey() (+8 more)

### Community 58 - "Inspector.tsx"
Cohesion: 0.17
Nodes (11): AnimateTab(), CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), ColorPicker, CreateTab(), ICON_MAP, TAB_PANELS (+3 more)

### Community 59 - "commands.ts"
Cohesion: 0.18
Nodes (13): DirtyRect, DocReplaceFrameInput, FrameId, LayerId, LayerMetaPatch, LayerRef, SerializedFrame, SerializedLayer (+5 more)

### Community 60 - "quantize.rs"
Cohesion: 0.24
Nodes (19): alpha_threshold_boundary_is_inclusive_on_the_high_side(), build(), build_palette(), Centroid, colors_zero_still_yields_one_centroid_not_zero(), dist2(), keeps_fully_transparent_pixels_transparent(), nearest() (+11 more)

### Community 61 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, colord, idb, konva, @pixelforge/core, react-dom, react-konva, react-router-dom (+13 more)

### Community 62 - "pixellab-animation.service.ts"
Cohesion: 0.16
Nodes (16): ANIMATION_GENERIC_ERROR, PIXELLAB_ANIMATE_ROUTE, PIXELLAB_JOB_ROUTE, AnimationProviderError, ADR-0009, createPixelLabAnimationProvider(), KNOWN_SERVER_ERROR_CODES, readJson() (+8 more)

### Community 63 - "SoundListItem.tsx"
Cohesion: 0.24
Nodes (8): LibraryEmptyState(), LibraryEmptyStateProps, PendingSoundRow(), PendingSoundRowProps, SoundList(), SoundListItem(), useSoundListItem(), LibraryEmptyVariant

### Community 64 - "collect-ai-jobs/index.ts"
Cohesion: 0.16
Nodes (19): Admin, AiJobRow, assetName(), collectOne(), decodeBase64(), describeDetail(), fetchPixelLabJob(), frameFileName() (+11 more)

### Community 65 - "constants/audio.ts"
Cohesion: 0.08
Nodes (34): ADSR_LIMITS, ADSR_VIEW, ELEVENLABS_API_TIMEOUT, FILTER_LIMITS, FILTER_TYPES, HZ_PER_KHZ, MAX_MUSIC_DURATION, MAX_REFERENCE_FILE_SIZE (+26 more)

### Community 66 - "PixelForge IA (AGENTS.md)"
Cohesion: 0.11
Nodes (22): apps/editor, apps/landing, architecture-decision skill, Future improvements deferral rule, packages/core (Rust/Wasm), packages/tokens, PixelForge IA (AGENTS.md), @pixelforge/editor README (+14 more)

### Community 67 - "audio-engine.test.ts"
Cohesion: 0.33
Nodes (11): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+3 more)

### Community 68 - "timeline-player.ts"
Cohesion: 0.17
Nodes (14): GAIN_SMOOTHING_S, PLAYBACK_SCHEDULE_LEAD_S, dbToGain(), effectiveGain(), hasSoloTrack(), buildMixGraph(), disposeMixGraph(), MixGraph (+6 more)

### Community 69 - "useTimelinePlayback.hook.ts"
Cohesion: 0.20
Nodes (12): timelineDuration(), formatClock(), pad2(), ClipInspector(), TimelineEditor(), useTimelineEditor(), TimelineTopBar(), TimelineTransport() (+4 more)

### Community 70 - "slices.ts"
Cohesion: 0.16
Nodes (15): DocumentPersistenceStoreApi, NOOP_CONTROLLER, emptyPayload(), fakeStorage, makeFakeStore(), emptyPayload(), fakeStorage, makeFakeStore() (+7 more)

### Community 71 - "useClipInspector.hook.ts"
Cohesion: 0.24
Nodes (11): SNAP_GRID_SECONDS, CLIP_INSPECTOR, PLAYHEAD_LARGE_STEP_MULTIPLIER, formatSeconds(), buildSliders(), formatFade(), formatGain(), formatSpeed() (+3 more)

### Community 72 - "BottomToolbar.tsx"
Cohesion: 0.36
Nodes (5): BottomToolbar(), ICON_MAP, ToolButton(), ToolButtonProps, ToolDefinition

### Community 73 - "PixelKernels Interface"
Cohesion: 0.25
Nodes (8): D13: idb Library for IndexedDB, D1: Flat RGBA Buffer Decision, D2: Copy-on-Write Mutation Decision, D5: Two Seams (PixelKernels/PixelCore) Decision, IndexedDbDocumentRepository Adapter, PixelKernels Interface, Local Draft Recovery Requirement, Phase 1: Flatten Buffer + IndexedDB Persistence

### Community 74 - "document.ts"
Cohesion: 0.18
Nodes (14): DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_STORE_NAME, LOCAL_DRAFT_DOCUMENT_ID, DocumentPersistenceDeps, createInMemoryDocumentRepository(), createIndexedDbDocumentRepository(), PixelForgeDB (+6 more)

### Community 75 - "mascot-city.ts"
Cohesion: 0.20
Nodes (15): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+7 more)

### Community 76 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 77 - "AudioAsset"
Cohesion: 0.10
Nodes (26): TAG_TO_MODE, TWEAK_REGENERATE_DEBOUNCE_MS, VARIATION_COUNT, WAVE_PEAK_COUNT, audioBufferCache, buffers, decodeFromUrl(), inflight (+18 more)

### Community 78 - "useDocumentPersistence.hook.ts"
Cohesion: 0.12
Nodes (13): DOCUMENT_AUTOSAVE_DEBOUNCE_MS, useDocumentPersistence(), UseDocumentPersistenceResult, DocumentPersistenceController, FlushFn, registerDocumentPersistenceFlush(), here, instances (+5 more)

### Community 79 - "sprite-save-as"
Cohesion: 0.40
Nodes (4): Log, Specs, sprite-save-as, Tasks

### Community 80 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 82 - "BottomPanel.tsx"
Cohesion: 0.24
Nodes (7): BottomPanel(), ICON_MAP, AssetsPanel(), FrameThumbnail, FrameThumbnailProps, getThumbnailBorderClass(), TimelineBar()

### Community 83 - "DocumentRepository port"
Cohesion: 0.15
Nodes (13): D12: local-first, cloud sync deferred, ADR 0006 (sprite drafts repository, cited), Repository pattern for audio persistence, Local-first persistence, D12: Local-First Persistence ADR, D8: IndexedDB Persistence Decision, AI-assisted sprites, docs/ARCHITECTURE.md (+5 more)

### Community 84 - "Synthetic Architect design system"
Cohesion: 0.12
Nodes (19): DESIGN.md vs tokens.css conflict note, clean-code-agent, design-agent, frontend-agent, graphify knowledge graph rules, CLAUDE.md (root), Accent token system, AI accent (violet) reserved for AI surfaces (+11 more)

### Community 85 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, bench, build, dev, preview, test, test:watch, typecheck

### Community 86 - "core/ts-core.ts"
Cohesion: 0.04
Nodes (94): SPRITE_EDITOR_HISTORY, unpackRgba(), bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory(), entryBytes() (+86 more)

### Community 87 - "animation-history.ts"
Cohesion: 0.35
Nodes (9): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, ANIMATION_PIPELINE_VERSION, isNonEmptyString(), isPngDataUri(), isPositiveFiniteNumber(), normalizeAnimation(), parseAnimationHistory() (+1 more)

### Community 88 - "Animation flow (PixelLab)"
Cohesion: 0.11
Nodes (21): Animation flow (PixelLab), buildAnimationAction, Sprite Generation with Retro Diffusion, PixelLab animation adapter, ANIMATION_HARNESS motion catalogue, AnimationProvider port, Async job pattern, buildAnimationAction (+13 more)

### Community 89 - "include"
Cohesion: 0.12
Nodes (15): compilerOptions, paths, plugins, target, exclude, extends, include, node_modules (+7 more)

### Community 90 - "Zustand store (diagram node)"
Cohesion: 0.17
Nodes (13): D10: packages/tokens source-exported, no build step, DocumentRepository port (load/save/remove), document-persistence.controller.ts, indexeddb-document.repository.service.ts, packages/tokens, apps/landing (diagram node), DocumentRepository port (diagram node), Hooks layer (diagram node) (+5 more)

### Community 91 - "Five-phase scaling plan"
Cohesion: 0.25
Nodes (8): Audio chunking (10s segments), List virtualization, LRU cache + memory budget, Deferred: scaling the sound editor, Five-phase scaling plan, docs/architecture/scalable-assets-research.md (cited), Scaling triggers, Windowed rendering export

### Community 92 - "Phase 7: Rust Document/History"
Cohesion: 0.21
Nodes (13): Phase 7 Document/PixelCore Bench Result, D3: Core Owns Document Decision, Default Core Implementation Stays TS Decision, PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, PixelCore Interface Fallback Decision (+5 more)

### Community 93 - "edit-history Capability"
Cohesion: 0.17
Nodes (13): Every Document Mutation Is Undoable (Phase 2c), Command Union Type, D4: Dirty-Rect History Decision, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), edit-history Capability, Dirty-Rect Patch History Decision, Bounded History Retention Requirement (+5 more)

### Community 94 - "core/package.json"
Cohesion: 0.10
Nodes (19): devDependencies, @types/node, typescript, vitest, exports, @types/node, typescript, vitest (+11 more)

### Community 95 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 96 - "tweak-mapping.test.ts"
Cohesion: 0.21
Nodes (15): DEFAULT_DECAY_SHARE, TWEAK_PARAMS, TWEAK_RANGES, TWEAK_SLIDER, applyTweak(), clamp(), fromPosition(), Range (+7 more)

### Community 97 - "Phased Migration Approach (0-7)"
Cohesion: 0.25
Nodes (9): Phased Migration Approach (0-7), Lossless Pixel Round-Trip Requirement, Dirty-Pair Cache-Refresh Contract, Judgment-Day Blind-Judge Review Process, Phase 0: Gates (CI, Scripts, Characterization Tests), Phase 4: packages/core Rust Scaffold, Phase 6: Rust Quantize/Downscale, f64 Is Bit-Identical to JS number (+1 more)

### Community 98 - "RgbaColor"
Cohesion: 0.08
Nodes (29): SPRITE_EDITOR_COLORS, SPRITE_EDITOR_PALETTE, hexToHsv(), hexToRgba(), hsvToHex(), rgbaToHex(), coreEntryPath, coreRoot (+21 more)

### Community 99 - "Cancel an in-flight AI generation"
Cohesion: 0.13
Nodes (14): decodeGeneratedSprite, estimateRetroDiffusionCost, generateSpriteWithRetroDiffusion, No background removal rationale, Sprite flow, AI sprite variations, Retro Diffusion num_images parameter, Sprite Studio v3 Create (AI-first) Pencil frame (+6 more)

### Community 100 - "apps/editor/api/ai/ functions"
Cohesion: 0.13
Nodes (16): Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, apps/editor/api/ai Vercel Functions proxy (diagram node), ElevenLabs API (diagram node), Retro Diffusion API (diagram node) (+8 more)

### Community 101 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.21
Nodes (12): Phase 5 Flood-Fill Bench Result (2.3-2.6x, Target 3x Not Met), Phase 5f Scanline Bench Result (Ratio Narrows, Absolute Faster), Phase 6 Quantize/Downscale Bench Result, Scanline Span-Fill Rewrite (Phase 5f), Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, Flat Table Replaces Per-Cell HashMap, No Recursion in Flood-Fill (Stack Overflow Risk) (+4 more)

### Community 102 - "AssetType"
Cohesion: 0.09
Nodes (35): ASSET_FOLDERS, ASSET_TYPES, QUALITY_TIERS, AssetFolderTree(), AssetFolderTreeProps, ICON_MAP, AssetGrid(), AssetGridProps (+27 more)

### Community 103 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 104 - "ai-generation.ts"
Cohesion: 0.17
Nodes (12): AnimateResult, GameTemplateId, ImportedLibraryImage, QualityRecommendation, RecentAnimationItem, RetroDiffusionCostEstimate, RetroDiffusionGenerationResult, RetroDiffusionRequestBody (+4 more)

### Community 105 - "Handoff 2 of 2 — give attack animations their own model"
Cohesion: 0.29
Nodes (6): Evidence (benchmark 2026-10-18, wizard-128, 1.42 USD), Handoff 2 of 2 — give attack animations their own model, Open decisions for the owner (ask one at a time), Prompt to paste in the new conversation, What the owner wants (verbatim, 2026-10-18), Where it plugs in

### Community 106 - "computeMascotSceneState"
Cohesion: 0.18
Nodes (16): MascotScene(), useMascotScene(), UseMascotSceneResult, clamp01(), computeAirDodgeOffset(), computeBolt(), computeEnemy(), computeLevelWipeY() (+8 more)

### Community 107 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 108 - "useSoundsStore"
Cohesion: 0.09
Nodes (37): DELETE_SOUND_KEYS, NAME_VISIBLE_TAIL_LENGTH, ADD_TO_TIMELINE_KEY, OPEN_SOUND_KEY, SOUND_DRAG_MIME, TRACK_KIND_ICON, releaseObjectUrl(), splitNameForTruncation() (+29 more)

### Community 109 - "wasm-document-core.test.ts"
Cohesion: 0.22
Nodes (7): setIdSeed(), baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 110 - "resolve-core.ts"
Cohesion: 0.26
Nodes (11): isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels(), here, pkgAvailable, wasmPath, withRuntimeTrapFallback() (+3 more)

### Community 111 - "elevenlabs.ts"
Cohesion: 0.25
Nodes (7): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES

### Community 112 - "mascot-font.ts"
Cohesion: 0.21
Nodes (12): GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, TITLE_TEXT, drawGlyph(), drawGlyphGlow(), drawGlyphText() (+4 more)

### Community 113 - "SpriteEditorLayout.tsx"
Cohesion: 0.16
Nodes (11): LeftSidebar(), ResizeHandle(), ResizeHandleProps, useResizeHandle(), TopBar(), LayerItem(), LayerItemProps, useLayerItem() (+3 more)

### Community 114 - "constants/timeline-view.ts"
Cohesion: 0.10
Nodes (29): WAV_EXTENSION, ALT_KEY, ALT_KEY_LABEL, CLOCK_CENTISECONDS, MAC_PLATFORM_PATTERN, MIX_EXPORT, MOD_KEY, MOD_KEY_LABEL (+21 more)

### Community 115 - "useSaveIndicator.hook.ts"
Cohesion: 0.39
Nodes (6): SaveIndicator(), useSaveIndicator(), useIsPersistent(), useSaveError(), useSaveStatus(), SaveIndicator

### Community 116 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, jsx, lib, moduleDetection, noEmit, paths, target, types (+13 more)

### Community 117 - "PixelForge Architecture Overview"
Cohesion: 0.16
Nodes (16): ADR 0001: Flat pixel buffer, copy-on-write per batch, ADR 0003: Dirty-rect patches for undo history, ADR 0004: Rust/Wasm boundary shape, ADR 0005: pnpm monorepo split, ADR 0006: DocumentRepository port + IndexedDB adapter, ADR 0007: Local-first persistence model, The monorepo and Rust/WebAssembly migration, explained simply, Study guide: moving the editor from Next.js to Vite (+8 more)

### Community 118 - "WasmPixelCore (diagram node, behind flag)"
Cohesion: 0.16
Nodes (15): ADR 0002: Single dispatch(cmd) seam; core owns the document, D4: dirty-rect before/after patches, stable-id addressing, D7: Wasm linear-memory views, rebuilt per dispatch, WebAssembly JS<->Wasm boundary copy cost, core/commands.ts module, core/history.ts module, src-ts/resolve-core.ts module, src-ts/ts-core.ts module (+7 more)

### Community 119 - "bindings.rs (diagram node, only wasm-bindgen boundary)"
Cohesion: 0.22
Nodes (9): D9: pkg/ committed, CI drift check, packages/core/src Rust modules, bindings.rs (diagram node, only wasm-bindgen boundary), document.rs (diagram node), downscale.rs (diagram node), flood_fill.rs (diagram node), history.rs (diagram node), pixels/mod.rs (diagram node) (+1 more)

### Community 120 - "Rust/Wasm core migration"
Cohesion: 0.22
Nodes (9): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), Editor environment variables, VITE_PIXEL_CORE / pf:core override, apps/landing README env vars, PixelCore hexagonal port (+1 more)

### Community 121 - "useImportLibraryAssets.hook.ts"
Cohesion: 0.36
Nodes (7): readFileAsDataUrl(), readImageDimensions(), readLibraryImageFile(), stripExtension(), useImportLibraryAssets(), UseImportLibraryAssetsParams, UseImportLibraryAssetsReturn

### Community 122 - "workspace-build Capability"
Cohesion: 0.22
Nodes (9): D9: Commit pkg/, CI Rebuild-Diff Decision, Sound Editor Feature-Parity Checklist, Sprite Editor Feature-Parity Checklist, Commit pkg/ + CI Rebuild-Diff Decision, workspace-build Capability, Developer Experience Budgets Requirement, Independent App Deployment Requirement, Server-Side Secrets Stay Server-Side Requirement (+1 more)

### Community 123 - "0011 — Lock an explicit animation reference (canvas frame or Asset)"
Cohesion: 0.25
Nodes (7): 0011 — Lock an explicit animation reference (canvas frame or Asset), Consequences, Context, Decision, Implementation plan, Options considered, Prior art

### Community 124 - "quantize-downscale.fuzz.test.ts"
Cohesion: 0.25
Nodes (7): DOWNSCALE_SEEDS, here, pkgAvailable, QUANTIZE_SEEDS, randInt(), randomBuffer(), wasmPath

### Community 125 - "vercel-functions-dev.ts"
Cohesion: 0.32
Nodes (5): Handler, METHODS_WITHOUT_BODY, readBody(), toWebRequest(), vercelFunctionsDev()

### Community 126 - "useReferencePicker.hook.ts"
Cohesion: 0.25
Nodes (12): buildAssetReference(), buildCanvasReference(), canvasFrameReferenceLabel(), resolveAnimationReferenceImage(), ASSET, ADR-0011, CanvasFrameOption, getFocusable() (+4 more)

### Community 127 - "mascot-sprite.ts"
Cohesion: 0.25
Nodes (8): MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, drawBlaster(), drawMascot(), FillRectCall, PixelWriter

### Community 128 - "tokens/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, composite, outDir, extends, include, **/*.ts, ../../tsconfig.base.json

### Community 129 - "0008 — Lossless canvas resize with a cut-strips undo entry"
Cohesion: 0.25
Nodes (7): 0008 — Lossless canvas resize with a cut-strips undo entry, Consequences, Context, Decision, Options considered, Performance budget / acceptance, Prior art

### Community 130 - "0009 — Animation provider port and animation harness"
Cohesion: 0.25
Nodes (7): 0009 — Animation provider port and animation harness, Consequences, Context, Decision, Options considered, Performance budget / acceptance, Prior art

### Community 131 - "Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)"
Cohesion: 0.25
Nodes (7): 1. Apply the migration, 2. Create the two Vault secrets (SQL editor, once), 3. Set the Edge Function secrets, 4. Deploy the function (no JWT check: it authorizes with the shared secret), 5. Vercel env vars (project "editor"), 6. Check it works, Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)

### Community 132 - "pixel-core Capability"
Cohesion: 0.22
Nodes (9): Phase 0 TS Baseline Benchmarks, core-parity-gate Capability, Rust/Wasm Core Migration Intent, pixel-core Capability, Baseline Benchmarks Recorded Before Porting, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Full Canvas Repaint Performance Requirement (+1 more)

### Community 134 - "check-bench.ts"
Cohesion: 0.32
Nodes (7): Benchmark, BenchResults, findByPrefix(), Group, groupTitle(), main(), Thresholds

### Community 135 - "cleancode-agent definition"
Cohesion: 0.29
Nodes (7): cleancode-agent definition, test-agent (referenced), cleancode-agent (invoked when done), frontend-agent definition, Reference to clean-code-agent.md, Reference to frontend-agent.md, Reference to AGENTS.md build pipeline

### Community 136 - "0012 — Preset motion text is the editable action field, not hidden boilerplate"
Cohesion: 0.25
Nodes (7): 0012 — Preset motion text is the editable action field, not hidden boilerplate, Consequences, Context, Decision, Options considered, Performance budget / acceptance, Prior art

### Community 137 - "2026-10-15 — When "just add a note" quietly breaks your own animation"
Cohesion: 0.25
Nodes (7): 2026-10-15 — When "just add a note" quietly breaks your own animation, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What I decided and why, What I learned, What I researched

### Community 138 - "useCanvasOverlay.hook.ts"
Cohesion: 0.27
Nodes (8): CURSOR_POSITION_FALLBACK, CanvasOverlay(), useCanvasOverlay(), PositionFields(), usePositionFields(), UsePositionFieldsReturn, useCursorPixel(), useResetViewport()

### Community 139 - "2026-10-11 — Resizing a sprite without losing its layers"
Cohesion: 0.29
Nodes (6): 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What was researched

### Community 140 - "core/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, outDir, exclude, extends, include, node_modules, ../../tsconfig.base.json (+2 more)

### Community 141 - "0013 — Each motion preset picks its PixelLab animation model"
Cohesion: 0.33
Nodes (5): 0013 — Each motion preset picks its PixelLab animation model, Consequences, Context, Decision, Options

### Community 142 - "mascot.types.ts"
Cohesion: 0.22
Nodes (8): BlasterBoltState, EnemyLifecycle, EnemyState, MascotDrawOptions, MascotHurtbox, MascotPose, MascotScenePhase, MascotSceneState

### Community 143 - "wasm-bindgen Copy-In/Copy-Out Mechanism"
Cohesion: 0.33
Nodes (6): Phase 4 Wasm vs TS Kernel Bench (Near-Memcpy Loss), Phase 7g Store-Loop Bench Result (Wasm Slower Unbatched), Wasm Artifact Size Budget Requirement, Batching Amortizes the Fixed Per-Call Cost, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 144 - "bench/flood-fill.bench.ts"
Cohesion: 0.22
Nodes (4): here, mazePool, uniformPool, wasmPath

### Community 145 - "editor/package.json"
Cohesion: 0.40
Nodes (4): license, name, private, version

### Community 147 - "Animation motion detail"
Cohesion: 0.40
Nodes (4): Animation motion detail, Log, Specs, Tasks

### Community 148 - "colors.test.ts"
Cohesion: 0.40
Nodes (3): COLORS, tokensCss, tokensCssPath

### Community 149 - "delete-account/index.ts"
Cohesion: 0.40
Nodes (4): CORS_HEADERS, Envelope, fail(), respond()

### Community 150 - "Granular selector golden rule"
Cohesion: 0.40
Nodes (5): Zustand granular selector check, Zustand granular selectors always, Core rules shared by both apps, Granular selector golden rule, Konva layer / Zustand store sync

### Community 151 - "/implementar command"
Cohesion: 0.50
Nodes (4): /implementar command, Reference to find-animation-opportunities skill, Reference to impeccable skill, mcp__pencil__* tools usage

### Community 152 - "D6: flat Rust API surface, u32 handles, no serde"
Cohesion: 0.50
Nodes (4): D6: flat Rust API surface, u32 handles, no serde, D6 elaboration: flat methods, u32 handles, rgba:u32, TsPixelCore adapter, WasmPixelCore adapter

### Community 153 - "Animation reference lock"
Cohesion: 0.40
Nodes (4): Animation reference lock, Log, Specs, Tasks

### Community 154 - "Infinite Canvas pattern"
Cohesion: 0.67
Nodes (3): Core rules summary, Infinite Canvas pattern, ResizeObserver canvas resize handling

### Community 155 - "YouTube/Netflix MPEG-DASH/HLS precedent"
Cohesion: 0.67
Nodes (3): Chunking / segmentation, HTTP adaptive streaming (HLS, MPEG-DASH), YouTube/Netflix MPEG-DASH/HLS precedent

### Community 236 - "Sprite Studio v3 · Create tab simplification (AI-first)"
Cohesion: 0.40
Nodes (4): Log, Specs, Sprite Studio v3 · Create tab simplification (AI-first), Tasks

### Community 238 - "types/audio.ts"
Cohesion: 0.10
Nodes (29): ADSR_DEFAULTS, DEFAULT_VOLUME, FILTER_DEFAULTS, GENERATION_HISTORY_LIMIT, MASTER_GAIN_DEFAULT, OSCILLATOR_DEFAULTS, VariationCardProps, createAudioSynthSlice() (+21 more)

### Community 239 - "0010 — The canvas is always a named Assets item"
Cohesion: 0.20
Nodes (9): 0010 — The canvas is always a named Assets item, Consequences, Context, Decision, Implementation plan, Out of scope (this plan), Phase 1 — `Save As…` creates a named, typed Assets item, Phase 2 — Rename and recategorize an existing Assets item (+1 more)

### Community 241 - "D6: Flat Rust API, No Serde Decision"
Cohesion: 0.33
Nodes (6): D6: Flat Rust API, No Serde Decision, D7: Wasm-Memory-Backed Views Decision, Rust Document Struct, Option/Result at the FFI Boundary, Owning Data in Wasm Memory vs Copying Out, Slices and Bounds-Checking

### Community 242 - "2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go"
Cohesion: 0.25
Nodes (7): 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What I decided and why, What I learned, What I researched

### Community 247 - "Handoff 1 of 2 — merge `feat/animation-editing` into `master`"
Cohesion: 0.40
Nodes (4): Handoff 1 of 2 — merge `feat/animation-editing` into `master`, Prompt to paste in the new conversation, Watch out (verified 2026-10-18), What to merge

### Community 256 - "LoginPage.tsx"
Cohesion: 0.20
Nodes (10): AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, GoogleButton(), GoogleButtonProps, GoogleIcon(), HEADING (+2 more)

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **867 isolated node(s):** `RetroDiffusionApiResponse`, `SPRITE_IMPORT_DEFAULT_FRAMES`, `ASSET_TYPE_STYLE`, `AI_QUALITY_SAMPLE_SRC`, `AI_QUALITY_SAMPLE_NATIVE_SIZE` (+862 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1120 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `FOCUS_RING` connect `focus-ring.ts` to `LoginPage.tsx`, `constants/audio.ts`, `AssetType`, `QualitySamplePreview.tsx`, `useClipInspector.hook.ts`, `file-menu.ts`, `sound-library.ts`, `AnimateTab.tsx`, `SpriteEditorLayout.tsx`, `BottomPanel.tsx`, `ColorPicker.tsx`, `sound-timeline.slice.ts`, `Inspector.tsx`, `SoundListItem.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `MOTION` connect `focus-ring.ts` to `LoginPage.tsx`, `AssetType`, `QualitySamplePreview.tsx`, `file-menu.ts`, `lib/timeline-view.ts`, `AnimateTab.tsx`, `SpriteEditorLayout.tsx`, `BottomPanel.tsx`, `ColorPicker.tsx`, `sound-timeline.slice.ts`, `Inspector.tsx`, `SoundListItem.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `WasmPixelCore` connect `WasmPixelCore` to `pixel-core.ts`, `PixelCore`, `ts-core.judgment-day-round3.test.ts`, `wasm-pixel-core.differential.fuzz.test.ts`, `wasm-document-core.test.ts`, `src-ts/index.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `RetroDiffusionApiResponse`, `SPRITE_IMPORT_DEFAULT_FRAMES`, `ASSET_TYPE_STYLE` to the rest of the system?**
  _867 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Should `createEmptyBuffer` be split into smaller, more focused modules?**
  _Cohesion score 0.06483075157773953 - nodes in this community are weakly interconnected._