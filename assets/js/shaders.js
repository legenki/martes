// ═══════════════════════════════════════════════════════════════
// SHADER MODE — WebGL shaders from @paper-design/shaders
//
// Every preset below was derived by reading the shader's own GLSL: its
// declared uniforms, and which varying it consumes from the shared vertex
// shader. That distinction matters more than anything else here:
//
//   v_patternUV  — tiles across the surface   → pattern sizing, fit: none
//   v_objectUV   — one centred object         → object sizing, fit: contain
//   v_imageUV    — samples an input image     → excluded, we have no image
//
// Two contract details cost a lot of debugging and are easy to miss:
//   1. `fit` in defaultPatternSizing/defaultObjectSizing is a STRING
//      ("none"/"contain"); the shader wants the NUMBER from
//      ShaderFitOptions. Passing the string makes u_fit NaN and the
//      vertex stage emits garbage UVs — nothing renders.
//   2. The vertex shader multiplies UVs by u_resolution, which ShaderMount
//      only uploads when its own ResizeObserver has fired. In a hidden or
//      embedded view it may never fire, leaving u_resolution at 0 and every
//      UV collapsed to zero. We seed the size and force the upload.
//
// Rendering happens on a <canvas>, so a shader cannot be serialised into
// the exported SVG — Save-SVG/Copy omit it, PNG composites it.
// ═══════════════════════════════════════════════════════════════
import { toHex, hexToRgb } from './core.js';

const VENDOR = '../vendor/paper-shaders/index.js';

