# Graph Report - game-builder  (2026-10-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3804 nodes · 9801 edges · 236 communities (155 shown, 77 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `429b2f60`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- createEmptyBuffer
- persistence.ts
- pixel-core.ts
- timeline-ops.ts
- ts-core.judgment-day-round2.test.ts
- src/types/index.ts
- core/ts-core.ts
- index.tsx
- animation.ts
- types/audio.ts
- mod.rs
- constants/timeline-view.ts
- animation-job-ledger.ts
- constants/index.ts
- WasmDocument
- sound-library.ts
- animate.ts
- types/timeline.ts
- motion.ts
- focus-ring.ts
- PixelKernels
- src-ts/index.ts
- useCanvasInteraction.hook.ts
- useSpriteEditorStore.hook.ts
- LoginPage.tsx
- useEditorUIStore
- useSoundsStore
- assets.store.ts
- timeline-shortcuts.ts
- mascot-scene-state.ts
- SpriteEditorLayout.tsx
- history.rs
- pixellab-animate-harness.ts
- sprite-pipeline.ts
- devDependencies
- export-utils.ts
- index.test.ts
- auth.service.ts
- TopBar.tsx
- pixellab-job.ts
- useImportSpriteSheet.hook.ts
- useCreateSound.hook.ts
- useSoundDetailHeader.hook.ts
- wasm-pixel-core.differential.fuzz.test.ts
- src-ts/ts-core.ts
- tsKernels
- useEditorPrefsStore
- timeline-player.ts
- useDeleteAccountDialog.hook.ts
- DISABLED_STATE
- downscale.rs
- server-animation-sync.ts
- useAssetsPanel.hook.ts
- sound-timeline.slice.ts
- animation.types.ts
- mascot-scene.ts
- useSettingsPanel.hook.ts
- PropertiesTab.tsx
- RgbaColor
- quantize.rs
- dependencies
- pixellab-animation.service.ts
- LibrarySidebar.tsx
- collect-ai-jobs/index.ts
- BottomPanel.tsx
- TimelineEditor.tsx
- WasmPixelCore
- quantize.oracle-parity.test.ts
- useDescribeWithAI.hook.ts
- audio-engine.ts
- tweak-mapping.test.ts
- useColorPicker.hook.ts
- useTopBar.hook.ts
- mascot-font.ts
- mascot-city.ts
- tokens/package.json
- mascot-sprite.ts
- ai-generation.ts
- AssetType
- scripts
- dependencies
- useVariationsPanel.hook.ts
- PixelForge IA (AGENTS.md)
- Synthetic Architect design system
- scripts
- useDropZone.hook.ts
- Transport.tsx
- Animation flow (PixelLab)
- include
- Zustand store (diagram node)
- DocumentRepository port
- Phase 7: Rust Document/History
- edit-history Capability
- core/package.json
- build-wasm.mjs
- pixel-parity.test.ts
- doc.resize command
- animation-history.ts
- Deferred: scaling the sound editor
- apps/editor/api/ai/ functions
- Phase 5: Rust Flood-Fill
- resolve-core.ts
- compilerOptions
- typescript
- audio-engine.test.ts
- computeMascotSceneState
- landing/package.json
- package.json
- wasm-document-core.test.ts
- PixelForge IA (root README)
- elevenlabs.ts
- audio-storage.service.ts
- useTimelineShortcuts.hook.ts
- audio-encoder.ts
- useSaveIndicator.hook.ts
- compilerOptions
- PixelForge Architecture Overview
- WasmPixelCore (diagram node, behind flag)
- bindings.rs (diagram node, only wasm-bindgen boundary)
- PixelLab adapter
- pixel-core Capability
- workspace-build Capability
- Phased Migration Approach (0-7)
- quantize-downscale.fuzz.test.ts
- vercel-functions-dev.ts
- ui.store.ts
- mascot.types.ts
- ../../tsconfig.base.json
- 0008 — Lossless canvas resize with a cut-strips undo entry
- 0009 — Animation provider port and animation harness
- Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)
- PixelKernels Interface
- PixelCore
- check-bench.ts
- cleancode-agent definition
- editor/tsconfig.json
- lib
- ADR 0006: DocumentRepository port + IndexedDB adapter
- 2026-10-11 — Resizing a sprite without losing its layers
- core/tsconfig.json
- Four-step dark ladder palette
- useQualitySamplePreview.hook.ts
- GridBackground.tsx
- node_modules
- ADR 0002: Single dispatch(cmd) seam; core owns the document
- wasm-bindgen Copy-In/Copy-Out Mechanism
- D6: Flat Rust API, No Serde Decision
- colors.test.ts
- delete-account/index.ts
- Granular selector golden rule
- /implementar command
- D6: flat Rust API surface, u32 handles, no serde
- Stage 6: Publishing to AWS (planned)
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

## God Nodes (most connected - your core abstractions)
1. `useSpriteEditorStore` - 90 edges
2. `useSoundsStore` - 89 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 70 edges
5. `MOTION` - 62 edges
6. `Document` - 52 edges
7. `useEditorUIStore` - 46 edges
8. `AssetType` - 41 edges
9. `putPixel()` - 40 edges
10. `WasmDocument` - 38 edges

## Surprising Connections (you probably didn't know these)
- `VITE_PIXEL_CORE / pf:core override` --semantically_similar_to--> `PixelCore hexagonal port`  [INFERRED] [semantically similar]
  apps/editor/README.md → README.md
- `ANIMATION_HARNESS motion catalogue` --semantically_similar_to--> `Animation flow (PixelLab)`  [INFERRED] [semantically similar]
  docs/adr/0009-animation-provider-port-and-harness.md → apps/editor/src/lib/README.md
- `Hexagonal architecture / Ports & Adapters` --semantically_similar_to--> `PixelCore hexagonal port`  [INFERRED] [semantically similar]
  docs/adr/0009-animation-provider-port-and-harness.md → README.md
- `Repository pattern for audio persistence` --semantically_similar_to--> `DocumentRepository port`  [INFERRED] [semantically similar]
  docs/ai-notes/deferred-audio-asset-scalability.md → README.md
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

## Communities (236 total, 77 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (73): HashMap, History, HistoryEntry, bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of() (+65 more)

