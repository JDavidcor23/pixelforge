# Graph Report - pixelforge  (2026-11-07)

## Corpus Check
- 640 files · ~354,149 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .toml 2)

## Summary
- 4184 nodes · 10506 edges · 258 communities (167 shown, 91 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2fee9719`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- createEmptyBuffer
- ai/retro-diffusion.ts
- pixel-core.ts
- timeline-ops.ts
- server-animation-sync.ts
- useSoundsStore
- ts-core.judgment-day-round2.test.ts
- index.tsx
- animation.ts
- ai-generation.ts
- mod.rs
- types/timeline-view.ts
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
- audio-engine.test.ts
- constants/timeline-view.ts
- TopBar.tsx
- useAnimateTab.hook.ts
- mascot-scene-state.ts
- animate.ts
- history.rs
- pixellab-animate-harness.ts
- useImportSpriteSheet.hook.ts
- devDependencies
- SpriteEditorLayout.tsx
- useMixExport.hook.ts
- sound-library.ts
- useTimelineShortcuts.hook.ts
- lib/timeline-view.ts
- useTopBar.hook.ts
- persistence.ts
- useLayerPanel.hook.ts
- tsKernels
- src-ts/ts-core.ts
- prefs.store.ts
- AssetTypeSelector.tsx
- 0014 — Build screen: chat + live Phaser preview, one asset catalog
- useDeleteAccountDialog.hook.ts
- focus-ring.ts
- downscale.rs
- useSettingsPanel.hook.ts
- useAssetsPanel.hook.ts
- sound-timeline.slice.ts
- animation.types.ts
- mascot-scene.ts
- App.tsx
- CollapsibleSection.tsx
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
- useImportSpriteSheet.hook.test.ts
- retro-diffusion-utils.ts
- useEditorPrefsStore
- kernels.ts
- document-persistence.controller.ts
- mascot-city.ts
- tokens/package.json
- document-persistence.controller.ts
- Deferred: scaling the sound editor
- quantize.ts
- scripts
- generation-history.ts
- elevenlabs.ts
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
- Phased Migration Approach (0-7)
- core/package.json
- build-wasm.mjs
- edit-history Capability
- file-menu.ts
- RgbaColor
- Sprite flow
- apps/editor/api/ai/ functions
- Phase 5: Rust Flood-Fill
- AssetType
- compilerOptions
- auth.service.ts
- Handoff 2 of 2 — give attack animations their own model
- computeMascotSceneState
- devDependencies
- Phase 4: packages/core Rust Scaffold
- wasm-document-core.test.ts
- kernels.ts
- auth.types.ts
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
- audio-storage.service.ts
- TweakSlider.tsx
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
- useMascotScene.hook.ts
- 0010 — The canvas is always a named Assets item
- AssetLibraryRepository
- bench/flood-fill.bench.ts
- 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go
- PixelForge IA — Vision and milestones
- index.test.ts
- ApiKeyField.tsx
- @vitest/ui@^4.1.4
- Handoff 1 of 2 — merge `feat/animation-editing` into `master`
- ui.store.ts
- installFakeDom
- Build screen architecture — study notes
- konva@^10.2.5
- use-image@^1.1.4
- vite-plugin-wasm@^3.6.0
- doc.resize command
- Four-step dark ladder palette
- build-screen.md
- react-konva@^19.2.3

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
10. `useAssetsStore` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Decision` --references--> `EditorLayout()`  [INFERRED]
  docs/adr/0014-build-screen-chat-preview-and-asset-catalog.md → apps/editor/src/components/EditorLayout/EditorLayout.tsx
- `Specs` --references--> `EditorLayout()`  [INFERRED]
  odd/tasks/build-screen.md → apps/editor/src/components/EditorLayout/EditorLayout.tsx
- `Context` --references--> `useTimeline()`  [INFERRED]
  docs/adr/0014-build-screen-chat-preview-and-asset-catalog.md → apps/editor/src/sprites/hooks/useSpriteEditorStore.hook.ts
- `Tasks` --references--> `AIGeneration`  [INFERRED]
  odd/tasks/sprite-asset-deep-link.md → apps/editor/src/types/ai-generation.ts
- `Log` --references--> `DocumentId`  [INFERRED]
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

## Communities (258 total, 91 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (66): bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of(), DirtyRect, DispatchResult, doc_replace_rejects_a_huge_frame_count_on_a_zero_sized_canvas_instead_of_attempting_a_multi_gb_allocation() (+58 more)

### Community 1 - "createEmptyBuffer"
Cohesion: 0.06
Nodes (71): TRANSPARENT_COLOR, makeFullBuffer(), DocReplaceFrameInput, applyEntry(), px(), StrokeState, makeDoc(), BucketStats (+63 more)

### Community 2 - "ai/retro-diffusion.ts"
Cohesion: 0.13
Nodes (21): clampSize(), handler(), json(), RetroDiffusionApiResponse, stripDataUri(), RETRO_DIFFUSION_DEFAULT_STRENGTH, RETRO_DIFFUSION_DEFAULT_STYLE, RETRO_DIFFUSION_ENDPOINT (+13 more)

### Community 3 - "pixel-core.ts"
Cohesion: 0.05
Nodes (42): ContractCase, GREEN, implementations, makeDoc(), RED, toLayerMeta(), toMetaSnapshot(), TsPixelCore (+34 more)

### Community 4 - "timeline-ops.ts"
Cohesion: 0.06
Nodes (70): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME (+62 more)

### Community 5 - "server-animation-sync.ts"
Cohesion: 0.11
Nodes (21): AI_JOB_FRAME_EXTENSION, AI_JOB_FRAME_INDEX_PAD, createSyncDeps(), ADR-0009, useServerAnimationSync(), buildServerAnimationAsset(), pngBytesToDataUri(), ServerAnimationSyncDeps (+13 more)

### Community 6 - "useSoundsStore"
Cohesion: 0.19
Nodes (12): LIBRARY_FILTERS, NEW_SOUND_AUTOFOCUS, useSoundEditorLayout(), LibraryFilters(), useLibraryFilters(), LibrarySearch(), useLibrarySearch(), autofocusSelector() (+4 more)

### Community 7 - "ts-core.judgment-day-round2.test.ts"
Cohesion: 0.07
Nodes (55): packPoints(), packRgba(), RGBA_BYTE_SHIFT, frameToSerializedFrame(), layerToSerializedLayer(), CoreState, createCoreState(), currentActiveLayerId() (+47 more)

### Community 8 - "index.tsx"
Cohesion: 0.07
Nodes (40): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+32 more)

