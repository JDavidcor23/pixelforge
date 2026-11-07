# Graph Report - pixelforge  (2026-11-07)

## Corpus Check
- 642 files · ~355,469 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .toml 2)

## Summary
- 4191 nodes · 10539 edges · 270 communities (180 shown, 90 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 142 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ae1d096`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- createEmptyBuffer
- ai-generation.ts
- wasm-pixel-core.differential.fuzz.test.ts
- timeline-ops.ts
- server-animation-sync.ts
- useSoundsStore
- ts-core.judgment-day-round2.test.ts
- index.tsx
- animation.ts
- useSoundDetailHeader.hook.ts
- mod.rs
- TimelineTracks.tsx
- animation-job-ledger.ts
- constants/index.ts
- WasmDocument
- src/types/index.ts
- pixellab-job.ts
- useEditorUIStore
- pixel-core.ts
- ColorPicker.tsx
- PixelKernels
- sound-assets.ts
- useCanvasInteraction.hook.ts
- useSpriteEditorStore
- LoginPage.tsx
- types/audio.ts
- constants/timeline-view.ts
- TopBar.tsx
- useAnimateTab.hook.ts
- mascot-scene-state.ts
- animate.ts
- history.rs
- pixellab-animate-harness.ts
- useImportSpriteSheet.hook.ts
- devDependencies
- LeftSidebar.tsx
- audio-encoder.ts
- sound-library.ts
- useTimelinePlayback.hook.ts
- lib/timeline-view.ts
- useTopBar.hook.ts
- indexeddb-asset-library.repository.service.ts
- useLayerPanel.hook.ts
- tsKernels
- src-ts/ts-core.ts
- prefs.store.ts
- AssetTypeSelector.tsx
- 0014 — Build screen: chat + live Phaser preview, one asset catalog
- useDeleteAccountDialog.hook.ts
- focus-ring.ts
- downscale.rs
- useGenerateSound.hook.ts
- useAssetsPanel.hook.ts
- sound-timeline.slice.ts
- animation.types.ts
- mascot-scene.ts
- Document
- Vec
- animation-limits.ts
- quantize.rs
- dependencies
- pixellab-animation.service.ts
- LibrarySidebar.tsx
- collect-ai-jobs/index.ts
- types/audio.ts
- PixelForge IA (AGENTS.md)
- assets.store.ts
- WasmPixelCore
- audio-engine.ts
- useSoundList.hook.ts
- audio-slices.ts
- useBottomToolbar.hook.ts
- useCreateSound.hook.ts
- persistence.ts
- mascot-city.ts
- tokens/package.json
- document-persistence.controller.ts
- Deferred: scaling the sound editor
- useColorPicker.hook.ts
- scripts
- generation-history.ts
- DocumentRepository
- DocumentRepository port
- Synthetic Architect design system
- scripts
- core/ts-core.ts
- commands.ts
- Animation flow (PixelLab)
- include
- Zustand store (diagram node)
- Five-phase scaling plan
- Phase 7: Rust Document/History
- edit-history Capability
- core/package.json
- build-wasm.mjs
- pixel-core Capability
- file-menu.ts
- RgbaColor
- Sprite flow
- apps/editor/api/ai/ functions
- Phase 5: Rust Flood-Fill
- AssetType
- compilerOptions
- open-library-item.test.ts
- Handoff 2 of 2 — give attack animations their own model
- document-persistence.controller.assets.test.ts
- devDependencies
- Phase 4: packages/core Rust Scaffold
- wasm-document-core.test.ts
- kernels.ts
- vitest
- mascot-font.ts
- edit-history Capability
- 2026-10-28 — Every sprite is a file from the moment you create it
- useSaveIndicator.hook.ts
- compilerOptions
- PixelForge Architecture Overview
- WasmPixelCore (diagram node, behind flag)
- bindings.rs (diagram node, only wasm-bindgen boundary)
- PixelCore
- useDocumentPersistence.hook.ts
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
- useCanvasOverlay.hook.ts
- src-ts/index.ts
- check-bench.ts
- cleancode-agent definition
- 0012 — Preset motion text is the editable action field, not hidden boilerplate
- 2026-10-15 — When "just add a note" quietly breaks your own animation
- build-level.md
- 2026-10-11 — Resizing a sprite without losing its layers
- core/tsconfig.json
- 0013 — Each motion preset picks its PixelLab animation model
- auth.service.ts
- TweakPanel.tsx
- mascot.types.ts
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
- @pixelforge/tokens@workspace:*
- color-utils.ts
- 0010 — The canvas is always a named Assets item
- store-loop.bench.ts
- bench/flood-fill.bench.ts
- 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go
- PixelForge IA — Vision and milestones
- index.test.ts
- useSettingsPanel.hook.ts
- @vitest/ui@^4.1.4
- Handoff 1 of 2 — merge `feat/animation-editing` into `master`
- timeline-schedule.ts
- installFakeDom
- Build screen architecture — study notes
- konva@^10.2.5
- use-image@^1.1.4
- vite-plugin-wasm@^3.6.0
- core.slice.real-trap.test.ts
- doc.resize command
- Phased Migration Approach (0-7)
- Four-step dark ladder palette
- .from_payload
- react-konva@^19.2.3
- clear-local-sprite-data.service.test.ts
- wasm-pixel-core.undo-memory.baseline.test.ts
- export-utils.ts
- document-persistence.controller.test.ts
- document-persistence.controller.wasm-gate.test.ts
- ADR 0006: DocumentRepository port + IndexedDB adapter
- import-library-image.ts
- ADR 0002: Single dispatch(cmd) seam; core owns the document
- D6: Flat Rust API, No Serde Decision
- Stage 6: Publishing to AWS (planned)

## God Nodes (most connected - your core abstractions)
1. `useSpriteEditorStore` - 96 edges
2. `useSoundsStore` - 89 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 69 edges
5. `MOTION` - 63 edges
6. `Document` - 52 edges
7. `useEditorUIStore` - 44 edges
8. `putPixel()` - 40 edges
9. `WasmDocument` - 38 edges
10. `PixelBuffer` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Context` --references--> `useTimeline()`  [INFERRED]
  docs/adr/0014-build-screen-chat-preview-and-asset-catalog.md → apps/editor/src/sprites/hooks/useSpriteEditorStore.hook.ts
- `Decision` --references--> `EditorLayout()`  [INFERRED]
  docs/adr/0014-build-screen-chat-preview-and-asset-catalog.md → apps/editor/src/components/EditorLayout/EditorLayout.tsx
- `Log` --references--> `clearLocalSpriteData()`  [INFERRED]
  odd/tasks/sprite-asset-deep-link.md → apps/editor/src/services/clear-local-sprite-data.service.ts
- `Log` --references--> `DocumentId`  [INFERRED]
  odd/tasks/sprite-asset-deep-link.md → apps/editor/src/types/document.ts
- `Log` --references--> `DocumentRepository`  [INFERRED]
  odd/tasks/sprite-asset-deep-link.md → apps/editor/src/types/document.ts

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

## Communities (270 total, 90 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.12
Nodes (35): doc_replace_rejects_a_huge_frame_count_on_a_zero_sized_canvas_instead_of_attempting_a_multi_gb_allocation(), doc_replace_rejects_mismatched_buffer_length(), doc_replace_swaps_canvas_and_is_undoable(), doc_resize_1x1_edge_case_round_trips(), doc_resize_evicts_nothing_ids_never_change(), doc_resize_growing_costs_zero_history_bytes_and_pads_transparent(), doc_resize_mixed_wider_but_shorter_only_cuts_the_bottom_strip(), doc_resize_redo_reapplies_the_deterministic_crop() (+27 more)

### Community 1 - "createEmptyBuffer"
Cohesion: 0.07
Nodes (62): TRANSPARENT_COLOR, makeFullBuffer(), DocReplaceFrameInput, px(), StrokeState, BucketStats, dominantColor(), downscalePixels() (+54 more)

### Community 2 - "ai-generation.ts"
Cohesion: 0.05
Nodes (40): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES, clampSize() (+32 more)

### Community 3 - "wasm-pixel-core.differential.fuzz.test.ts"
Cohesion: 0.09
Nodes (21): setIdSeed(), here, makeDoc(), pkgAvailable, pkgDir, RED, STROKE_POINTS, wasmJsPath (+13 more)

### Community 4 - "timeline-ops.ts"
Cohesion: 0.07
Nodes (62): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_VOLUME, GAIN_DB_MAX, GAIN_DB_MIN (+54 more)

### Community 5 - "server-animation-sync.ts"
Cohesion: 0.13
Nodes (22): AI_JOB_FRAME_EXTENSION, AI_JOB_FRAME_INDEX_PAD, ANIMATION_PIPELINE_VERSION, createSyncDeps(), ADR-0009, useServerAnimationSync(), buildServerAnimationAsset(), planServerAnimationSync() (+14 more)

### Community 6 - "useSoundsStore"
Cohesion: 0.12
Nodes (21): DEFAULT_VOLUME, VOLUME_RANGE, TIMELINE_TIPS, TIP_NOTICE_DURATION_MS, LibrarySearch(), useLibrarySearch(), TimelineToolbar(), useTimelineToolbar() (+13 more)

### Community 7 - "ts-core.judgment-day-round2.test.ts"
Cohesion: 0.08
Nodes (48): packPoints(), packRgba(), RGBA_BYTE_SHIFT, frameToSerializedFrame(), layerToSerializedLayer(), CoreState, createCoreState(), currentActiveLayerId() (+40 more)

### Community 8 - "index.tsx"
Cohesion: 0.07
Nodes (40): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+32 more)

