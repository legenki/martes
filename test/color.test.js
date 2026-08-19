import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { installCanvasDom, freshSvg, defaultState } from './helpers.js';

installCanvasDom();

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

const TILE = ['terrain','symmetry','bloks','disque','trigram','mixtape','ring','blossom','veil','radius','odessa'];
const PLAIN = ['splat','dust','prism','leaf','drift','coil','wave','orbit','vortex','slash','mirror',
               'ripple','bloom','flux','quartz','haze','shine','surf','scale','burst','halo','whorl','tessera'];

let TOOLS = [], core;

beforeAll(async () => {
  core = await import('../assets/js/core.js');
  const plain = await Promise.all(PLAIN.map(s => import(`../assets/js/tools/${s}.js`)));
  const tile  = await Promise.all(TILE.map(s => import(`../assets/js/tools/tile/${s}.js`)));
  TOOLS = [...plain, ...tile].map(m => m.default);
});

beforeEach(() => installCanvasDom());

describe('toHex — the single colour normaliser', () => {
  it('is exported from core.js', () => {
    expect(typeof core.toHex).toBe('function');
  });

  it('passes 6-digit hex through, lowercased', () => {
    expect(core.toHex('#FF8800')).toBe('#ff8800');
    expect(core.toHex('#ff8800')).toBe('#ff8800');
  });

  it('expands 3-digit hex', () => {
    expect(core.toHex('#f80')).toBe('#ff8800');
    expect(core.toHex('#000')).toBe('#000000');
  });

  it('converts hsl() to hex', () => {
    expect(core.toHex('hsl(0,100%,50%)')).toBe('#ff0000');
    expect(core.toHex('hsl(120,100%,50%)')).toBe('#00ff00');
  });

  it('converts rgb() to hex', () => {
    expect(core.toHex('rgb(255, 136, 0)')).toBe('#ff8800');
  });

  it('maps transparent/none/empty to the documented fallback', () => {
    // 'none' is a legal SVG paint value but not a colour an <input type=color>
    // can show; it must round-trip to the fallback rather than silently black.
    expect(core.toHex('none', '#123456')).toBe('#123456');
    expect(core.toHex('', '#123456')).toBe('#123456');
    expect(core.toHex(null, '#123456')).toBe('#123456');
    expect(core.toHex(undefined)).toBe('#000000');
  });

  it('is idempotent', () => {
    for (const c of ['#ff8800', 'hsl(210,50%,50%)', 'rgb(1,2,3)', '#abc']) {
      expect(core.toHex(core.toHex(c))).toBe(core.toHex(c));
    }
  });
});

describe('colour control defaults', () => {
  it('every colour control default is a hex value an <input type=color> accepts', () => {
    const bad = [];
    for (const t of TOOLS) {
      for (const c of t.controls.filter(c => c.type === 'color')) {
        if (!/^#[0-9a-f]{6}$/i.test(String(c.default))) {
          bad.push(`${t.slug}.${c.id} = ${c.default}`);
        }
      }
    }
    // <input type="color"> silently coerces any non-hex value to #000000,
    // so an hsl() default makes the swatch lie about the actual colour.
    expect(bad, `non-hex colour defaults:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every tool exposes at least one colour control', () => {
    for (const t of TOOLS) {
      expect(t.controls.some(c => c.type === 'color'), `${t.slug} has no colour control`).toBe(true);
    }
  });

  it('numbered colour slots run contiguously with no gaps', () => {
    // Two conventions coexist on purpose: tile presets are 0-based
    // (color0..color5), the older generators are 1-based because the UI
    // labels them "Color 1". Either start is fine; a *gap* is the bug,
    // since applyPaletteToTool walks the slots in order.
    for (const t of TOOLS) {
      const nums = t.controls.filter(c => /^color\d+$/.test(c.id)).map(c => +c.id.slice(5)).sort((a,b)=>a-b);
      if (!nums.length) continue;
      const base = nums[0];
      expect(base, `${t.slug} numbering starts at ${base}`).toBeLessThanOrEqual(1);
      expect(nums, `${t.slug} colour slots have a gap`).toEqual(nums.map((_, i) => base + i));
    }
  });
});

describe('palette application', () => {
  let pal;
  beforeAll(async () => { pal = await import('../assets/js/palettes.js'); });

  it('fills EVERY colour slot even when the palette is shorter', () => {
    for (const t of TOOLS) {
      const slots = t.controls.filter(c => c.type === 'color');
      core.toolState[t.slug] = {};
      pal.applyPaletteToTool(t, ['#111111','#222222','#333333','#444444','#555555']);
      const s = core.toolState[t.slug];
      for (const c of slots) {
        expect(s[c.id], `${t.slug}.${c.id} left unset by a 5-colour palette`).toBeTruthy();
        expect(String(s[c.id]), `${t.slug}.${c.id} not hex`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('normalises palette colours to hex', () => {
    const t = TOOLS[0];
    core.toolState[t.slug] = {};
    pal.applyPaletteToTool(t, ['hsl(0,100%,50%)']);
    const first = t.controls.find(c => c.type === 'color');
    expect(core.toolState[t.slug][first.id]).toBe('#ff0000');
  });

  it('applyPaletteGlobal accepts a palette index and resolves it', () => {
    // doImportJSON passes a stored index, the dropdown passes an array —
    // both must work through the same entry point.
    expect(() => pal.applyPaletteGlobal(3)).not.toThrow();
    expect(pal.currentPaletteIndex).toBe(3);
    expect(pal.currentPalette).toEqual(pal.NICE_PALETTES[3]);
  });

  it('applyPaletteGlobal accepts a palette array', () => {
    const arr = ['#010101','#020202','#030303','#040404','#050505'];
    expect(() => pal.applyPaletteGlobal(arr, 7)).not.toThrow();
    expect(pal.currentPalette).toEqual(arr);
  });

  it('every palette in the library is well-formed', () => {
    for (const [i, p] of pal.NICE_PALETTES.entries()) {
      expect(Array.isArray(p), `palette ${i} is not an array`).toBe(true);
      expect(p.length, `palette ${i} length`).toBeGreaterThanOrEqual(5);
      for (const c of p) expect(c, `palette ${i} colour ${c}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('applying a palette then rendering produces only palette-derived colour', () => {
    const palette = ['#111111','#222222','#333333','#444444','#555555'];
    for (const t of TOOLS) {
      core.toolState[t.slug] = {};
      pal.applyPaletteToTool(t, palette);
      const state = { ...defaultState(t), ...core.toolState[t.slug] };
      const svg = freshSvg();
      expect(() => t.render(svg, 600, 900, state), `${t.slug} failed with palette`).not.toThrow();
    }
  });
});

describe('randomize colour output', () => {
  it('emits hex, so the swatch matches the canvas', async () => {
    const actions = read('../assets/js/actions.js');
    // Randomize used to write `hsl(...)` straight into state; the swatch input
    // then coerced it to #000000 while the canvas drew the real colour.
    const colorBranch = actions.slice(actions.indexOf("c.type === 'color'"), actions.indexOf("c.type === 'btngroup'"));
    expect(/hsl\(/.test(colorBranch) && !/toHex/.test(colorBranch),
      'randomize must normalise colours to hex (wrap in toHex)').toBe(false);
  });
});
