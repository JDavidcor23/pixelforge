# Graph Report - pixelforge  (2026-11-07)

## Corpus Check
- 673 files · ~365,851 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .toml 2)

## Summary
- 4322 nodes · 10888 edges · 259 communities (169 shown, 90 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 167 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de6e4f60`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- createEmptyBuffer
- ai-generation.ts
- ViewportState
- timeline-ops.ts
- server-animation-sync.ts
- LibrarySidebar.tsx
- ts-core.judgment-day.test.ts
- index.tsx
- useAnimateTab.hook.ts
- AudioAsset
- mod.rs
- lib/timeline-view.ts
- animation-job-ledger.ts
- constants/index.ts
- WasmDocument
- stores/index.ts
- pixellab-job.ts
- useEditorUIStore
- pixel-core.ts
- AnimateTab.tsx
- PixelKernels
- ColorPicker.tsx
- useCanvasInteraction.hook.ts
- useSpriteEditorStore
- LoginPage.tsx
- types/audio.ts
- catalog-subscription.test.ts
- motion.ts
- wasm-pixel-core.differential.fuzz.test.ts
- mascot-scene-state.ts
- animate.ts
- history.rs
- pixellab-animate-harness.ts
- useImportSpriteSheet.hook.ts
- devDependencies
- useSpriteAssetDeepLink.hook.ts
- useCanvasInteraction.hook.ts
- sound-library.ts
- useAuthStore
- useSoundsStore
- EditorLayout.tsx
- vitest
- useSettingsPanel.hook.ts
- flood-fill.oracle-parity.test.ts
- src-ts/ts-core.ts
- prefs.store.ts
- useDeleteAccountDialog.hook.ts
- 0014 — Build screen: chat + live Phaser preview, one asset catalog
- auth.service.ts
- BottomPanel.tsx
- downscale.rs
- slices.ts
- useAssetsPanel.hook.ts
- sound-timeline.slice.ts
- animation.types.ts
- mascot-scene.ts
- audio-storage.service.ts
- animation-polling.ts
- pixel-parity.test.ts
- quantize.rs
- dependencies
- LeftSidebar.tsx
- routes.ts
- collect-ai-jobs/index.ts
- types/audio.ts
- PixelForge IA (AGENTS.md)
- assets.store.ts
- PixelCore
- audio-engine.test.ts
- useSoundList.hook.ts
- TweakPanel.tsx
- useBottomToolbar.hook.ts
- mascot-scene-state.ts
- persistence.ts
- mascot-city.ts
- tokens/package.json
- document-persistence.controller.ts
- Deferred: scaling the sound editor
- App.tsx
- scripts
- ai-generation.ts
- RgbaColor
- DocumentRepository port
- Synthetic Architect design system
- scripts
- core/ts-core.ts
- ts-core.judgment-day-round3.test.ts
- Animation flow (PixelLab)
- include
- Zustand store (diagram node)
- DocumentRepository port
- Phase 7: Rust Document/History
- edit-history Capability
- core/package.json
- build-wasm.mjs
- Phased Migration Approach (0-7)
- 2026-11-07 — Why the asset catalog is rebuilt instead of saved
- file-menu.ts
- Sprite flow
- apps/editor/api/ai/ functions
- Phase 5: Rust Flood-Fill
- AssetType
- compilerOptions
- useMascotScene.hook.ts
- Handoff 2 of 2 — give attack animations their own model
- quantize.oracle-parity.test.ts
- devDependencies
- Phase 4: packages/core Rust Scaffold
- wasm-document-core.test.ts
- kernels.ts
- ai-jobs.store.ts
- mascot-font.ts
- ApiKeyField.tsx
- 2026-10-28 — Every sprite is a file from the moment you create it
- useSaveIndicator.hook.ts
- compilerOptions
- PixelForge Architecture Overview
- WasmPixelCore (diagram node, behind flag)
- bindings.rs (diagram node, only wasm-bindgen boundary)
- PixelForge IA (AGENTS.md)
- GridBackground.tsx
- workspace-build Capability
- 0011 — Lock an explicit animation reference (canvas frame or Asset)
- quantize-downscale.fuzz.test.ts
- vercel-functions-dev.ts
- src/types/index.ts
- mascot-sprite.ts
- tokens/tsconfig.json
- 0008 — Lossless canvas resize with a cut-strips undo entry
- 0009 — Animation provider port and animation harness
- Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)
- useLayerPanel.hook.ts
- src-ts/index.ts
- check-bench.ts
- cleancode-agent definition
- 0012 — Preset motion text is the editable action field, not hidden boilerplate
- 2026-10-15 — When "just add a note" quietly breaks your own animation
- build-level.md
- 2026-10-11 — Resizing a sprite without losing its layers
- core/tsconfig.json
- 0013 — Each motion preset picks its PixelLab animation model
- edit-history Capability
- focus-ring.ts
- Handoff — after build screen phase 3 (sprite-asset-deep-link)
- editor/package.json
- sprite-pipeline.ts
- Animation motion detail
- build-game.ts
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
- Client-side localStorage API key storage
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
- CI job: test / bench / typecheck
- rules-agent
- zustand-agent
- Geist font Google Fonts <link>
- #root + main.tsx mount point
- NEXT_PUBLIC_EDITOR_URL var
- AI-notes vs owner-written authorship policy
- AI notes README
- pnpm workspaces (monorepo)
- React Server Components and 'use client'
- SPA (Single Page Application)
- SSR vs CSR
- Vite build tool
- Code map: where each piece lives
- flood-fill/quantize/downscale modules
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
- Sound editor capabilities
- Sprite Studio v3 · Create tab simplification (AI-first)
- Handoff — build screen phase 4 (asset catalog)
- SoundEditorLayout.tsx
- 0010 — The canvas is always a named Assets item
- colord@^2.9.3
- phaser@4.2.1
- 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go
- PixelForge IA — Vision and milestones
- @types/react@^19
- Handoff 1 of 2 — merge `feat/animation-editing` into `master`
- constants/timeline-view.ts
- installFakeDom
- Build screen architecture — study notes
- konva@^10.2.5
- use-image@^1.1.4
- core.slice.real-trap.test.ts
- doc.resize command
- Four-step dark ladder palette
- @types/node@^20
- ADR 0006: DocumentRepository port + IndexedDB adapter
- ADR 0002: Single dispatch(cmd) seam; core owns the document
- D6: Flat Rust API, No Serde Decision
- Stage 6: Publishing to AWS (planned)

## God Nodes (most connected - your core abstractions)
1. `useSpriteEditorStore` - 96 edges
2. `useSoundsStore` - 95 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 69 edges
5. `MOTION` - 64 edges
6. `Document` - 52 edges
7. `useEditorUIStore` - 44 edges
8. `useAssetsStore` - 43 edges
9. `AudioAsset` - 40 edges
10. `putPixel()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Phase 1 — Empty screen + Phaser mounted (#18) — done` --references--> `EditorLayout()`  [INFERRED]
  docs/build-screen-implementation-plan.md → apps/editor/src/components/EditorLayout/EditorLayout.tsx
- `Context` --references--> `useTimeline()`  [INFERRED]
  docs/adr/0014-build-screen-chat-preview-and-asset-catalog.md → apps/editor/src/sprites/hooks/useSpriteEditorStore.hook.ts
- `Decision` --references--> `EditorLayout()`  [INFERRED]
  docs/adr/0014-build-screen-chat-preview-and-asset-catalog.md → apps/editor/src/components/EditorLayout/EditorLayout.tsx
- `Log` --references--> `toAssetName()`  [INFERRED]
  odd/tasks/asset-catalog.md → apps/editor/src/lib/asset-catalog/asset-name.ts
- `Phase 4 — Asset catalog` --references--> `subscribeToCatalogEntry()`  [INFERRED]
  docs/build-screen-implementation-plan.md → apps/editor/src/lib/asset-catalog/catalog-subscription.ts

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

## Communities (259 total, 90 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (66): bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of(), DirtyRect, DispatchResult, doc_replace_rejects_a_huge_frame_count_on_a_zero_sized_canvas_instead_of_attempting_a_multi_gb_allocation() (+58 more)

### Community 1 - "createEmptyBuffer"
Cohesion: 0.07
Nodes (58): TRANSPARENT_COLOR, makeFullBuffer(), makeDoc(), BucketStats, dominantColor(), downscalePixels(), downscaleTo(), EMPTY_BUFFER (+50 more)

### Community 2 - "ai-generation.ts"
Cohesion: 0.09
Nodes (28): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES, clampSize() (+20 more)

### Community 3 - "ViewportState"
Cohesion: 0.16
Nodes (16): getDrawOffset(), screenToPixel(), GridBackgroundProps, getDrawOffset(), GridOverlay(), GridOverlayProps, SelectionOverlay(), SelectionOverlayProps (+8 more)

### Community 4 - "timeline-ops.ts"
Cohesion: 0.06
Nodes (72): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME (+64 more)

### Community 5 - "server-animation-sync.ts"
Cohesion: 0.12
Nodes (22): AI_JOB_FRAME_EXTENSION, AI_JOB_FRAME_INDEX_PAD, createSyncDeps(), ADR-0009, useServerAnimationSync(), buildServerAnimationAsset(), planServerAnimationSync(), pngBytesToDataUri() (+14 more)

### Community 6 - "LibrarySidebar.tsx"
Cohesion: 0.12
Nodes (15): LIBRARY_FILTERS, DeleteSoundDialog(), LibraryEmptyState(), LibraryEmptyStateProps, LibraryFilters(), useLibraryFilters(), LibrarySearch(), useLibrarySearch() (+7 more)

### Community 7 - "ts-core.judgment-day.test.ts"
Cohesion: 0.06
Nodes (40): packPoints(), packRgba(), RGBA_BYTE_SHIFT, timelineToDocumentPayload(), toStrokePoints, BLUE, d(), doc() (+32 more)

### Community 8 - "index.tsx"
Cohesion: 0.07
Nodes (40): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+32 more)

### Community 9 - "useAnimateTab.hook.ts"
Cohesion: 0.07
Nodes (42): ANIMATION_ALREADY_RUNNING_ERROR, ANIMATION_ELAPSED_TICK_MS, ANIMATION_FRAME_OPTIONS, ANIMATION_FRAMES_INVALID_ERROR, ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR, ANIMATION_FRAMES_OVER_BUDGET_ERROR, ANIMATION_GENERATING_HINT, ANIMATION_GENERATING_LABEL (+34 more)

### Community 10 - "AudioAsset"
Cohesion: 0.06
Nodes (39): NAME_VISIBLE_TAIL_LENGTH, SOUND_DRAG_MIME, audioBufferCache, buffers, decodeFromUrl(), inflight, formatDuration(), getAssetKindLabel() (+31 more)

### Community 11 - "mod.rs"
Cohesion: 0.08
Nodes (44): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+36 more)