### Community 9 - "animation.ts"
Cohesion: 0.06
Nodes (53): handler(), json(), ANIMATION_BUSY_MESSAGE, ANIMATION_CANCEL_HINT, ANIMATION_CANCEL_LABEL, ANIMATION_CHECK_AGAIN_LABEL, ANIMATION_DISCARD_HINT, ANIMATION_DISCARD_LABEL (+45 more)

### Community 10 - "useSoundDetailHeader.hook.ts"
Cohesion: 0.11
Nodes (30): NAME_VISIBLE_TAIL_LENGTH, audioBufferCache, buffers, decodeFromUrl(), inflight, downloadBlob(), buildUniqueName(), formatDuration() (+22 more)

### Community 11 - "mod.rs"
Cohesion: 0.08
Nodes (44): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+36 more)

### Community 12 - "TimelineTracks.tsx"
Cohesion: 0.15
Nodes (15): DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, TRACK_COLOR, TRACK_KIND_ICON, TRACK_KIND_OPTIONS, AddTrackRow(), useAddTrackRow(), TimelineClip (+7 more)

### Community 13 - "animation-job-ledger.ts"
Cohesion: 0.11
Nodes (44): ANIMATION_RECOVER_FAILED_PREFIX, ANIMATION_RECOVER_PROCESSING_STATE, ANIMATION_RECOVER_SUCCESS_NOTICE, ANIMATION_RECOVER_UNREACHABLE_STATE, ANIMATION_JOB_LEDGER_SETTLED_LIMIT, createLedgerRecoverDeps(), saveAnimationToAssets(), useAnimationJobRecovery() (+36 more)

### Community 14 - "constants/index.ts"
Cohesion: 0.06
Nodes (48): AI_QUALITY_SAMPLE_NATIVE_SIZE, AI_QUALITY_SAMPLE_SEED, AI_QUALITY_SAMPLE_SRC, AI_SPRITE_DEFAULT_SIZE, AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE, AI_SPRITE_SIZES, ALPHA_TRANSPARENT_THRESHOLD, ASSET_LIBRARY_IMPORT_ACCEPT (+40 more)

### Community 15 - "WasmDocument"
Cohesion: 0.08
Nodes (8): clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill(), quantize(), WasmDocument

### Community 16 - "src/types/index.ts"
Cohesion: 0.08
Nodes (41): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_PALETTE, SPRITE_EDITOR_TIMELINE, getDrawOffset(), renderPixelsToCanvas(), RenderPixelsToCanvasOptions, screenToPixel(), HistoryPatch (+33 more)