### Community 1 - "createEmptyBuffer"
Cohesion: 0.06
Nodes (67): TRANSPARENT_COLOR, installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext(), makeFullBuffer(), endOpenStroke(), fakeFloodFill, makeDoc() (+59 more)

### Community 2 - "persistence.ts"
Cohesion: 0.05
Nodes (56): AI_JOBS_STORAGE_KEY, ASSET_ANIMATIONS_STORE, ASSET_DB_NAME, ASSET_DB_VERSION, ASSET_GENERATIONS_STORE, DOCUMENT_AUTOSAVE_DEBOUNCE_MS, DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION (+48 more)

### Community 3 - "pixel-core.ts"
Cohesion: 0.05
Nodes (33): Command, DispatchResult, PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, resolveCore(), makeDoc(), mockGetPixelCoreEnvOverride, mockTryResolveWasmPixelCore (+25 more)

### Community 4 - "timeline-ops.ts"
Cohesion: 0.07
Nodes (61): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME, GAIN_DB_MAX, GAIN_DB_MIN (+53 more)

### Community 5 - "ts-core.judgment-day-round2.test.ts"
Cohesion: 0.05
Nodes (63): packPoints(), packRgba(), RGBA_BYTE_SHIFT, unpackRgba(), History, ContractCase, GREEN, implementations (+55 more)

### Community 6 - "src/types/index.ts"
Cohesion: 0.06
Nodes (51): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_PALETTE, SPRITE_EDITOR_TIMELINE, PREFS_STORAGE_KEY, DocReplaceFrameInput, FrameId, LayerId, LayerMetaPatch (+43 more)

### Community 7 - "core/ts-core.ts"
Cohesion: 0.06
Nodes (62): SPRITE_EDITOR_HISTORY, DirtyRect, LayerRef, bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory() (+54 more)

### Community 8 - "index.tsx"
Cohesion: 0.07
Nodes (40): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+32 more)

### Community 9 - "animation.ts"
Cohesion: 0.07
Nodes (53): ANIMATION_ALREADY_RUNNING_ERROR, ANIMATION_ELAPSED_TICK_MS, ANIMATION_FRAME_OPTIONS, ANIMATION_FRAMES_INVALID_ERROR, ANIMATION_FRAMES_OVER_BUDGET_ERROR, ANIMATION_GENERATING_HINT, ANIMATION_GENERATING_LABEL, ANIMATION_GENERIC_ERROR (+45 more)

### Community 10 - "types/audio.ts"
Cohesion: 0.06
Nodes (49): ADSR_DEFAULTS, ADSR_LIMITS, ADSR_VIEW, DEFAULT_VOLUME, ELEVENLABS_API_TIMEOUT, FILTER_DEFAULTS, FILTER_LIMITS, FILTER_TYPES (+41 more)

### Community 11 - "mod.rs"
Cohesion: 0.08
Nodes (48): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+40 more)

### Community 12 - "constants/timeline-view.ts"
Cohesion: 0.08
Nodes (43): CLIP_INSPECTOR, CLIP_WAVE, CLOCK_CENTISECONDS, PLAYHEAD_LARGE_STEP_MULTIPLIER, RULER_LABEL_MAX_DECIMALS, RULER_MAJOR_STEPS, RULER_MIN_MAJOR_SPACING_PX, RULER_MINOR_DIVISIONS (+35 more)

### Community 13 - "animation-job-ledger.ts"
Cohesion: 0.10
Nodes (49): ANIMATION_RECOVER_FAILED_PREFIX, ANIMATION_RECOVER_PROCESSING_STATE, ANIMATION_RECOVER_SUCCESS_NOTICE, ANIMATION_RECOVER_UNREACHABLE_STATE, ANIMATION_JOB_LEDGER_SETTLED_LIMIT, ANIMATION_JOB_LEDGER_STORAGE_KEY, createLedgerRecoverDeps(), saveAnimationToAssets() (+41 more)

### Community 14 - "constants/index.ts"
Cohesion: 0.06
Nodes (47): clampSize(), handler(), json(), RetroDiffusionApiResponse, stripDataUri(), AI_QUALITY_SAMPLE_NATIVE_SIZE, AI_QUALITY_SAMPLE_SEED, AI_QUALITY_SAMPLE_SRC (+39 more)

### Community 15 - "WasmDocument"
Cohesion: 0.08
Nodes (13): Box, DispatchResult, clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill() (+5 more)

### Community 16 - "sound-library.ts"
Cohesion: 0.08
Nodes (43): DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, FALLBACK_SOUND_NAME, LONG_DURATION_DECIMALS, LONG_DURATION_THRESHOLD_S, MINI_WAVE, MINI_WAVE_BAR_COUNT, PLACEHOLDER_PEAKS (+35 more)

### Community 17 - "animate.ts"
Cohesion: 0.07
Nodes (43): describeDetail(), handler(), json(), PixelLabSubmitResponse, readEnv(), recordServerJob(), validBody, ADR-0009 (+35 more)

### Community 18 - "types/timeline.ts"
Cohesion: 0.08
Nodes (40): CLIP_KEY_SHORTCUTS, TRACK_COLOR, TRACK_KIND_ICON, TRACK_KIND_OPTIONS, snapTime(), clipAriaLabel(), snapClipMove(), AddTrackRow() (+32 more)

### Community 19 - "motion.ts"
Cohesion: 0.08
Nodes (31): ANIMATION_BUSY_MESSAGE, ANIMATION_CHECK_AGAIN_LABEL, ANIMATION_DISCARD_HINT, ANIMATION_DISCARD_LABEL, ANIMATE_CUSTOM_MOTION_PLACEHOLDER, ASSET_LIBRARY_IMPORT_ACCEPT, MOTION, TrackLane() (+23 more)

### Community 20 - "focus-ring.ts"
Cohesion: 0.08
Nodes (29): FOCUS_RING, COLOR_PICKER, DescribeWithAISection(), ImportRow(), NewSoundPopover(), NewSoundPopoverProps, autofocusSelector(), getFocusable() (+21 more)

### Community 21 - "PixelKernels"
Cohesion: 0.05
Nodes (19): here, source, wasmPath, here, mazePool, uniformPool, wasmPath, here (+11 more)

