# Graph Report - game-builder  (2026-10-18)

## Corpus Check
- 611 files · ~338,109 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3967 nodes · 10108 edges · 256 communities (169 shown, 83 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 124 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1846b112`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- document.rs
- createEmptyBuffer
- legacy-draft-migration.service.test.ts
- pixel-core.ts
- timeline-ops.ts
- index.test.ts
- src/types/index.ts
- core/ts-core.ts
- index.tsx
- animation.ts
- constants/audio.ts
- mod.rs
- useTimelineClip.hook.ts
- animation-job-ledger.ts
- constants/index.ts
- WasmDocument
- export-utils.ts
- animate.ts
- useEditorUIStore
- Inspector.tsx
- ColorPicker.tsx
- PixelKernels
- src-ts/index.ts
- CanvasArea.tsx
- useSpriteEditorStore.hook.ts
- auth.service.ts
- sound-library.ts
- AssetType
- assets.store.ts
- useTopBar.hook.ts
- mascot-scene-state.ts
- WasmPixelCore
- history.rs
- pixellab-animate-harness.ts
- sprite-pipeline.ts
- devDependencies
- useAnimateTab.hook.ts
- useCreateSound.hook.ts
- audio-storage.service.ts
- file-menu.ts
- pixellab-job.ts
- useImportSpriteSheet.hook.ts
- BottomPanel.tsx
- useSoundsStore
- wasm-core.ts
- src-ts/ts-core.ts
- quantize.oracle-parity.test.ts
- prefs.store.ts
- useSoundDetailHeader.hook.ts
- useDeleteAccountDialog.hook.ts
- focus-ring.ts
- downscale.rs
- server-animation-sync.ts
- useAssetsPanel.hook.ts
- sound-timeline.slice.ts
- animation.types.ts
- mascot-scene.ts
- useSettingsPanel.hook.ts
- PropertiesTab.tsx
- useCanvasInteraction.hook.ts
- quantize.rs
- dependencies
- pixellab-animation.service.ts
- SoundList.tsx
- collect-ai-jobs/index.ts
- types/audio.ts
- PixelForge IA (root README)
- ts-core.judgment-day-round3.test.ts
- timeline-player.ts
- AudioAsset
- audio-engine.test.ts
- document-persistence.controller.wasm-gate.test.ts
- useBottomToolbar.hook.ts
- Phase 4: packages/core Rust Scaffold
- color-utils.ts
- mascot-city.ts
- tokens/package.json
- lib/timeline-view.ts
- useGeneratePanel
- sprite-save-as
- scripts
- lucide-react
- wasm-pixel-core.differential.fuzz.test.ts
- DocumentRepository port
- Synthetic Architect design system
- scripts
- core/history.ts
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
- TweakPanel.tsx
- useMixExport.hook.ts
- Cancel an in-flight AI generation
- apps/editor/api/ai/ functions
- Phase 5: Rust Flood-Fill
- animation-polling.ts
- compilerOptions
- ai-generation.ts
- LeftSidebar.tsx
- computeMascotSceneState
- devDependencies
- useSoundList.hook.ts
- wasm-document-core.test.ts
- mascot-font.ts
- elevenlabs.ts
- useDocumentPersistence.hook.ts
- persistence.ts
- constants/timeline-view.ts
- useSaveIndicator.hook.ts
- compilerOptions
- PixelForge Architecture Overview
- WasmPixelCore (diagram node, behind flag)
- bindings.rs (diagram node, only wasm-bindgen boundary)
- useClipInspector.hook.ts
- TimelineEditor.tsx
- Phased Migration Approach (0-7)
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
- pixel-parity.test.ts
- legacy-draft-migration.service.ts
- RgbaColor
- QualitySamplePreview.tsx
- editor/package.json
- quantize.ts
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
- ai-jobs.store.test.ts
- 0010 — The canvas is always a named Assets item
- react
- PixelForge IA (AGENTS.md)
- 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go
- document-persistence.controller.ts
- tailwindcss
- @vitejs/plugin-react
- @vitest/ui
- installFakeDom
- kernels.ts
- PixelLab adapter
- wasm-pixel-core.undo-memory.baseline.test.ts
- doc.resize command
- Four-step dark ladder palette
- DocumentRepository
- VariationCard.tsx
- useColorInputs.hook.ts

## God Nodes (most connected - your core abstractions)
1. `useSpriteEditorStore` - 98 edges
2. `useSoundsStore` - 89 edges
3. `createEmptyBuffer()` - 83 edges
4. `FOCUS_RING` - 69 edges
5. `MOTION` - 63 edges
6. `Document` - 52 edges
7. `AssetType` - 51 edges
8. `useEditorUIStore` - 44 edges
9. `putPixel()` - 40 edges
10. `useAssetsStore` - 39 edges

## Surprising Connections (you probably didn't know these)
- `Repository pattern for audio persistence` --semantically_similar_to--> `DocumentRepository port`  [INFERRED] [semantically similar]
  docs/ai-notes/deferred-audio-asset-scalability.md → README.md
- `VITE_PIXEL_CORE / pf:core override` --semantically_similar_to--> `PixelCore hexagonal port`  [INFERRED] [semantically similar]
  apps/editor/README.md → README.md
- `Hexagonal architecture / Ports & Adapters` --semantically_similar_to--> `PixelCore hexagonal port`  [INFERRED] [semantically similar]
  docs/adr/0009-animation-provider-port-and-harness.md → README.md
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

## Communities (256 total, 83 thin omitted)

### Community 0 - "document.rs"
Cohesion: 0.06
Nodes (73): HashMap, History, HistoryEntry, bounded_capacity(), clamp_rect_to_buffer(), decode_names(), Direction, dirty_and_evicted_of() (+65 more)

### Community 1 - "createEmptyBuffer"
Cohesion: 0.07
Nodes (61): TRANSPARENT_COLOR, DocReplaceFrameInput, applyEntry(), StrokeState, BucketStats, dominantColor(), downscalePixels(), downscaleTo() (+53 more)

### Community 2 - "legacy-draft-migration.service.test.ts"
Cohesion: 0.29
Nodes (5): LEGACY_SPRITE_EDITOR_STORAGE_KEY, GREEN, legacyLayer(), legacyRaw(), RED

### Community 3 - "pixel-core.ts"
Cohesion: 0.05
Nodes (33): getPixelCoreEnvOverride(), DispatchResult, isPixelCoreImpl(), PIXEL_CORE_OVERRIDE_KEY, PixelCoreImpl, readEnvOverride(), readLocalStorageOverride(), resolveCore() (+25 more)

### Community 4 - "timeline-ops.ts"
Cohesion: 0.06
Nodes (62): DEFAULT_CLIP_GAIN_DB, DEFAULT_CLIP_SPEED, DEFAULT_PROJECT_NAME, DEFAULT_PX_PER_SECOND, DEFAULT_TRACK_ID_PREFIX, DEFAULT_TRACK_KINDS, DEFAULT_TRACK_NAMES, DEFAULT_TRACK_VOLUME (+54 more)

### Community 5 - "index.test.ts"
Cohesion: 0.08
Nodes (24): StructuralDocSnapshot, DocMetaSnapshot, timelineToDocumentPayload(), toStrokePoints, BLUE, GREEN, make2x2Buffer(), RED (+16 more)

### Community 6 - "src/types/index.ts"
Cohesion: 0.10
Nodes (37): SPRITE_EDITOR_DEFAULTS, SPRITE_EDITOR_TIMELINE, Command, fakeFloodFill, makeDoc(), makeLayer(), requestImmediateFlush(), createInitialFrame() (+29 more)

### Community 7 - "core/ts-core.ts"
Cohesion: 0.05
Nodes (80): packPoints(), packRgba(), RGBA_BYTE_SHIFT, unpackRgba(), History, asKernelBuffer(), clampRectToBuffer(), coreCanRedo() (+72 more)

### Community 8 - "index.tsx"
Cohesion: 0.07
Nodes (40): CtaSection(), FeatureCard(), FeaturesSection(), Footer(), HeroSection(), LegalDocument(), Navbar(), PipelineSection() (+32 more)

### Community 9 - "animation.ts"
Cohesion: 0.08
Nodes (41): ANIMATION_BUSY_MESSAGE, ANIMATION_CANCEL_HINT, ANIMATION_CANCEL_LABEL, ANIMATION_CHECK_AGAIN_LABEL, ANIMATION_DISCARD_HINT, ANIMATION_DISCARD_LABEL, ANIMATION_LEDGER_TIME_FORMAT, ANIMATION_RECOVER_DISCARDED_TAG (+33 more)

### Community 10 - "constants/audio.ts"
Cohesion: 0.06
Nodes (44): ADSR_DEFAULTS, ADSR_LIMITS, ADSR_VIEW, ELEVENLABS_API_TIMEOUT, FILTER_DEFAULTS, FILTER_LIMITS, FILTER_TYPES, HZ_PER_KHZ (+36 more)

### Community 11 - "mod.rs"
Cohesion: 0.08
Nodes (48): bounded_stack_handles_a_large_fully_connected_canvas_without_overflow(), does_not_leak_diagonally_four_connectivity_only(), empty(), fill_span_row(), fills_the_whole_canvas_from_any_seed(), flood_fill(), holes_are_preserved_maze_shape(), pixel_matches() (+40 more)

### Community 12 - "useTimelineClip.hook.ts"
Cohesion: 0.12
Nodes (26): SNAP_GRID_SECONDS, soundDragSession, collectSnapEdges(), snapThresholdSeconds(), snapTime(), laneWidthPx(), snapClipMove(), timeToX() (+18 more)

### Community 13 - "animation-job-ledger.ts"
Cohesion: 0.10
Nodes (49): ANIMATION_RECOVER_FAILED_PREFIX, ANIMATION_RECOVER_PROCESSING_STATE, ANIMATION_RECOVER_SUCCESS_NOTICE, ANIMATION_RECOVER_UNREACHABLE_STATE, ANIMATION_JOB_LEDGER_SETTLED_LIMIT, ANIMATION_JOB_LEDGER_STORAGE_KEY, createLedgerRecoverDeps(), saveAnimationToAssets() (+41 more)

### Community 14 - "constants/index.ts"
Cohesion: 0.05
Nodes (51): clampSize(), handler(), json(), RetroDiffusionApiResponse, stripDataUri(), AI_QUALITY_SAMPLE_NATIVE_SIZE, AI_QUALITY_SAMPLE_SEED, AI_QUALITY_SAMPLE_SRC (+43 more)

### Community 15 - "WasmDocument"
Cohesion: 0.08
Nodes (13): Box, DispatchResult, clone_buffer(), diff_rect(), downscale(), encode_dispatch_result(), extract_rect(), flood_fill() (+5 more)

### Community 16 - "export-utils.ts"
Cohesion: 0.16
Nodes (20): makeFullBuffer(), getDrawOffset(), renderPixelsToCanvas(), screenToPixel(), downloadCanvasAsPng(), exportFrameAsPng(), exportSpriteSheetAsPng(), layersToBase64() (+12 more)

### Community 17 - "animate.ts"
Cohesion: 0.10
Nodes (30): describeDetail(), handler(), json(), PixelLabSubmitResponse, readEnv(), recordServerJob(), validBody, ADR-0009 (+22 more)

### Community 18 - "useEditorUIStore"
Cohesion: 0.12
Nodes (30): BOTTOM_PANEL_TABS, CANVAS_MIN_SIZE, DEFAULT_QUALITY_TIER, QUALITY_RECOMMENDATION_BY_ASSET_TYPE, RESIZABLE_PANELS, SPRITE_EDITOR_LAYOUT, useAssetLibraryPersistence(), createIndexedDbAssetLibraryRepository() (+22 more)

### Community 19 - "Inspector.tsx"
Cohesion: 0.40
Nodes (4): CreateTab(), ICON_MAP, Inspector(), TAB_PANELS

### Community 20 - "ColorPicker.tsx"
Cohesion: 0.18
Nodes (11): COLOR_PICKER, ColorInputs(), ColorInputsProps, HueSlider(), HueSliderProps, useHueSlider(), UseHueSliderParams, SaturationValueSquare() (+3 more)

### Community 21 - "PixelKernels"
Cohesion: 0.06
Nodes (14): here, source, wasmPath, here, mazePool, uniformPool, wasmPath, here (+6 more)

### Community 22 - "src-ts/index.ts"
Cohesion: 0.09
Nodes (39): AnimationFrame, Command, DirtyRect, DocMetaSnapshot, DocReplaceFrameInput, DocSnapshot, DocumentFramePayload, DocumentLayerPayload (+31 more)

### Community 23 - "CanvasArea.tsx"
Cohesion: 0.15
Nodes (26): SPRITE_EDITOR_KEYBOARD, CanvasArea(), KonvaPointerEvent, useCanvasPanning(), useCanvasZoom(), useKeyboardShortcuts(), useCopySelection(), useCutSelection() (+18 more)

### Community 24 - "useSpriteEditorStore.hook.ts"
Cohesion: 0.14
Nodes (42): useLeftSidebar(), useLayerPanel(), getFrameAtClientX(), getFramesInViewportRange(), useTimelineBar(), useAnimationPlayback(), useAddFrame(), useAddLayer() (+34 more)

### Community 25 - "auth.service.ts"
Cohesion: 0.06
Nodes (51): App(), AuthForm(), AuthFormProps, SUBMIT_LABEL, SUBMITTING_LABEL, useAuthForm(), GoogleButton(), HEADING (+43 more)

### Community 26 - "sound-library.ts"
Cohesion: 0.09
Nodes (35): FALLBACK_SOUND_NAME, LONG_DURATION_DECIMALS, LONG_DURATION_THRESHOLD_S, MINI_WAVE, MINI_WAVE_BAR_COUNT, PLACEHOLDER_PEAKS, SECONDS_PER_HOUR, SECONDS_PER_MINUTE (+27 more)

### Community 27 - "AssetType"
Cohesion: 0.14
Nodes (20): ASSET_FOLDERS, ASSET_TYPES, QUALITY_TIERS, AssetFolderTreeProps, AssetGridProps, AssetTileProps, ADR-0010, UseAssetTileParams (+12 more)

### Community 28 - "assets.store.ts"
Cohesion: 0.07
Nodes (34): GENERATION_HISTORY_LIMIT, GENERATION_HISTORY_STORAGE_KEY, ASSET_ANIMATIONS_STORE, ASSET_DB_NAME, ASSET_DB_VERSION, ASSET_GENERATIONS_STORE, ASSET_LIBRARY_LIMIT, ParsedAnimationHistory (+26 more)

### Community 29 - "useTopBar.hook.ts"
Cohesion: 0.20
Nodes (17): FILE_MENU_ENTRY_KIND, FILE_MENU_LABELS, SAVE_AS_ERRORS, SPRITE_DOCUMENT_DEFAULT_NAME, buildFileMenuEntries(), isMenuDismissKey(), isOutsideMenu(), runSaveAs() (+9 more)

### Community 30 - "mascot-scene-state.ts"
Cohesion: 0.10
Nodes (33): AIR_BOLT_Y_OFFSET, CROUCH_HURTBOX_TOP_OFFSET_PX, DODGE_CLEARANCE_PX, DODGE_HOP_HEIGHT_PX, ENEMY_BOLT_OFFSCREEN_X, ENEMY_KNOCKBACK_PX, GROUND_BOLT_Y_OFFSET, GROUND_ENEMY (+25 more)

### Community 31 - "WasmPixelCore"
Cohesion: 0.17
Nodes (4): DispatchResult, clampRectToCanvas(), decodeNames(), WasmPixelCore

### Community 32 - "history.rs"
Cohesion: 0.15
Nodes (25): bytes_of_frame(), bytes_of_snapshot(), DocSnapshotRecord, entry_bytes(), eviction_drops_oldest_first_once_budget_exceeded(), eviction_enforces_max_entries(), eviction_never_drops_the_just_pushed_entry_even_if_it_alone_exceeds_budget(), FrameRecord (+17 more)

### Community 33 - "pixellab-animate-harness.ts"
Cohesion: 0.13
Nodes (18): args, BackgroundJob, Base64Image, benchmarkable, CaseResult, framesArg, getBalance(), HarnessCase (+10 more)

### Community 34 - "sprite-pipeline.ts"
Cohesion: 0.11
Nodes (29): AI_SPRITE_DEFAULT_SIZE, RETRO_DIFFUSION_ROUTE, base64ToNativePixels(), decodeGeneratedSprite(), estimateRetroDiffusionCost(), generateSpriteWithRetroDiffusion(), postToRetroDiffusion(), asKernelView() (+21 more)

### Community 35 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, babel-plugin-react-compiler, fake-indexeddb, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+13 more)

### Community 36 - "useAnimateTab.hook.ts"
Cohesion: 0.06
Nodes (48): ANIMATION_ALREADY_RUNNING_ERROR, ANIMATION_ELAPSED_TICK_MS, ANIMATION_FRAME_OPTIONS, ANIMATION_FRAMES_INVALID_ERROR, ANIMATION_FRAMES_OVER_BUDGET_ERROR, ANIMATION_GENERATING_HINT, ANIMATION_GENERATING_LABEL, ANIMATION_NOT_SQUARE_ERROR (+40 more)

### Community 37 - "useCreateSound.hook.ts"
Cohesion: 0.10
Nodes (31): DEFAULT_SOUND_KIND, DUPLICATE_NAME_SUFFIX, ELEVENLABS_DEFAULT_VOICE_ID, MODE_TO_TAG, MPEG_MIME_TYPE, PRESET_PREVIEW_DEBOUNCE_MS, PRESET_PREVIEW_DURATION_S, PRESET_TILES (+23 more)

### Community 38 - "audio-storage.service.ts"
Cohesion: 0.24
Nodes (6): AUDIO_STORAGE_BUCKET, buildFilePath(), generateId(), StorageError, uploadAudio(), UploadResult

### Community 39 - "file-menu.ts"
Cohesion: 0.07
Nodes (43): DIALOG_FOCUS_TRAP_KEY, FILE_EXTENSION_PATTERN, FILE_MENU_COPY, FILE_MENU_DISMISS_KEY, FILE_MENU_ITEM_IDS, IMPORT_FILE_ERROR_NOTICE_AUTO_DISMISS_MS, IMPORT_FILE_ERROR_NOTICE_COPY, IMPORT_SPRITE_SHEET_COPY (+35 more)

### Community 40 - "pixellab-job.ts"
Cohesion: 0.10
Nodes (25): handler(), json(), PIXELLAB_API_BASE, PIXELLAB_INPUT_FRAME_INDEX, PIXELLAB_JOB_FAILED_ERROR, PIXELLAB_JOB_ID_PARAM, PIXELLAB_JOB_ID_PATTERN, PIXELLAB_JOB_PATH (+17 more)

### Community 41 - "useImportSpriteSheet.hook.ts"
Cohesion: 0.18
Nodes (20): IMPORT_SPRITE_SHEET_ERRORS, SPRITE_ANIMATION, SPRITE_IMPORT_MAX_FRAMES, pixelBufferToDataUri(), decodeSheet(), decodeSingle(), FILE_READERS, isValidFrameCount() (+12 more)

### Community 42 - "BottomPanel.tsx"
Cohesion: 0.17
Nodes (10): BottomPanel(), ICON_MAP, AssetFolderTree(), AssetGrid(), AssetsPanel(), AssetsPanelProps, FrameThumbnail, FrameThumbnailProps (+2 more)

### Community 43 - "useSoundsStore"
Cohesion: 0.11
Nodes (22): DEFAULT_VOLUME, SOUNDS_STORE_KEY, LIBRARY_FILTERS, NEW_SOUND_AUTOFOCUS, SOUND_NAME_MAX_LENGTH, VOLUME_RANGE, useSoundEditorLayout(), LibraryFilters() (+14 more)

### Community 44 - "wasm-core.ts"
Cohesion: 0.13
Nodes (17): here, sourceCanvas, wasmPath, isWasmRuntimeError(), resetLoadFailureLogForTests(), resetRuntimeTrapDemotionForTests(), resolveKernels(), here (+9 more)

### Community 45 - "src-ts/ts-core.ts"
Cohesion: 0.15
Nodes (24): buildPalette(), diffRect(), dist2(), dominantColor(), downscale(), DownscaleBucket, extractRect(), fillSpanRow() (+16 more)

### Community 46 - "quantize.oracle-parity.test.ts"
Cohesion: 0.12
Nodes (15): coreEntryPath, coreRoot, KernelRow, kernelRows, pkgJsPath, require, wasmPath, coreEntryPath (+7 more)

### Community 47 - "prefs.store.ts"
Cohesion: 0.16
Nodes (14): SPRITE_EDITOR_CANVAS, PREFS_STORAGE_KEY, getDrawOffset(), GridOverlay(), GridOverlayProps, createIntegrationsSlice(), IntegrationsSlice, ADR-0009 (+6 more)

### Community 48 - "useSoundDetailHeader.hook.ts"
Cohesion: 0.12
Nodes (27): IMPORT_ACCEPT, IMPORT_ALLOWED_EXTENSIONS, IMPORT_ALLOWED_MIME_TYPES, NAME_VISIBLE_TAIL_LENGTH, SOUND_LIBRARY_ERRORS, SOUND_DRAG_MIME, getAssetKind(), getAssetKindLabel() (+19 more)

### Community 49 - "useDeleteAccountDialog.hook.ts"
Cohesion: 0.16
Nodes (16): DeleteAccountDialog(), DeleteAccountDialogProps, getFocusable(), useDeleteAccountDialog(), UseDeleteAccountDialogProps, AccountDeletedNotice(), useAccountDeletedNotice(), EditorLayout() (+8 more)

### Community 50 - "focus-ring.ts"
Cohesion: 0.09
Nodes (34): GoogleButtonProps, GoogleIcon(), DISABLED_STATE, FOCUS_RING, MOTION, SoundEditorLayout(), DeleteSoundDialog(), DescribeWithAISection() (+26 more)

### Community 51 - "downscale.rs"
Cohesion: 0.16
Nodes (21): FnMut, alpha_127_vs_128_falls_on_opposite_sides_of_the_fallback_core_threshold(), BucketStats, build(), cell_range(), cell_range_never_overflows_for_u32_range_inputs_even_on_a_simulated_32_bit_width(), does_not_vanish_a_uniformly_semi_transparent_image(), dominant_color() (+13 more)

### Community 52 - "server-animation-sync.ts"
Cohesion: 0.09
Nodes (31): AI_JOB_FRAME_EXTENSION, AI_JOB_FRAME_INDEX_PAD, AI_JOB_STATUS_COMPLETED, AI_JOBS_STORAGE_BUCKET, SERVER_ANIMATION_SYNC_LIMIT, createSyncDeps(), ADR-0009, useServerAnimationSync() (+23 more)

### Community 53 - "useAssetsPanel.hook.ts"
Cohesion: 0.10
Nodes (24): DEFAULT_ASSET_TYPE, buildAssetLibraryItems(), ADR-0010, ADR-0011, composeHorizontalSheet(), computeHorizontalSheetLayout(), ADR-0009, downloadFromHref() (+16 more)

### Community 54 - "sound-timeline.slice.ts"
Cohesion: 0.14
Nodes (29): EMPTY_HISTORY, isSameSnapshot(), purgeAssetFromHistory(), pushHistory(), redoHistory(), TimelineHistory, undoHistory(), withoutAsset() (+21 more)

### Community 55 - "animation.types.ts"
Cohesion: 0.12
Nodes (21): ReferenceChipProps, AIJobsState, IDLE_ANIMATE_JOB, IDLE_JOB, ADR-0009, ADR-0011, AIJob, GenerateResult (+13 more)

### Community 56 - "mascot-scene.ts"
Cohesion: 0.17
Nodes (20): AIR_ENEMY, PARTICLE_BURST, PARTICLE_GRAVITY, PARTICLE_SPREAD_PX, PLATFORM, PLATFORM_Y, SQUASH_OFFSET_PX, SUBTITLE_BASELINE_Y (+12 more)

### Community 57 - "useSettingsPanel.hook.ts"
Cohesion: 0.20
Nodes (16): useSettingsPanel(), UseSettingsPanelResult, API_KEY_HELP_URL, API_KEY_PROVIDER, API_KEY_SAVED_FEEDBACK_MS, ElevenLabsError, generateMusic(), generateSFX() (+8 more)

### Community 58 - "PropertiesTab.tsx"
Cohesion: 0.20
Nodes (11): CollapsibleSection(), CollapsibleSectionProps, useCollapsibleSection(), OpacitySlider(), OpacitySliderProps, PropertiesTab(), usePropertiesTab(), UsePropertiesTabReturn (+3 more)

### Community 59 - "useCanvasInteraction.hook.ts"
Cohesion: 0.18
Nodes (16): CANVAS_SIZE_OPTIONS, isCanvasBlank(), isLayerDataBlank(), ADR-0008, useCanvasSizePopover(), bresenhamLine(), KonvaPointerEvent, useCanvasInteraction() (+8 more)

### Community 60 - "quantize.rs"
Cohesion: 0.24
Nodes (19): alpha_threshold_boundary_is_inclusive_on_the_high_side(), build(), build_palette(), Centroid, colors_zero_still_yields_one_centroid_not_zero(), dist2(), keeps_fully_transparent_pixels_transparent(), nearest() (+11 more)

### Community 61 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, colord, idb, konva, @pixelforge/core, react-dom, react-konva, react-router-dom (+13 more)

### Community 62 - "pixellab-animation.service.ts"
Cohesion: 0.15
Nodes (17): ANIMATION_GENERIC_ERROR, PIXELLAB_ANIMATE_ROUTE, PIXELLAB_JOB_ROUTE, PIXELLAB_KEY_HEADER, AnimationProviderError, ADR-0009, createPixelLabAnimationProvider(), KNOWN_SERVER_ERROR_CODES (+9 more)

### Community 63 - "SoundList.tsx"
Cohesion: 0.31
Nodes (6): LibraryEmptyState(), LibraryEmptyStateProps, PendingSoundRow(), PendingSoundRowProps, SoundList(), LibraryEmptyVariant

### Community 64 - "collect-ai-jobs/index.ts"
Cohesion: 0.16
Nodes (19): Admin, AiJobRow, assetName(), collectOne(), decodeBase64(), describeDetail(), fetchPixelLabJob(), frameFileName() (+11 more)

### Community 65 - "types/audio.ts"
Cohesion: 0.14
Nodes (23): GENERATION_HISTORY_LIMIT, TRACK_COLOR, TRACK_KIND_ICON, TRACK_KIND_OPTIONS, createAudioLibrarySlice(), AudioLibrarySlice, AudioPlaybackSlice, AudioUISlice (+15 more)

### Community 66 - "PixelForge IA (root README)"
Cohesion: 0.12
Nodes (16): cargo-deny advisories/bans/licenses check, packages/core/pkg drift check, CI job: packages/core (Rust/Wasm), Wasm gzip size budget (<150KB), Editor environment variables, VITE_PIXEL_CORE / pf:core override, apps/landing README env vars, Hexagonal architecture / Ports & Adapters (+8 more)

### Community 67 - "ts-core.judgment-day-round3.test.ts"
Cohesion: 0.14
Nodes (18): DirtyRect, FrameId, LayerId, LayerMetaPatch, LayerRef, SerializedFrame, SerializedLayer, ADR-0008 (+10 more)

### Community 68 - "timeline-player.ts"
Cohesion: 0.13
Nodes (20): GAIN_SMOOTHING_S, MIX_EXPORT, PLAYBACK_SCHEDULE_LEAD_S, clipEnd(), dbToGain(), effectiveGain(), hasSoloTrack(), buildMixGraph() (+12 more)

### Community 69 - "AudioAsset"
Cohesion: 0.12
Nodes (20): AI_KIND_OPTIONS, TAG_TO_MODE, formatDuration(), pad2(), VariationCard(), useVariationsPanel(), VariationsPanel(), VariationsPanelProps (+12 more)

### Community 70 - "audio-engine.test.ts"
Cohesion: 0.33
Nodes (11): createMockAnalyserNode(), createMockAudioBuffer(), createMockBiquadFilterNode(), createMockBufferSourceNode(), createMockContextInstance(), createMockGainNode(), createMockOfflineInstance(), createMockOscillatorNode() (+3 more)

### Community 71 - "document-persistence.controller.wasm-gate.test.ts"
Cohesion: 0.33
Nodes (5): emptyPayload(), fakeStorage, makeFakeStore(), mockResolveCoreImpl, mockWaitForWasmModule

### Community 72 - "useBottomToolbar.hook.ts"
Cohesion: 0.12
Nodes (24): SPRITE_EDITOR_TOOLS, useColorPalette(), ColorPicker, ActiveColorType, hexToRgba(), rgbaToHex(), useColorPicker(), BottomToolbar() (+16 more)

### Community 73 - "Phase 4: packages/core Rust Scaffold"
Cohesion: 0.13
Nodes (15): Phase 4 Wasm vs TS Kernel Bench (Near-Memcpy Loss), Phase 7g Store-Loop Bench Result (Wasm Slower Unbatched), D1: Flat RGBA Buffer Decision, D2: Copy-on-Write Mutation Decision, D5: Two Seams (PixelKernels/PixelCore) Decision, PixelKernels Interface, Local Draft Recovery Requirement, Wasm Artifact Size Budget Requirement (+7 more)

### Community 74 - "color-utils.ts"
Cohesion: 0.26
Nodes (9): SPRITE_EDITOR_COLORS, hexToHsv(), hexToRgba(), hsvToHex(), getDrawOffset(), GridBackground(), GridBackgroundProps, renderCheckerboardToCanvas() (+1 more)

### Community 75 - "mascot-city.ts"
Cohesion: 0.19
Nodes (15): computePlanePosition(), drawBuildingLayer(), drawBuildingWindows(), drawCityBackground(), drawGeometry(), drawPlane(), GEOMETRY_SHAPES, hashSeed() (+7 more)

### Community 76 - "tokens/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, exports, ./colors, ./tokens.css, typescript, vitest (+9 more)

### Community 77 - "lib/timeline-view.ts"
Cohesion: 0.18
Nodes (19): CLIP_WAVE, TIMELINE_LAYOUT, clipAriaLabel(), clipBarCount(), clipPeaks(), clipUsageMessage(), formatTickLabel(), rulerMajorStep() (+11 more)

### Community 78 - "useGeneratePanel"
Cohesion: 0.31
Nodes (8): INSPECTOR_TABS, useGeneratePanel(), useInspector(), useFocusPromptRequest(), useInspectorTab(), useOpenSettings(), useRetroDiffusionApiKey(), useSetInspectorTab()

### Community 79 - "sprite-save-as"
Cohesion: 0.40
Nodes (4): Log, Specs, sprite-save-as, Tasks

### Community 80 - "scripts"
Cohesion: 0.07
Nodes (26): @changesets/cli, devDependencies, @changesets/cli, typescript, typescript, license, name, packageManager (+18 more)

### Community 82 - "wasm-pixel-core.differential.fuzz.test.ts"
Cohesion: 0.06
Nodes (30): here, makeDoc(), pkgAvailable, pkgDir, RED, SCENARIOS, STROKE_POINTS, wasmJsPath (+22 more)

### Community 83 - "DocumentRepository port"
Cohesion: 0.15
Nodes (13): DocumentRepository port (load/save/remove), D12: local-first, cloud sync deferred, document-persistence.controller.ts, indexeddb-document.repository.service.ts, Local-first persistence, DocumentRepository port (diagram node), IndexedDB adapter (diagram node, DEFAULT), Supabase project sync (diagram node, planned) (+5 more)

### Community 84 - "Synthetic Architect design system"
Cohesion: 0.18
Nodes (13): clean-code-agent, design-agent, frontend-agent, graphify knowledge graph rules, CLAUDE.md (root), src/constants/COLORS.ts (canvas mirror), Component conventions, src/app/globals.css (source of truth) (+5 more)

### Community 85 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, bench, build, dev, preview, test, test:watch, typecheck

### Community 86 - "core/history.ts"
Cohesion: 0.15
Nodes (22): RenderPixelsToCanvasOptions, bytesOfFrame(), bytesOfSnapshot(), canRedo(), canUndo(), createHistory(), entryBytes(), HISTORY_MAX_BYTES (+14 more)

### Community 87 - "animation-history.ts"
Cohesion: 0.32
Nodes (10): ANIMATION_HISTORY_LIMIT, ANIMATION_HISTORY_STORAGE_KEY, ANIMATION_PIPELINE_VERSION, isNonEmptyString(), isPngDataUri(), isPositiveFiniteNumber(), normalizeAnimation(), parseAnimationHistory() (+2 more)

### Community 88 - "Animation flow (PixelLab)"
Cohesion: 0.22
Nodes (11): Animation flow (PixelLab), buildAnimationAction, Sprite Generation with Retro Diffusion, PixelLab animation adapter, ANIMATION_HARNESS motion catalogue, AnimationProvider port, buildAnimationAction, buildPrompt rules-first pattern (+3 more)

### Community 89 - "include"
Cohesion: 0.12
Nodes (15): compilerOptions, paths, plugins, target, exclude, extends, include, node_modules (+7 more)

### Community 90 - "Zustand store (diagram node)"
Cohesion: 0.33
Nodes (7): D10: packages/tokens source-exported, no build step, packages/tokens, apps/landing (diagram node), Hooks layer (diagram node), packages/tokens (diagram node), UI layer (diagram node), Zustand store (diagram node)

### Community 91 - "Five-phase scaling plan"
Cohesion: 0.15
Nodes (13): architecture-decision skill, ADR 0006 (sprite drafts repository, cited), Audio chunking (10s segments), List virtualization, LRU cache + memory budget, Deferred: scaling the sound editor, Five-phase scaling plan, Repository pattern for audio persistence (+5 more)

### Community 92 - "Phase 7: Rust Document/History"
Cohesion: 0.14
Nodes (18): Phase 7 Document/PixelCore Bench Result, D3: Core Owns Document Decision, D6: Flat Rust API, No Serde Decision, D7: Wasm-Memory-Backed Views Decision, Default Core Implementation Stays TS Decision, Rust Document Struct, PixelCore Interface, TrapSafePixelCore (+10 more)

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

### Community 97 - "TweakPanel.tsx"
Cohesion: 0.16
Nodes (12): TransportProps, FILTER_LABELS, FilterControls(), useFilterControls(), TweakPanel(), TweakPanelProps, TweakSlider(), TweakSliderProps (+4 more)

### Community 98 - "useMixExport.hook.ts"
Cohesion: 0.14
Nodes (18): WAV_EXTENSION, createAudioObjectUrl(), encodeWav(), floatToInt16(), MockAudioBuffer, writeString(), writeWavHeader(), downloadBlob() (+10 more)

### Community 99 - "Cancel an in-flight AI generation"
Cohesion: 0.13
Nodes (14): decodeGeneratedSprite, estimateRetroDiffusionCost, generateSpriteWithRetroDiffusion, No background removal rationale, Sprite flow, AI sprite variations, Retro Diffusion num_images parameter, Sprite Studio v3 Create (AI-first) Pencil frame (+6 more)

### Community 100 - "apps/editor/api/ai/ functions"
Cohesion: 0.13
Nodes (16): Vercel Functions (server-side key proxy), AI Setup & Usage guide, ElevenLabs AI sound generation, Retro Diffusion sprite/animation generation, apps/editor/api/ai/ functions, apps/editor/api/ai Vercel Functions proxy (diagram node), ElevenLabs API (diagram node), Retro Diffusion API (diagram node) (+8 more)

### Community 101 - "Phase 5: Rust Flood-Fill"
Cohesion: 0.19
Nodes (13): Phase 5 Flood-Fill Bench Result (2.3-2.6x, Target 3x Not Met), Phase 5f Scanline Bench Result (Ratio Narrows, Absolute Faster), Phase 6 Quantize/Downscale Bench Result, Scanline Span-Fill Rewrite (Phase 5f), Flood-Fill Performance Requirement, Phase 5: Rust Flood-Fill, Flat Table Replaces Per-Cell HashMap, No Recursion in Flood-Fill (Stack Overflow Risk) (+5 more)

### Community 102 - "animation-polling.ts"
Cohesion: 0.17
Nodes (12): ANIMATION_HINT_SEPARATOR, ANIMATION_QUEUE_POSITION_PREFIX, ANIMATION_SECONDS_PER_MINUTE, ANIMATION_WAIT_PREFIX, ANIMATION_WAIT_SUFFIX, AnimationPollDeps, formatAnimationProgressHint(), pollAnimationJob() (+4 more)

### Community 103 - "compilerOptions"
Cohesion: 0.11
Nodes (18): esnext, compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module (+10 more)

### Community 104 - "ai-generation.ts"
Cohesion: 0.13
Nodes (15): AI_QUALITY_SAMPLE_COPY_FEEDBACK_MS, AI_QUALITY_SAMPLE_PROMPT, QualitySamplePreviewProps, UseQualitySamplePreviewParams, AnimateResult, GameTemplateId, QualityRecommendation, QualityTierConfig (+7 more)

### Community 105 - "LeftSidebar.tsx"
Cohesion: 0.27
Nodes (6): LeftSidebar(), LayerItem(), LayerItemProps, useLayerItem(), UseLayerItemProps, LayerPanel()

### Community 106 - "computeMascotSceneState"
Cohesion: 0.18
Nodes (16): MascotScene(), useMascotScene(), UseMascotSceneResult, clamp01(), computeAirDodgeOffset(), computeBolt(), computeEnemy(), computeLevelWipeY() (+8 more)

### Community 107 - "devDependencies"
Cohesion: 0.05
Nodes (40): dependencies, lucide-react, next, @pixelforge/tokens, react, react-dom, devDependencies, babel-plugin-react-compiler (+32 more)

### Community 108 - "useSoundList.hook.ts"
Cohesion: 0.19
Nodes (14): DELETE_SOUND_KEYS, SOUND_KIND_LABELS, ADD_TO_TIMELINE_KEY, OPEN_SOUND_KEY, filterAssets(), getRowAssetId(), isNavigationKey(), isTextEntry() (+6 more)

### Community 109 - "wasm-document-core.test.ts"
Cohesion: 0.22
Nodes (7): setIdSeed(), baseDoc(), emptyBuffer(), freshDoc(), here, pkgAvailable, wasmPath

### Community 110 - "mascot-font.ts"
Cohesion: 0.21
Nodes (12): rgbaToString(), GLYPH_FONT, GLYPH_SIZE, GLYPH_SPACING, SUBTITLE_TEXT, TITLE_TEXT, drawGlyph(), drawGlyphGlow() (+4 more)

### Community 111 - "elevenlabs.ts"
Cohesion: 0.29
Nodes (7): ElevenLabsMode, handler(), isValidMode(), json(), proxyToElevenLabs(), RequestBody, VALID_MODES

### Community 112 - "useDocumentPersistence.hook.ts"
Cohesion: 0.22
Nodes (10): DOCUMENT_AUTOSAVE_DEBOUNCE_MS, useDocumentPersistence(), UseDocumentPersistenceResult, DocumentPersistenceController, FlushFn, registerDocumentPersistenceFlush(), createInMemoryDocumentRepository(), createIndexedDbDocumentRepository() (+2 more)

### Community 113 - "persistence.ts"
Cohesion: 0.25
Nodes (9): DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION, DOCUMENT_STORE_NAME, LOCAL_DRAFT_DOCUMENT_ID, SPRITE_EDITOR_STORAGE_KEY, ADR-0009, PixelForgeDB, DocumentId (+1 more)

### Community 114 - "constants/timeline-view.ts"
Cohesion: 0.07
Nodes (45): ALT_KEY, ALT_KEY_LABEL, CLIP_KEY_SHORTCUTS, CLOCK_CENTISECONDS, FILES_DRAG_TYPE, MAC_PLATFORM_PATTERN, MOD_KEY, MOD_KEY_LABEL (+37 more)

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

### Community 120 - "useClipInspector.hook.ts"
Cohesion: 0.25
Nodes (11): CLIP_INSPECTOR, PLAYHEAD_LARGE_STEP_MULTIPLIER, formatSeconds(), timelineDuration(), buildSliders(), formatFade(), formatGain(), formatSpeed() (+3 more)

### Community 121 - "TimelineEditor.tsx"
Cohesion: 0.22
Nodes (9): formatClock(), pad2(), ClipInspector(), TimelineEditor(), useTimelineEditor(), TimelineTopBar(), TimelineTransport(), TimelineTransportProps (+1 more)

### Community 122 - "Phased Migration Approach (0-7)"
Cohesion: 0.13
Nodes (16): D9: Commit pkg/, CI Rebuild-Diff Decision, Sound Editor Feature-Parity Checklist, Sprite Editor Feature-Parity Checklist, core-parity-gate Capability, Rust/Wasm Core Migration Intent, Phased Migration Approach (0-7), Commit pkg/ + CI Rebuild-Diff Decision, workspace-build Capability (+8 more)

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
Cohesion: 0.12
Nodes (17): MASCOT_ARMS, MASCOT_COLORS, MASCOT_LEGS, MASCOT_SPRITE_SIZE, drawBlaster(), drawMascot(), FillRectCall, BlasterBoltState (+9 more)

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
Cohesion: 0.25
Nodes (8): Phase 0 TS Baseline Benchmarks, pixel-core Capability, Full Canvas Repaint Performance Requirement, Implementation-Agnostic Pixel Operations Requirement, Lossless Pixel Round-Trip Requirement, Judgment-Day Blind-Judge Review Process, Phase 6: Rust Quantize/Downscale, f64 Is Bit-Identical to JS number

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
Cohesion: 0.26
Nodes (8): CURSOR_POSITION_FALLBACK, SPRITE_EDITOR_VIEWPORT, CanvasOverlay(), useCanvasOverlay(), PositionFields(), usePositionFields(), UsePositionFieldsReturn, useCursorPixel()

### Community 139 - "2026-10-11 — Resizing a sprite without losing its layers"
Cohesion: 0.22
Nodes (8): 2026-10-11 — Resizing a sprite without losing its layers, Decision and why, Lessons, Resizing a sprite without losing its layers, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What was researched

### Community 140 - "core/tsconfig.json"
Cohesion: 0.18
Nodes (10): compilerOptions, composite, outDir, exclude, extends, include, node_modules, ../../tsconfig.base.json (+2 more)

### Community 141 - "pixel-parity.test.ts"
Cohesion: 0.18
Nodes (11): buf(), cases, here, maze(), ParityCase, pkgAvailable, readPixel(), rgba() (+3 more)

### Community 142 - "legacy-draft-migration.service.ts"
Cohesion: 0.17
Nodes (13): DOCUMENT_SCHEMA_VERSION, waitForWasmModule(), startDocumentPersistence(), LegacyFrame, LegacyLayer, legacyLayerToPayload(), LegacyMigrationResult, LegacyPersistedState (+5 more)

### Community 143 - "RgbaColor"
Cohesion: 0.33
Nodes (8): rgbaToHex(), ColorPalette(), ColorSwatch(), ColorSwatchProps, useColorSwatch(), UseColorSwatchParams, UseColorSwatchReturn, RgbaColor

### Community 144 - "QualitySamplePreview.tsx"
Cohesion: 0.19
Nodes (10): ModalPortal(), ModalPortalProps, ApiKeyField(), ApiKeyFieldProps, useApiKeyField(), UseApiKeyFieldResult, SettingsPanel(), SettingsPanelProps (+2 more)

### Community 145 - "editor/package.json"
Cohesion: 0.40
Nodes (4): license, name, private, version

### Community 146 - "quantize.ts"
Cohesion: 0.33
Nodes (9): QUANTIZE_DEFAULTS, buildPalette(), Centroid, dist2(), nearest(), quantizePixels(), saturation(), WeightedPoint (+1 more)

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

### Community 238 - "ai-jobs.store.test.ts"
Cohesion: 0.20
Nodes (9): AI_JOBS_STORAGE_KEY, IDLE, IDLE_ANIMATE, PENDING, PROCESSING, REFERENCE, storage, ADR-0009 (+1 more)

### Community 239 - "0010 — The canvas is always a named Assets item"
Cohesion: 0.20
Nodes (9): 0010 — The canvas is always a named Assets item, Consequences, Context, Decision, Implementation plan, Out of scope (this plan), Phase 1 — `Save As…` creates a named, typed Assets item, Phase 2 — Rename and recategorize an existing Assets item (+1 more)

### Community 241 - "PixelForge IA (AGENTS.md)"
Cohesion: 0.25
Nodes (9): apps/editor, apps/landing, Future improvements deferral rule, packages/core (Rust/Wasm), packages/tokens, PixelForge IA (AGENTS.md), @pixelforge/editor README, api/ai/*.ts Vercel Functions (+1 more)

### Community 242 - "2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go"
Cohesion: 0.25
Nodes (7): 2026-10-14 — The canvas is a draft, Assets is the library: why "Save As" had nowhere to go, Options and tradeoffs, Result, The problem (one paragraph, no jargon), What I decided and why, What I learned, What I researched

### Community 243 - "document-persistence.controller.ts"
Cohesion: 0.29
Nodes (8): DocumentPersistenceStoreApi, NOOP_CONTROLLER, emptyPayload(), fakeStorage, makeFakeStore(), DocumentStatusSlice, DocStatus, SaveStatus

### Community 247 - "installFakeDom"
Cohesion: 1.00
Nodes (3): installFakeDom(), makeFakeCanvas(), makeFakeCanvasContext()

### Community 248 - "kernels.ts"
Cohesion: 0.33
Nodes (5): resolveCoreImpl(), ensureWasmResolving(), getActiveKernels(), getActiveKernelsAsync(), mockGetPixelCoreEnvOverride

### Community 249 - "PixelLab adapter"
Cohesion: 0.25
Nodes (9): Async job pattern, PixelLab adapter, Retro Diffusion animation adapter (removed), public.ai_jobs table + RLS, collect-ai-jobs Edge Function, Deploy: server-owned animation jobs, pg_cron collect-ai-jobs job, PIXELLAB_API_KEY (+1 more)

### Community 250 - "wasm-pixel-core.undo-memory.baseline.test.ts"
Cohesion: 0.25
Nodes (7): here, makeDoc(), pkgAvailable, pkgDir, RED, wasmJsPath, wasmPath

### Community 251 - "doc.resize command"
Cohesion: 0.32
Nodes (8): ADR 0003 dirty-rect undo history (cited), Command pattern (inverse operation), Option C: store only cut strips, doc.replace command, doc.resize command, GIMP tile-based undo, History budget (32 MiB / 50 entries), Memento pattern (delta only)

### Community 252 - "Four-step dark ladder palette"
Cohesion: 0.33
Nodes (6): DESIGN.md vs tokens.css conflict note, Accent token system, AI accent (violet) reserved for AI surfaces, Four-step dark ladder palette, Blue-tinted neutral surfaces rationale, --pf-* CSS custom properties

### Community 253 - "DocumentRepository"
Cohesion: 0.40
Nodes (3): DocumentPersistenceDeps, ResolvedDocumentRepository, DocumentRepository

### Community 254 - "VariationCard.tsx"
Cohesion: 0.60
Nodes (4): TONE_CLASSES, VariationCardProps, VariationCardState, VariationCardTone

### Community 255 - "useColorInputs.hook.ts"
Cohesion: 0.67
Nodes (3): useColorInputs(), UseColorInputsParams, useSaveColor()

## Ambiguous Edges - Review These
- `ADR 0004: Rust/Wasm boundary shape` → `src-ts/resolve-core.ts module`  [AMBIGUOUS]
  docs/adr/0004-rust-wasm-boundary-shape.md · relation: references

## Knowledge Gaps
- **846 isolated node(s):** `UseAnimateTabReturn`, `ADR-0012`, `ADR-0011`, `ADR-0009`, `FILE_READERS` (+841 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1096 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ADR 0004: Rust/Wasm boundary shape` and `src-ts/resolve-core.ts module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `FOCUS_RING` connect `focus-ring.ts` to `TweakPanel.tsx`, `AudioAsset`, `file-menu.ts`, `LeftSidebar.tsx`, `constants/audio.ts`, `useSoundsStore`, `BottomPanel.tsx`, `animation.ts`, `QualitySamplePreview.tsx`, `useDeleteAccountDialog.hook.ts`, `useSoundDetailHeader.hook.ts`, `Inspector.tsx`, `ColorPicker.tsx`, `useClipInspector.hook.ts`, `auth.service.ts`, `PropertiesTab.tsx`, `VariationCard.tsx`, `SoundList.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `MOTION` connect `focus-ring.ts` to `TweakPanel.tsx`, `file-menu.ts`, `LeftSidebar.tsx`, `BottomPanel.tsx`, `animation.ts`, `useTimelineClip.hook.ts`, `QualitySamplePreview.tsx`, `useDeleteAccountDialog.hook.ts`, `useSoundDetailHeader.hook.ts`, `Inspector.tsx`, `ColorPicker.tsx`, `auth.service.ts`, `VariationCard.tsx`, `SoundList.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `PixelKernels` connect `PixelKernels` to `src/types/index.ts`, `wasm-core.ts`, `pixel-parity.test.ts`, `src-ts/ts-core.ts`, `src-ts/index.ts`, `kernels.ts`, `quantize-downscale.fuzz.test.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `UseAnimateTabReturn`, `ADR-0012`, `ADR-0011` to the rest of the system?**
  _846 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `document.rs` be split into smaller, more focused modules?**
  _Cohesion score 0.062291757207011446 - nodes in this community are weakly interconnected._
- **Should `createEmptyBuffer` be split into smaller, more focused modules?**
  _Cohesion score 0.06759259259259259 - nodes in this community are weakly interconnected._