### Community 12 - "lib/timeline-view.ts"
Cohesion: 0.08
Nodes (49): SNAP_GRID_SECONDS, CLIP_WAVE, TIMELINE_LAYOUT, resamplePeaks(), formatSeconds(), collectSnapEdges(), snapThresholdSeconds(), snapTime() (+41 more)

### Community 13 - "animation-job-ledger.ts"
Cohesion: 0.08
Nodes (54): SERVER_SYNCED_JOB_IDS_LIMIT, ANIMATION_LEDGER_TIME_FORMAT, ANIMATION_RECOVER_FAILED_PREFIX, ANIMATION_RECOVER_PROCESSING_STATE, ANIMATION_RECOVER_SUCCESS_NOTICE, ANIMATION_RECOVER_UNREACHABLE_STATE, ANIMATION_JOB_LEDGER_SETTLED_LIMIT, ANIMATION_JOB_LEDGER_STORAGE_KEY (+46 more)

### Community 14 - "constants/index.ts"
Cohesion: 0.05
Nodes (48): AI_QUALITY_SAMPLE_NATIVE_SIZE, AI_QUALITY_SAMPLE_SEED, AI_QUALITY_SAMPLE_SRC, AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE, AI_SPRITE_SIZES, ASSET_LIBRARY_IMPORT_ACCEPT, ASSET_TYPE_EXAMPLE_CHIPS (+40 more)

### Community 15 - "WasmDocument"
Cohesion: 0.08
Nodes (8): clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill(), quantize(), WasmDocument

### Community 16 - "stores/index.ts"
Cohesion: 0.19
Nodes (13): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_TIMELINE, SPRITE_EDITOR_STORAGE_KEY, createInitialFrame(), createInitialLayer(), initialLayer, createCompoundSlice(), createCoreSlice() (+5 more)

### Community 17 - "pixellab-job.ts"
Cohesion: 0.17
Nodes (14): PIXELLAB_INPUT_FRAME_INDEX, PIXELLAB_JOB_FAILED_ERROR, PIXELLAB_NO_FRAMES_ERROR, describeDetail(), isFiniteNumber(), KNOWN_STATES, mapPixelLabJob(), PNG_SIGNATURE (+6 more)