### Community 22 - "src-ts/index.ts"
Cohesion: 0.09
Nodes (38): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+30 more)

### Community 23 - "useCanvasInteraction.hook.ts"
Cohesion: 0.12
Nodes (35): CURSOR_POSITION_FALLBACK, SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_KEYBOARD, SPRITE_EDITOR_VIEWPORT, CanvasArea(), CanvasOverlay(), useCanvasOverlay(), bresenhamLine() (+27 more)

### Community 24 - "useSpriteEditorStore.hook.ts"
Cohesion: 0.16
Nodes (39): useLayerPanel(), getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useClipboard(), useCommitTransformation() (+31 more)

### Community 25 - "LoginPage.tsx"
Cohesion: 0.11
Nodes (27): App(), AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, useAuthForm(), HEADING, LoginPage() (+19 more)

### Community 26 - "useEditorUIStore"
Cohesion: 0.11
Nodes (37): BOTTOM_PANEL_TABS, CANVAS_MIN_SIZE, INSPECTOR_TABS, SPRITE_EDITOR_LAYOUT, useDocumentPersistence(), BottomPanel(), useBottomPanel(), useSpriteEditorLayout() (+29 more)

### Community 27 - "useSoundsStore"
Cohesion: 0.10
Nodes (29): DELETE_SOUND_KEYS, ADD_TO_TIMELINE_KEY, OPEN_SOUND_KEY, useSoundEditorLayout(), LibrarySearch(), useLibrarySearch(), filterAssets(), getRowAssetId() (+21 more)

### Community 28 - "assets.store.ts"
Cohesion: 0.09
Nodes (25): GENERATION_HISTORY_LIMIT, GENERATION_HISTORY_STORAGE_KEY, ASSET_LIBRARY_LIMIT, useAssetLibraryPersistence(), ASSET_TYPES, isAssetType(), isFiniteNumber(), isNonEmptyString() (+17 more)

### Community 29 - "timeline-shortcuts.ts"
Cohesion: 0.09
Nodes (28): DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, HISTORY_LIMIT, MAX_PX_PER_SECOND, MIN_PX_PER_SECOND, ALT_KEY, ALT_KEY_LABEL, MAC_PLATFORM_PATTERN (+20 more)

### Community 30 - "mascot-scene-state.ts"
Cohesion: 0.10
Nodes (33): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_BOLT_Y_OFFSET, GROUND_ENEMY (+25 more)

### Community 31 - "SpriteEditorLayout.tsx"
Cohesion: 0.08
Nodes (24): AI_SPRITE_SIZES, CREATE_METHODS, SPRITE_IMPORT_ACCEPT, SPRITE_IMPORT_MIN_FRAMES, LeftSidebar(), useLeftSidebar(), ResizeHandle(), ResizeHandleProps (+16 more)

### Community 32 - "history.rs"
Cohesion: 0.15
Nodes (25): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+17 more)

### Community 33 - "pixellab-animate-harness.ts"
Cohesion: 0.08
Nodes (27): PIXELLAB_MAX_FRAMES, PIXELLAB_MIN_FRAMES, ANIMATION_HARNESS, buildAnimationAction(), CHARACTER_MOTIONS, findAnimationMotion(), SUBJECT_MOTIONS, ADR-0009 (+19 more)

### Community 34 - "sprite-pipeline.ts"
Cohesion: 0.12
Nodes (30): AI_SPRITE_DEFAULT_SIZE, SPRITE_IMPORT_DEFAULT_FRAMES, SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MAX_NATIVE_SIZE, decodeGeneratedSprite(), asKernelView(), composeCentered(), contentBox() (+22 more)

### Community 35 - "devDependencies"
Cohesion: 0.07
Nodes (33): devDependencies, babel-plugin-react-compiler, fake-indexeddb, tailwindcss, @tailwindcss/postcss, @types/react, @types/react-dom, vite (+25 more)

### Community 36 - "export-utils.ts"
Cohesion: 0.12
Nodes (27): getDrawOffset(), renderPixelsToCanvas(), RenderPixelsToCanvasOptions, screenToPixel(), HistoryPatch, ResizeStrip, downloadCanvasAsPng(), exportFrameAsPng() (+19 more)

### Community 37 - "index.test.ts"
Cohesion: 0.08
Nodes (21): timelineToDocumentPayload(), toStrokePoints, BLUE, GREEN, make2x2Buffer(), RED, setupWithSelection(), TRANSPARENT (+13 more)

### Community 38 - "auth.service.ts"
Cohesion: 0.09
Nodes (20): getSupabaseAnonKey(), getSupabaseUrl(), isSupabaseConfigured(), DELETE_ACCOUNT_ERROR_CODE, supabase, deleteAccount(), DeleteAccountEnvelope, GoogleUserMetadata (+12 more)

### Community 39 - "TopBar.tsx"
Cohesion: 0.14
Nodes (20): DIALOG_FOCUS_TRAP_KEY, FILE_EXTENSION_PATTERN, FILE_MENU_COPY, FILE_MENU_DISMISS_KEY, FILE_MENU_ITEM_IDS, IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS, IMPORT_FILE_ERROR_NOTICE_COPY, IMPORT_SPRITE_SHEET_COPY (+12 more)

### Community 40 - "pixellab-job.ts"
Cohesion: 0.11
Nodes (23): handler(), json(), PIXELLAB_API_BASE, PIXELLAB_INPUT_FRAME_INDEX, PIXELLAB_JOB_FAILED_ERROR, PIXELLAB_JOB_ID_PATTERN, PIXELLAB_JOB_PATH, PIXELLAB_KEY_HEADER (+15 more)

### Community 41 - "useImportSpriteSheet.hook.ts"
Cohesion: 0.14
Nodes (25): IMPORT_SPRITE_SHEET_ERRORS, SPRITE_ANIMATION, decodeSheet(), decodeSingle(), FILE_READERS, isValidFrameCount(), nameFromFileName(), openSpriteSheetFile() (+17 more)

### Community 42 - "useCreateSound.hook.ts"
Cohesion: 0.15
Nodes (23): ELEVENLABS_DEFAULT_VOICE_ID, MODE_TO_TAG, MPEG_MIME_TYPE, PRESET_TILES, PROMPT_SLUG_MAX_LENGTH, VARIATION_NAME_SUFFIX, audioBufferCache, buffers (+15 more)

