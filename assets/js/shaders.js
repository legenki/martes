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

  // ── pattern family (v_patternUV, fit: none) ──────────────────
  { id:'dotGrid', name:'Dot Grid', shader:'dotGridFragmentShader', kind:'pattern',
    uniforms:{ u_dotSize:0.32, u_gapX:0.4, u_gapY:0.4, u_strokeWidth:0,
               u_sizeRange:0.3, u_opacityRange:0.4, u_shape:0 } },
  { id:'dotOrbit', name:'Dot Orbit', shader:'dotOrbitFragmentShader', kind:'pattern',
    uniforms:{ u_stepsPerColor:2, u_size:1, u_sizeRange:0.15, u_spreading:0.6 } },
  { id:'neuroNoise', name:'Neuro', shader:'neuroNoiseFragmentShader', kind:'pattern',
    uniforms:{ u_brightness:1.1, u_contrast:0.85 } },
  { id:'perlinNoise', name:'Perlin', shader:'perlinNoiseFragmentShader', kind:'pattern',
    uniforms:{ u_proportion:0.5, u_softness:0.4, u_octaveCount:4,
               u_persistence:0.5, u_lacunarity:2 } },
  { alphaFromColors:true, id:'simplexNoise', name:'Simplex', shader:'simplexNoiseFragmentShader', kind:'pattern',
    uniforms:{ u_stepsPerColor:3, u_softness:0.4 } },
  { id:'spiral', name:'Spiral', shader:'spiralFragmentShader', kind:'pattern',
    uniforms:{ u_density:0.6, u_distortion:0.2, u_strokeWidth:0.5, u_strokeCap:0.3,
               u_strokeTaper:0.2, u_noise:0.2, u_noiseFrequency:0.4, u_softness:0.2 } },
  { alphaFromColors:true, id:'voronoi', name:'Voronoi', shader:'voronoiFragmentShader', kind:'pattern',
    uniforms:{ u_stepsPerColor:2, u_distortion:0.35, u_gap:0.06, u_glow:0.4 } },
  { alphaFromColors:true, id:'warp', name:'Warp', shader:'warpFragmentShader', kind:'pattern',
    uniforms:{ u_proportion:0.5, u_softness:1, u_shape:1, u_shapeScale:0.3,
               u_distortion:0.25, u_swirl:0.6, u_swirlIterations:8 } },
  { id:'waves', name:'Waves', shader:'wavesFragmentShader', kind:'pattern',
    uniforms:{ u_shape:1, u_frequency:0.5, u_amplitude:0.4, u_spacing:0.6,
               u_proportion:0.5, u_softness:0.2 } },

  // ── object family (v_objectUV, fit: contain) ─────────────────
  { id:'colorPanels', name:'Panels', shader:'colorPanelsFragmentShader', kind:'object',
    uniforms:{ u_density:0.8, u_angle1:0.4, u_angle2:0.6, u_length:1.2,
               u_edges:false, u_blur:0.2, u_fadeIn:0.3, u_fadeOut:0.3, u_gradient:0.4 } },
  { id:'godRays', name:'God Rays', shader:'godRaysFragmentShader', kind:'object',
    uniforms:{ u_density:0.6, u_spotty:0.3, u_midSize:0.5, u_midIntensity:0.4,
               u_intensity:0.9, u_bloom:0.4 } },
  { id:'metaballs', name:'Metaballs', shader:'metaballsFragmentShader', kind:'object',
    uniforms:{ u_size:1, u_sizeRange:0.3, u_count:12 } },
  { id:'smokeRing', name:'Smoke', shader:'smokeRingFragmentShader', kind:'object',
    uniforms:{ u_thickness:0.5, u_radius:0.6, u_innerShape:1.5,
               u_noiseScale:1.4, u_noiseIterations:8 } },
  { id:'swirl', name:'Swirl', shader:'swirlFragmentShader', kind:'object',
    uniforms:{ u_bandCount:4, u_twist:0.6, u_center:0.15, u_proportion:0.5,
               u_softness:0.6, u_noise:0.15, u_noiseFrequency:0.5 } },
  { id:'staticRadial', name:'Radial', shader:'staticRadialGradientFragmentShader', kind:'object',
    uniforms:{ u_radius:0.7, u_focalDistance:0.2, u_focalAngle:0, u_falloff:0.2,
               u_mixing:0.5, u_distortion:0.2, u_distortionShift:0, u_distortionFreq:2,
               u_grainMixer:0.1, u_grainOverlay:0.1 } },
  { alphaFromColors:true, id:'meshGradient', name:'Mesh', shader:'meshGradientFragmentShader', kind:'object',
    uniforms:{ u_distortion:0.8, u_swirl:0.5, u_grainMixer:0.1, u_grainOverlay:0.1 } },
  { alphaFromColors:true, id:'staticMesh', name:'Mesh S', shader:'staticMeshGradientFragmentShader', kind:'object',
    uniforms:{ u_positions:2, u_waveX:0.4, u_waveXShift:0.3, u_waveY:0.4,
               u_waveYShift:0.3, u_mixing:0.6, u_grainMixer:0.1, u_grainOverlay:0.1 } },

  // ── mixed families ───────────────────────────────────────────
  { id:'grainGradient', name:'Grain', shader:'grainGradientFragmentShader', kind:'pattern',
    uniforms:{ u_softness:0.5, u_intensity:0.4, u_noise:0.5, u_shape:1 } },
  { id:'dithering', name:'Dither', shader:'ditheringFragmentShader', kind:'pattern',
    uniforms:{ u_pxSize:3, u_shape:1, u_type:2 } },
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
  { type:'color', id:'color1',   label:'Shader 1', default:'#5100ff' },
  { type:'color', id:'color2',   label:'Shader 2', default:'#00ff80' },
];