### Community 9 - "animation.ts"
Cohesion: 0.06
Nodes (54): handler(), json(), ANIMATION_BUSY_MESSAGE, ANIMATION_CANCEL_HINT, ANIMATION_CANCEL_LABEL, ANIMATION_CHECK_AGAIN_LABEL, ANIMATION_DISCARD_HINT, ANIMATION_DISCARD_LABEL (+46 more)

### Community 10 - "ai-generation.ts"
Cohesion: 0.17
Nodes (12): AnimateResult, GameTemplate, GameTemplateId, OpenLibraryItemDeps, QualityRecommendation, RecentAnimationItem, RetroDiffusionCostEstimate, RetroDiffusionGenerationResult (+4 more)

### Community 11 - "mod.rs"
Cohesion: 0.08
Nodes (44): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+36 more)

### Community 12 - "types/timeline-view.ts"
Cohesion: 0.08
Nodes (31): PERCENT_SCALE, SOUND_NAME_MAX_LENGTH, VOLUME_RANGE, TRACK_COLOR, TRACK_KIND_ICON, TRACK_KIND_OPTIONS, resolveTimelineShortcut(), AddTrackRow() (+23 more)

### Community 13 - "animation-job-ledger.ts"
Cohesion: 0.11
Nodes (45): ANIMATION_RECOVER_FAILED_PREFIX, ANIMATION_RECOVER_PROCESSING_STATE, ANIMATION_RECOVER_SUCCESS_NOTICE, ANIMATION_RECOVER_UNREACHABLE_STATE, ANIMATION_JOB_LEDGER_SETTLED_LIMIT, createLedgerRecoverDeps(), saveAnimationToAssets(), useAnimationJobRecovery() (+37 more)

### Community 14 - "constants/index.ts"
Cohesion: 0.08
Nodes (36): AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS, AI_QUALITY_SAMPLE_NATIVE_SIZE, AI_QUALITY_SAMPLE_PROMPT, AI_QUALITY_SAMPLE_SEED, AI_QUALITY_SAMPLE_SRC, AI_SPRITE_DEFAULT_SIZE_BY_ASSET_TYPE, AI_SPRITE_SIZES, ALPHA_TRANSPARENT_THRESHOLD (+28 more)

### Community 15 - "WasmDocument"
Cohesion: 0.08
Nodes (8): clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill(), quantize(), WasmDocument

### Community 16 - "src/types/index.ts"
Cohesion: 0.06
Nodes (52): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_PALETTE, SPRITE_EDITOR_TIMELINE, SPRITE_EDITOR_STORAGE_KEY, getDrawOffset(), renderPixelsToCanvas(), RenderPixelsToCanvasOptions, screenToPixel() (+44 more)

### Community 17 - "pixellab-job.ts"
Cohesion: 0.17
Nodes (14): PIXELLAB_INPUT_FRAME_INDEX, PIXELLAB_JOB_FAILED_ERROR, PIXELLAB_NO_FRAMES_ERROR, describeDetail(), isFiniteNumber(), KNOWN_STATES, mapPixelLabJob(), PNG_SIGNATURE (+6 more)

### Community 18 - "useEditorUIStore"
Cohesion: 0.13
Nodes (31): BOTTOM_PANEL_TABS, CANVAS_MIN_SIZE, INSPECTOR_TABS, QUALITY_RECOMMENDATION_BY_ASSET_TYPE, SPRITE_EDITOR_LAYOUT, useBottomPanel(), useSpriteEditorLayout(), useCreateTab() (+23 more)