### Community 43 - "useSoundDetailHeader.hook.ts"
Cohesion: 0.15
Nodes (22): NAME_VISIBLE_TAIL_LENGTH, SOUND_NAME_MAX_LENGTH, WAV_EXTENSION, downloadBlob(), formatDuration(), getAssetKindLabel(), pad2(), releaseObjectUrl() (+14 more)

### Community 44 - "wasm-pixel-core.differential.fuzz.test.ts"
Cohesion: 0.08
Nodes (22): here, makeDoc(), pkgAvailable, pkgDir, RED, SCENARIOS, STROKE_POINTS, wasmJsPath (+14 more)

### Community 45 - "src-ts/ts-core.ts"
Cohesion: 0.15
Nodes (25): buildPalette(), diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect(), fillSpanRow() (+17 more)

### Community 46 - "tsKernels"
Cohesion: 0.09
Nodes (19): getPixelCoreEnvOverride(), isPixelCoreImpl(), readEnvOverride(), readLocalStorageOverride(), resolveCoreImpl(), ensureWasmResolving(), getActiveKernels(), getActiveKernelsAsync() (+11 more)

### Community 47 - "useEditorPrefsStore"
Cohesion: 0.12
Nodes (21): SPRITE_EDITOR_TOOLS, useCanvasSelection(), useColorInputs(), UseColorInputsParams, BottomToolbar(), useBottomToolbar(), ICON_MAP, ToolButton() (+13 more)

### Community 48 - "timeline-player.ts"
Cohesion: 0.14
Nodes (17): GAIN_SMOOTHING_S, MIX_EXPORT, PLAYBACK_SCHEDULE_LEAD_S, TIMELINE_ERRORS, loadClipBuffers(), effectiveGain(), hasSoloTrack(), buildMixGraph() (+9 more)

### Community 49 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.16
Nodes (16): DeleteAccountDialog(), DeleteAccountDialogProps, getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, AccountDeletedNotice(), useAccountDeletedNotice(), EditorLayout() (+8 more)

### Community 50 - "DISABLED_STATE"
Cohesion: 0.12
Nodes (17): GoogleButton(), GoogleButtonProps, GoogleIcon(), DISABLED_STATE, FILTER_LABELS, FilterControls(), useFilterControls(), TweakPanel() (+9 more)

### Community 51 - "downscale.rs"
Cohesion: 0.16
Nodes (21): FnMut, alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color() (+13 more)

### Community 52 - "server-animation-sync.ts"
Cohesion: 0.14
Nodes (21): AI_JOB_FRAME_EXTENSION, AI_JOB_FRAME_INDEX_PAD, ANIMATION_PIPELINE_VERSION, createSyncDeps(), ADR-0009, useServerAnimationSync(), buildServerAnimationAsset(), planServerAnimationSync() (+13 more)

### Community 53 - "useAssetsPanel.hook.ts"
Cohesion: 0.14
Nodes (18): composeHorizontalSheet(), computeHorizontalSheetLayout(), ADR-0009, downloadFromHref(), downloadJson(), base64ToNativePixels(), readFileAsDataUrl(), readImageDimensions() (+10 more)

### Community 54 - "sound-timeline.slice.ts"
Cohesion: 0.20
Nodes (21): EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory(), withoutAsset() (+13 more)

### Community 55 - "animation.types.ts"
Cohesion: 0.12
Nodes (21): UseAnimateTabReturn, AIJobsState, IDLE_ANIMATE_JOB, IDLE_JOB, ADR-0009, AIJob, AnimateResult, GenerateResult (+13 more)

### Community 56 - "mascot-scene.ts"
Cohesion: 0.16
Nodes (22): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+14 more)

### Community 57 - "useSettingsPanel.hook.ts"
Cohesion: 0.13
Nodes (16): ModalPortal(), ModalPortalProps, ApiKeyField(), ApiKeyFieldProps, useApiKeyField(), UseApiKeyFieldResult, SettingsPanel(), SettingsPanelProps (+8 more)

### Community 58 - "PropertiesTab.tsx"
Cohesion: 0.14
Nodes (16): CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), ColorPicker, OpacitySlider(), OpacitySliderProps, PositionFields(), usePositionFields() (+8 more)

### Community 59 - "RgbaColor"
Cohesion: 0.15
Nodes (17): rgbaToHex(), rowsToBuffer(), LegacyFrame, LegacyLayer, legacyLayerToPayload(), LegacyMigrationResult, LegacyPersistedState, legacyStateToPayload() (+9 more)

### Community 60 - "quantize.rs"
Cohesion: 0.24
Nodes (19): alpha_threshold_boundary_is_inclusive_on_the_high_side(), build(), build_palette(), Centroid, colors_zero_still_yields_one_centroid_not_zero(), dist2(), keeps_fully_transparent_pixels_transparent(), nearest() (+11 more)

### Community 61 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, colord, idb, konva, @pixelforge/core, react, react-konva, react-router-dom (+13 more)

### Community 62 - "pixellab-animation.service.ts"
Cohesion: 0.16
Nodes (16): PIXELLAB_ANIMATE_ROUTE, PIXELLAB_JOB_ID_PARAM, PIXELLAB_JOB_ROUTE, AnimationProviderError, ADR-0009, createPixelLabAnimationProvider(), KNOWN_SERVER_ERROR_CODES, readJson() (+8 more)

### Community 63 - "LibrarySidebar.tsx"
Cohesion: 0.15
Nodes (12): LIBRARY_FILTERS, DeleteSoundDialog(), LibraryEmptyState(), LibraryEmptyStateProps, LibraryFilters(), useLibraryFilters(), LibrarySidebar(), useLibrarySidebar() (+4 more)

### Community 64 - "collect-ai-jobs/index.ts"
Cohesion: 0.16
Nodes (19): Admin, AiJobRow, assetName(), collectOne(), decodeBase64(), describeDetail(), fetchPixelLabJob(), frameFileName() (+11 more)

### Community 65 - "BottomPanel.tsx"
Cohesion: 0.14
Nodes (13): ASSET_FOLDERS, TIMELINE_THUMBNAIL_SIZE, ICON_MAP, AssetFolderTree(), AssetFolderTreeProps, ICON_MAP, AssetGrid(), AssetsPanel() (+5 more)