let _lib = null, _mount = null, _canvas = null, _noise;

async function lib() {
  if (!_lib) _lib = await import(VENDOR);
  return _lib;
}

export function shaderState(s) {
  const out = {};
  for (const c of SHADER_CONTROLS) {
    const k = '_sh_' + c.id;
    out[c.id] = s[k] !== undefined ? s[k] : c.default;
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

function buildUniforms(L, def, p) {
  // Most shaders composite against u_colorBack, so a transparent backdrop is
  // enough. Five of them (mesh gradients, voronoi, warp, simplex) have no
  // u_colorBack at all — their alpha comes straight from u_colors[i].a, so
  // the layer opacity has to travel in the colours themselves or they paint
  // an opaque field and hide the artwork completely.
  const a = def.alphaFromColors ? 0.85 : 1;
  const c1 = rgba(p.color1, '#5100ff', a);
  const c2 = rgba(p.color2, '#00ff80', a);
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

  // 14 shaders sample u_noiseTexture; without it WebGL binds the zero
  // texture and the fragment stage yields nothing.
  if (_noise === undefined) _noise = L.getShaderNoiseTexture?.() ?? null;
  if (_noise) { u.u_noiseTexture = _noise; u.u_image = _noise; }
  return u;
}

export async function applyShader(svgEl, W, H, s) {
  const def = SHADER_BY_ID[s._shader || 'none'];
  if (!def || !def.shader) { teardownShader(); return; }

  const L = await lib();
  const frag = L[def.shader];
  if (!frag) { console.warn(`[martes] unknown shader ${def.shader}`); return; }

  const p = shaderState(s);
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

  const uniforms = buildUniforms(L, def, p);

  if (_mount && _mount.__fx === def.shader) {
    try { _mount.setUniforms(uniforms); _mount.setSpeed?.(p.speed); kick(_mount); return; } catch {}
  }
  if (_mount) { try { _mount.dispose(); } catch {} _mount = null; }
  _canvas.replaceChildren();
  // preserveDrawingBuffer keeps the frame readable for the PNG composite.
  _mount = new L.ShaderMount(_canvas, frag, uniforms, { preserveDrawingBuffer: true }, p.speed);
  _mount.__fx = def.shader;
  kick(_mount);
  if (_noise && !_noise.complete) {
    _noise.addEventListener('load', () => {
      if (_mount) { try { _mount.setUniforms({ u_noiseTexture: _noise }); } catch {} kick(_mount); }
    }, { once: true });
  }
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
