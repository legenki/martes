// ═══════════════════════════════════════════════════════════════
// SHADER MODE — real WebGL shaders from @paper-design/shaders
//
// A deliberate second path alongside fx.js. These are GPU fragment
// shaders rendered to a <canvas>, so they look exactly like the upstream
// library — but a canvas cannot be serialised into an SVG document.
// Consequences, surfaced in the UI rather than hidden:
//   • Save-SVG / Copy export the artwork WITHOUT the shader
//   • PNG export composites artwork + shader and does include it
//
// The library is vendored under assets/vendor/ because the app has no
// build step; it is loaded lazily so the 336 KB only costs users who
// actually switch shader mode on.
// ═══════════════════════════════════════════════════════════════
import { toHex } from './core.js';

const VENDOR = '../vendor/paper-shaders/index.js';

// Curated subset: shaders that read as a texture/overlay over artwork.
// `uniforms` are the ones we expose; everything else keeps library defaults.
export const SHADERS = [
  { id:'none', name:'None', shader:null, controls:[] },
  { id:'grainGradient',       name:'Grain',      shader:'grainGradientFragmentShader' },
  { id:'dithering',           name:'Dither',     shader:'ditheringFragmentShader' },
  { id:'halftoneDots',        name:'Halftone',   shader:'halftoneDotsFragmentShader' },
  { id:'halftoneCmyk',        name:'CMYK',       shader:'halftoneCmykFragmentShader' },
  { id:'warp',                name:'Warp',       shader:'warpFragmentShader' },
  { id:'swirl',               name:'Swirl',      shader:'swirlFragmentShader' },
  { id:'meshGradient',        name:'Mesh',       shader:'meshGradientFragmentShader' },
  { id:'staticMeshGradient',  name:'Mesh S',     shader:'staticMeshGradientFragmentShader' },
  { id:'neuroNoise',          name:'Neuro',      shader:'neuroNoiseFragmentShader' },
  { id:'perlinNoise',         name:'Perlin',     shader:'perlinNoiseFragmentShader' },
  { id:'simplexNoise',        name:'Simplex',    shader:'simplexNoiseFragmentShader' },
  { id:'voronoi',             name:'Voronoi',    shader:'voronoiFragmentShader' },
  { id:'dotOrbit',            name:'Dot Orbit',  shader:'dotOrbitFragmentShader' },
  { id:'dotGrid',             name:'Dot Grid',   shader:'dotGridFragmentShader' },
  { id:'metaballs',           name:'Metaballs',  shader:'metaballsFragmentShader' },
  { id:'smokeRing',           name:'Smoke',      shader:'smokeRingFragmentShader' },
  { id:'godRays',             name:'God Rays',   shader:'godRaysFragmentShader' },
  { id:'liquidMetal',         name:'Liquid',     shader:'liquidMetalFragmentShader' },
  { id:'waves',               name:'Waves',      shader:'wavesFragmentShader' },
  { id:'water',               name:'Water',      shader:'waterFragmentShader' },
  { id:'spiral',              name:'Spiral',     shader:'spiralFragmentShader' },
  { id:'paperTexture',        name:'Paper',      shader:'paperTextureFragmentShader' },
  { id:'lensDistortion',      name:'Lens',       shader:'lensDistortionFragmentShader' },
  { id:'flutedGlass',         name:'Glass',      shader:'flutedGlassFragmentShader' },
];

// Shared controls — the library's shaders take wildly different uniforms,
// so we expose the handful that are near-universal and safe.
export const SHADER_CONTROLS = [
  { type:'range', id:'opacity',   label:'Opacity',   default:0.55, min:0.05, max:1,  step:0.05 },
  { type:'range', id:'speed',     label:'Speed',     default:0.6,  min:0,    max:3,  step:0.1 },
  { type:'range', id:'scale',     label:'Scale',     default:1,    min:0.2,  max:4,  step:0.1 },
  { type:'btngroup', id:'blend',  label:'Blend',     default:'overlay',
    options:['Normal','Multiply','Screen','Overlay','Soft'],
    values:['normal','multiply','screen','overlay','soft-light'] },
  { type:'color', id:'color1',    label:'Shader 1',  default:'#5100ff' },
  { type:'color', id:'color2',    label:'Shader 2',  default:'#00ff80' },
];

export const SHADER_BY_ID = Object.fromEntries(SHADERS.map(s => [s.id, s]));

let _lib = null;
let _mount = null;
let _canvas = null;