### Community 18 - "useEditorUIStore"
Cohesion: 0.14
Nodes (34): BOTTOM_PANEL_TABS, INSPECTOR_TABS, QUALITY_RECOMMENDATION_BY_ASSET_TYPE, useBottomPanel(), useSpriteEditorLayout(), useCreateTab(), useInspector(), useBottomPanelHeight() (+26 more)

### Community 19 - "pixel-core.ts"
Cohesion: 0.04
Nodes (41): getPixelCoreEnvOverride(), Command, DispatchResult, isPixelCoreImpl(), PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, readEnvOverride(), readLocalStorageOverride() (+33 more)

### Community 20 - "AnimateTab.tsx"
Cohesion: 0.06
Nodes (52): handler(), json(), ANIMATION_BUSY_MESSAGE, ANIMATION_CANCEL_HINT, ANIMATION_CANCEL_LABEL, ANIMATION_CHECK_AGAIN_LABEL, ANIMATION_DISCARD_HINT, ANIMATION_DISCARD_LABEL (+44 more)

### Community 21 - "PixelKernels"
Cohesion: 0.05
Nodes (21): mockGetPixelCoreEnvOverride, KernelRow, KernelRow, here, source, wasmPath, here, mazePool (+13 more)

### Community 22 - "ColorPicker.tsx"
Cohesion: 0.09
Nodes (21): COLOR_PICKER, CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), ColorInputs(), ColorInputsProps, useColorInputs(), UseColorInputsParams (+13 more)

### Community 23 - "useCanvasInteraction.hook.ts"
Cohesion: 0.12
Nodes (29): CURSOR_POSITION_FALLBACK, SPRITE_EDITOR_KEYBOARD, SPRITE_EDITOR_VIEWPORT, CanvasArea(), CanvasOverlay(), useCanvasOverlay(), KonvaPointerEvent, useCanvasPanning() (+21 more)

### Community 24 - "useSpriteEditorStore"
Cohesion: 0.19
Nodes (28): getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useClipboard(), useCopySelectedFrames(), useCurrentFrameIndex() (+20 more)

### Community 25 - "LoginPage.tsx"
Cohesion: 0.13
Nodes (20): AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, useAuthForm(), GoogleButton(), HEADING, SUBTEXT (+12 more)

### Community 26 - "types/audio.ts"
Cohesion: 0.22
Nodes (14): DEFAULT_DECAY_SHARE, TWEAK_PARAMS, TWEAK_RANGES, TWEAK_SLIDER, applyTweak(), clamp(), fromPosition(), Range (+6 more)

### Community 27 - "catalog-subscription.test.ts"
Cohesion: 0.07
Nodes (28): BUILD_PANEL_TAB_ITEMS, BUILD_PANEL_TABS, BUILD_SCREEN_COPY, LIBRARY_ACTIVE_FILTER, LIBRARY_FILTER_ITEMS, LIBRARY_FILTERS, ADR-0014, toAssetName() (+20 more)

### Community 28 - "motion.ts"
Cohesion: 0.14
Nodes (24): DeleteAccountDialogProps, ModalPortal(), ModalPortalProps, SettingsPanelProps, DELETE_ACCOUNT_COPY, AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS, AI_QUALITY_SAMPLE_PROMPT, MOTION (+16 more)

### Community 29 - "wasm-pixel-core.differential.fuzz.test.ts"
Cohesion: 0.08
Nodes (22): here, makeDoc(), pkgAvailable, pkgDir, RED, SCENARIOS, STROKE_POINTS, wasmJsPath (+14 more)

### Community 30 - "mascot-scene-state.ts"
Cohesion: 0.12
Nodes (19): AIR_BOLT_Y_OFFSET, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_ENEMY, JUMP_ARC_HEIGHT_PX, JUMP_DOWN_LANDING_X (+11 more)

### Community 31 - "animate.ts"
Cohesion: 0.07
Nodes (40): describeDetail(), handler(), json(), PixelLabSubmitResponse, readEnv(), recordServerJob(), validBody, AI_JOB_ASSET_TYPE_MAX_LENGTH (+32 more)

### Community 32 - "history.rs"
Cohesion: 0.15
Nodes (20): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+12 more)

### Community 33 - "pixellab-animate-harness.ts"
Cohesion: 0.07
Nodes (31): DEFAULT_ANIMATION_MODEL, PIXELLAB_ANIMATE_PATHS, PIXELLAB_MAX_FRAMES, PIXELLAB_MIN_FRAMES, ANIMATION_HARNESS, buildAnimationAction(), CHARACTER_MOTIONS, findAnimationMotion() (+23 more)

### Community 34 - "useImportSpriteSheet.hook.ts"
Cohesion: 0.10
Nodes (33): IMPORT_SPRITE_SHEET_ERRORS, SPRITE_ANIMATION, SPRITE_IMPORT_MAX_FRAMES, decodeSheet(), decodeSingle(), FILE_READERS, isValidFrameCount(), nameFromFileName() (+25 more)

### Community 35 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, fake-indexeddb@^6.2.5, @tailwindcss/postcss@^4, @types/react-dom@^19, typescript@^5, vite-plugin-wasm@^3.6.0, @vitejs/plugin-react@^5.0.0, vitest@^4.1.4 (+8 more)

### Community 36 - "useSpriteAssetDeepLink.hook.ts"
Cohesion: 0.32
Nodes (10): useSoundAssetDeepLink(), useSpriteAssetDeepLink(), openSoundDeepLink(), openSpriteDeepLink(), readAssetDeepLinkId(), SoundDeepLinkDeps, SpriteDeepLinkDeps, withoutAssetDeepLink() (+2 more)

### Community 37 - "useCanvasInteraction.hook.ts"
Cohesion: 0.15
Nodes (19): ALPHA_TRANSPARENT_THRESHOLD, CANVAS_SIZE_OPTIONS, isCanvasBlank(), isLayerDataBlank(), ADR-0008, useCanvasSizePopover(), bresenhamLine(), KonvaPointerEvent (+11 more)

### Community 38 - "sound-library.ts"
Cohesion: 0.05
Nodes (80): AI_KIND_OPTIONS, DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, ELEVENLABS_DEFAULT_VOICE_ID, FALLBACK_SOUND_NAME, IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES (+72 more)

