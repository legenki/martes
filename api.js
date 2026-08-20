/**
 * Martes API — Headless Programmatic Access
 */

export * as core from './assets/js/core.js';
export * as helpers from './assets/js/tools/_helpers.js';
export * as voronoi from './assets/js/tools/_voronoi.js';
// Only the palette *data* and the pure state helper. The rest of palettes.js
// drives the dropdown and pulls in registry.js -> actions.js, i.e. the whole
// browser UI, which has no place in a headless entry point.
export { NICE_PALETTES, applyPaletteToTool } from './assets/js/palettes.data.js';
// FX are SVG filters, so they work headlessly exactly as they do in the app.
// The WebGL shader layer is intentionally NOT exported: it needs a GPU
// context and a canvas, neither of which exists in a headless render.
export { FX, FX_BY_ID, applyFx, fxParams } from './assets/js/fx.js';

import splat from './assets/js/tools/splat.js';
import dust from './assets/js/tools/dust.js';
import prism from './assets/js/tools/prism.js';
import leaf from './assets/js/tools/leaf.js';
import drift from './assets/js/tools/drift.js';
import coil from './assets/js/tools/coil.js';
import wave from './assets/js/tools/wave.js';
import orbit from './assets/js/tools/orbit.js';
import vortex from './assets/js/tools/vortex.js';
import slash from './assets/js/tools/slash.js';
import mirror from './assets/js/tools/mirror.js';
import ripple from './assets/js/tools/ripple.js';
import bloom from './assets/js/tools/bloom.js';
import flux from './assets/js/tools/flux.js';
import quartz from './assets/js/tools/quartz.js';
import haze from './assets/js/tools/haze.js';
import shine from './assets/js/tools/shine.js';
import surf from './assets/js/tools/surf.js';
import scale from './assets/js/tools/scale.js';
import burst from './assets/js/tools/burst.js';
import halo from './assets/js/tools/halo.js';
import whorl from './assets/js/tools/whorl.js';
import tessera from './assets/js/tools/tessera.js';
import terrain from './assets/js/tools/tile/terrain.js';
import symmetry from './assets/js/tools/tile/symmetry.js';
import bloks from './assets/js/tools/tile/bloks.js';
import disque from './assets/js/tools/tile/disque.js';
import trigram from './assets/js/tools/tile/trigram.js';
import mixtape from './assets/js/tools/tile/mixtape.js';
import ring from './assets/js/tools/tile/ring.js';
import blossom from './assets/js/tools/tile/blossom.js';
import veil from './assets/js/tools/tile/veil.js';
import radius from './assets/js/tools/tile/radius.js';
import odessa from './assets/js/tools/tile/odessa.js';

export const tools = {
  splat,
  dust,
  prism,
  leaf,
  drift,
  coil,
  wave,
  orbit,
  vortex,
  slash,
  mirror,
  ripple,
  bloom,
  flux,
  quartz,
  haze,
  shine,
  surf,
  scale,
  burst,
  halo,
  whorl,
  tessera,
  terrain,
  symmetry,
  bloks,
  disque,
  trigram,
  mixtape,
  ring,
  blossom,
  veil,
  radius,
  odessa
};