### Community 19 - "pixel-core.ts"
Cohesion: 0.05
Nodes (29): getPixelCoreEnvOverride(), Command, DispatchResult, isPixelCoreImpl(), PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, readEnvOverride(), readLocalStorageOverride() (+21 more)

### Community 20 - "ColorPicker.tsx"
Cohesion: 0.15
Nodes (14): COLOR_PICKER, ColorInputs(), ColorInputsProps, useColorInputs(), UseColorInputsParams, HueSlider(), HueSliderProps, useHueSlider() (+6 more)

### Community 21 - "PixelKernels"
Cohesion: 0.06
Nodes (22): here, source, wasmPath, here, wasmPath, here, pkgAvailable, SEEDS (+14 more)

### Community 22 - "sound-assets.ts"
Cohesion: 0.06
Nodes (57): DELETE_SOUND_KEYS, FALLBACK_SOUND_NAME, LONG_DURATION_DECIMALS, LONG_DURATION_THRESHOLD_S, NAME_VISIBLE_TAIL_LENGTH, SECONDS_PER_HOUR, SECONDS_PER_MINUTE, SOUND_KIND_LABELS (+49 more)

### Community 23 - "useCanvasInteraction.hook.ts"
Cohesion: 0.11
Nodes (36): CANVAS_SIZE_OPTIONS, SPRITE_EDITOR_KEYBOARD, ADR-0008, useCanvasSizePopover(), CanvasArea(), bresenhamLine(), KonvaPointerEvent, useCanvasInteraction() (+28 more)

### Community 24 - "useSpriteEditorStore"
Cohesion: 0.17
Nodes (34): TimelineBar(), getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useClipboard(), useCommitTransformation() (+26 more)

### Community 25 - "LoginPage.tsx"
Cohesion: 0.17
Nodes (16): AuthForm(), useAuthForm(), GoogleButton(), HEADING, SUBTEXT, ResetPasswordPage(), useResetPasswordPage(), AUTH_COPY (+8 more)

### Community 26 - "audio-engine.test.ts"
Cohesion: 0.33
Nodes (11): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+3 more)

### Community 27 - "constants/timeline-view.ts"
Cohesion: 0.09
Nodes (33): ALT_KEY, ALT_KEY_LABEL, CLIP_INSPECTOR, CLIP_KEY_SHORTCUTS, CLOCK_CENTISECONDS, MAC_PLATFORM_PATTERN, MOD_KEY, MOD_KEY_LABEL (+25 more)

### Community 28 - "TopBar.tsx"
Cohesion: 0.13
Nodes (22): DeleteAccountDialog(), DeleteAccountDialogProps, AccountDeletedNotice(), useAccountDeletedNotice(), EditorLayout(), useEditorLayout(), ModalPortal(), ModalPortalProps (+14 more)

### Community 29 - "useAnimateTab.hook.ts"
Cohesion: 0.06
Nodes (39): ANIMATION_ALREADY_RUNNING_ERROR, ANIMATION_ELAPSED_TICK_MS, ANIMATION_GENERATING_HINT, ANIMATION_GENERATING_LABEL, ANIMATION_HINT_SEPARATOR, ANIMATION_POLL_INTERVAL_MS, ANIMATION_POLL_MAX_CONSECUTIVE_ERRORS, ANIMATION_POLL_TIMEOUT_MS (+31 more)

### Community 30 - "mascot-scene-state.ts"
Cohesion: 0.10
Nodes (34): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GLYPH_SPACING, GROUND_BOLT_Y_OFFSET (+26 more)

### Community 31 - "animate.ts"
Cohesion: 0.07
Nodes (42): describeDetail(), handler(), json(), PixelLabSubmitResponse, readEnv(), recordServerJob(), validBody, AI_JOB_ASSET_TYPE_MAX_LENGTH (+34 more)

### Community 32 - "history.rs"
Cohesion: 0.15
Nodes (20): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+12 more)

### Community 33 - "pixellab-animate-harness.ts"
Cohesion: 0.08
Nodes (30): PIXELLAB_ANIMATE_PATHS, PIXELLAB_MAX_FRAMES, PIXELLAB_MIN_FRAMES, ANIMATION_HARNESS, buildAnimationAction(), CHARACTER_MOTIONS, findAnimationMotion(), SUBJECT_MOTIONS (+22 more)

### Community 34 - "useImportSpriteSheet.hook.ts"
Cohesion: 0.13
Nodes (18): SPRITE_IMPORT_MAX_NATIVE_SIZE, FILE_READERS, ADR-0010, FileMenuActions, FileMenuEntry, ImportErrorNoticeProps, ImportSpriteSheetDialogProps, OpenedSpriteSheet (+10 more)

### Community 35 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, fake-indexeddb@^6.2.5, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^20, @types/react@^19, typescript@^5, vite@^6.3.0 (+10 more)

### Community 36 - "SpriteEditorLayout.tsx"
Cohesion: 0.13
Nodes (13): PANEL_RESIZE_STEP, PANEL_RESIZE_STEP_LARGE, LeftSidebar(), ResizeHandle(), ResizeHandleProps, useResizeHandle(), UseResizeHandleParams, LayerItem() (+5 more)