### Community 17 - "pixellab-job.ts"
Cohesion: 0.17
Nodes (14): PIXELLAB_INPUT_FRAME_INDEX, PIXELLAB_JOB_FAILED_ERROR, PIXELLAB_NO_FRAMES_ERROR, describeDetail(), isFiniteNumber(), KNOWN_STATES, mapPixelLabJob(), PNG_SIGNATURE (+6 more)

### Community 18 - "useEditorUIStore"
Cohesion: 0.12
Nodes (39): BOTTOM_PANEL_TABS, DEFAULT_QUALITY_TIER, INSPECTOR_TABS, QUALITY_RECOMMENDATION_BY_ASSET_TYPE, RESIZABLE_PANELS, useBottomPanel(), useSpriteEditorLayout(), useCreateTab() (+31 more)

### Community 19 - "pixel-core.ts"
Cohesion: 0.05
Nodes (42): getPixelCoreEnvOverride(), Command, DispatchResult, isPixelCoreImpl(), PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, readEnvOverride(), readLocalStorageOverride() (+34 more)

### Community 20 - "ColorPicker.tsx"
Cohesion: 0.18
Nodes (11): COLOR_PICKER, ColorInputs(), ColorInputsProps, HueSlider(), HueSliderProps, useHueSlider(), UseHueSliderParams, SaturationValueSquare() (+3 more)

### Community 21 - "PixelKernels"
Cohesion: 0.07
Nodes (21): here, source, wasmPath, here, wasmPath, here, sourceCanvas, wasmPath (+13 more)

### Community 22 - "sound-assets.ts"
Cohesion: 0.09
Nodes (32): FALLBACK_SOUND_NAME, LONG_DURATION_DECIMALS, LONG_DURATION_THRESHOLD_S, SECONDS_PER_HOUR, SECONDS_PER_MINUTE, TAG_TO_MODE, TIME_DECIMALS, TWEAK_REGENERATE_DEBOUNCE_MS (+24 more)

### Community 23 - "useCanvasInteraction.hook.ts"
Cohesion: 0.10
Nodes (37): CANVAS_SIZE_OPTIONS, SPRITE_EDITOR_KEYBOARD, ADR-0008, useCanvasSizePopover(), CanvasArea(), getDrawOffset(), GridOverlay(), GridOverlayProps (+29 more)

### Community 24 - "useSpriteEditorStore"
Cohesion: 0.14
Nodes (34): SPRITE_EDITOR_STORAGE_KEY, TimelineBar(), getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useCopySelectedFrames() (+26 more)

### Community 25 - "LoginPage.tsx"
Cohesion: 0.10
Nodes (30): App(), BuildScreen, ADR-0014, AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, useAuthForm() (+22 more)

### Community 26 - "types/audio.ts"
Cohesion: 0.10
Nodes (29): DEFAULT_DECAY_SHARE, TWEAK_PARAMS, TWEAK_RANGES, TWEAK_SLIDER, applyTweak(), clamp(), fromPosition(), Range (+21 more)

### Community 27 - "constants/timeline-view.ts"
Cohesion: 0.08
Nodes (35): SOUND_NAME_MAX_LENGTH, WAV_EXTENSION, ALT_KEY, ALT_KEY_LABEL, GAIN_SMOOTHING_S, MAC_PLATFORM_PATTERN, MIX_EXPORT, MOD_KEY (+27 more)

### Community 28 - "TopBar.tsx"
Cohesion: 0.16
Nodes (17): ModalPortal(), ModalPortalProps, Z_INDEX, ResizeHandle(), ResizeHandleProps, useResizeHandle(), AccountMenu(), getInitial() (+9 more)

### Community 29 - "useAnimateTab.hook.ts"
Cohesion: 0.07
Nodes (37): ANIMATION_ALREADY_RUNNING_ERROR, ANIMATION_ELAPSED_TICK_MS, ANIMATION_GENERATING_HINT, ANIMATION_GENERATING_LABEL, ANIMATION_HINT_SEPARATOR, ANIMATION_POLL_INTERVAL_MS, ANIMATION_POLL_MAX_CONSECUTIVE_ERRORS, ANIMATION_POLL_TIMEOUT_MS (+29 more)

### Community 30 - "mascot-scene-state.ts"
Cohesion: 0.08
Nodes (45): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_BOLT_Y_OFFSET, GROUND_ENEMY (+37 more)

### Community 31 - "animate.ts"
Cohesion: 0.06
Nodes (44): describeDetail(), handler(), json(), PixelLabSubmitResponse, readEnv(), recordServerJob(), validBody, AI_JOB_ASSET_TYPE_MAX_LENGTH (+36 more)

### Community 32 - "history.rs"
Cohesion: 0.15
Nodes (20): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+12 more)

### Community 33 - "pixellab-animate-harness.ts"
Cohesion: 0.11
Nodes (22): DEFAULT_ANIMATION_MODEL, PIXELLAB_ANIMATE_PATHS, buildAnimationAction(), args, BackgroundJob, Base64Image, benchmarkable, CaseResult (+14 more)

### Community 34 - "useImportSpriteSheet.hook.ts"
Cohesion: 0.09
Nodes (35): IMPORT_SPRITE_SHEET_ERRORS, SPRITE_ANIMATION, SPRITE_IMPORT_MAX_FRAMES, SPRITE_IMPORT_MAX_NATIVE_SIZE, decodeSheet(), decodeSingle(), FILE_READERS, isValidFrameCount() (+27 more)

### Community 35 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, fake-indexeddb@^6.2.5, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^20, @types/react@^19, typescript@^5, vite@^6.3.0 (+10 more)

### Community 36 - "LeftSidebar.tsx"
Cohesion: 0.27
Nodes (6): LeftSidebar(), LayerItem(), LayerItemProps, useLayerItem(), UseLayerItemProps, LayerPanel()

### Community 37 - "audio-encoder.ts"
Cohesion: 0.33
Nodes (6): createAudioObjectUrl(), encodeWav(), floatToInt16(), MockAudioBuffer, writeString(), writeWavHeader()