// `kind` selects the sizing family; `uniforms` are the shader's own knobs at
// values that read well over artwork (verified by rendering each one).
export const SHADERS = [
  { id:'none', name:'None', shader:null, kind:null, uniforms:{} },

  // ── Texture — fine grain and tone, meant to sit quietly on the artwork ──
  { id:'grainGradient', name:'Grain', shader:'grainGradientFragmentShader', kind:'pattern',
    defaultOpacity:0.35, defaultBlend:'soft-light',
    uniforms:{ u_softness:1, u_intensity:0.25, u_noise:0.65, u_shape:1 } },
  { id:'dithering', name:'Dither', shader:'ditheringFragmentShader', kind:'pattern',
    defaultOpacity:0.3, defaultBlend:'overlay',
    uniforms:{ u_pxSize:2, u_shape:1, u_type:3 } },
  { id:'dotGrid', name:'Dots', shader:'dotGridFragmentShader', kind:'pattern',
    defaultOpacity:0.28, defaultBlend:'multiply',
    // Small dots on a tight lattice read as a print screen; large u_dotSize
    // fills the cell and turns the whole layer into a flat wash.
    uniforms:{ u_dotSize:0.12, u_gapX:0.08, u_gapY:0.08, u_strokeWidth:0,
               u_sizeRange:0.25, u_opacityRange:0.55, u_shape:0 } },
  { id:'paperGrain', name:'Paper', shader:'perlinNoiseFragmentShader', kind:'pattern',
    defaultOpacity:0.3, defaultBlend:'soft-light',
    // High octave count + low proportion = fibrous paper tooth, not clouds.
    uniforms:{ u_proportion:0.32, u_softness:0.85, u_octaveCount:7,
               u_persistence:0.42, u_lacunarity:2.4 } },
  { id:'neuroNoise', name:'Fibre', shader:'neuroNoiseFragmentShader', kind:'pattern',
    defaultOpacity:0.3, defaultBlend:'soft-light',
    // noise = pow(noise, .7 + 6*u_contrast): anything above ~0.15 crushes
    // the whole field to black.
    uniforms:{ u_brightness:0.55, u_contrast:0.06 } },

  // ── Light — soft glow and directional light ──────────────────
  { id:'godRays', name:'Rays', shader:'godRaysFragmentShader', kind:'object',
    defaultOpacity:0.4, defaultBlend:'screen',
    uniforms:{ u_density:0.32, u_spotty:0.12, u_midSize:0.9, u_midIntensity:0.25,
               u_intensity:0.5, u_bloom:0.7 } },
  { id:'staticRadial', name:'Halo', shader:'staticRadialGradientFragmentShader', kind:'object',
    defaultOpacity:0.45, defaultBlend:'screen',
    uniforms:{ u_radius:0.95, u_focalDistance:0.1, u_focalAngle:0, u_falloff:0.55,
               u_mixing:0.75, u_distortion:0.12, u_distortionShift:0,
               u_distortionFreq:1.5, u_grainMixer:0.25, u_grainOverlay:0.15 } },
  { id:'smokeRing', name:'Smoke', shader:'smokeRingFragmentShader', kind:'object',
    defaultOpacity:0.4, defaultBlend:'screen',
    uniforms:{ u_thickness:0.85, u_radius:0.5, u_innerShape:2.4,
               u_noiseScale:0.9, u_noiseIterations:9 } },

  // ── Gradient — broad, soft colour fields ─────────────────────
  { alphaFromColors:true, id:'meshGradient', name:'Mesh', shader:'meshGradientFragmentShader', kind:'object',
    defaultOpacity:0.38, defaultBlend:'soft-light',
    uniforms:{ u_distortion:0.65, u_swirl:0.35, u_grainMixer:0.3, u_grainOverlay:0.2 } },
  { alphaFromColors:true, id:'staticMesh', name:'Mesh S', shader:'staticMeshGradientFragmentShader', kind:'object',
    defaultOpacity:0.38, defaultBlend:'soft-light',
    uniforms:{ u_positions:3, u_waveX:0.35, u_waveXShift:0.4, u_waveY:0.35,
               u_waveYShift:0.5, u_mixing:0.85, u_grainMixer:0.3, u_grainOverlay:0.2 } },
  { alphaFromColors:true, id:'warp', name:'Warp', shader:'warpFragmentShader', kind:'pattern',
    defaultOpacity:0.4, defaultBlend:'soft-light',
    uniforms:{ u_proportion:0.5, u_softness:1, u_shape:1, u_shapeScale:0.12,
               u_distortion:0.12, u_swirl:0.85, u_swirlIterations:10 } },
  { alphaFromColors:true, id:'simplexNoise', name:'Drift', shader:'simplexNoiseFragmentShader', kind:'pattern',
    defaultOpacity:0.35, defaultBlend:'soft-light',
    // stepsPerColor 1 keeps it a continuous blend; higher values posterise.
    uniforms:{ u_stepsPerColor:1, u_softness:1 } },

  // ── Structure — visible geometry, still soft-edged ───────────
  { id:'swirl', name:'Swirl', shader:'swirlFragmentShader', kind:'object',
    defaultOpacity:0.35, defaultBlend:'soft-light',
    uniforms:{ u_bandCount:2.5, u_twist:0.35, u_center:0.05, u_proportion:0.5,
               u_softness:1, u_noise:0.35, u_noiseFrequency:0.35 } },
  { id:'spiral', name:'Spiral', shader:'spiralFragmentShader', kind:'pattern',
    defaultOpacity:0.3, defaultBlend:'soft-light',
    uniforms:{ u_density:0.22, u_distortion:0.35, u_strokeWidth:0.5, u_strokeCap:0.6,
               u_strokeTaper:0.7, u_noise:0.35, u_noiseFrequency:0.3, u_softness:1 } },
  { id:'waves', name:'Waves', shader:'wavesFragmentShader', kind:'pattern',
    defaultOpacity:0.25, defaultBlend:'soft-light',
    // Waves has a binary front/back opacity, so it only reads well thin
    // and softened — otherwise it is a hard two-colour stripe.
    uniforms:{ u_shape:1, u_frequency:0.35, u_amplitude:0.55, u_spacing:0.85,
               u_proportion:0.5, u_softness:1 } },
  { alphaFromColors:true, id:'voronoi', name:'Cells', shader:'voronoiFragmentShader', kind:'pattern',
    defaultOpacity:0.3, defaultBlend:'soft-light',
    uniforms:{ u_stepsPerColor:1, u_distortion:0.45, u_gap:0.015, u_glow:0.85 } },
  { id:'dotOrbit', name:'Orbit', shader:'dotOrbitFragmentShader', kind:'pattern',
    defaultOpacity:0.45, defaultBlend:'multiply',
    uniforms:{ u_stepsPerColor:1, u_size:1, u_sizeRange:0.12, u_spreading:0.55 } },
  { id:'metaballs', name:'Blobs', shader:'metaballsFragmentShader', kind:'object',
    defaultOpacity:0.5, defaultBlend:'soft-light',
    uniforms:{ u_size:1, u_sizeRange:0.25, u_count:14 } },
  { id:'colorPanels', name:'Panels', shader:'colorPanelsFragmentShader', kind:'object',
    defaultOpacity:0.5, defaultBlend:'soft-light',
    uniforms:{ u_density:0.75, u_angle1:0.25, u_angle2:0.6, u_length:2.4,
               u_edges:false, u_blur:0.6, u_fadeIn:0.45, u_fadeOut:0.45, u_gradient:0.8 } },
];

export const SHADER_BY_ID = Object.fromEntries(SHADERS.map(s => [s.id, s]));

