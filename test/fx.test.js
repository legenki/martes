import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { installCanvasDom, freshSvg, defaultState } from './helpers.js';

installCanvasDom();

const TILE = ['terrain','symmetry','bloks','disque','trigram','mixtape','ring','blossom','veil','radius','odessa'];
const PLAIN = ['splat','dust','prism','leaf','drift','coil','wave','orbit','vortex','slash','mirror',
               'ripple','bloom','flux','quartz','haze','shine','surf','scale','burst','halo','whorl','tessera'];

let fx, TOOLS = [];
beforeAll(async () => {
  fx = await import('../assets/js/fx.js');
  const plain = await Promise.all(PLAIN.map(s => import(`../assets/js/tools/${s}.js`)));
  const tile  = await Promise.all(TILE.map(s => import(`../assets/js/tools/tile/${s}.js`)));
  TOOLS = [...plain, ...tile].map(m => m.default);
});
beforeEach(() => installCanvasDom());

describe('effect catalogue', () => {
  it('ships at least 12 effects plus None', () => {
    expect(fx.FX.length).toBeGreaterThanOrEqual(13);
    expect(fx.FX[0].id).toBe('none');
  });

  it('every effect has a unique id, a name and a build function', () => {
    const ids = fx.FX.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of fx.FX) {
      expect(f.name, `${f.id} name`).toBeTruthy();
      expect(typeof f.build, `${f.id} build`).toBe('function');
      expect(Array.isArray(f.controls), `${f.id} controls`).toBe(true);
    }
  });

  it('every effect control declares a usable default', () => {
    for (const f of fx.FX) {
      for (const c of f.controls) {
        expect(c.default, `${f.id}.${c.id} default`).toBeDefined();
        if (c.type === 'range') {
          expect(c.default).toBeGreaterThanOrEqual(c.min);
          expect(c.default).toBeLessThanOrEqual(c.max);
        }
        if (c.type === 'color') expect(String(c.default)).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('builds well-formed filter primitives with no NaN or undefined', () => {
    for (const f of fx.FX) {
      const p = fx.fxParams(f, {});
      const body = f.build(p);
      if (body === null) continue;
      expect(body, `${f.id} emitted NaN/undefined`).not.toMatch(/NaN|undefined/);
      expect(body.trim().startsWith('<'), `${f.id} is not markup`).toBe(true);
    }
  });

  it('sweeps every control value without producing invalid markup', () => {
    for (const f of fx.FX) {
      for (const c of f.controls) {
        const values = c.type === 'range' ? [c.min, (c.min + c.max) / 2, c.max] : [c.default, '#000000', '#ffffff'];
        for (const v of values) {
          const p = { ...fx.fxParams(f, {}), [c.id]: v };
          const body = f.build(p);
          if (body === null) continue;
          expect(body, `${f.id}[${c.id}=${v}]`).not.toMatch(/NaN|undefined/);
        }
      }
    }
  });
});

describe('applyFx', () => {
  const renderWith = (tool, fxId) => {
    const svg = freshSvg();
    const state = { ...defaultState(tool), _fx: fxId };
    tool.render(svg, 600, 900, state);
    fx.applyFx(svg, 600, 900, state);
    return svg;
  };

  it('is a no-op when no effect is selected', () => {
    const tool = TOOLS[0];
    const a = renderWith(tool, 'none');
    expect(a.querySelector('filter[id^="fx-"]')).toBeNull();
  });

  it('applies every effect to every generator without throwing', () => {
    const failures = [];
    for (const tool of TOOLS) {
      for (const f of fx.FX) {
        try { renderWith(tool, f.id); }
        catch (e) { failures.push(`${tool.slug} + ${f.id}: ${e.message}`); }
      }
    }
    expect(failures, failures.slice(0, 10).join('\n')).toEqual([]);
  });

  it('keeps the artwork visible under every effect', () => {
    const empty = [];
    for (const tool of TOOLS) {
      for (const f of fx.FX) {
        const svg = renderWith(tool, f.id);
        const painted = [...svg.querySelectorAll('rect,circle,ellipse,path,polygon,polyline,line,use,image')]
          .filter(el => !el.closest('defs'));
        if (painted.length === 0) empty.push(`${tool.slug} + ${f.id}`);
      }
    }
    expect(empty, `blank output: ${empty.slice(0, 8).join(', ')}`).toEqual([]);
  });

  // The whole reason these are SVG filters and not WebGL: the app's output
  // is a serialised SVG document, so the effect has to live inside it.
  it('serialises into the exported SVG markup', () => {
    const tool = TOOLS[0];
    for (const f of fx.FX) {
      if (f.id === 'none') continue;
      const svg = renderWith(tool, f.id);
      const markup = svg.outerHTML;
      // Three mechanisms, all of which must live inside the document:
      // a <filter>, a <pattern> screen, or an overlay gradient.
      const hasFilter  = /<filter/i.test(markup);
      const hasPattern = !!f.pattern && /<pattern/i.test(markup);
      const hasOverlay = !!f.overlay && /radialGradient/i.test(markup);
      expect(hasFilter || hasPattern || hasOverlay,
        `${f.id} left nothing in the exported SVG`).toBe(true);
    }
  });

  it('does not leak the generator output out of the filtered group', () => {
    const tool = TOOLS[0];
    const svg = renderWith(tool, 'blur');
    const g = svg.querySelector('g[filter]');
    expect(g, 'artwork was not wrapped in a filtered group').toBeTruthy();
    expect(g.childNodes.length).toBeGreaterThan(0);
  });

  it('generates a unique filter id per render', () => {
    const tool = TOOLS[0];
    const ids = new Set();
    for (let i = 0; i < 5; i++) {
      const svg = renderWith(tool, 'bloom');
      const f = svg.querySelector('filter');
      expect(ids.has(f.id), `reused filter id ${f.id}`).toBe(false);
      ids.add(f.id);
    }
  });

  it('reads params from state and reflects them in the markup', () => {
    const tool = TOOLS[0];
    const svg = freshSvg();
    const state = { ...defaultState(tool), _fx: 'blur', _fx_blur_radius: 27 };
    tool.render(svg, 600, 900, state);
    fx.applyFx(svg, 600, 900, state);
    expect(svg.querySelector('feGaussianBlur').getAttribute('stdDeviation')).toBe('27');
  });
});