### Community 39 - "useAuthStore"
Cohesion: 0.19
Nodes (13): useLoginPage(), getLandingUrl(), getSupabaseAnonKey(), getSupabaseUrl(), isSupabaseConfigured(), LANDING_ROUTES, supabase, authService (+5 more)

### Community 40 - "useSoundsStore"
Cohesion: 0.17
Nodes (15): NEW_SOUND_AUTOFOCUS, VOLUME_RANGE, TRACK_COLOR, TRACK_KIND_ICON, TRACK_KIND_OPTIONS, autofocusSelector(), getFocusable(), useNewSoundPopover() (+7 more)

### Community 41 - "EditorLayout.tsx"
Cohesion: 0.22
Nodes (11): DeleteAccountDialog(), AccountDeletedNotice(), EditorLayout(), useEditorLayout(), SettingsPanel(), useAssetLibraryPersistence(), createIndexedDbAssetLibraryRepository(), Log (+3 more)

### Community 42 - "vitest"
Cohesion: 0.26
Nodes (11): GENERATION_HISTORY_LIMIT, ASSET_TYPES, isAssetType(), isFiniteNumber(), isGenerationKind(), isNonEmptyString(), isPngDataUri(), normalizeGeneration() (+3 more)

### Community 43 - "useSettingsPanel.hook.ts"
Cohesion: 0.20
Nodes (16): useSettingsPanel(), UseSettingsPanelResult, API_KEY_HELP_URL, API_KEY_PROVIDER, API_KEY_SAVED_FEEDBACK_MS, ElevenLabsError, generateMusic(), generateSFX() (+8 more)

### Community 44 - "flood-fill.oracle-parity.test.ts"
Cohesion: 0.22
Nodes (7): coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require, wasmPath

### Community 45 - "src-ts/ts-core.ts"
Cohesion: 0.15
Nodes (25): buildPalette(), diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect(), fillSpanRow() (+17 more)

### Community 46 - "prefs.store.ts"
Cohesion: 0.21
Nodes (11): SPRITE_EDITOR_CANVAS, PREFS_STORAGE_KEY, createIntegrationsSlice(), IntegrationsSlice, ADR-0009, createViewPrefsSlice(), clampZoom(), createViewportSlice() (+3 more)

### Community 47 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.22
Nodes (11): getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, useAccountDeletedNotice(), ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS, DELETE_ACCOUNT_CONFIRM_WORD, DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE, DELETE_ACCOUNT_ERROR_MESSAGES (+3 more)

### Community 48 - "0014 — Build screen: chat + live Phaser preview, one asset catalog"
Cohesion: 0.06
Nodes (32): 0014 — Build screen: chat + live Phaser preview, one asset catalog, Consequences, Context, D1. Where the screen lives, D2. Game loop vs React, D3. Who owns the asset list, D4. Editing from the Biblioteca, Decision (+24 more)

### Community 49 - "auth.service.ts"
Cohesion: 0.16
Nodes (10): DELETE_ACCOUNT_ERROR_CODE, deleteAccount(), DeleteAccountEnvelope, GoogleUserMetadata, ProfileRow, toDeleteAccountErrorCode(), DeleteAccountErrorCode, DeleteAccountFailure (+2 more)

### Community 50 - "BottomPanel.tsx"
Cohesion: 0.24
Nodes (7): BottomPanel(), ICON_MAP, AssetsPanel(), FrameThumbnail, FrameThumbnailProps, getThumbnailBorderClass(), TimelineBar()

### Community 51 - "downscale.rs"
Cohesion: 0.16
Nodes (18): alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color(), downscale() (+10 more)

### Community 52 - "slices.ts"
Cohesion: 0.14
Nodes (16): SPRITE_EDITOR_PALETTE, fakeFloodFill, makeDoc(), makeLayer(), makeDoc(), makeLayer(), RED, createPaletteSlice() (+8 more)

### Community 53 - "useAssetsPanel.hook.ts"
Cohesion: 0.07
Nodes (29): buildAssetLibraryItems(), downloadFromHref(), downloadJson(), readFileAsDataUrl(), readImageDimensions(), readLibraryImageFile(), stripExtension(), openLibraryItem() (+21 more)

### Community 54 - "sound-timeline.slice.ts"
Cohesion: 0.09
Nodes (46): EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory(), withoutAsset() (+38 more)

### Community 55 - "animation.types.ts"
Cohesion: 0.06
Nodes (34): ANIMATION_GENERIC_ERROR, PIXELLAB_ANIMATE_ROUTE, PIXELLAB_JOB_ROUTE, AnimationProviderError, ADR-0009, createPixelLabAnimationProvider(), KNOWN_SERVER_ERROR_CODES, readJson() (+26 more)

### Community 56 - "mascot-scene.ts"
Cohesion: 0.16
Nodes (22): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+14 more)

### Community 57 - "audio-storage.service.ts"
Cohesion: 0.14
Nodes (14): AUDIO_STORAGE_BUCKET, useSoundLibraryHydration(), buildFilePath(), generateId(), listAudioAssets(), StorageError, uploadAudio(), UploadResult (+6 more)

### Community 58 - "animation-polling.ts"
Cohesion: 0.15
Nodes (10): ANIMATION_HINT_SEPARATOR, ANIMATION_QUEUE_POSITION_PREFIX, ANIMATION_SECONDS_PER_MINUTE, ANIMATION_WAIT_PREFIX, ANIMATION_WAIT_SUFFIX, AnimationPollDeps, formatAnimationProgressHint(), pollAnimationJob() (+2 more)

### Community 59 - "pixel-parity.test.ts"
Cohesion: 0.18
Nodes (11): buf(), cases, here, maze(), ParityCase, pkgAvailable, readPixel(), rgba() (+3 more)

### Community 60 - "quantize.rs"
Cohesion: 0.24
Nodes (17): alpha_threshold_boundary_is_inclusive_on_the_high_side(), build(), build_palette(), Centroid, colors_zero_still_yields_one_centroid_not_zero(), dist2(), keeps_fully_transparent_pixels_transparent(), nearest() (+9 more)

### Community 61 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, idb@^8.0.4, lucide-react@^1.8.0, @pixelforge/core@workspace:*, @pixelforge/tokens@workspace:*, react@19.2.4, react-dom@19.2.4, react-konva@^19.2.3 (+9 more)

### Community 62 - "LeftSidebar.tsx"
Cohesion: 0.27
Nodes (6): LeftSidebar(), LayerItem(), LayerItemProps, useLayerItem(), UseLayerItemProps, LayerPanel()

