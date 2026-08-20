import { describe, it, expect, beforeAll } from 'vitest';
import { installCanvasDom, defaultState } from './helpers.js';

// api.js is the headless entry point. It must expose every generator and be
// importable without the app shell — it previously threw `document is not
// defined` at import time, so nothing it advertised actually worked.
installCanvasDom();

let api;
beforeAll(async () => { api = await import('../api.js'); });

describe('public API surface', () => {
  it('exports the tool registry, core, helpers and palette data', () => {
    for (const key of ['tools', 'core', 'helpers', 'voronoi', 'NICE_PALETTES', 'applyPaletteToTool']) {
      expect(api[key], `api.js must export ${key}`).toBeDefined();
    }
  });

  it('exposes all 34 generators keyed by name', () => {
    expect(Object.keys(api.tools)).toHaveLength(34);
    for (const [key, tool] of Object.entries(api.tools)) {
      expect(typeof tool.render, `${key}.render`).toBe('function');
      expect(tool.slug, `${key}.slug`).toBeTruthy();
      expect(Array.isArray(tool.controls), `${key}.controls`).toBe(true);
    }
  });

  it('every exported tool renders through the public surface', () => {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    for (const [key, tool] of Object.entries(api.tools)) {
      const svg = document.createElementNS(SVG_NS, 'svg');
      expect(() => tool.render(svg, 600, 900, defaultState(tool)), `${key} render`).not.toThrow();
      expect(svg.childNodes.length, `${key} produced no output`).toBeGreaterThan(0);
    }
  });

  it('applyPaletteToTool works against a caller-supplied store', () => {
    const tool = api.tools.splat;
    const store = {};
    api.applyPaletteToTool(tool, api.NICE_PALETTES[0], store);
    const slots = tool.controls.filter(c => c.type === 'color');
    for (const c of slots) {
      expect(store[tool.slug][c.id], `${c.id} unset`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('exposes toHex through core', () => {
    expect(api.core.toHex('hsl(0,100%,50%)')).toBe('#ff0000');
  });
});

describe('headless safety', () => {
  it('no module in the api graph touches the DOM at import scope', async () => {
    const { readFileSync, readdirSync } = await import('fs');
    const { resolve } = await import('path');
    // jsdom's import.meta.url is not a file: URL; vitest runs from the root.
    const at = (p) => resolve(process.cwd(), p);
    const problems = [];
    const files = [
      'assets/js/core.js',
      'assets/js/palettes.data.js',
      'assets/js/tools/_helpers.js',
      'assets/js/tools/_voronoi.js',
      'assets/js/tools/burst.js',
      'assets/js/tools/tessera.js',
      ...readdirSync(at('assets/js/tools'))
        .filter(f => f.endsWith('.js')).map(f => 'assets/js/tools/' + f),
      ...readdirSync(at('assets/js/tools/tile'))
        .filter(f => f.endsWith('.js')).map(f => 'assets/js/tools/tile/' + f),
    ];
    for (const f of files) {
      const src = readFileSync(at(f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      // `window` is browser-only and `getContext` needs a canvas backend —
      // both blow up in Node. Neither belongs anywhere in the API graph, at
      // module scope or inside a render path.
      for (const line of src.split('\n')) {
        if (/^(window|document)\./.test(line)) problems.push(`${f}: module-scope DOM — ${line.trim().slice(0, 60)}`);
        // core.js legitimately drives browser-only UI behind `hasDOM`;
        // generator files have no such excuse — they must stay portable.
        if (/\bwindow\./.test(line) && f.includes('/tools/'))
          problems.push(`${f}: uses window — ${line.trim().slice(0, 60)}`);
        if (/getContext\(/.test(line) && !f.endsWith('core.js'))
          problems.push(`${f}: getContext outside core — ${line.trim().slice(0, 60)}`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});

describe('deterministic rendering', () => {
  it('exposes setSeed through core', () => {
    expect(typeof api.core.setSeed).toBe('function');
    expect(typeof api.core.random).toBe('function');
  });

  it('the same seed reproduces byte-identical output for every generator', () => {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const render = (tool) => {
      const svg = document.createElementNS(SVG_NS, 'svg');
      tool.render(svg, 600, 900, defaultState(tool));
      return svg.innerHTML;
    };
    const mismatches = [];
    for (const [key, tool] of Object.entries(api.tools)) {
      api.core.setSeed(1234);
      const a = render(tool);
      api.core.setSeed(1234);
      const b = render(tool);
      if (a !== b) mismatches.push(key);
    }
    api.core.setSeed(null);
    expect(mismatches, `not reproducible under a fixed seed: ${mismatches.join(', ')}`).toEqual([]);
  });

  it('different seeds produce different art', () => {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const tool = api.tools.splat;
    const render = () => {
      const svg = document.createElementNS(SVG_NS, 'svg');
      tool.render(svg, 600, 900, defaultState(tool));
      return svg.innerHTML;
    };
    api.core.setSeed(1); const a = render();
    api.core.setSeed(2); const b = render();
    api.core.setSeed(null);
    expect(a).not.toBe(b);
  });

  it('accepts a string seed', () => {
    expect(() => api.core.setSeed('martes')).not.toThrow();
    const v = api.core.random();
    api.core.setSeed('martes');
    expect(api.core.random()).toBe(v);
    api.core.setSeed(null);
  });
});