### Community 66 - "TimelineEditor.tsx"
Cohesion: 0.15
Nodes (15): TIMELINE_TIPS, TIP_NOTICE_DURATION_MS, isTimeInsideClip(), TimelineEditor(), TimelineToolbar(), useTimelineToolbar(), TimelineTopBar(), TimelineTracks() (+7 more)

### Community 67 - "WasmPixelCore"
Cohesion: 0.16
Nodes (5): DispatchResult, LayerId, clampRectToCanvas(), decodeNames(), WasmPixelCore

### Community 68 - "quantize.oracle-parity.test.ts"
Cohesion: 0.15
Nodes (16): QUANTIZE_DEFAULTS, buildPalette(), Centroid, dist2(), nearest(), coreEntryPath, coreRoot, KernelRow (+8 more)

### Community 69 - "useDescribeWithAI.hook.ts"
Cohesion: 0.22
Nodes (14): AI_KIND_OPTIONS, NEW_SOUND_AUTOFOCUS, ElevenLabsError, generateMusic(), generateSFX(), generateTTS(), getApiKeyOrThrow(), getElevenLabsApiKey() (+6 more)

### Community 70 - "audio-engine.ts"
Cohesion: 0.20
Nodes (9): AudioEngine, buildSynthChain(), calculateDefaultDuration(), createWhiteNoiseBuffer(), mapFilterType(), msToSec(), getEngine(), AudioSynthSlice (+1 more)

### Community 71 - "tweak-mapping.test.ts"
Cohesion: 0.21
Nodes (15): DEFAULT_DECAY_SHARE, TWEAK_PARAMS, TWEAK_RANGES, TWEAK_SLIDER, applyTweak(), clamp(), fromPosition(), Range (+7 more)

### Community 72 - "useColorPicker.hook.ts"
Cohesion: 0.22
Nodes (14): hexToHsv(), hsvToHex(), useColorPalette(), ActiveColorType, hexToRgba(), rgbaToHex(), useColorPicker(), usePalette() (+6 more)

### Community 73 - "useTopBar.hook.ts"
Cohesion: 0.23
Nodes (13): FILE_MENU_ENTRY_KIND, FILE_MENU_LABELS, SPRITE_DOCUMENT_DEFAULT_NAME, buildFileMenuEntries(), isMenuDismissKey(), isOutsideMenu(), selectByLabel(), useTopBar() (+5 more)

### Community 74 - "mascot-font.ts"
Cohesion: 0.19
Nodes (14): rgbaToString(), GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, TITLE_TEXT, drawGlyph(), drawGlyphGlow() (+6 more)

### Community 75 - "mascot-city.ts"
Cohesion: 0.19
Nodes (15): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+7 more)

### Community 76 - "tokens/package.json"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, vitest, license (+8 more)

### Community 77 - "mascot-sprite.ts"
Cohesion: 0.17
Nodes (11): MascotScene(), useMascotScene(), UseMascotSceneResult, MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, computeReducedMotionSceneState() (+3 more)

### Community 78 - "ai-generation.ts"
Cohesion: 0.17
Nodes (14): RETRO_DIFFUSION_ROUTE, estimateRetroDiffusionCost(), generateSpriteWithRetroDiffusion(), postToRetroDiffusion(), AssetLibrarySnapshot, GameTemplateId, QualityRecommendation, RecentGenerationItem (+6 more)

### Community 79 - "AssetType"
Cohesion: 0.20
Nodes (13): ASSET_TYPES, QUALITY_RECOMMENDATION_BY_ASSET_TYPE, QUALITY_TIERS, FinishedJob, GeneratePanelProps, QualitySelectorProps, UseAssetTypeSelectorParams, UseGeneratePanelParams (+5 more)

### Community 80 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, bench, build, changeset, changeset:version, check-bench, check-bench:core, check-bench:editor (+7 more)

### Community 81 - "dependencies"
Cohesion: 0.14
Nodes (14): lucide-react, @pixelforge/tokens, react-dom, lucide-react, @pixelforge/tokens, react-dom, dependencies, lucide-react (+6 more)

### Community 82 - "useVariationsPanel.hook.ts"
Cohesion: 0.22
Nodes (11): TAG_TO_MODE, VARIATION_COUNT, getAssetKind(), TONE_CLASSES, VariationCard(), VariationCardProps, useVariationsPanel(), VariationsPanel() (+3 more)

### Community 83 - "PixelForge IA (AGENTS.md)"
Cohesion: 0.15
Nodes (13): apps/editor, apps/landing, architecture-decision skill, Future improvements deferral rule, packages/tokens, PixelForge IA (AGENTS.md), Editor environment variables, @pixelforge/editor README (+5 more)

### Community 84 - "Synthetic Architect design system"
Cohesion: 0.18
Nodes (13): clean-code-agent, design-agent, frontend-agent, graphify knowledge graph rules, CLAUDE.md (root), src/constants/COLORS.ts (canvas mirror), Component conventions, src/app/globals.css (source of truth) (+5 more)

### Community 85 - "scripts"
Cohesion: 0.15
Nodes (12): license, name, private, scripts, bench, build, dev, preview (+4 more)

### Community 86 - "useDropZone.hook.ts"
Cohesion: 0.23
Nodes (11): IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES, SOUND_LIBRARY_ERRORS, FILES_DRAG_TYPE, SOUND_DRAG_MIME, isSupportedFile(), useImportRow() (+3 more)

### Community 87 - "Transport.tsx"
Cohesion: 0.24
Nodes (9): VOLUME_RANGE, Transport(), TransportProps, useWaveform(), Waveform(), WaveformProps, useWavePanel(), WavePanel() (+1 more)

### Community 88 - "Animation flow (PixelLab)"
Cohesion: 0.18
Nodes (13): Animation flow (PixelLab), buildAnimationAction, Sprite Generation with Retro Diffusion, PixelLab animation adapter, ANIMATION_HARNESS motion catalogue, AnimationProvider port, buildAnimationAction, buildPrompt rules-first pattern (+5 more)

### Community 89 - "include"
Cohesion: 0.15
Nodes (12): compilerOptions, paths, plugins, target, extends, include, **/*.ts, **/*.mts (+4 more)