// User-facing controls, shared by every shader.
export const SHADER_CONTROLS = [
  { type:'range', id:'opacity',  label:'Opacity', default:0.8, min:0.05, max:1, step:0.05 },
  { type:'range', id:'speed',    label:'Speed',   default:0.6, min:0,    max:3, step:0.1 },
  { type:'range', id:'scale',    label:'Scale',   default:1,   min:0.2,  max:4, step:0.1 },
  { type:'btngroup', id:'blend', label:'Blend',   default:'normal',
    options:['Normal','Multiply','Screen','Overlay','Soft'],
    values:['normal','multiply','screen','overlay','soft-light'] },
  { type:'color', id:'color1',   label:'Shader 1', default:'#f4a37c' },
  { type:'color', id:'color2',   label:'Shader 2', default:'#5b6bb5' },
];

let _lib = null, _mount = null, _canvas = null;

async function lib() {
  if (!_lib) _lib = await import(VENDOR);
  return _lib;
}

// 14 shaders sample a noise texture, and ShaderMount *throws* if an image
// uniform is not fully decoded by mount time. Resolve it once, up front.
let _noisePromise = null;
function noiseTexture(L) {
  if (_noisePromise) return _noisePromise;
  const img = L.getShaderNoiseTexture?.();
  if (!img) return (_noisePromise = Promise.resolve(null));
  _noisePromise = img.complete && img.naturalWidth
    ? Promise.resolve(img)
    : new Promise(res => {
        img.addEventListener('load',  () => res(img), { once: true });
        img.addEventListener('error', () => res(null), { once: true });
      });
  return _noisePromise;
}

// Each shader carries its own opacity/blend, because the level that reads as
// a finish differs wildly per effect — a grain wants 0.3 soft-light, a mesh
// gradient wants 0.45. The user's own choice still wins once they touch it.
export function shaderState(s, def) {
  const out = {};
  for (const c of SHADER_CONTROLS) {
    const k = '_sh_' + c.id;
    if (s[k] !== undefined) { out[c.id] = s[k]; continue; }
    if (c.id === 'opacity' && def?.defaultOpacity !== undefined) { out[c.id] = def.defaultOpacity; continue; }
    if (c.id === 'blend'   && def?.defaultBlend   !== undefined) { out[c.id] = def.defaultBlend; continue; }
    out[c.id] = c.default;
  }
  return out;
}

// "#rrggbb" -> the vec4 the shaders expect, in 0..1.
function rgba(hex, fallback, alpha = 1) {
  const [r, g, b] = hexToRgb(toHex(hex, fallback));
  return [r / 255, g / 255, b / 255, alpha];
}

export function teardownShader() {
  if (_mount) { try { _mount.dispose(); } catch {} _mount = null; }
  if (_canvas) { _canvas.remove(); _canvas = null; }
}

function positionLayer(svgEl, host) {
  if (!_canvas || !svgEl || !host) return;
  const rect = svgEl.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  let w = rect.width, h = rect.height;
  let x = rect.left - hostRect.left, y = rect.top - hostRect.top;
  // A hidden or pre-layout view measures 0; fall back to the SVG's own size.
  if (!w || !h) {
    w = parseFloat(svgEl.style.width)  || +svgEl.getAttribute('width')  || 0;
    h = parseFloat(svgEl.style.height) || +svgEl.getAttribute('height') || 0;
    x = Math.max(0, (host.clientWidth  - w) / 2);
    y = Math.max(0, (host.clientHeight - h) / 2);
  }
  Object.assign(_canvas.style, {
    left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px',
  });
  if (_mount) kick(_mount);
}

// ShaderMount derives its canvas size from a ResizeObserver and uploads
// u_resolution only when that size changes. Neither is guaranteed to have
// happened, and a zero resolution collapses every UV — so seed the parent
// measurements, force the resolution upload, and drive a frame.
function kick(mount) {
  const w = _canvas?.clientWidth, h = _canvas?.clientHeight;
  if (!w || !h) return;
  try {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    mount.parentWidth = w;
    mount.parentHeight = h;
    if (mount.devicePixelsSupported) {
      mount.parentDevicePixelWidth  = w * dpr;
      mount.parentDevicePixelHeight = h * dpr;
    }
    mount.handleResize?.();
    // handleResize only flags the upload when the size actually changed;
    // set it unconditionally so the first frame has a real resolution.
    mount.resolutionChanged = true;
    mount.render?.(performance.now());
  } catch { /* disposed mid-flight */ }
}

export function repositionShaderLayer() {
  const svgEl = typeof document !== 'undefined' && document.getElementById('svgCanvas');
  if (_canvas && svgEl) positionLayer(svgEl, svgEl.parentElement);
}
if (typeof window !== 'undefined') {
  window.addEventListener('resize', repositionShaderLayer);
}