### Community 38 - "sound-library.ts"
Cohesion: 0.11
Nodes (25): IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES, MINI_WAVE, MINI_WAVE_BAR_COUNT, NEW_SOUND_AUTOFOCUS, PLACEHOLDER_PEAKS, SEEK_STEP_S (+17 more)

### Community 39 - "useTimelinePlayback.hook.ts"
Cohesion: 0.11
Nodes (23): TIME_EPSILON, loadClipBuffers(), timelineDuration(), resolveTimelineShortcut(), formatClock(), pad2(), ClipInspector(), TimelineEditor() (+15 more)

### Community 40 - "lib/timeline-view.ts"
Cohesion: 0.08
Nodes (44): SNAP_GRID_SECONDS, CLIP_WAVE, CLOCK_CENTISECONDS, PLAYHEAD_LARGE_STEP_MULTIPLIER, RULER_LABEL_MAX_DECIMALS, RULER_MAJOR_STEPS, RULER_MIN_MAJOR_SPACING_PX, RULER_MINOR_DIVISIONS (+36 more)

### Community 41 - "useTopBar.hook.ts"
Cohesion: 0.18
Nodes (16): DUPLICATE_ERRORS, DUPLICATE_NAME_SUFFIX, FILE_MENU_ENTRY_KIND, FILE_MENU_LABELS, buildFileMenuEntries(), duplicateDefaultName(), isMenuDismissKey(), isOutsideMenu() (+8 more)

### Community 42 - "indexeddb-asset-library.repository.service.ts"
Cohesion: 0.16
Nodes (11): ASSET_ANIMATIONS_STORE, ASSET_DB_NAME, ASSET_DB_VERSION, ASSET_GENERATIONS_STORE, useAssetLibraryPersistence(), AssetLibraryDB, createIndexedDbAssetLibraryRepository(), StoreName (+3 more)

### Community 43 - "useLayerPanel.hook.ts"
Cohesion: 0.28
Nodes (11): useLeftSidebar(), useLayerPanel(), useActiveLayerId(), useAddLayer(), useLayersMetadata(), useRemoveLayer(), useReorderLayers(), useSetActiveLayer() (+3 more)

### Community 44 - "tsKernels"
Cohesion: 0.12
Nodes (12): coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require, wasmPath, here (+4 more)

### Community 45 - "src-ts/ts-core.ts"
Cohesion: 0.14
Nodes (26): buildPalette(), CHANNELS, diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect() (+18 more)

### Community 46 - "prefs.store.ts"
Cohesion: 0.11
Nodes (22): SPRITE_EDITOR_CANVAS, SPRITE_EDITOR_VIEWPORT, PREFS_STORAGE_KEY, CanvasOverlay(), useCanvasOverlay(), useColorInputs(), UseColorInputsParams, useCursorPixel() (+14 more)

### Community 47 - "AssetTypeSelector.tsx"
Cohesion: 0.21
Nodes (9): ASSET_FOLDERS, BottomPanel(), ICON_MAP, AssetFolderTree(), AssetFolderTreeProps, ICON_MAP, AssetGrid(), AssetsPanel() (+1 more)

### Community 48 - "0014 — Build screen: chat + live Phaser preview, one asset catalog"
Cohesion: 0.07
Nodes (25): 0014 — Build screen: chat + live Phaser preview, one asset catalog, Consequences, Context, D1. Where the screen lives, D2. Game loop vs React, D3. Who owns the asset list, D4. Editing from the Biblioteca, Decision (+17 more)

### Community 49 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.13
Nodes (21): DeleteAccountDialog(), DeleteAccountDialogProps, getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, AccountDeletedNotice(), useAccountDeletedNotice(), EditorLayout() (+13 more)

### Community 50 - "focus-ring.ts"
Cohesion: 0.10
Nodes (27): GoogleButtonProps, GoogleIcon(), DISABLED_STATE, FOCUS_RING, MOTION, TONE_CLASSES, DescribeWithAISection(), ImportRow() (+19 more)

### Community 51 - "downscale.rs"
Cohesion: 0.16
Nodes (18): alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color(), downscale() (+10 more)

### Community 52 - "useGenerateSound.hook.ts"
Cohesion: 0.19
Nodes (17): AI_KIND_OPTIONS, ELEVENLABS_DEFAULT_VOICE_ID, MODE_TO_TAG, MPEG_MIME_TYPE, ElevenLabsError, generateMusic(), generateSFX(), generateTTS() (+9 more)

### Community 53 - "useAssetsPanel.hook.ts"
Cohesion: 0.11
Nodes (21): DEFAULT_ASSET_TYPE, buildAssetLibraryItems(), ADR-0010, ADR-0011, downloadFromHref(), downloadJson(), DocumentAssetCommands, registerDocumentAssetCommands() (+13 more)

### Community 54 - "sound-timeline.slice.ts"
Cohesion: 0.19
Nodes (22): EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory(), withoutAsset() (+14 more)

### Community 55 - "animation.types.ts"
Cohesion: 0.06
Nodes (37): AI_JOBS_STORAGE_KEY, AIJobsState, IDLE_ANIMATE_JOB, IDLE_JOB, IDLE, IDLE_ANIMATE, PENDING, PROCESSING (+29 more)

### Community 56 - "mascot-scene.ts"
Cohesion: 0.16
Nodes (22): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+14 more)

### Community 57 - "Document"
Cohesion: 0.20
Nodes (6): DirtyRect, DispatchResult, doc_resize_preserves_ids_and_metadata_across_multiple_frames_and_layers(), Document, frame_to_record(), layer_to_record()

### Community 58 - "Vec"
Cohesion: 0.12
Nodes (18): clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of(), Frame, frame_index_by_id(), frame_to_live(), full_dirty() (+10 more)

### Community 59 - "animation-limits.ts"
Cohesion: 0.10
Nodes (25): ANIMATION_FRAME_OPTIONS, ANIMATION_FRAMES_INVALID_ERROR, ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR, ANIMATION_FRAMES_OVER_BUDGET_ERROR, ANIMATION_NOT_SQUARE_ERROR, ANIMATION_TOO_LARGE_ERROR, PIXELLAB_MAX_FRAMES, PIXELLAB_MAX_SIZE (+17 more)

