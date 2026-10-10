/* @ts-self-types="./pixelforge_core.d.ts" */

/**
 * The Wasm-exposed `Document` handle. Holds the ENTIRE document (frames,
 * layers, pixel buffers) in Wasm linear memory — `readLayer`/`exportPixels`
 * are the only ways pixel bytes ever leave it, and both always COPY (D7: a
 * view into Wasm memory is invalidated by the next call that might grow
 * that memory).
 */
export class WasmDocument {
    static __wrap(ptr) {
        const obj = Object.create(WasmDocument.prototype);
        obj.__wbg_ptr = ptr;
        WasmDocumentFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmDocumentFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmdocument_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    can_redo() {
        const ret = wasm.wasmdocument_can_redo(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    can_undo() {
        const ret = wasm.wasmdocument_can_undo(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * TEST-ONLY (phase 7f). Deliberately panics — with this crate's
     * `panic = "abort"` release profile, that compiles to a Wasm
     * `unreachable` trap, i.e. a REAL `WebAssembly.RuntimeError`, not a
     * simulated one. Exists purely so JS-side tests can reproduce the
     * actual wasm-bindgen post-trap behavior (the generated glue sets a
     * "this object is currently borrowed" flag before entering any `&self`/
     * `&mut self` method and only clears it on a NORMAL return — a trap
     * skips that cleanup, so the flag is stuck forever and every later call
     * on the SAME JS handle throws a plain `Error: recursive use of an
     * object detected which is already borrowed`, never another
     * `RuntimeError`) without relying on a slow/flaky genuine OOM. Never
     * called by production TS (`rg`-verified: only
     * `wasm-pixel-core-resolver.*.test.ts` and `wasm-document-core.test.ts`
     * reference it).
     */
    debug_force_trap() {
        wasm.wasmdocument_debug_force_trap(this.__wbg_ptr);
    }
    /**
     * @param {number} canvas_w
     * @param {number} canvas_h
     * @param {number} frame_count
     * @param {number} frame_duration_ms
     * @param {Uint8Array} pixels
     * @param {string} label
     * @returns {Uint32Array}
     */
    doc_replace(canvas_w, canvas_h, frame_count, frame_duration_ms, pixels, label) {
        const ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_doc_replace(this.__wbg_ptr, canvas_w, canvas_h, frame_count, frame_duration_ms, ptr0, len0, ptr1, len1);
        var v3 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v3;
    }
    /**
     * @returns {Uint8Array}
     */
    export_pixels() {
        const ret = wasm.wasmdocument_export_pixels(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} layer_id
     * @param {number} x
     * @param {number} y
     * @param {number} rgba
     * @param {string} label
     * @returns {Uint32Array}
     */
    fill(layer_id, x, y, rgba, label) {
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_fill(this.__wbg_ptr, layer_id, x, y, rgba, ptr0, len0);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @returns {Uint32Array}
     */
    frame_add() {
        const ret = wasm.wasmdocument_frame_add(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} at
     * @param {Uint32Array} layer_counts
     * @param {Uint32Array} durations
     * @param {Uint32Array} visible
     * @param {Uint32Array} locked
     * @param {Float64Array} opacity
     * @param {Uint32Array} name_lens
     * @param {Uint8Array} names_bytes
     * @param {Uint8Array} pixels
     * @returns {Uint32Array}
     */
    frame_paste(at, layer_counts, durations, visible, locked, opacity, name_lens, names_bytes, pixels) {
        const ptr0 = passArray32ToWasm0(layer_counts, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(durations, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray32ToWasm0(visible, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray32ToWasm0(locked, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF64ToWasm0(opacity, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passArray32ToWasm0(name_lens, wasm.__wbindgen_malloc);
        const len5 = WASM_VECTOR_LEN;
        const ptr6 = passArray8ToWasm0(names_bytes, wasm.__wbindgen_malloc);
        const len6 = WASM_VECTOR_LEN;
        const ptr7 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
        const len7 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_frame_paste(this.__wbg_ptr, at, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7);
        var v9 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v9;
    }
    /**
     * @param {number} index
     * @returns {Uint32Array}
     */
    frame_remove(index) {
        const ret = wasm.wasmdocument_frame_remove(this.__wbg_ptr, index);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} index
     * @returns {Uint32Array}
     */
    frame_select(index) {
        const ret = wasm.wasmdocument_frame_select(this.__wbg_ptr, index);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Imports a full document from the flat wire format. `undefined` on any
     * shape mismatch — a boundary-validated no-op, never a panic/throw. See
     * `Document::from_payload`'s doc for the exact `doc_meta` layout.
     * @param {Uint32Array} doc_meta
     * @param {Float64Array} layer_opacity
     * @param {Uint32Array} layer_name_lens
     * @param {Uint8Array} layer_names_bytes
     * @param {Uint8Array} pixels
     * @returns {WasmDocument | undefined}
     */
    static from_payload(doc_meta, layer_opacity, layer_name_lens, layer_names_bytes, pixels) {
        const ptr0 = passArray32ToWasm0(doc_meta, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(layer_opacity, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray32ToWasm0(layer_name_lens, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray8ToWasm0(layer_names_bytes, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_from_payload(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        return ret === 0 ? undefined : WasmDocument.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    history_bytes() {
        const ret = wasm.wasmdocument_history_bytes(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Uint32Array}
     */
    layer_add() {
        const ret = wasm.wasmdocument_layer_add(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} layer_id
     * @param {string | null} [name]
     * @param {boolean | null} [visible]
     * @param {boolean | null} [locked]
     * @param {number | null} [opacity]
     * @returns {Uint32Array}
     */
    layer_meta(layer_id, name, visible, locked, opacity) {
        var ptr0 = isLikeNone(name) ? 0 : passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_layer_meta(this.__wbg_ptr, layer_id, ptr0, len0, isLikeNone(visible) ? 0xFFFFFF : visible ? 1 : 0, isLikeNone(locked) ? 0xFFFFFF : locked ? 1 : 0, !isLikeNone(opacity), isLikeNone(opacity) ? 0 : opacity);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {number} layer_id
     * @returns {Uint32Array}
     */
    layer_remove(layer_id) {
        const ret = wasm.wasmdocument_layer_remove(this.__wbg_ptr, layer_id);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} from
     * @param {number} to
     * @returns {Uint32Array}
     */
    layer_reorder(from, to) {
        const ret = wasm.wasmdocument_layer_reorder(this.__wbg_ptr, from, to);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} layer_id
     * @returns {Uint32Array}
     */
    layer_set_active(layer_id) {
        const ret = wasm.wasmdocument_layer_set_active(this.__wbg_ptr, layer_id);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    meta_doc() {
        const ret = wasm.wasmdocument_meta_doc(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    meta_layer_name_lens() {
        const ret = wasm.wasmdocument_meta_layer_name_lens(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    meta_layer_names_bytes() {
        const ret = wasm.wasmdocument_meta_layer_names_bytes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Float64Array}
     */
    meta_layer_opacity() {
        const ret = wasm.wasmdocument_meta_layer_opacity(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * Fresh document: one frame, one default layer. Mirrors
     * `Document::new` — see that function's doc.
     * @param {number} canvas_w
     * @param {number} canvas_h
     */
    constructor(canvas_w, canvas_h) {
        const ret = wasm.wasmdocument_new(canvas_w, canvas_h);
        this.__wbg_ptr = ret;
        WasmDocumentFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Fix-agent 7g (item 3): see `Document::noop`'s doc.
     * @returns {Uint32Array}
     */
    noop() {
        const ret = wasm.wasmdocument_noop(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} frame_id
     * @param {number} layer_id
     * @returns {Uint8Array}
     */
    read_layer(frame_id, layer_id) {
        const ret = wasm.wasmdocument_read_layer(this.__wbg_ptr, frame_id, layer_id);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    redo() {
        const ret = wasm.wasmdocument_redo(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} layer_id
     * @param {number} rx
     * @param {number} ry
     * @param {number} rw
     * @param {number} rh
     * @returns {Uint32Array}
     */
    region_clear(layer_id, rx, ry, rw, rh) {
        const ret = wasm.wasmdocument_region_clear(this.__wbg_ptr, layer_id, rx, ry, rw, rh);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} layer_id
     * @param {number} rx
     * @param {number} ry
     * @param {number} rw
     * @param {number} rh
     * @param {Uint8Array} pixels
     * @returns {Uint32Array}
     */
    selection_commit(layer_id, rx, ry, rw, rh, pixels) {
        const ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_selection_commit(this.__wbg_ptr, layer_id, rx, ry, rw, rh, ptr0, len0);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {number} layer_id
     * @returns {Uint32Array}
     */
    stroke_begin(layer_id) {
        const ret = wasm.wasmdocument_stroke_begin(this.__wbg_ptr, layer_id);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {string} label
     * @returns {Uint32Array}
     */
    stroke_end(label) {
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_stroke_end(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {Int32Array} points
     * @param {number} rgba
     * @returns {Uint32Array}
     */
    stroke_points(points, rgba) {
        const ptr0 = passArray32ToWasm0(points, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_stroke_points(this.__wbg_ptr, ptr0, len0, rgba);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {number} fps
     * @returns {Uint32Array}
     */
    timeline_set_fps(fps) {
        const ret = wasm.wasmdocument_timeline_set_fps(this.__wbg_ptr, fps);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {Uint32Array} indices
     * @returns {Uint32Array}
     */
    timeline_set_frame_selection(indices) {
        const ptr0 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmdocument_timeline_set_frame_selection(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @returns {Uint32Array}
     */
    timeline_toggle_loop() {
        const ret = wasm.wasmdocument_timeline_toggle_loop(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    timeline_toggle_playback() {
        const ret = wasm.wasmdocument_timeline_toggle_playback(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    undo() {
        const ret = wasm.wasmdocument_undo(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) WasmDocument.prototype[Symbol.dispose] = WasmDocument.prototype.free;

/**
 * `true` iff two same-length byte slices hold identical values.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
export function bytes_equal(a, b) {
    const ptr0 = passArray8ToWasm0(a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.bytes_equal(ptr0, len0, ptr1, len1);
    return ret !== 0;
}

/**
 * Returns an independent copy of `data` — a `Vec<u8>` return is always
 * copied back to JS as a fresh `Uint8Array` (never a view).
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export function clone_buffer(data) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.clone_buffer(ptr0, len0);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * Bounding box of every differing byte between two same-sized buffers,
 * packed as `[x, y, w, h]` — `None` (JS: `undefined`) if they are identical.
 * @param {Uint8Array} before
 * @param {Uint8Array} after
 * @param {number} w
 * @param {number} h
 * @returns {Uint32Array | undefined}
 */
export function diff_rect(before, after, w, h) {
    const ptr0 = passArray8ToWasm0(before, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(after, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.diff_rect(ptr0, len0, ptr1, len1, w, h);
    let v3;
    if (ret[0] !== 0) {
        v3 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    }
    return v3;
}

/**
 * Majority-vote downscale from `src_w x src_h` to `target_w x target_h`
 * (phase 6, design.md "Lossless Pixel Round-Trip"). `None` (JS: `undefined`)
 * if `data`'s length doesn't match `src_w*src_h*4`, any dimension is zero,
 * or `target_w`/`target_h` exceeds `crate::downscale::
 * MAX_DOWNSCALE_TARGET_DIMENSION` (phase 6f boundary hardening — closes an
 * allocation-size overflow that used to trap the Wasm instance for an
 * individually-"valid" `u32` target, phase 6 review finding W-A). See
 * `crate::downscale` for the algorithm.
 * @param {Uint8Array} data
 * @param {number} src_w
 * @param {number} src_h
 * @param {number} target_w
 * @param {number} target_h
 * @returns {Uint8Array | undefined}
 */
export function downscale(data, src_w, src_h, target_w, target_h) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.downscale(ptr0, len0, src_w, src_h, target_w, target_h);
    let v2;
    if (ret[0] !== 0) {
        v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

/**
 * Copies `rect` (`rx, ry, rw, rh`) out of `data` as a tightly-packed RGBA
 * byte vec. `None` if the rect doesn't fit the buffer.
 * @param {Uint8Array} data
 * @param {number} w
 * @param {number} h
 * @param {number} rx
 * @param {number} ry
 * @param {number} rw
 * @param {number} rh
 * @returns {Uint8Array | undefined}
 */
export function extract_rect(data, w, h, rx, ry, rw, rh) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.extract_rect(ptr0, len0, w, h, rx, ry, rw, rh);
    let v2;
    if (ret[0] !== 0) {
        v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

/**
 * 4-connected flood fill (phase 5, design.md's Rust surface), in place.
 * Returns the dirty rect packed as `[x, y, w, h]` — `None` (JS: `undefined`)
 * if nothing changed: an invalid buffer shape, an out-of-bounds seed, or a
 * seed pixel that already matches `rgba`. See `crate::flood_fill` for the
 * algorithm (stack-based, no recursion, bounded memory).
 * @param {Uint8Array} data
 * @param {number} w
 * @param {number} h
 * @param {number} x
 * @param {number} y
 * @param {number} rgba
 * @returns {Uint32Array | undefined}
 */
export function flood_fill(data, w, h, x, y, rgba) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.flood_fill(ptr0, len0, data, w, h, x, y, rgba);
    let v2;
    if (ret[0] !== 0) {
        v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    }
    return v2;
}

/**
 * Reads one pixel as a packed `u32` (R highest byte, A lowest — see
 * `pixels::pack_rgba`). Returns `0` (fully transparent black) for an
 * out-of-range coordinate — a boundary no-op, never a throw.
 * @param {Uint8Array} data
 * @param {number} w
 * @param {number} h
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function get_pixel(data, w, h, x, y) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.get_pixel(ptr0, len0, w, h, x, y);
    return ret >>> 0;
}

/**
 * Writes one pixel in place. A `&mut [u8]` argument is copied INTO Wasm
 * memory, mutated, then copied back OUT by wasm-bindgen's generated glue
 * (see `LEARNING.md`) — the caller's `Uint8ClampedArray` sees the write once
 * the call returns. A no-op (returns `false`) for an out-of-range coordinate.
 * @param {Uint8Array} data
 * @param {number} w
 * @param {number} h
 * @param {number} x
 * @param {number} y
 * @param {number} rgba
 * @returns {boolean}
 */
export function put_pixel(data, w, h, x, y, rgba) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.put_pixel(ptr0, len0, data, w, h, x, y, rgba);
    return ret !== 0;
}

/**
 * Writes every `(x, y)` pair in `points` (interleaved `i32`s) with `rgba`,
 * in ONE call — T1 (phase 4f): the batched replacement for a per-pixel
 * `put_pixel` loop crossing the FFI boundary once per point. Returns the
 * count of points actually written (out-of-range points are skipped, never
 * panic). `get_pixel`/`put_pixel` stay exported here (useful for Rust-side
 * tests/tools that want single-pixel access), but `src-ts/types.ts`'s
 * `PixelKernels` facade — the only thing `apps/editor` is meant to call —
 * no longer exposes them, steering callers to this batched kernel instead.
 * @param {Uint8Array} data
 * @param {number} w
 * @param {number} h
 * @param {Int32Array} points
 * @param {number} rgba
 * @returns {number}
 */
export function put_points(data, w, h, points, rgba) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray32ToWasm0(points, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.put_points(ptr0, len0, data, w, h, ptr1, len1, rgba);
    return ret >>> 0;
}

/**
 * Reduces `data`'s RGB palette to at most `colors` colors (phase 6, design.md
 * "Lossless Pixel Round-Trip"). A `Vec<u8>` return is always a fresh copy
 * back to JS (see `LEARNING.md`'s note on owned returns) — unlike the
 * in-place `&mut [u8]` kernels above, this always allocates a brand new
 * buffer, mirroring `quantizePixels`'s `cloneBuffer` + recolor shape.
 * `None` (JS: `undefined`) if `data`'s length isn't a whole number of RGBA
 * pixels, or `colors` exceeds `crate::quantize::MAX_QUANTIZE_COLORS` (phase
 * 6f boundary hardening — same convention `downscale` below documents). See
 * `crate::quantize` for the algorithm.
 * @param {Uint8Array} data
 * @param {number} colors
 * @param {boolean} weight_by_saturation
 * @param {number} iterations
 * @param {number} alpha_threshold
 * @returns {Uint8Array | undefined}
 */
export function quantize(data, colors, weight_by_saturation, iterations, alpha_threshold) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.quantize(ptr0, len0, colors, weight_by_saturation, iterations, alpha_threshold);
    let v2;
    if (ret[0] !== 0) {
        v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

/**
 * Writes `patch` into `rect` of `data`, in place. `false` (no-op) if the
 * rect doesn't fit the buffer or `patch`'s length doesn't match `rw*rh*4`.
 * @param {Uint8Array} data
 * @param {number} w
 * @param {number} h
 * @param {number} rx
 * @param {number} ry
 * @param {number} rw
 * @param {number} rh
 * @param {Uint8Array} patch
 * @returns {boolean}
 */
export function write_rect(data, w, h, rx, ry, rw, rh, patch) {
    var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(patch, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.write_rect(ptr0, len0, data, w, h, rx, ry, rw, rh, ptr1, len1);
    return ret !== 0;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_copy_to_typed_array_88899a52af046901: function(arg0, arg1, arg2) {
            new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
        },
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./pixelforge_core_bg.js": import0,
    };
}

const WasmDocumentFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdocument_free(ptr, 1));

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('pixelforge_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