function buildUniforms(L, def, p, noise) {
  // Most shaders composite against u_colorBack, so a transparent backdrop is
  // enough. Five of them (mesh gradients, voronoi, warp, simplex) have no
  // u_colorBack at all — their alpha comes straight from u_colors[i].a, so
  // the layer opacity has to travel in the colours themselves or they paint
  // an opaque field and hide the artwork completely.
  const a = def.alphaFromColors ? 0.85 : 1;
  const c1 = rgba(p.color1, '#f4a37c', a);
  const c2 = rgba(p.color2, '#5b6bb5', a);
  const sizing = def.kind === 'object' ? L.defaultObjectSizing : L.defaultPatternSizing;
  const u = {
    ...sizing,
    // `fit` arrives as a string in those defaults; the shader wants a number.
    u_fit: L.ShaderFitOptions[sizing.fit] ?? 0,
    u_scale: p.scale,
    u_rotation: sizing.rotation,
    u_offsetX: sizing.offsetX, u_offsetY: sizing.offsetY,
    u_originX: sizing.originX, u_originY: sizing.originY,
    u_worldWidth: sizing.worldWidth, u_worldHeight: sizing.worldHeight,
    u_imageAspectRatio: 1,
    // Transparent backdrop so the artwork shows through.
    u_colorBack: [0, 0, 0, 0],
    u_colors: [c1, c2],
    u_colorsCount: 2,
    u_colorFront: c1,
    u_colorFill: c1,
    u_colorStroke: c2,
    u_colorMid: c2,
    u_colorBloom: c2,
    u_colorGlow: c2,
    u_colorGap: [0, 0, 0, 0],
    u_colorHighlight: c2,
    u_colorInner: c2,
    u_colorTint: c2,
    ...def.uniforms,
  };
  delete u.fit; delete u.scale; delete u.rotation;
  delete u.offsetX; delete u.offsetY; delete u.originX; delete u.originY;
  delete u.worldWidth; delete u.worldHeight;

  // Without the texture WebGL binds the zero texture and the fragment stage
  // yields nothing; with a half-decoded one ShaderMount throws.
  if (noise) { u.u_noiseTexture = noise; u.u_image = noise; }
  return u;
}

export async function applyShader(svgEl, W, H, s) {
  const def = SHADER_BY_ID[s._shader || 'none'];
  if (!def || !def.shader) { teardownShader(); return; }

  const L = await lib();
  const frag = L[def.shader];
  if (!frag) { console.warn(`[martes] unknown shader ${def.shader}`); return; }

  const p = shaderState(s, def);
  const host = svgEl.parentElement;
  if (!host) return;

  if (!_canvas) {
    _canvas = document.createElement('div');
    _canvas.className = 'shader-layer';
    host.appendChild(_canvas);
  }
  Object.assign(_canvas.style, {
    position: 'absolute',
    opacity: String(p.opacity),
    mixBlendMode: p.blend,
    pointerEvents: 'none',
  });
  positionLayer(svgEl, host);

  const noise = await noiseTexture(L);
  const uniforms = buildUniforms(L, def, p, noise);

  if (_mount && _mount.__fx === def.shader) {
    try { _mount.setUniforms(uniforms); _mount.setSpeed?.(p.speed); kick(_mount); return; } catch {}
  }
  if (_mount) { try { _mount.dispose(); } catch {} _mount = null; }
  _canvas.replaceChildren();
  // preserveDrawingBuffer keeps the frame readable for the PNG composite.
  _mount = new L.ShaderMount(_canvas, frag, uniforms, { preserveDrawingBuffer: true }, p.speed);
  _mount.__fx = def.shader;
  kick(_mount);
}

// SVG export cannot carry the shader, so PNG is the only export that
// reproduces what is on screen.
export async function compositeToPNG(svgString, W, H, scale = 2) {
  const cvs = document.createElement('canvas');
  cvs.width = W * scale; cvs.height = H * scale;
  const ctx = cvs.getContext('2d');

  await new Promise((res, rej) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, cvs.width, cvs.height); URL.revokeObjectURL(url); res(); };
    img.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
    img.src = url;
  });

  const glCanvas = _canvas?.querySelector('canvas');
  if (glCanvas) {
    if (_mount) kick(_mount);   // guarantee a fresh frame in the buffer
    const st = _canvas.style;
    ctx.save();
    ctx.globalAlpha = parseFloat(st.opacity || '1');
    ctx.globalCompositeOperation = st.mixBlendMode === 'normal' ? 'source-over' : st.mixBlendMode;
    ctx.drawImage(glCanvas, 0, 0, cvs.width, cvs.height);
    ctx.restore();
  }
  return new Promise(res => cvs.toBlob(res, 'image/png'));
}

export function hasActiveShader() { return !!_mount; }