### Community 37 - "useMixExport.hook.ts"
Cohesion: 0.08
Nodes (30): WAV_EXTENSION, GAIN_SMOOTHING_S, MIX_EXPORT, PLAYBACK_SCHEDULE_LEAD_S, TIMELINE_ERRORS, buffers, decodeFromUrl(), inflight (+22 more)

### Community 38 - "sound-library.ts"
Cohesion: 0.04
Nodes (80): AI_KIND_OPTIONS, DEFAULT_DECAY_SHARE, DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, ELEVENLABS_DEFAULT_VOICE_ID, IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES (+72 more)

### Community 39 - "useTimelineShortcuts.hook.ts"
Cohesion: 0.14
Nodes (14): KeyChip(), KeyChipProps, TimelineEditor(), useTimelineEditor(), TimelineToolbar(), useTimelineToolbar(), TimelineTopBar(), TimelineTracks() (+6 more)

### Community 40 - "lib/timeline-view.ts"
Cohesion: 0.08
Nodes (47): SNAP_GRID_SECONDS, CLIP_WAVE, PLAYHEAD_LARGE_STEP_MULTIPLIER, TIMELINE_LAYOUT, collectSnapEdges(), snapThresholdSeconds(), snapTime(), timelineDuration() (+39 more)

### Community 41 - "useTopBar.hook.ts"
Cohesion: 0.18
Nodes (16): DUPLICATE_ERRORS, DUPLICATE_NAME_SUFFIX, FILE_MENU_ENTRY_KIND, FILE_MENU_LABELS, buildFileMenuEntries(), duplicateDefaultName(), isMenuDismissKey(), isOutsideMenu() (+8 more)

### Community 42 - "persistence.ts"
Cohesion: 0.10
Nodes (19): ANIMATION_JOB_LEDGER_STORAGE_KEY, ASSET_ANIMATIONS_STORE, ASSET_DB_NAME, ASSET_DB_VERSION, ASSET_GENERATIONS_STORE, DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_STORE_NAME (+11 more)

### Community 43 - "useLayerPanel.hook.ts"
Cohesion: 0.28
Nodes (11): useLeftSidebar(), useLayerPanel(), useActiveLayerId(), useAddLayer(), useLayersMetadata(), useRemoveLayer(), useReorderLayers(), useSetActiveLayer() (+3 more)

### Community 44 - "tsKernels"
Cohesion: 0.11
Nodes (14): mockGetPixelCoreEnvOverride, KernelRow, coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require (+6 more)

### Community 45 - "src-ts/ts-core.ts"
Cohesion: 0.14
Nodes (26): buildPalette(), CHANNELS, diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect() (+18 more)

### Community 46 - "prefs.store.ts"
Cohesion: 0.21
Nodes (11): SPRITE_EDITOR_CANVAS, PREFS_STORAGE_KEY, createIntegrationsSlice(), IntegrationsSlice, ADR-0009, createViewPrefsSlice(), clampZoom(), createViewportSlice() (+3 more)

### Community 47 - "AssetTypeSelector.tsx"
Cohesion: 0.12
Nodes (16): ASSET_FOLDERS, ASSET_LIBRARY_IMPORT_ACCEPT, BottomPanel(), ICON_MAP, AssetFolderTree(), AssetFolderTreeProps, ICON_MAP, AssetGrid() (+8 more)

### Community 48 - "0014 — Build screen: chat + live Phaser preview, one asset catalog"
Cohesion: 0.07
Nodes (25): 0014 — Build screen: chat + live Phaser preview, one asset catalog, Consequences, Context, D1. Where the screen lives, D2. Game loop vs React, D3. Who owns the asset list, D4. Editing from the Biblioteca, Decision (+17 more)

### Community 49 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.16
Nodes (14): getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, ACCOUNT_DELETED_NOTICE_AUTO_DISMISS_MS, DELETE_ACCOUNT_CONFIRM_WORD, DELETE_ACCOUNT_DEFAULT_ERROR_MESSAGE, DELETE_ACCOUNT_ERROR_CODE, DELETE_ACCOUNT_ERROR_MESSAGES (+6 more)

### Community 50 - "focus-ring.ts"
Cohesion: 0.09
Nodes (32): SUBMIT_LABEL, SUBMITTING_LABEL, GoogleButtonProps, GoogleIcon(), DISABLED_STATE, FOCUS_RING, TIMELINE_THUMBNAIL_SIZE, MOTION (+24 more)

### Community 51 - "downscale.rs"
Cohesion: 0.16
Nodes (18): alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color(), downscale() (+10 more)

### Community 52 - "useSettingsPanel.hook.ts"
Cohesion: 0.20
Nodes (16): useSettingsPanel(), UseSettingsPanelResult, API_KEY_HELP_URL, API_KEY_PROVIDER, API_KEY_SAVED_FEEDBACK_MS, ElevenLabsError, generateMusic(), generateSFX() (+8 more)

### Community 53 - "useAssetsPanel.hook.ts"
Cohesion: 0.09
Nodes (26): downloadFromHref(), downloadJson(), readFileAsDataUrl(), readImageDimensions(), readLibraryImageFile(), stripExtension(), openLibraryItem(), animation (+18 more)