### Community 60 - "quantize.rs"
Cohesion: 0.24
Nodes (17): alpha_threshold_boundary_is_inclusive_on_the_high_side(), build(), build_palette(), Centroid, colors_zero_still_yields_one_centroid_not_zero(), dist2(), keeps_fully_transparent_pixels_transparent(), nearest() (+9 more)

### Community 61 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, colord@^2.9.3, idb@^8.0.4, lucide-react@^1.8.0, phaser@4.2.1, @pixelforge/core@workspace:*, react@19.2.4, react-router-dom@^7.1.1 (+9 more)

### Community 62 - "pixellab-animation.service.ts"
Cohesion: 0.12
Nodes (16): ANIMATION_GENERIC_ERROR, PIXELLAB_ANIMATE_ROUTE, PIXELLAB_JOB_ROUTE, AnimationProviderError, ADR-0009, createPixelLabAnimationProvider(), KNOWN_SERVER_ERROR_CODES, readJson() (+8 more)

### Community 63 - "LibrarySidebar.tsx"
Cohesion: 0.13
Nodes (15): LIBRARY_FILTERS, SoundEditorLayout(), DeleteSoundDialog(), LibraryEmptyState(), LibraryEmptyStateProps, LibraryFilters(), useLibraryFilters(), LibrarySidebar() (+7 more)

### Community 64 - "collect-ai-jobs/index.ts"
Cohesion: 0.15
Nodes (18): Admin, AiJobRow, assetName(), collectOne(), decodeBase64(), describeDetail(), fetchPixelLabJob(), frameFileName() (+10 more)

### Community 65 - "types/audio.ts"
Cohesion: 0.06
Nodes (43): ADSR_DEFAULTS, ADSR_LIMITS, ADSR_VIEW, ELEVENLABS_API_TIMEOUT, FILTER_DEFAULTS, FILTER_LIMITS, FILTER_TYPES, GENERATION_HISTORY_LIMIT (+35 more)

### Community 66 - "PixelForge IA (AGENTS.md)"
Cohesion: 0.12
Nodes (18): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), apps/editor, apps/landing, packages/core (Rust/Wasm), packages/tokens (+10 more)

### Community 67 - "assets.store.ts"
Cohesion: 0.08
Nodes (30): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, GENERATION_HISTORY_STORAGE_KEY, ASSET_LIBRARY_LIMIT, isNonEmptyString(), isPngDataUri(), isPositiveFiniteNumber(), normalizeAnimation() (+22 more)

### Community 68 - "WasmPixelCore"
Cohesion: 0.16
Nodes (4): DispatchResult, clampRectToCanvas(), decodeNames(), WasmPixelCore

### Community 69 - "audio-engine.ts"
Cohesion: 0.13
Nodes (19): AudioEngine, buildSynthChain(), calculateDefaultDuration(), createWhiteNoiseBuffer(), mapFilterType(), msToSec(), createMockAnalyserNode(), createMockAudioBuffer() (+11 more)

### Community 70 - "useSoundList.hook.ts"
Cohesion: 0.13
Nodes (21): DELETE_SOUND_KEYS, SOUND_KIND_LABELS, ADD_TO_TIMELINE_KEY, FILES_DRAG_TYPE, OPEN_SOUND_KEY, useSoundEditorLayout(), filterAssets(), getRowAssetId() (+13 more)

### Community 71 - "audio-slices.ts"
Cohesion: 0.16
Nodes (21): CLIP_KEY_SHORTCUTS, clipBarCount(), clipPeaks(), waveBars(), ClipWave(), ClipWaveProps, useClipWave(), TimelineClipProps (+13 more)

### Community 72 - "useBottomToolbar.hook.ts"
Cohesion: 0.22
Nodes (12): SPRITE_EDITOR_TOOLS, BottomToolbar(), useBottomToolbar(), ICON_MAP, ToolButton(), ToolButtonProps, useOnionSkinEnabled(), useSetShowGrid() (+4 more)

### Community 73 - "useCreateSound.hook.ts"
Cohesion: 0.15
Nodes (20): DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, PRESET_PREVIEW_DEBOUNCE_MS, PRESET_PREVIEW_DURATION_S, PRESET_TILES, PROMPT_SLUG_MAX_LENGTH, VARIATION_NAME_SUFFIX, WAV_MIME_TYPE (+12 more)

### Community 74 - "persistence.ts"
Cohesion: 0.15
Nodes (16): DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_STORE_NAME, LOCAL_DRAFT_DOCUMENT_ID, ADR-0015, draft(), payloadWithAlpha(), createInMemoryDocumentRepository() (+8 more)

### Community 75 - "mascot-city.ts"
Cohesion: 0.21
Nodes (14): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+6 more)

### Community 76 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 77 - "document-persistence.controller.ts"
Cohesion: 0.17
Nodes (22): SPRITE_EDITOR_LAYER, waitForWasmModule(), blankDocument(), createUntitledSprite(), documentFromPixels(), documentHasContent(), documentPreview(), flattenDocumentFrame() (+14 more)

### Community 78 - "Deferred: scaling the sound editor"
Cohesion: 0.20
Nodes (9): Deferred: scaling the sound editor, docs/architecture/scalable-assets-research.md (cited), Scaling triggers, Cancel an in-flight AI generation, How to build it, What, What it affects, Why it waited (+1 more)

### Community 79 - "useColorPicker.hook.ts"
Cohesion: 0.24
Nodes (13): rgbaToHex(), ColorPalette(), useColorPalette(), ActiveColorType, hexToRgba(), rgbaToHex(), useColorPicker(), usePalette() (+5 more)

### Community 80 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 81 - "generation-history.ts"
Cohesion: 0.26
Nodes (11): GENERATION_HISTORY_LIMIT, ASSET_TYPES, isAssetType(), isFiniteNumber(), isGenerationKind(), isNonEmptyString(), isPngDataUri(), normalizeGeneration() (+3 more)