### Community 63 - "routes.ts"
Cohesion: 0.27
Nodes (8): ASSET_DEEP_LINK_PARAM, EDITOR_NAV_ITEMS, EDITOR_ROUTES, navigate, ADR-0015, useBackToBuild(), EditorNavItem, react

### Community 64 - "collect-ai-jobs/index.ts"
Cohesion: 0.15
Nodes (18): Admin, AiJobRow, assetName(), collectOne(), decodeBase64(), describeDetail(), fetchPixelLabJob(), frameFileName() (+10 more)

### Community 65 - "types/audio.ts"
Cohesion: 0.05
Nodes (59): ADSR_DEFAULTS, ADSR_LIMITS, ADSR_VIEW, DEFAULT_VOLUME, ELEVENLABS_API_TIMEOUT, FILTER_DEFAULTS, FILTER_LIMITS, FILTER_TYPES (+51 more)

### Community 66 - "PixelForge IA (AGENTS.md)"
Cohesion: 0.14
Nodes (15): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), apps/editor, packages/core (Rust/Wasm), Editor environment variables, @pixelforge/editor README (+7 more)

### Community 67 - "assets.store.ts"
Cohesion: 0.07
Nodes (38): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, ANIMATION_PIPELINE_VERSION, GENERATION_HISTORY_STORAGE_KEY, ASSET_LIBRARY_LIMIT, isNonEmptyString(), isPngDataUri(), isPositiveFiniteNumber() (+30 more)

### Community 69 - "audio-engine.test.ts"
Cohesion: 0.33
Nodes (11): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+3 more)

### Community 70 - "useSoundList.hook.ts"
Cohesion: 0.19
Nodes (14): DELETE_SOUND_KEYS, SOUND_KIND_LABELS, ADD_TO_TIMELINE_KEY, OPEN_SOUND_KEY, filterAssets(), getRowAssetId(), isNavigationKey(), isTextEntry() (+6 more)

### Community 71 - "TweakPanel.tsx"
Cohesion: 0.16
Nodes (12): TransportProps, FILTER_LABELS, FilterControls(), useFilterControls(), TweakPanel(), TweakPanelProps, TweakSlider(), TweakSliderProps (+4 more)

### Community 72 - "useBottomToolbar.hook.ts"
Cohesion: 0.12
Nodes (26): SPRITE_EDITOR_TOOLS, useColorPalette(), ActiveColorType, hexToRgba(), rgbaToHex(), useColorPicker(), BottomToolbar(), useBottomToolbar() (+18 more)

### Community 73 - "mascot-scene-state.ts"
Cohesion: 0.09
Nodes (33): CROUCH_HURTBOX_TOP_OFFSET_PX, GROUND_BOLT_Y_OFFSET, TITLE_DROP_FROM_PX, AIR_BOLT_FROM, AIR_BOLT_TO, AIR_ENEMY_CENTER, AIR_MASCOT_GUN_TIP_UP, clamp01() (+25 more)

### Community 74 - "persistence.ts"
Cohesion: 0.05
Nodes (64): ASSET_HYDRATE_WAIT_MS, DOCUMENT_AUTOSAVE_DEBOUNCE_MS, DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_STORE_NAME, DRAFT_MIGRATION_ASSET_STORAGE_KEY, LEGACY_SPRITE_EDITOR_STORAGE_KEY, LOCAL_DRAFT_DOCUMENT_ID (+56 more)

### Community 75 - "mascot-city.ts"
Cohesion: 0.19
Nodes (15): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+7 more)

### Community 76 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 77 - "document-persistence.controller.ts"
Cohesion: 0.13
Nodes (20): createUntitledSprite(), documentHasContent(), documentPreview(), flattenDocumentFrame(), layer(), twoFrameDoc(), ADR-0015, mockBase64ToNativePixels (+12 more)

### Community 78 - "Deferred: scaling the sound editor"
Cohesion: 0.20
Nodes (9): Deferred: scaling the sound editor, docs/architecture/scalable-assets-research.md (cited), Scaling triggers, Cancel an in-flight AI generation, How to build it, What, What it affects, Why it waited (+1 more)

### Community 79 - "App.tsx"
Cohesion: 0.28
Nodes (7): App(), BuildScreen, ADR-0014, LoginPage(), useAuthSession(), rootElement, SpriteEditorLayout()

### Community 80 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 81 - "ai-generation.ts"
Cohesion: 0.06
Nodes (24): ASSET_ANIMATIONS_STORE, ASSET_DB_NAME, ASSET_DB_VERSION, ASSET_GENERATIONS_STORE, createInMemoryAssetLibraryRepository(), AssetLibraryDB, StoreName, AIGeneration (+16 more)

### Community 82 - "RgbaColor"
Cohesion: 0.14
Nodes (19): DOCUMENT_SCHEMA_VERSION, rgbaToHex(), rowsToBuffer(), LegacyFrame, LegacyLayer, legacyLayerToPayload(), LegacyMigrationResult, LegacyPersistedState (+11 more)

### Community 83 - "DocumentRepository port"
Cohesion: 0.33
Nodes (6): AI-assisted sprites, docs/ARCHITECTURE.md, PixelForge IA (root README), Roadmap, Sound editor feature, Sprite editor feature

### Community 84 - "Synthetic Architect design system"
Cohesion: 0.18
Nodes (13): clean-code-agent, design-agent, frontend-agent, graphify knowledge graph rules, CLAUDE.md (root), src/constants/COLORS.ts (canvas mirror), Component conventions, src/app/globals.css (source of truth) (+5 more)

### Community 85 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, bench, build, dev, preview, test, test:watch, typecheck

### Community 86 - "core/ts-core.ts"
Cohesion: 0.05
Nodes (77): RenderPixelsToCanvasOptions, unpackRgba(), bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory(), entryBytes() (+69 more)

### Community 87 - "ts-core.judgment-day-round3.test.ts"
Cohesion: 0.08
Nodes (30): DirtyRect, DocReplaceFrameInput, FrameId, LayerId, LayerMetaPatch, LayerRef, SerializedFrame, SerializedLayer (+22 more)

### Community 88 - "Animation flow (PixelLab)"
Cohesion: 0.14
Nodes (18): Animation flow (PixelLab), buildAnimationAction, PixelLab animation adapter, ANIMATION_HARNESS motion catalogue, AnimationProvider port, Async job pattern, buildAnimationAction, buildPrompt rules-first pattern (+10 more)