### Community 54 - "sound-timeline.slice.ts"
Cohesion: 0.15
Nodes (28): EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory(), withoutAsset() (+20 more)

### Community 55 - "animation.types.ts"
Cohesion: 0.06
Nodes (36): AI_JOBS_STORAGE_KEY, AIJobsState, IDLE_ANIMATE_JOB, IDLE_JOB, IDLE, IDLE_ANIMATE, PENDING, PROCESSING (+28 more)

### Community 56 - "mascot-scene.ts"
Cohesion: 0.17
Nodes (20): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+12 more)

### Community 57 - "App.tsx"
Cohesion: 0.17
Nodes (14): App(), BuildScreen, ADR-0014, LoginPage(), useLoginPage(), getLandingUrl(), useAuthSession(), rootElement (+6 more)

### Community 58 - "CollapsibleSection.tsx"
Cohesion: 0.60
Nodes (3): CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection()

### Community 59 - "animation-limits.ts"
Cohesion: 0.17
Nodes (17): ANIMATION_FRAME_OPTIONS, ANIMATION_FRAMES_INVALID_ERROR, ANIMATION_FRAMES_NOT_MULTIPLE_OF_4_ERROR, ANIMATION_FRAMES_OVER_BUDGET_ERROR, ANIMATION_NOT_SQUARE_ERROR, ANIMATION_TOO_LARGE_ERROR, DEFAULT_ANIMATION_MODEL, PIXELLAB_MAX_SIZE (+9 more)

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
Cohesion: 0.18
Nodes (10): DeleteSoundDialog(), LibraryEmptyState(), LibraryEmptyStateProps, LibrarySidebar(), useLibrarySidebar(), NewSoundPopover(), PendingSoundRow(), PendingSoundRowProps (+2 more)

### Community 64 - "collect-ai-jobs/index.ts"
Cohesion: 0.15
Nodes (18): Admin, AiJobRow, assetName(), collectOne(), decodeBase64(), describeDetail(), fetchPixelLabJob(), frameFileName() (+10 more)

### Community 65 - "types/audio.ts"
Cohesion: 0.06
Nodes (60): ADSR_DEFAULTS, ADSR_LIMITS, ADSR_VIEW, DEFAULT_VOLUME, ELEVENLABS_API_TIMEOUT, FILTER_DEFAULTS, FILTER_LIMITS, FILTER_TYPES (+52 more)

### Community 66 - "PixelForge IA (AGENTS.md)"
Cohesion: 0.12
Nodes (18): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), apps/editor, apps/landing, packages/core (Rust/Wasm), packages/tokens (+10 more)

### Community 67 - "assets.store.ts"
Cohesion: 0.08
Nodes (32): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, ANIMATION_PIPELINE_VERSION, GENERATION_HISTORY_STORAGE_KEY, ASSET_LIBRARY_LIMIT, useAssetLibraryPersistence(), isNonEmptyString(), isPngDataUri() (+24 more)

### Community 68 - "WasmPixelCore"
Cohesion: 0.17
Nodes (4): DispatchResult, clampRectToCanvas(), decodeNames(), WasmPixelCore

### Community 69 - "audio-engine.ts"
Cohesion: 0.14
Nodes (13): AudioEngine, buildSynthChain(), calculateDefaultDuration(), createWhiteNoiseBuffer(), mapFilterType(), msToSec(), Transport(), useWaveform() (+5 more)

### Community 70 - "useImportSpriteSheet.hook.test.ts"
Cohesion: 0.19
Nodes (15): IMPORT_SPRITE_SHEET_ERRORS, SPRITE_ANIMATION, SPRITE_IMPORT_MAX_FRAMES, decodeSheet(), decodeSingle(), isValidFrameCount(), nameFromFileName(), openSpriteSheetFile() (+7 more)

### Community 71 - "retro-diffusion-utils.ts"
Cohesion: 0.27
Nodes (8): AI_SPRITE_DEFAULT_SIZE, decodeGeneratedSprite(), estimateRetroDiffusionCost(), generateSpriteWithRetroDiffusion(), postToRetroDiffusion(), ApplyAnimationParams, ApplyGenerationParams, RetroDiffusionRequestBody

### Community 72 - "useEditorPrefsStore"
Cohesion: 0.12
Nodes (27): SPRITE_EDITOR_TOOLS, useColorPalette(), ColorPicker, ActiveColorType, hexToRgba(), rgbaToHex(), useColorPicker(), BottomToolbar() (+19 more)

### Community 73 - "kernels.ts"
Cohesion: 0.25
Nodes (6): resolveCoreImpl(), ensureWasmResolving(), getActiveKernels(), getActiveKernelsAsync(), mockBase64ToNativePixels, mockGetPixelCoreEnvOverride

### Community 74 - "document-persistence.controller.ts"
Cohesion: 0.08
Nodes (36): LOCAL_DRAFT_DOCUMENT_ID, OPEN_SPRITE_ASSET_STORAGE_KEY, decodedPixels, makeFakeStore(), payloadWithAlpha(), ADR-0015, DocumentPersistenceController, DocumentPersistenceDeps (+28 more)