// Lazily pull in the vendored library the first time shader mode is used.
async function lib() {
  if (!_lib) _lib = await import(VENDOR);
  return _lib;
}


// Keep the overlay locked to the SVG's on-screen box. Measuring can return
// a zero rect (hidden tab, pre-layout), which would collapse the canvas to
// 0x0 and render nothing, so fall back to the SVG's own attributes and
// re-measure once layout is available.
function positionLayer(svgEl, host) {
  if (!_canvas || !svgEl || !host) return;
  const rect = svgEl.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  let w = rect.width, h = rect.height, x = rect.left - hostRect.left, y = rect.top - hostRect.top;
  if (!w || !h) {
    w = parseFloat(svgEl.style.width) || +svgEl.getAttribute('width') || 0;
    h = parseFloat(svgEl.style.height) || +svgEl.getAttribute('height') || 0;
    x = Math.max(0, (host.clientWidth - w) / 2);
    y = Math.max(0, (host.clientHeight - h) / 2);
  }
  Object.assign(_canvas.style, {
    left: x + 'px', top: y + 'px',
    width: w + 'px', height: h + 'px',
  });
}

// Keep the overlay tracking the canvas through every refit — window resize,
// panel layout changes, and the tab becoming visible again.
export function repositionShaderLayer() {
  const svgEl = typeof document !== 'undefined' && document.getElementById('svgCanvas');
  if (_canvas && svgEl) positionLayer(svgEl, svgEl.parentElement);
}
if (typeof window !== 'undefined') {
  window.addEventListener('resize', repositionShaderLayer);
}

export function shaderState(s) {
  const out = {};
  for (const c of SHADER_CONTROLS) {
    const k = '_sh_' + c.id;
    out[c.id] = s[k] !== undefined ? s[k] : c.default;
  }
  return out;
}

export function teardownShader() {
  if (_mount) { try { _mount.dispose(); } catch {} _mount = null; }
  if (_canvas) { _canvas.remove(); _canvas = null; }
}

// Mount (or update) the shader canvas over the SVG canvas.
export async function applyShader(svgEl, W, H, s) {
  const id = s._shader || 'none';
  const def = SHADER_BY_ID[id];
  if (!def || !def.shader) { teardownShader(); return; }

  const L = await lib();
  const frag = L[def.shader];
  if (!frag) { console.warn(`[martes] unknown shader ${def.shader}`); return; }

  const p = shaderState(s);
  const host = svgEl.parentElement;
  if (!host) return;

  // The canvas tracks the SVG's on-screen box so the effect lines up with
  // the artwork rather than the whole panel.
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

  const uniforms = {
    u_colorBack:  L.getShaderColorFromString('#00000000'),
    u_scale: p.scale,
    u_colors: [
      L.getShaderColorFromString(toHex(p.color1, '#5100ff')),
      L.getShaderColorFromString(toHex(p.color2, '#00ff80')),
    ],
    u_colorsCount: 2,
  };

  // Re-mounting on every param change would leak GL contexts, so update
  // in place whenever the shader itself has not changed.
  if (_mount && _mount.__fx === def.shader) {
    try { _mount.setUniforms(uniforms); _mount.setSpeed?.(p.speed); return; } catch {}
  }
  if (_mount) { try { _mount.dispose(); } catch {} _mount = null; }
  _canvas.replaceChildren();
  // preserveDrawingBuffer is required for PNG export: without it WebGL
  // clears the buffer after each composite, and drawImage() on the canvas
  // later reads transparent black — the shader silently vanished from PNGs.
  _mount = new L.ShaderMount(_canvas, frag, uniforms, { preserveDrawingBuffer: true }, p.speed);
  _mount.__fx = def.shader;
}

// Composite artwork + shader into a PNG. SVG export cannot carry the
// shader, so this is the only export path that reproduces what is on screen.
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
    const st = _canvas.style;
    ctx.save();
    ctx.globalAlpha = parseFloat(st.opacity || '1');
    // Canvas2D understands the same blend keywords as CSS mix-blend-mode.
    ctx.globalCompositeOperation = st.mixBlendMode === 'normal' ? 'source-over' : st.mixBlendMode;
    ctx.drawImage(glCanvas, 0, 0, cvs.width, cvs.height);
    ctx.restore();
  }
  return new Promise(res => cvs.toBlob(res, 'image/png'));
}

export function hasActiveShader() { return !!_mount; }