### Community 89 - "include"
Cohesion: 0.12
Nodes (15): compilerOptions, paths, plugins, target, exclude, extends, include, node_modules (+7 more)

### Community 90 - "Zustand store (diagram node)"
Cohesion: 0.22
Nodes (9): packages/tokens, apps/landing (diagram node), DocumentRepository port (diagram node), Hooks layer (diagram node), IndexedDB adapter (diagram node, DEFAULT), packages/tokens (diagram node), Supabase project sync (diagram node, planned), UI layer (diagram node) (+1 more)

### Community 91 - "DocumentRepository port"
Cohesion: 0.14
Nodes (9): ADR 0006 (sprite drafts repository, cited), Audio chunking (10s segments), List virtualization, LRU cache + memory budget, Five-phase scaling plan, Repository pattern for audio persistence, Windowed rendering export, IndexedDbDocumentRepository Adapter (+1 more)

### Community 92 - "Phase 7: Rust Document/History"
Cohesion: 0.21
Nodes (8): PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, Phase 7: Rust Document/History, Document: Stateful Struct, Not Stateless Function, A Wasm Trap Poisons the Whole Object, wasm32 usize Is 32 Bits (Overflow Risk)

### Community 93 - "edit-history Capability"
Cohesion: 0.29
Nodes (6): Command Union Type, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), Judgment-Day Blind-Judge Review Process, Phase 2: Command Seam + Dirty-Rect History, withState Reducer Helper

### Community 94 - "core/package.json"
Cohesion: 0.10
Nodes (19): devDependencies, @types/node, typescript, vitest, exports, @types/node, typescript, vitest (+11 more)

### Community 95 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 96 - "Phased Migration Approach (0-7)"
Cohesion: 0.12
Nodes (14): Phase 0 TS Baseline Benchmarks, core-parity-gate Capability, pixel-core Capability, Baseline Benchmarks Recorded Before Porting, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Full Canvas Repaint Performance Requirement, Implementation-Agnostic Pixel Operations Requirement (+6 more)

### Community 97 - "2026-11-07 — Why the asset catalog is rebuilt instead of saved"
Cohesion: 0.25
Nodes (7): 2026-11-07 — Why the asset catalog is rebuilt instead of saved, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What I decided and why, What I learned, What I researched

### Community 98 - "file-menu.ts"
Cohesion: 0.07
Nodes (34): DIALOG_FOCUS_TRAP_KEY, DUPLICATE_COPY, DUPLICATE_ERRORS, DUPLICATE_FIELD_IDS, DUPLICATE_NAME_SUFFIX, FILE_EXTENSION_PATTERN, FILE_MENU_COPY, FILE_MENU_DISMISS_KEY (+26 more)

### Community 99 - "Sprite flow"
Cohesion: 0.22
Nodes (8): decodeGeneratedSprite, estimateRetroDiffusionCost, generateSpriteWithRetroDiffusion, Sprite Generation with Retro Diffusion, Sprite flow, AI sprite variations, Retro Diffusion num_images parameter, Sprite Studio v3 Create (AI-first) Pencil frame

### Community 100 - "apps/editor/api/ai/ functions"
Cohesion: 0.18
Nodes (11): Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, apps/editor/api/ai Vercel Functions proxy (diagram node), ElevenLabs API (diagram node), Retro Diffusion API (diagram node) (+3 more)

### Community 101 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.21
Nodes (4): Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, u32 RGBA Packing/Unpacking, Vec<T> as an Explicit Stack

### Community 102 - "AssetType"
Cohesion: 0.08
Nodes (33): ASSET_FOLDERS, ASSET_TYPES, QUALITY_TIERS, AssetFolderTree(), AssetFolderTreeProps, ICON_MAP, AssetGrid(), AssetGridProps (+25 more)

### Community 103 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 104 - "useMascotScene.hook.ts"
Cohesion: 0.48
Nodes (5): MascotScene(), useMascotScene(), UseMascotSceneResult, computeReducedMotionSceneState(), createCanvas2DPixelWriter()

### Community 105 - "Handoff 2 of 2 — give attack animations their own model"
Cohesion: 0.29
Nodes (6): Evidence (benchmark 2026-10-18, wizard-128, 1.42 USD), Handoff 2 of 2 — give attack animations their own model, Open decisions for the owner (ask one at a time), Prompt to paste in the new conversation, What the owner wants (verbatim, 2026-10-18), Where it plugs in

### Community 106 - "quantize.oracle-parity.test.ts"
Cohesion: 0.17
Nodes (14): buildPalette(), Centroid, dist2(), nearest(), buildBuffer(), coreEntryPath, coreRoot, kernelRows (+6 more)

### Community 107 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 108 - "Phase 4: packages/core Rust Scaffold"
Cohesion: 0.33
Nodes (4): Wasm Artifact Size Budget Requirement, Batching Amortizes the Fixed Per-Call Cost, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 109 - "wasm-document-core.test.ts"
Cohesion: 0.20
Nodes (8): DocSnapshot, setIdSeed(), baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 110 - "kernels.ts"
Cohesion: 0.18
Nodes (14): ensureModuleLoading(), isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels(), here, pkgAvailable, wasmPath (+6 more)

### Community 111 - "ai-jobs.store.ts"
Cohesion: 0.11
Nodes (19): AI_JOBS_STORAGE_KEY, AIJobsState, IDLE_ANIMATE_JOB, IDLE_JOB, IDLE, IDLE_ANIMATE, PENDING, PROCESSING (+11 more)

### Community 112 - "mascot-font.ts"
Cohesion: 0.21
Nodes (12): rgbaToString(), GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, TITLE_TEXT, drawGlyph(), drawGlyphGlow() (+4 more)

### Community 113 - "ApiKeyField.tsx"
Cohesion: 0.47
Nodes (4): ApiKeyField(), ApiKeyFieldProps, useApiKeyField(), UseApiKeyFieldResult

### Community 114 - "2026-10-28 — Every sprite is a file from the moment you create it"
Cohesion: 0.25
Nodes (7): 2026-10-28 — Every sprite is a file from the moment you create it, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What I decided and why, What I learned, What I researched

### Community 115 - "useSaveIndicator.hook.ts"
Cohesion: 0.39
Nodes (6): SaveIndicator(), useSaveIndicator(), useIsPersistent(), useSaveError(), useSaveStatus(), SaveIndicator

### Community 116 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, jsx, lib, moduleDetection, noEmit, paths, target, types (+13 more)