### Community 75 - "mascot-city.ts"
Cohesion: 0.21
Nodes (14): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+6 more)

### Community 76 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 77 - "document-persistence.controller.ts"
Cohesion: 0.10
Nodes (27): SPRITE_EDITOR_LAYER, UNTITLED_ASSET_NAME_PREFIX, DRAFT_MIGRATION_ASSET_STORAGE_KEY, blankDocument(), createUntitledSprite(), documentFromPixels(), documentHasContent(), documentPreview() (+19 more)

### Community 78 - "Deferred: scaling the sound editor"
Cohesion: 0.20
Nodes (9): Deferred: scaling the sound editor, docs/architecture/scalable-assets-research.md (cited), Scaling triggers, Cancel an in-flight AI generation, How to build it, What, What it affects, Why it waited (+1 more)

### Community 79 - "quantize.ts"
Cohesion: 0.33
Nodes (9): QUANTIZE_DEFAULTS, buildPalette(), Centroid, dist2(), nearest(), quantizePixels(), saturation(), WeightedPoint (+1 more)

### Community 80 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 81 - "generation-history.ts"
Cohesion: 0.26
Nodes (11): GENERATION_HISTORY_LIMIT, ASSET_TYPES, isAssetType(), isFiniteNumber(), isGenerationKind(), isNonEmptyString(), isPngDataUri(), normalizeGeneration() (+3 more)

### Community 82 - "elevenlabs.ts"
Cohesion: 0.25
Nodes (7): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES

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
Nodes (59): unpackRgba(), bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory(), entryBytes(), History (+51 more)

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
Cohesion: 0.13
Nodes (12): Rust Document Struct, PixelCore Interface, TrapSafePixelCore, TsPixelCore, WasmPixelCore, Phase 7: Rust Document/History, Document: Stateful Struct, Not Stateless Function, Option/Result at the FFI Boundary (+4 more)

### Community 93 - "Phased Migration Approach (0-7)"
Cohesion: 0.16
Nodes (11): Command Union Type, DispatchResult, DispatchResult.structureChanged Field (Phase 7g), Baseline Benchmarks Recorded Before Porting, Lossless Pixel Round-Trip Requirement, Judgment-Day Blind-Judge Review Process, Phase 0: Gates (CI, Scripts, Characterization Tests), Phase 2: Command Seam + Dirty-Rect History (+3 more)

### Community 94 - "core/package.json"
Cohesion: 0.10
Nodes (19): devDependencies, @types/node, typescript, vitest, exports, @types/node, typescript, vitest (+11 more)

### Community 95 - "build-wasm.mjs"
Cohesion: 0.15
Nodes (11): asLatin1, bytes, crateDir, finalBytes, here, offenders, relativeRustPaths, remapFlags (+3 more)

### Community 96 - "edit-history Capability"
Cohesion: 0.20
Nodes (8): core-parity-gate Capability, edit-history Capability, CI Enforces Tests Benchmarks and Drift Check, Parity Tests Gate Default Implementation, Bounded History Retention Requirement, Bounded Undo Memory Requirement, Command-Based Mutation Requirement, Undo/Redo Correctness Requirement

### Community 97 - "file-menu.ts"
Cohesion: 0.10
Nodes (18): DIALOG_FOCUS_TRAP_KEY, DUPLICATE_COPY, DUPLICATE_FIELD_IDS, FILE_EXTENSION_PATTERN, FILE_MENU_COPY, FILE_MENU_DISMISS_KEY, FILE_MENU_ITEM_IDS, IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS (+10 more)

### Community 98 - "RgbaColor"
Cohesion: 0.15
Nodes (18): rgbaToHex(), rowsToBuffer(), LegacyFrame, LegacyLayer, legacyLayerToPayload(), LegacyMigrationResult, LegacyPersistedState, legacyStateToPayload() (+10 more)

### Community 99 - "Sprite flow"
Cohesion: 0.22
Nodes (8): decodeGeneratedSprite, estimateRetroDiffusionCost, generateSpriteWithRetroDiffusion, Sprite Generation with Retro Diffusion, Sprite flow, AI sprite variations, Retro Diffusion num_images parameter, Sprite Studio v3 Create (AI-first) Pencil frame

### Community 100 - "apps/editor/api/ai/ functions"
Cohesion: 0.13
Nodes (15): Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, apps/editor/api/ai Vercel Functions proxy (diagram node), ElevenLabs API (diagram node), Retro Diffusion API (diagram node) (+7 more)

### Community 101 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.21
Nodes (4): Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, u32 RGBA Packing/Unpacking, Vec<T> as an Explicit Stack

### Community 102 - "AssetType"
Cohesion: 0.13
Nodes (21): ASSET_TYPES, AssetTypeSelectorProps, ICON_MAP, CreateTab(), GeneratePanel(), GeneratePanelProps, QualitySelector(), QualitySelectorProps (+13 more)

### Community 103 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 104 - "auth.service.ts"
Cohesion: 0.25
Nodes (5): deleteAccount(), DeleteAccountEnvelope, GoogleUserMetadata, ProfileRow, toDeleteAccountErrorCode()