### Community 82 - "DocumentRepository"
Cohesion: 0.18
Nodes (8): LEGACY_SPRITE_EDITOR_STORAGE_KEY, DocumentPersistenceDeps, migrateLegacyDraft(), GREEN, legacyLayer(), legacyRaw(), RED, DocumentRepository

### Community 83 - "DocumentRepository port"
Cohesion: 0.18
Nodes (7): AI-assisted sprites, docs/ARCHITECTURE.md, DocumentRepository port, PixelForge IA (root README), Roadmap, Sound editor feature, Sprite editor feature

### Community 84 - "Synthetic Architect design system"
Cohesion: 0.18
Nodes (13): clean-code-agent, design-agent, frontend-agent, graphify knowledge graph rules, CLAUDE.md (root), src/constants/COLORS.ts (canvas mirror), Component conventions, src/app/globals.css (source of truth) (+5 more)

### Community 85 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, bench, build, dev, preview, test, test:watch, typecheck

### Community 86 - "core/ts-core.ts"
Cohesion: 0.07
Nodes (61): unpackRgba(), bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory(), entryBytes(), History (+53 more)

### Community 87 - "commands.ts"
Cohesion: 0.24
Nodes (9): DirtyRect, FrameId, LayerId, LayerMetaPatch, LayerRef, SerializedFrame, SerializedLayer, ADR-0008 (+1 more)

### Community 88 - "Animation flow (PixelLab)"
Cohesion: 0.14
Nodes (18): Animation flow (PixelLab), buildAnimationAction, PixelLab animation adapter, ANIMATION_HARNESS motion catalogue, AnimationProvider port, Async job pattern, buildAnimationAction, buildPrompt rules-first pattern (+10 more)

### Community 89 - "include"
Cohesion: 0.12
Nodes (15): compilerOptions, paths, plugins, target, exclude, extends, include, node_modules (+7 more)

### Community 90 - "Zustand store (diagram node)"
Cohesion: 0.22
Nodes (9): packages/tokens, apps/landing (diagram node), DocumentRepository port (diagram node), Hooks layer (diagram node), IndexedDB adapter (diagram node, DEFAULT), packages/tokens (diagram node), Supabase project sync (diagram node, planned), UI layer (diagram node) (+1 more)

### Community 91 - "Five-phase scaling plan"
Cohesion: 0.29
Nodes (7): ADR 0006 (sprite drafts repository, cited), Audio chunking (10s segments), List virtualization, LRU cache + memory budget, Five-phase scaling plan, Repository pattern for audio persistence, Windowed rendering export

### Community 92 - "Phase 7: Rust Document/History"
Cohesion: 0.21
Nodes (8): PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, Phase 7: Rust Document/History, Document: Stateful Struct, Not Stateless Function, A Wasm Trap Poisons the Whole Object, wasm32 usize Is 32 Bits (Overflow Risk)

### Community 93 - "edit-history Capability"
Cohesion: 0.17
Nodes (10): Command Union Type, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), edit-history Capability, Bounded History Retention Requirement, Bounded Undo Memory Requirement, Command-Based Mutation Requirement, Undo/Redo Correctness Requirement (+2 more)

### Community 94 - "core/package.json"
Cohesion: 0.10
Nodes (19): devDependencies, @types/node, typescript, vitest, exports, @types/node, typescript, vitest (+11 more)

### Community 95 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 96 - "pixel-core Capability"
Cohesion: 0.22
Nodes (8): Phase 0 TS Baseline Benchmarks, core-parity-gate Capability, pixel-core Capability, Baseline Benchmarks Recorded Before Porting, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Full Canvas Repaint Performance Requirement, Implementation-Agnostic Pixel Operations Requirement

### Community 97 - "file-menu.ts"
Cohesion: 0.10
Nodes (18): DIALOG_FOCUS_TRAP_KEY, DUPLICATE_COPY, DUPLICATE_FIELD_IDS, FILE_EXTENSION_PATTERN, FILE_MENU_COPY, FILE_MENU_DISMISS_KEY, FILE_MENU_ITEM_IDS, IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS (+10 more)

### Community 98 - "RgbaColor"
Cohesion: 0.09
Nodes (24): rowsToBuffer(), buildBuffer(), coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require (+16 more)

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
Cohesion: 0.10
Nodes (28): AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS, AI_QUALITY_SAMPLE_PROMPT, ASSET_TYPES, QUALITY_TIERS, AnimateTab(), AssetTypeSelectorProps, CreateTab(), GeneratePanel() (+20 more)

### Community 103 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 104 - "open-library-item.test.ts"
Cohesion: 0.19
Nodes (5): openLibraryItem(), animation, ADR-0015, ADR-0010, UseAssetTileParams

### Community 105 - "Handoff 2 of 2 — give attack animations their own model"
Cohesion: 0.29
Nodes (6): Evidence (benchmark 2026-10-18, wizard-128, 1.42 USD), Handoff 2 of 2 — give attack animations their own model, Open decisions for the owner (ask one at a time), Prompt to paste in the new conversation, What the owner wants (verbatim, 2026-10-18), Where it plugs in

### Community 106 - "document-persistence.controller.assets.test.ts"
Cohesion: 0.21
Nodes (8): decodedPixels, makeFakeStore(), payloadWithAlpha(), ADR-0015, DocumentPersistenceStoreApi, DocumentStatusSlice, DocStatus, SaveStatus

### Community 107 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 108 - "Phase 4: packages/core Rust Scaffold"
Cohesion: 0.33
Nodes (4): Wasm Artifact Size Budget Requirement, Batching Amortizes the Fixed Per-Call Cost, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 109 - "wasm-document-core.test.ts"
Cohesion: 0.24
Nodes (6): baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 110 - "kernels.ts"
Cohesion: 0.26
Nodes (11): isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels(), here, pkgAvailable, wasmPath, withRuntimeTrapFallback() (+3 more)

### Community 111 - "vitest"
Cohesion: 0.18
Nodes (8): UNTITLED_ASSET_NAME_PREFIX, ANIMATION_JOB_LEDGER_STORAGE_KEY, nextUntitledName(), ADR-0015, UNTITLED_NAME_PATTERN, NEW_ENTRY, storage, vitest