### Community 90 - "Zustand store (diagram node)"
Cohesion: 0.17
Nodes (13): D10: packages/tokens source-exported, no build step, DocumentRepository port (load/save/remove), document-persistence.controller.ts, indexeddb-document.repository.service.ts, packages/tokens, apps/landing (diagram node), DocumentRepository port (diagram node), Hooks layer (diagram node) (+5 more)

### Community 91 - "DocumentRepository port"
Cohesion: 0.15
Nodes (13): D12: local-first, cloud sync deferred, ADR 0006 (sprite drafts repository, cited), Audio chunking (10s segments), List virtualization, LRU cache + memory budget, Five-phase scaling plan, Repository pattern for audio persistence, Windowed rendering export (+5 more)

### Community 92 - "Phase 7: Rust Document/History"
Cohesion: 0.21
Nodes (13): Phase 7 Document/PixelCore Bench Result, D3: Core Owns Document Decision, Default Core Implementation Stays TS Decision, PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, PixelCore Interface Fallback Decision (+5 more)

### Community 93 - "edit-history Capability"
Cohesion: 0.17
Nodes (13): Every Document Mutation Is Undoable (Phase 2c), Command Union Type, D4: Dirty-Rect History Decision, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), edit-history Capability, Dirty-Rect Patch History Decision, Bounded History Retention Requirement (+5 more)

### Community 94 - "core/package.json"
Cohesion: 0.15
Nodes (12): exports, license, name, private, scripts, bench, build:wasm, test (+4 more)

### Community 95 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 96 - "pixel-parity.test.ts"
Cohesion: 0.18
Nodes (11): buf(), cases, here, maze(), ParityCase, pkgAvailable, readPixel(), rgba() (+3 more)

### Community 97 - "doc.resize command"
Cohesion: 0.21
Nodes (12): packages/core (Rust/Wasm), ADR 0003 dirty-rect undo history (cited), Command pattern (inverse operation), Option C: store only cut strips, doc.replace command, doc.resize command, GIMP tile-based undo, History budget (32 MiB / 50 entries) (+4 more)

### Community 98 - "animation-history.ts"
Cohesion: 0.30
Nodes (10): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, isNonEmptyString(), isPngDataUri(), isPositiveFiniteNumber(), normalizeAnimation(), parseAnimationHistory(), ParsedAnimationHistory (+2 more)

### Community 99 - "Deferred: scaling the sound editor"
Cohesion: 0.17
Nodes (12): decodeGeneratedSprite, estimateRetroDiffusionCost, generateSpriteWithRetroDiffusion, No background removal rationale, Sprite flow, Deferred: scaling the sound editor, docs/architecture/scalable-assets-research.md (cited), Scaling triggers (+4 more)

### Community 100 - "apps/editor/api/ai/ functions"
Cohesion: 0.18
Nodes (12): Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, apps/editor/api/ai Vercel Functions proxy (diagram node), ElevenLabs API (diagram node), Retro Diffusion API (diagram node) (+4 more)

### Community 101 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.21
Nodes (12): Phase 5 Flood-Fill Bench Result (2.3-2.6x, Target 3x Not Met), Phase 5f Scanline Bench Result (Ratio Narrows, Absolute Faster), Phase 6 Quantize/Downscale Bench Result, Scanline Span-Fill Rewrite (Phase 5f), Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, Flat Table Replaces Per-Cell HashMap, No Recursion in Flood-Fill (Stack Overflow Risk) (+4 more)

### Community 102 - "resolve-core.ts"
Cohesion: 0.26
Nodes (10): isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels(), here, pkgAvailable, wasmPath, withRuntimeTrapFallback() (+2 more)

### Community 103 - "compilerOptions"
Cohesion: 0.17
Nodes (12): compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, module, moduleResolution, noEmit (+4 more)

### Community 104 - "typescript"
Cohesion: 0.18
Nodes (11): @types/node, typescript, @types/node, @types/node, typescript, devDependencies, @types/node, typescript (+3 more)

### Community 105 - "audio-engine.test.ts"
Cohesion: 0.38
Nodes (10): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+2 more)

### Community 106 - "computeMascotSceneState"
Cohesion: 0.27
Nodes (11): clamp01(), computeAirDodgeOffset(), computeBolt(), computeEnemy(), computeLevelWipeY(), computeMascotSceneState(), computeTitleLine(), easeOutBack() (+3 more)

### Community 107 - "landing/package.json"
Cohesion: 0.18
Nodes (10): license, name, private, scripts, build, dev, lint, start (+2 more)

### Community 108 - "package.json"
Cohesion: 0.18
Nodes (10): @changesets/cli, devDependencies, @changesets/cli, typescript, license, name, packageManager, private (+2 more)

### Community 109 - "wasm-document-core.test.ts"
Cohesion: 0.22
Nodes (7): setIdSeed(), baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 110 - "PixelForge IA (root README)"
Cohesion: 0.20
Nodes (10): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), AI-assisted sprites, docs/ARCHITECTURE.md, PixelForge IA (root README), Rust/Wasm core migration (+2 more)

### Community 111 - "elevenlabs.ts"
Cohesion: 0.29
Nodes (7): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES

### Community 112 - "audio-storage.service.ts"
Cohesion: 0.24
Nodes (6): AUDIO_STORAGE_BUCKET, buildFilePath(), generateId(), StorageError, uploadAudio(), UploadResult

### Community 113 - "useTimelineShortcuts.hook.ts"
Cohesion: 0.29
Nodes (9): SNAP_GRID_SECONDS, resolveTimelineShortcut(), isTextEntry(), NUDGE_ACTIONS, runAction(), shouldIgnore(), useTimelineShortcuts(), TimelineShortcutAction (+1 more)

### Community 114 - "audio-encoder.ts"
Cohesion: 0.33
Nodes (6): createAudioObjectUrl(), encodeWav(), floatToInt16(), MockAudioBuffer, writeString(), writeWavHeader()

### Community 115 - "useSaveIndicator.hook.ts"
Cohesion: 0.39
Nodes (6): SaveIndicator(), useSaveIndicator(), useIsPersistent(), useSaveError(), useSaveStatus(), SaveIndicator