### Community 117 - "PixelForge Architecture Overview"
Cohesion: 0.31
Nodes (9): ADR 0001: Flat pixel buffer, copy-on-write per batch, ADR 0003: Dirty-rect patches for undo history, ADR 0004: Rust/Wasm boundary shape, ADR 0005: pnpm monorepo split, The monorepo and Rust/WebAssembly migration, explained simply, Study guide: moving the editor from Next.js to Vite, Vercel monorepos (Root Directory, Ignored Build Step), PixelForge Architecture Overview (+1 more)

### Community 118 - "WasmPixelCore (diagram node, behind flag)"
Cohesion: 0.31
Nodes (8): WebAssembly JS<->Wasm boundary copy cost, src-ts/resolve-core.ts module, src-ts/wasm-core.ts module, PixelCore port (diagram node), PixelKernels (diagram node), TsPixelCore (diagram node, DEFAULT), wasm-pack -> pkg/ (diagram node), WasmPixelCore (diagram node, behind flag)

### Community 119 - "bindings.rs (diagram node, only wasm-bindgen boundary)"
Cohesion: 0.22
Nodes (8): packages/core/src Rust modules, bindings.rs (diagram node, only wasm-bindgen boundary), document.rs (diagram node), downscale.rs (diagram node), flood_fill.rs (diagram node), history.rs (diagram node), pixels/mod.rs (diagram node), quantize.rs (diagram node)

### Community 120 - "PixelForge IA (AGENTS.md)"
Cohesion: 0.29
Nodes (6): apps/landing, architecture-decision skill, packages/tokens, PixelForge IA (AGENTS.md), Scaling the sound editor learning-log entry (cited), Learning log index

### Community 121 - "GridBackground.tsx"
Cohesion: 0.29
Nodes (8): SPRITE_EDITOR_COLORS, hexToHsv(), hexToRgba(), hsvToHex(), getDrawOffset(), GridBackground(), renderCheckerboardToCanvas(), HsvColor

### Community 122 - "workspace-build Capability"
Cohesion: 0.22
Nodes (7): Sound Editor Feature-Parity Checklist, Sprite Editor Feature-Parity Checklist, workspace-build Capability, Developer Experience Budgets Requirement, Independent App Deployment Requirement, Server-Side Secrets Stay Server-Side Requirement, Phase 3: Monorepo Split + Vercel Deploy

### Community 123 - "0011 — Lock an explicit animation reference (canvas frame or Asset)"
Cohesion: 0.25
Nodes (7): 0011 — Lock an explicit animation reference (canvas frame or Asset), Consequences, Context, Decision, Implementation plan, Options considered, Prior art

### Community 124 - "quantize-downscale.fuzz.test.ts"
Cohesion: 0.25
Nodes (7): DOWNSCALE_SEEDS, here, pkgAvailable, QUANTIZE_SEEDS, randInt(), randomBuffer(), wasmPath

### Community 125 - "vercel-functions-dev.ts"
Cohesion: 0.32
Nodes (5): Handler, METHODS_WITHOUT_BODY, readBody(), toWebRequest(), vercelFunctionsDev()

### Community 126 - "src/types/index.ts"
Cohesion: 0.08
Nodes (31): DEFAULT_ASSET_TYPE, ADR-0010, ADR-0011, downloadCanvasAsPng(), exportFrameAsPng(), exportSpriteSheetAsPng(), layersToBase64(), renderLayersToCanvas() (+23 more)

### Community 127 - "mascot-sprite.ts"
Cohesion: 0.24
Nodes (7): MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, FillRectCall, MascotDrawOptions, PixelWriter

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

### Community 132 - "useLayerPanel.hook.ts"
Cohesion: 0.20
Nodes (15): useLeftSidebar(), useLayerPanel(), usePropertiesTab(), UsePropertiesTabReturn, useActiveLayerId(), useActiveLayerOpacity(), useAddLayer(), useLayersMetadata() (+7 more)

### Community 133 - "src-ts/index.ts"
Cohesion: 0.07
Nodes (42): AnimationFrame, Command, DirtyRect, DispatchResult, DocMetaSnapshot, DocReplaceFrameInput, DocumentFramePayload, DocumentLayerPayload (+34 more)

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

### Community 138 - "build-level.md"
Cohesion: 0.50
Nodes (3): Log, Specs, Tasks

### Community 139 - "2026-10-11 — Resizing a sprite without losing its layers"
Cohesion: 0.22
Nodes (8): 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Lessons, Resizing a sprite without losing its layers, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What was researched

### Community 140 - "core/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, outDir, exclude, extends, include, node_modules, ../../tsconfig.base.json (+2 more)

### Community 141 - "0013 — Each motion preset picks its PixelLab animation model"
Cohesion: 0.33
Nodes (5): 0013 — Each motion preset picks its PixelLab animation model, Consequences, Context, Decision, Options

### Community 142 - "edit-history Capability"
Cohesion: 0.33
Nodes (5): edit-history Capability, Bounded History Retention Requirement, Bounded Undo Memory Requirement, Command-Based Mutation Requirement, Undo/Redo Correctness Requirement

### Community 143 - "focus-ring.ts"
Cohesion: 0.13
Nodes (18): GoogleButtonProps, GoogleIcon(), DISABLED_STATE, FOCUS_RING, TONE_CLASSES, VariationCard(), VariationCardProps, DescribeWithAISection() (+10 more)

### Community 144 - "Handoff — after build screen phase 3 (sprite-asset-deep-link)"
Cohesion: 0.40
Nodes (4): Handoff — after build screen phase 3 (sprite-asset-deep-link), Minimal context, Owner's words, The idea / what is missing

### Community 145 - "editor/package.json"
Cohesion: 0.18
Nodes (10): babel-plugin-react-compiler@1.0.0, tailwindcss@^4, vite@^6.3.0, license, name, private, version, babel-plugin-react-compiler (+2 more)

### Community 146 - "sprite-pipeline.ts"
Cohesion: 0.12
Nodes (28): QUANTIZE_DEFAULTS, renderPixelsToCanvas(), composeHorizontalSheet(), computeHorizontalSheetLayout(), ADR-0009, base64ToNativePixels(), decodeGeneratedSprite(), estimateRetroDiffusionCost() (+20 more)

### Community 147 - "Animation motion detail"
Cohesion: 0.40
Nodes (4): Animation motion detail, Log, Specs, Tasks

### Community 148 - "build-game.ts"
Cohesion: 0.20
Nodes (8): BUILD_GAME, LEVEL_FORMAT, LEVEL_KEYS, LEVEL_SCENE, PLATFORMER, COLORS, tokensCss, tokensCssPath