### Community 105 - "Handoff 2 of 2 — give attack animations their own model"
Cohesion: 0.29
Nodes (6): Evidence (benchmark 2026-10-18, wizard-128, 1.42 USD), Handoff 2 of 2 — give attack animations their own model, Open decisions for the owner (ask one at a time), Prompt to paste in the new conversation, What the owner wants (verbatim, 2026-10-18), Where it plugs in

### Community 106 - "computeMascotSceneState"
Cohesion: 0.27
Nodes (11): clamp01(), computeAirDodgeOffset(), computeBolt(), computeEnemy(), computeLevelWipeY(), computeMascotSceneState(), computeTitleLine(), easeOutBack() (+3 more)

### Community 107 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 108 - "Phase 4: packages/core Rust Scaffold"
Cohesion: 0.22
Nodes (7): Wasm Artifact Size Budget Requirement, Dirty-Pair Cache-Refresh Contract, Phase 4: packages/core Rust Scaffold, Batching Amortizes the Fixed Per-Call Cost, Hexagonal Split: Domain Module vs bindings.rs, Ownership & Borrowing (&[u8] vs Vec<u8>), wasm-bindgen Copy-In/Copy-Out Mechanism

### Community 109 - "wasm-document-core.test.ts"
Cohesion: 0.22
Nodes (7): setIdSeed(), baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 110 - "kernels.ts"
Cohesion: 0.26
Nodes (11): isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels(), here, pkgAvailable, wasmPath, withRuntimeTrapFallback() (+3 more)

### Community 111 - "auth.types.ts"
Cohesion: 0.25
Nodes (7): AuthFormProps, AuthActions, AuthFormMode, AuthState, AuthStatus, AuthStore, AuthUser

### Community 112 - "mascot-font.ts"
Cohesion: 0.12
Nodes (22): SPRITE_EDITOR_COLORS, hexToHsv(), hexToRgba(), hsvToHex(), rgbaToString(), GLYPH_FONT, GLYPH_SIZE, SUBTITLE_TEXT (+14 more)

### Community 113 - "edit-history Capability"
Cohesion: 0.17
Nodes (8): Phase 0 TS Baseline Benchmarks, IndexedDbDocumentRepository Adapter, PixelKernels Interface, pixel-core Capability, Full Canvas Repaint Performance Requirement, Implementation-Agnostic Pixel Operations Requirement, Local Draft Recovery Requirement, Phase 1: Flatten Buffer + IndexedDB Persistence

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
Cohesion: 0.16
Nodes (13): ADR 0001: Flat pixel buffer, copy-on-write per batch, ADR 0003: Dirty-rect patches for undo history, ADR 0004: Rust/Wasm boundary shape, ADR 0005: pnpm monorepo split, ADR 0006: DocumentRepository port + IndexedDB adapter, ADR 0007: Local-first persistence model, The monorepo and Rust/WebAssembly migration, explained simply, Study guide: moving the editor from Next.js to Vite (+5 more)

### Community 118 - "WasmPixelCore (diagram node, behind flag)"
Cohesion: 0.16
Nodes (12): ADR 0002: Single dispatch(cmd) seam; core owns the document, WebAssembly JS<->Wasm boundary copy cost, core/commands.ts module, core/history.ts module, src-ts/resolve-core.ts module, src-ts/ts-core.ts module, src-ts/wasm-core.ts module, PixelCore port (diagram node) (+4 more)

### Community 119 - "bindings.rs (diagram node, only wasm-bindgen boundary)"
Cohesion: 0.22
Nodes (8): packages/core/src Rust modules, bindings.rs (diagram node, only wasm-bindgen boundary), document.rs (diagram node), downscale.rs (diagram node), flood_fill.rs (diagram node), history.rs (diagram node), pixels/mod.rs (diagram node), quantize.rs (diagram node)

### Community 121 - "useDocumentPersistence.hook.ts"
Cohesion: 0.31
Nodes (8): DOCUMENT_AUTOSAVE_DEBOUNCE_MS, createAssetBinding(), NOOP_OPEN_ASSET_STORAGE, ADR-0015, useDocumentPersistence(), UseDocumentPersistenceResult, pixelBufferToDataUri(), registerDocumentPersistenceFlush()

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
Cohesion: 0.09
Nodes (29): DEFAULT_ASSET_TYPE, buildAssetLibraryItems(), ADR-0010, ADR-0011, downloadCanvasAsPng(), exportFrameAsPng(), exportSpriteSheetAsPng(), layersToBase64() (+21 more)

### Community 127 - "mascot-sprite.ts"
Cohesion: 0.24
Nodes (8): MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, drawBlaster(), drawMascot(), FillRectCall, MascotDrawOptions

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
Nodes (15): CURSOR_POSITION_FALLBACK, SPRITE_EDITOR_VIEWPORT, CanvasOverlay(), useCanvasOverlay(), OpacitySlider(), OpacitySliderProps, PositionFields(), usePositionFields() (+7 more)

### Community 133 - "src-ts/index.ts"
Cohesion: 0.09
Nodes (39): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+31 more)

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