### Community 112 - "mascot-font.ts"
Cohesion: 0.21
Nodes (13): rgbaToString(), GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, drawGlyph(), drawGlyphGlow(), drawGlyphText() (+5 more)

### Community 113 - "edit-history Capability"
Cohesion: 0.25
Nodes (4): IndexedDbDocumentRepository Adapter, PixelKernels Interface, Local Draft Recovery Requirement, Phase 1: Flatten Buffer + IndexedDB Persistence

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

### Community 121 - "useDocumentPersistence.hook.ts"
Cohesion: 0.15
Nodes (14): DOCUMENT_AUTOSAVE_DEBOUNCE_MS, createAssetBinding(), NOOP_OPEN_ASSET_STORAGE, ADR-0015, useDocumentPersistence(), UseDocumentPersistenceResult, composeHorizontalSheet(), computeHorizontalSheetLayout() (+6 more)

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

### Community 126 - "useReferencePicker.hook.ts"
Cohesion: 0.15
Nodes (19): layersToBase64(), AssetGridProps, buildAssetReference(), buildCanvasReference(), canvasFrameReferenceLabel(), resolveAnimationReferenceImage(), ASSET, ADR-0011 (+11 more)

### Community 127 - "mascot-sprite.ts"
Cohesion: 0.16
Nodes (12): MascotScene(), useMascotScene(), UseMascotSceneResult, MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SCENE_SIZE, MASCOT_SPRITE_SIZE (+4 more)

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

### Community 132 - "useCanvasOverlay.hook.ts"
Cohesion: 0.14
Nodes (15): CURSOR_POSITION_FALLBACK, CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), ColorPicker, OpacitySlider(), OpacitySliderProps, PositionFields() (+7 more)

### Community 133 - "src-ts/index.ts"
Cohesion: 0.09
Nodes (40): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+32 more)

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
Cohesion: 0.17
Nodes (11): architecture-decision skill, 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Lessons, Resizing a sprite without losing its layers, Options and tradeoffs, Result, The problem (one paragraph, no jargon) (+3 more)

### Community 140 - "core/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, outDir, exclude, extends, include, node_modules, ../../tsconfig.base.json (+2 more)

### Community 141 - "0013 — Each motion preset picks its PixelLab animation model"
Cohesion: 0.33
Nodes (5): 0013 — Each motion preset picks its PixelLab animation model, Consequences, Context, Decision, Options

### Community 142 - "auth.service.ts"
Cohesion: 0.07
Nodes (26): getSupabaseAnonKey(), getSupabaseUrl(), isSupabaseConfigured(), DELETE_ACCOUNT_ERROR_CODE, AUDIO_STORAGE_BUCKET, supabase, deleteAccount(), DeleteAccountEnvelope (+18 more)

### Community 143 - "TweakPanel.tsx"
Cohesion: 0.21
Nodes (9): TransportProps, TweakPanel(), TweakPanelProps, TweakSlider(), TweakSliderProps, TweakSliderVariant, VARIANT_CLASSES, InspectorSlider() (+1 more)

### Community 144 - "mascot.types.ts"
Cohesion: 0.25
Nodes (7): BlasterBoltState, EnemyLifecycle, EnemyState, MascotHurtbox, MascotPose, MascotScenePhase, MascotSceneState

### Community 145 - "editor/package.json"
Cohesion: 0.18
Nodes (10): react-dom@19.2.4, babel-plugin-react-compiler@1.0.0, @types/react-dom@^19, license, name, private, version, babel-plugin-react-compiler (+2 more)

### Community 146 - "sprite-pipeline.ts"
Cohesion: 0.09
Nodes (33): QUANTIZE_DEFAULTS, ensureWasmResolving(), getActiveKernels(), getActiveKernelsAsync(), mockGetPixelCoreEnvOverride, buildPalette(), Centroid, dist2() (+25 more)

### Community 147 - "Animation motion detail"
Cohesion: 0.40
Nodes (4): Animation motion detail, Log, Specs, Tasks

### Community 148 - "build-game.ts"
Cohesion: 0.09
Nodes (15): BUILD_GAME, LEVEL_FORMAT, LEVEL_KEYS, LEVEL_SCENE, PLATFORMER, BUILD_PANEL_TAB_ITEMS, BUILD_PANEL_TABS, BUILD_SCREEN_COPY (+7 more)

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

### Community 238 - "color-utils.ts"
Cohesion: 0.29
Nodes (8): SPRITE_EDITOR_COLORS, hexToHsv(), hexToRgba(), hsvToHex(), getDrawOffset(), GridBackground(), renderCheckerboardToCanvas(), HsvColor

### Community 239 - "0010 — The canvas is always a named Assets item"
Cohesion: 0.20
Nodes (9): 0010 — The canvas is always a named Assets item, Consequences, Context, Decision, Implementation plan, Out of scope (this plan), Phase 1 — `Save As…` creates a named, typed Assets item, Phase 2 — Rename and recategorize an existing Assets item (+1 more)

### Community 240 - "store-loop.bench.ts"
Cohesion: 0.18
Nodes (9): here, makeDoc(), pkgAvailable, pkgDir, RED, SCENARIOS, STROKE_POINTS, wasmJsPath (+1 more)

### Community 241 - "bench/flood-fill.bench.ts"
Cohesion: 0.22
Nodes (4): here, mazePool, uniformPool, wasmPath

### Community 242 - "2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go"
Cohesion: 0.25
Nodes (7): 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What I decided and why, What I learned, What I researched

### Community 243 - "PixelForge IA — Vision and milestones"
Cohesion: 0.25
Nodes (7): Long-term vision, Method (from the Serudda video, 2026-10-24), Milestone 1 — From a text to a playable platformer, North-star use case, PixelForge IA — Vision and milestones, The plan (Freddy's format), Why this exists (the owner's pain)

### Community 244 - "index.test.ts"
Cohesion: 0.13
Nodes (14): DOCUMENT_SCHEMA_VERSION, timelineToDocumentPayload(), toStrokePoints, BLUE, GREEN, make2x2Buffer(), RED, setupWithSelection() (+6 more)