### Community 149 - "delete-account/index.ts"
Cohesion: 0.40
Nodes (4): CORS_HEADERS, Envelope, fail(), respond()

### Community 150 - "Granular selector golden rule"
Cohesion: 0.40
Nodes (5): Zustand granular selector check, Zustand granular selectors always, Core rules shared by both apps, Granular selector golden rule, Konva layer / Zustand store sync

### Community 151 - "/implementar command"
Cohesion: 0.50
Nodes (4): /implementar command, Reference to find-animation-opportunities skill, Reference to impeccable skill, mcp__pencil__* tools usage

### Community 153 - "Animation reference lock"
Cohesion: 0.40
Nodes (4): Animation reference lock, Log, Specs, Tasks

### Community 236 - "Sprite Studio v3 · Create tab simplification (AI-first)"
Cohesion: 0.40
Nodes (4): Log, Specs, Sprite Studio v3 · Create tab simplification (AI-first), Tasks

### Community 237 - "Handoff — build screen phase 4 (asset catalog)"
Cohesion: 0.40
Nodes (4): Handoff — build screen phase 4 (asset catalog), Minimal context, Owner's words, The idea / what is missing

### Community 238 - "SoundEditorLayout.tsx"
Cohesion: 0.08
Nodes (21): BackToBuildButton(), BackToBuildButtonProps, BACK_TO_BUILD_COPY, SoundEditorLayout(), ClipInspector(), InspectorSlider(), KeyChip(), KeyChipProps (+13 more)

### Community 239 - "0010 — The canvas is always a named Assets item"
Cohesion: 0.20
Nodes (9): 0010 — The canvas is always a named Assets item, Consequences, Context, Decision, Implementation plan, Out of scope (this plan), Phase 1 — `Save As…` creates a named, typed Assets item, Phase 2 — Rename and recategorize an existing Assets item (+1 more)

### Community 242 - "2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go"
Cohesion: 0.25
Nodes (7): 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What I decided and why, What I learned, What I researched

### Community 243 - "PixelForge IA — Vision and milestones"
Cohesion: 0.25
Nodes (7): Long-term vision, Method (from the Serudda video, 2026-10-24), Milestone 1 — From a text to a playable platformer, North-star use case, PixelForge IA — Vision and milestones, The plan (Freddy's format), Why this exists (the owner's pain)

### Community 247 - "Handoff 1 of 2 — merge `feat/animation-editing` into `master`"
Cohesion: 0.40
Nodes (4): Handoff 1 of 2 — merge `feat/animation-editing` into `master`, Prompt to paste in the new conversation, Watch out (verified 2026-10-18), What to merge

### Community 248 - "constants/timeline-view.ts"
Cohesion: 0.04
Nodes (71): SOUND_NAME_MAX_LENGTH, WAV_EXTENSION, ALT_KEY, ALT_KEY_LABEL, CLIP_INSPECTOR, CLIP_KEY_SHORTCUTS, CLOCK_CENTISECONDS, GAIN_SMOOTHING_S (+63 more)

### Community 249 - "installFakeDom"
Cohesion: 1.00
Nodes (3): installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext()

### Community 250 - "Build screen architecture — study notes"
Cohesion: 0.33
Nodes (5): After shipping, Build screen architecture — study notes, Readings (short, in this order), The four decisions in one line each, Words to use in an interview

### Community 254 - "core.slice.real-trap.test.ts"
Cohesion: 0.22
Nodes (7): here, instances, pkgAvailable, pkgDir, ProbeWasmPixelCore, wasmJsPath, wasmPath

### Community 255 - "doc.resize command"
Cohesion: 0.32
Nodes (7): ADR 0003 dirty-rect undo history (cited), Command pattern (inverse operation), doc.replace command, doc.resize command, GIMP tile-based undo, History budget (32 MiB / 50 entries), Memento pattern (delta only)

### Community 257 - "Four-step dark ladder palette"
Cohesion: 0.33
Nodes (3): Accent token system, Four-step dark ladder palette, --pf-* CSS custom properties

### Community 265 - "ADR 0006: DocumentRepository port + IndexedDB adapter"
Cohesion: 0.29
Nodes (4): ADR 0006: DocumentRepository port + IndexedDB adapter, ADR 0007: Local-first persistence model, Local-first software, Repository pattern + Ports & Adapters

### Community 267 - "ADR 0002: Single dispatch(cmd) seam; core owns the document"
Cohesion: 0.33
Nodes (4): ADR 0002: Single dispatch(cmd) seam; core owns the document, core/commands.ts module, core/history.ts module, src-ts/ts-core.ts module

### Community 268 - "D6: Flat Rust API, No Serde Decision"
Cohesion: 0.20
Nodes (8): Rust Document Struct, PixelKernels Interface, Dirty-Pair Cache-Refresh Contract, Phase 4: packages/core Rust Scaffold, Hexagonal Split: Domain Module vs bindings.rs, Option/Result at the FFI Boundary, Owning Data in Wasm Memory vs Copying Out, Slices and Bounds-Checking

### Community 269 - "Stage 6: Publishing to AWS (planned)"
Cohesion: 0.50
Nodes (4): Stage 4: Assets (planned), Stage 5: Game building (planned), Stage 6: Publishing to AWS (planned), Stage 7: Operations (planned)

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **280 isolated node(s):** `ADR-0014`, `ADR-0016`, `ADR-0016`, `ADR-0014`, `ADR-0016` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1271 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **90 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useSoundsStore` connect `useSoundsStore` to `types/audio.ts`, `assets.store.ts`, `useSpriteAssetDeepLink.hook.ts`, `timeline-ops.ts`, `sound-library.ts`, `LibrarySidebar.tsx`, `useSoundList.hook.ts`, `TweakPanel.tsx`, `AudioAsset`, `lib/timeline-view.ts`, `SoundEditorLayout.tsx`, `focus-ring.ts`, `sound-timeline.slice.ts`, `constants/timeline-view.ts`, `types/audio.ts`, `catalog-subscription.test.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `ADR-0014`, `ADR-0016`, `ADR-0016` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Why does `DocumentRepository port (load/save/remove)` connect `persistence.ts` to `DocumentRepository port`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `createEmptyBuffer` be split into smaller, more focused modules?**
  _Cohesion score 0.06815968841285297 - nodes in this community are weakly interconnected._
- **Why does `DocumentRepository port` connect `DocumentRepository port` to `persistence.ts`, `DocumentRepository port`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._