### Community 116 - "compilerOptions"
Cohesion: 0.22
Nodes (9): compilerOptions, jsx, moduleDetection, noEmit, paths, target, types, useDefineForClassFields (+1 more)

### Community 117 - "PixelForge Architecture Overview"
Cohesion: 0.31
Nodes (9): ADR 0001: Flat pixel buffer, copy-on-write per batch, ADR 0003: Dirty-rect patches for undo history, ADR 0004: Rust/Wasm boundary shape, ADR 0005: pnpm monorepo split, The monorepo and Rust/WebAssembly migration, explained simply, Study guide: moving the editor from Next.js to Vite, Vercel monorepos (Root Directory, Ignored Build Step), PixelForge Architecture Overview (+1 more)

### Community 118 - "WasmPixelCore (diagram node, behind flag)"
Cohesion: 0.31
Nodes (9): D7: Wasm linear-memory views, rebuilt per dispatch, WebAssembly JS<->Wasm boundary copy cost, src-ts/resolve-core.ts module, src-ts/wasm-core.ts module, PixelCore port (diagram node), PixelKernels (diagram node), TsPixelCore (diagram node, DEFAULT), wasm-pack -> pkg/ (diagram node) (+1 more)

### Community 119 - "bindings.rs (diagram node, only wasm-bindgen boundary)"
Cohesion: 0.22
Nodes (9): D9: pkg/ committed, CI drift check, packages/core/src Rust modules, bindings.rs (diagram node, only wasm-bindgen boundary), document.rs (diagram node), downscale.rs (diagram node), flood_fill.rs (diagram node), history.rs (diagram node), pixels/mod.rs (diagram node) (+1 more)

### Community 120 - "PixelLab adapter"
Cohesion: 0.25
Nodes (9): Async job pattern, PixelLab adapter, Retro Diffusion animation adapter (removed), public.ai_jobs table + RLS, collect-ai-jobs Edge Function, Deploy: server-owned animation jobs, pg_cron collect-ai-jobs job, PIXELLAB_API_KEY (+1 more)

### Community 121 - "pixel-core Capability"
Cohesion: 0.22
Nodes (9): Phase 0 TS Baseline Benchmarks, core-parity-gate Capability, Rust/Wasm Core Migration Intent, pixel-core Capability, Baseline Benchmarks Recorded Before Porting, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Full Canvas Repaint Performance Requirement (+1 more)

### Community 122 - "workspace-build Capability"
Cohesion: 0.22
Nodes (9): D9: Commit pkg/, CI Rebuild-Diff Decision, Sound Editor Feature-Parity Checklist, Sprite Editor Feature-Parity Checklist, Commit pkg/ + CI Rebuild-Diff Decision, workspace-build Capability, Developer Experience Budgets Requirement, Independent App Deployment Requirement, Server-Side Secrets Stay Server-Side Requirement (+1 more)

### Community 123 - "Phased Migration Approach (0-7)"
Cohesion: 0.25
Nodes (9): Phased Migration Approach (0-7), Lossless Pixel Round-Trip Requirement, Dirty-Pair Cache-Refresh Contract, Judgment-Day Blind-Judge Review Process, Phase 0: Gates (CI, Scripts, Characterization Tests), Phase 4: packages/core Rust Scaffold, Phase 6: Rust Quantize/Downscale, f64 Is Bit-Identical to JS number (+1 more)

### Community 124 - "quantize-downscale.fuzz.test.ts"
Cohesion: 0.25
Nodes (7): DOWNSCALE_SEEDS, here, pkgAvailable, QUANTIZE_SEEDS, randInt(), randomBuffer(), wasmPath

### Community 125 - "vercel-functions-dev.ts"
Cohesion: 0.32
Nodes (5): Handler, METHODS_WITHOUT_BODY, readBody(), toWebRequest(), vercelFunctionsDev()

### Community 126 - "ui.store.ts"
Cohesion: 0.32
Nodes (6): DEFAULT_ASSET_TYPE, DEFAULT_CREATE_METHOD, DEFAULT_QUALITY_TIER, RESIZABLE_PANELS, createUISlice(), EditorUIStore

### Community 127 - "mascot.types.ts"
Cohesion: 0.25
Nodes (7): BlasterBoltState, EnemyLifecycle, EnemyState, MascotHurtbox, MascotPose, MascotScenePhase, MascotSceneState

### Community 128 - "../../tsconfig.base.json"
Cohesion: 0.25
Nodes (7): ../../tsconfig.base.json, compilerOptions, composite, outDir, extends, include, **/*.ts

### Community 129 - "0008 — Lossless canvas resize with a cut-strips undo entry"
Cohesion: 0.25
Nodes (7): 0008 — Lossless canvas resize with a cut-strips undo entry, Consequences, Context, Decision, Options considered, Performance budget / acceptance, Prior art

### Community 130 - "0009 — Animation provider port and animation harness"
Cohesion: 0.25
Nodes (7): 0009 — Animation provider port and animation harness, Consequences, Context, Decision, Options considered, Performance budget / acceptance, Prior art

### Community 131 - "Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)"
Cohesion: 0.25
Nodes (7): 1. Apply the migration, 2. Create the two Vault secrets (SQL editor, once), 3. Set the Edge Function secrets, 4. Deploy the function (no JWT check: it authorizes with the shared secret), 5. Vercel env vars (project "editor"), 6. Check it works, Deploy: server-owned animation jobs (`ai_jobs` + `collect-ai-jobs`)

### Community 132 - "PixelKernels Interface"
Cohesion: 0.25
Nodes (8): D13: idb Library for IndexedDB, D1: Flat RGBA Buffer Decision, D2: Copy-on-Write Mutation Decision, D5: Two Seams (PixelKernels/PixelCore) Decision, IndexedDbDocumentRepository Adapter, PixelKernels Interface, Local Draft Recovery Requirement, Phase 1: Flatten Buffer + IndexedDB Persistence

### Community 134 - "check-bench.ts"
Cohesion: 0.32
Nodes (7): Benchmark, BenchResults, findByPrefix(), Group, groupTitle(), main(), Thresholds

### Community 135 - "cleancode-agent definition"
Cohesion: 0.29
Nodes (7): cleancode-agent definition, test-agent (referenced), cleancode-agent (invoked when done), frontend-agent definition, Reference to clean-code-agent.md, Reference to frontend-agent.md, Reference to AGENTS.md build pipeline

### Community 136 - "editor/tsconfig.json"
Cohesion: 0.29
Nodes (6): exclude, extends, include, api, src, vite.config.ts

### Community 137 - "lib"
Cohesion: 0.29
Nodes (7): lib, DOM, ES2020, esnext, lib, dom, dom.iterable

### Community 138 - "ADR 0006: DocumentRepository port + IndexedDB adapter"
Cohesion: 0.29
Nodes (7): ADR 0006: DocumentRepository port + IndexedDB adapter, ADR 0007: Local-first persistence model, Local-first software, Repository pattern + Ports & Adapters, Roadmap: sound editor -> sprite editor -> shared asset layer -> scene builder, Options A/B/C tradeoffs for audio asset storage, Recommendation: IndexedDB + bounded cache behind repository interface

### Community 139 - "2026-10-11 — Resizing a sprite without losing its layers"
Cohesion: 0.29
Nodes (6): 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What was researched

### Community 140 - "core/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, extends, include, src-ts/**/*.ts