### Community 142 - "audio-storage.service.ts"
Cohesion: 0.16
Nodes (11): getSupabaseAnonKey(), getSupabaseUrl(), isSupabaseConfigured(), AUDIO_STORAGE_BUCKET, supabase, buildFilePath(), generateId(), StorageError (+3 more)

### Community 143 - "TweakSlider.tsx"
Cohesion: 0.33
Nodes (5): TweakSliderProps, TweakSliderVariant, VARIANT_CLASSES, useTweakSlider(), UseTweakSliderParams

### Community 144 - "mascot.types.ts"
Cohesion: 0.25
Nodes (7): BlasterBoltState, EnemyLifecycle, EnemyState, MascotHurtbox, MascotPose, MascotScenePhase, MascotSceneState

### Community 145 - "editor/package.json"
Cohesion: 0.18
Nodes (10): react-dom@19.2.4, babel-plugin-react-compiler@1.0.0, @types/react-dom@^19, license, name, private, version, babel-plugin-react-compiler (+2 more)

### Community 146 - "sprite-pipeline.ts"
Cohesion: 0.23
Nodes (18): base64ToNativePixels(), asKernelView(), composeCentered(), contentBox(), cropRegion(), decodeAtNativeSize(), decodeSheetAtNativeSize(), decodeSheetToFrames() (+10 more)

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

### Community 238 - "useMascotScene.hook.ts"
Cohesion: 0.39
Nodes (6): MascotScene(), useMascotScene(), UseMascotSceneResult, MASCOT_SCENE_SIZE, computeReducedMotionSceneState(), createCanvas2DPixelWriter()

### Community 239 - "0010 — The canvas is always a named Assets item"
Cohesion: 0.20
Nodes (9): 0010 — The canvas is always a named Assets item, Consequences, Context, Decision, Implementation plan, Out of scope (this plan), Phase 1 — `Save As…` creates a named, typed Assets item, Phase 2 — Rename and recategorize an existing Assets item (+1 more)

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
Cohesion: 0.08
Nodes (24): DOCUMENT_SCHEMA_VERSION, StructuralDocSnapshot, DocMetaSnapshot, timelineToDocumentPayload(), toStrokePoints, BLUE, GREEN, RED (+16 more)

### Community 245 - "ApiKeyField.tsx"
Cohesion: 0.47
Nodes (4): ApiKeyField(), ApiKeyFieldProps, useApiKeyField(), UseApiKeyFieldResult

### Community 247 - "Handoff 1 of 2 — merge `feat/animation-editing` into `master`"
Cohesion: 0.40
Nodes (4): Handoff 1 of 2 — merge `feat/animation-editing` into `master`, Prompt to paste in the new conversation, Watch out (verified 2026-10-18), What to merge

### Community 248 - "ui.store.ts"
Cohesion: 0.47
Nodes (4): DEFAULT_QUALITY_TIER, RESIZABLE_PANELS, createUISlice(), EditorUIStore

### Community 249 - "installFakeDom"
Cohesion: 1.00
Nodes (3): installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext()

### Community 250 - "Build screen architecture — study notes"
Cohesion: 0.33
Nodes (5): After shipping, Build screen architecture — study notes, Readings (short, in this order), The four decisions in one line each, Words to use in an interview

### Community 255 - "doc.resize command"
Cohesion: 0.32
Nodes (7): ADR 0003 dirty-rect undo history (cited), Command pattern (inverse operation), doc.replace command, doc.resize command, GIMP tile-based undo, History budget (32 MiB / 50 entries), Memento pattern (delta only)

### Community 257 - "Four-step dark ladder palette"
Cohesion: 0.33
Nodes (3): Accent token system, Four-step dark ladder palette, --pf-* CSS custom properties

### Community 258 - "build-screen.md"
Cohesion: 0.50
Nodes (3): Log, Specs, Tasks

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **275 isolated node(s):** `ADR-0009`, `ADR-0015`, `ADR-0015`, `ADR-0009`, `ADR-0009` (+270 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1221 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **91 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DocumentRepository port` connect `DocumentRepository port` to `edit-history Capability`, `document-persistence.controller.ts`, `Five-phase scaling plan`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `ADR-0009`, `ADR-0015`, `ADR-0015` to the rest of the system?**
  _275 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Why does `DocumentRepository port (load/save/remove)` connect `document-persistence.controller.ts` to `DocumentRepository port`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `createEmptyBuffer` be split into smaller, more focused modules?**
  _Cohesion score 0.05586722767648434 - nodes in this community are weakly interconnected._
- **Why does `FOCUS_RING` connect `focus-ring.ts` to `types/audio.ts`, `SpriteEditorLayout.tsx`, `audio-engine.ts`, `useSoundsStore`, `useTimelineShortcuts.hook.ts`, `lib/timeline-view.ts`, `animation.ts`, `AssetType`, `constants/index.ts`, `AssetTypeSelector.tsx`, `ColorPicker.tsx`, `ApiKeyField.tsx`, `sound-assets.ts`, `LoginPage.tsx`, `CollapsibleSection.tsx`, `TopBar.tsx`, `LibrarySidebar.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._