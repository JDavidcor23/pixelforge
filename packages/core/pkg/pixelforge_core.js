/* @ts-self-types="./pixelforge_core.d.ts" */

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
 * if `data`'s length doesn't match `src_w*src_h*4`, or any dimension is
 * zero. See `crate::downscale` for the algorithm.
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
 * pixels. See `crate::quantize` for the algorithm.
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

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
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

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
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