### Community 141 - "Four-step dark ladder palette"
Cohesion: 0.33
Nodes (6): DESIGN.md vs tokens.css conflict note, Accent token system, AI accent (violet) reserved for AI surfaces, Four-step dark ladder palette, Blue-tinted neutral surfaces rationale, --pf-* CSS custom properties

### Community 142 - "useQualitySamplePreview.hook.ts"
Cohesion: 0.40
Nodes (5): AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS, AI_QUALITY_SAMPLE_PROMPT, QualitySamplePreviewProps, UseQualitySamplePreviewParams, QualityTierConfig

### Community 143 - "GridBackground.tsx"
Cohesion: 0.53
Nodes (5): SPRITE_EDITOR_COLORS, hexToRgba(), getDrawOffset(), GridBackground(), renderCheckerboardToCanvas()

### Community 144 - "node_modules"
Cohesion: 0.33
Nodes (5): exclude, exclude, pkg, exclude, node_modules

### Community 145 - "ADR 0002: Single dispatch(cmd) seam; core owns the document"
Cohesion: 0.33
Nodes (6): ADR 0002: Single dispatch(cmd) seam; core owns the document, D4: dirty-rect before/after patches, stable-id addressing, core/commands.ts module, core/history.ts module, src-ts/ts-core.ts module, Dirty-rect, not deep-clone, undo history

### Community 146 - "wasm-bindgen Copy-In/Copy-Out Mechanism"
Cohesion: 0.33
Nodes (6): Phase 4 Wasm vs TS Kernel Bench (Near-Memcpy Loss), Phase 7g Store-Loop Bench Result (Wasm Slower Unbatched), Wasm Artifact Size Budget Requirement, Batching Amortizes the Fixed Per-Call Cost, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 147 - "D6: Flat Rust API, No Serde Decision"
Cohesion: 0.33
Nodes (6): D6: Flat Rust API, No Serde Decision, D7: Wasm-Memory-Backed Views Decision, Rust Document Struct, Option/Result at the FFI Boundary, Owning Data in Wasm Memory vs Copying Out, Slices and Bounds-Checking

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

### Community 153 - "Stage 6: Publishing to AWS (planned)"
Cohesion: 0.50
Nodes (4): Stage 4: Assets (planned), Stage 5: Game building (planned), Stage 6: Publishing to AWS (planned), Stage 7: Operations (planned)

### Community 154 - "Infinite Canvas pattern"
Cohesion: 0.67
Nodes (3): Core rules summary, Infinite Canvas pattern, ResizeObserver canvas resize handling

### Community 155 - "YouTube/Netflix MPEG-DASH/HLS precedent"
Cohesion: 0.67
Nodes (3): Chunking / segmentation, HTTP adaptive streaming (HLS, MPEG-DASH), YouTube/Netflix MPEG-DASH/HLS precedent

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **730 isolated node(s):** `BucketStats`, `UseTweakSliderParams`, `PresetCategory`, `ElevenLabsMode`, `RequestBody` (+725 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 968 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **77 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `FOCUS_RING` connect `focus-ring.ts` to `BottomPanel.tsx`, `TopBar.tsx`, `types/audio.ts`, `useSoundDetailHeader.hook.ts`, `constants/timeline-view.ts`, `useDeleteAccountDialog.hook.ts`, `DISABLED_STATE`, `useVariationsPanel.hook.ts`, `types/timeline.ts`, `motion.ts`, `Transport.tsx`, `LoginPage.tsx`, `PropertiesTab.tsx`, `useSoundsStore`, `SpriteEditorLayout.tsx`, `LibrarySidebar.tsx`, `useSettingsPanel.hook.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `MOTION` connect `motion.ts` to `BottomPanel.tsx`, `TopBar.tsx`, `useSoundDetailHeader.hook.ts`, `useDeleteAccountDialog.hook.ts`, `DISABLED_STATE`, `useVariationsPanel.hook.ts`, `focus-ring.ts`, `types/timeline.ts`, `Transport.tsx`, `LoginPage.tsx`, `useSoundsStore`, `SpriteEditorLayout.tsx`, `LibrarySidebar.tsx`, `useSettingsPanel.hook.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `useSoundsStore` connect `useSoundsStore` to `timeline-ops.ts`, `types/audio.ts`, `constants/timeline-view.ts`, `sound-library.ts`, `types/timeline.ts`, `focus-ring.ts`, `timeline-shortcuts.ts`, `useCreateSound.hook.ts`, `useSoundDetailHeader.hook.ts`, `timeline-player.ts`, `DISABLED_STATE`, `sound-timeline.slice.ts`, `LibrarySidebar.tsx`, `TimelineEditor.tsx`, `useDescribeWithAI.hook.ts`, `tweak-mapping.test.ts`, `useVariationsPanel.hook.ts`, `useDropZone.hook.ts`, `Transport.tsx`, `useTimelineShortcuts.hook.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `BucketStats`, `UseTweakSliderParams`, `PresetCategory` to the rest of the system?**
  _730 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Should `createEmptyBuffer` be split into smaller, more focused modules?**
  _Cohesion score 0.06138975966562173 - nodes in this community are weakly interconnected._