### Community 245 - "useSettingsPanel.hook.ts"
Cohesion: 0.18
Nodes (13): ApiKeyField(), ApiKeyFieldProps, useApiKeyField(), UseApiKeyFieldResult, SettingsPanelProps, useSettingsPanel(), UseSettingsPanelResult, API_KEY_HELP_URL (+5 more)

### Community 247 - "Handoff 1 of 2 — merge `feat/animation-editing` into `master`"
Cohesion: 0.40
Nodes (4): Handoff 1 of 2 — merge `feat/animation-editing` into `master`, Prompt to paste in the new conversation, Watch out (verified 2026-10-18), What to merge

### Community 248 - "timeline-schedule.ts"
Cohesion: 0.38
Nodes (7): dbToGain(), clipEnvelope(), fadeEnvelopeAt(), mixLength(), scheduleClips(), ClipScheduleEntry, GainPoint

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

### Community 256 - "Phased Migration Approach (0-7)"
Cohesion: 0.25
Nodes (8): Lossless Pixel Round-Trip Requirement, Dirty-Pair Cache-Refresh Contract, Judgment-Day Blind-Judge Review Process, Phase 0: Gates (CI, Scripts, Characterization Tests), Phase 4: packages/core Rust Scaffold, Phase 6: Rust Quantize/Downscale, f64 Is Bit-Identical to JS number, Hexagonal Split: Domain Module vs bindings.rs

### Community 257 - "Four-step dark ladder palette"
Cohesion: 0.33
Nodes (3): Accent token system, Four-step dark ladder palette, --pf-* CSS custom properties

### Community 258 - ".from_payload"
Cohesion: 0.28
Nodes (7): bounded_capacity(), encode_names(), from_payload_accepts_a_name_containing_a_literal_nul_byte(), from_payload_rejects_an_absurd_claimed_count_instead_of_attempting_a_multi_gb_allocation(), from_payload_rejects_mismatched_pixel_length(), from_payload_roundtrips_through_meta_doc_and_export_pixels(), new_ids_never_collide_with_pre_existing_handles_after_import()

### Community 260 - "clear-local-sprite-data.service.test.ts"
Cohesion: 0.36
Nodes (4): DRAFT_MIGRATION_ASSET_STORAGE_KEY, OPEN_SPRITE_ASSET_STORAGE_KEY, ClearLocalSpriteDataDeps, ResolvedDocumentRepository

### Community 261 - "wasm-pixel-core.undo-memory.baseline.test.ts"
Cohesion: 0.25
Nodes (7): here, makeDoc(), pkgAvailable, pkgDir, RED, wasmJsPath, wasmPath

### Community 262 - "export-utils.ts"
Cohesion: 0.62
Nodes (5): downloadCanvasAsPng(), exportFrameAsPng(), exportSpriteSheetAsPng(), renderLayersToCanvas(), useExport()

### Community 263 - "document-persistence.controller.test.ts"
Cohesion: 0.33
Nodes (5): DocumentPersistenceController, emptyPayload(), fakeStorage, makeFakeStore(), DocumentId

### Community 264 - "document-persistence.controller.wasm-gate.test.ts"
Cohesion: 0.33
Nodes (5): emptyPayload(), fakeStorage, makeFakeStore(), mockResolveCoreImpl, mockWaitForWasmModule

### Community 265 - "ADR 0006: DocumentRepository port + IndexedDB adapter"
Cohesion: 0.29
Nodes (4): ADR 0006: DocumentRepository port + IndexedDB adapter, ADR 0007: Local-first persistence model, Local-first software, Repository pattern + Ports & Adapters

### Community 266 - "import-library-image.ts"
Cohesion: 0.53
Nodes (5): readFileAsDataUrl(), readImageDimensions(), readLibraryImageFile(), stripExtension(), ImportedLibraryImage

### Community 267 - "ADR 0002: Single dispatch(cmd) seam; core owns the document"
Cohesion: 0.33
Nodes (4): ADR 0002: Single dispatch(cmd) seam; core owns the document, core/commands.ts module, core/history.ts module, src-ts/ts-core.ts module

### Community 268 - "D6: Flat Rust API, No Serde Decision"
Cohesion: 0.33
Nodes (4): Rust Document Struct, Option/Result at the FFI Boundary, Owning Data in Wasm Memory vs Copying Out, Slices and Bounds-Checking

### Community 269 - "Stage 6: Publishing to AWS (planned)"
Cohesion: 0.50
Nodes (4): Stage 4: Assets (planned), Stage 5: Game building (planned), Stage 6: Publishing to AWS (planned), Stage 7: Operations (planned)

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **275 isolated node(s):** `ADR-0015`, `ADR-0015`, `ADR-0015`, `ADR-0009`, `ADR-0010` (+270 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **90 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DocumentRepository port` connect `DocumentRepository port` to `edit-history Capability`, `Five-phase scaling plan`, `document-persistence.controller.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `ADR-0015`, `ADR-0015`, `ADR-0015` to the rest of the system?**
  _275 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.11734693877551021 - nodes in this community are weakly interconnected._
- **Why does `DocumentRepository port (load/save/remove)` connect `document-persistence.controller.ts` to `persistence.ts`, `DocumentRepository port`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `createEmptyBuffer` be split into smaller, more focused modules?**
  _Cohesion score 0.0662451068955134 - nodes in this community are weakly interconnected._
- **Why does `FOCUS_RING` connect `focus-ring.ts` to `types/audio.ts`, `LeftSidebar.tsx`, `useCanvasOverlay.hook.ts`, `AssetType`, `audio-slices.ts`, `lib/timeline-view.ts`, `animation.ts`, `useSoundDetailHeader.hook.ts`, `TweakPanel.tsx`, `AssetTypeSelector.tsx`, `useDeleteAccountDialog.hook.ts`, `ColorPicker.tsx`, `useSettingsPanel.hook.ts`, `LoginPage.tsx`, `TopBar.tsx`, `LibrarySidebar.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._