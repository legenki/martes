import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { installCanvasDom, freshSvg, defaultState, controlValues, countPainted, findBadAttrs } from './helpers.js';

installCanvasDom();

// Import every generator through the same paths registry.js uses.
const TILE_SLUGS = ['terrain','symmetry','bloks','disque','trigram','mixtape','ring','blossom','veil','radius','odessa'];
const PLAIN_SLUGS = ['splat','dust','prism','leaf','drift','coil','wave','orbit','vortex','slash','mirror',
                     'ripple','bloom','flux','quartz','haze','shine','surf','scale','burst','halo','whorl','tessera'];

let TOOLS = [];

beforeAll(async () => {
  const plain = await Promise.all(PLAIN_SLUGS.map(s => import(`../assets/js/tools/${s}.js`)));
  const tile  = await Promise.all(TILE_SLUGS.map(s => import(`../assets/js/tools/tile/${s}.js`)));
  TOOLS = [...plain, ...tile].map(m => m.default);
});

beforeEach(() => { document.body.querySelectorAll('svg').forEach(s => s.remove()); installCanvasDom(); });

describe('registry contract', () => {
  it('exposes all 34 generators', () => {
    expect(TOOLS).toHaveLength(34);
  });

  it('every generator declares slug, name, render and controls', () => {
    for (const t of TOOLS) {
      expect(t, 'a module exported no default').toBeTruthy();
      expect(typeof t.slug, `${t?.name} slug`).toBe('string');
      expect(typeof t.name, `${t?.slug} name`).toBe('string');
      expect(typeof t.render, `${t?.slug} render`).toBe('function');
      expect(Array.isArray(t.controls), `${t?.slug} controls`).toBe(true);
    }
  });

  it('slugs are unique', () => {
    const slugs = TOOLS.map(t => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every control has an id, type and a default', () => {
    for (const t of TOOLS) {
      for (const c of t.controls) {
        expect(c.id, `${t.slug} control missing id`).toBeTruthy();
        expect(c.type, `${t.slug}.${c.id} missing type`).toBeTruthy();
        expect(c.default, `${t.slug}.${c.id} missing default`).toBeDefined();
      }
    }
  });

  it('control ids are unique within a tool', () => {
    for (const t of TOOLS) {
      const ids = t.controls.map(c => c.id);
      expect(new Set(ids).size, `${t.slug} has duplicate control ids`).toBe(ids.length);
    }
  });

  it('range controls have coherent min/max/step', () => {
    for (const t of TOOLS) {
      for (const c of t.controls.filter(c => c.type === 'range')) {
        expect(c.min, `${t.slug}.${c.id} min`).toBeTypeOf('number');
        expect(c.max, `${t.slug}.${c.id} max`).toBeTypeOf('number');
        expect(c.max, `${t.slug}.${c.id} max>min`).toBeGreaterThan(c.min);
        expect(c.default).toBeGreaterThanOrEqual(c.min);
        expect(c.default).toBeLessThanOrEqual(c.max);
      }
    }
  });
});

describe('rendering with defaults', () => {
  it('every generator renders without throwing', () => {
    const failures = [];
    for (const t of TOOLS) {
      const svg = freshSvg();
      try {
        t.render(svg, 600, 900, defaultState(t));
      } catch (e) {
        failures.push(`${t.slug}: ${e.constructor.name}: ${e.message}`);
      }
    }
    expect(failures, `generators threw:\n${failures.join('\n')}`).toEqual([]);
  });

  it('every generator paints visible geometry', () => {
    const empty = [];
    for (const t of TOOLS) {
      const svg = freshSvg();
      try { t.render(svg, 600, 900, defaultState(t)); } catch { /* covered above */ }
      if (countPainted(svg) === 0) empty.push(t.slug);
    }
    expect(empty, `generators produced no geometry: ${empty.join(', ')}`).toEqual([]);
  });

  it('every generator emits well-formed numeric attributes', () => {
    const bad = [];
    for (const t of TOOLS) {
      const svg = freshSvg();
      try { t.render(svg, 600, 900, defaultState(t)); } catch { continue; }
      const problems = findBadAttrs(svg);
      if (problems.length) bad.push(`${t.slug}: ${problems.slice(0, 3).join(' ')}`);
    }
    expect(bad, `generators emitted invalid attributes:\n${bad.join('\n')}`).toEqual([]);
  });

  it('renders into the canvas it is given, not a global', () => {
    for (const t of TOOLS) {
      const a = freshSvg(), b = freshSvg();
      t.render(a, 600, 900, defaultState(t));
      expect(b.children.length, `${t.slug} leaked into another canvas`).toBe(0);
    }
  });
});

describe('re-render stability', () => {
  it('repeated renders on a cleared canvas stay consistent', () => {
    for (const t of TOOLS) {
      const svg = freshSvg();
      for (let i = 0; i < 5; i++) {
        svg.replaceChildren();
        expect(() => t.render(svg, 600, 900, defaultState(t)), `${t.slug} failed on pass ${i}`).not.toThrow();
        expect(countPainted(svg), `${t.slug} empty on pass ${i}`).toBeGreaterThan(0);
      }
    }
  });

  it('generates unique def ids across renders (no clipPath/filter collisions)', () => {
    for (const t of TOOLS) {
      const svg = freshSvg();
      const seen = new Set();
      for (let i = 0; i < 3; i++) {
        svg.replaceChildren();
        t.render(svg, 600, 900, defaultState(t));
        for (const el of svg.querySelectorAll('[id]')) {
          expect(seen.has(el.id), `${t.slug} reused def id "${el.id}" across renders`).toBe(false);
          seen.add(el.id);
        }
      }
    }
  });
});

describe('canvas sizes', () => {
  for (const [label, W, H] of [['2:3 portrait', 600, 900], ['1:1 square', 900, 900]]) {
    it(`renders at ${label}`, () => {
      const failures = [];
      for (const t of TOOLS) {
        const svg = freshSvg(W, H);
        try {
          t.render(svg, W, H, defaultState(t));
          if (countPainted(svg) === 0) failures.push(`${t.slug}: empty`);
        } catch (e) { failures.push(`${t.slug}: ${e.message}`); }
      }
      expect(failures, failures.join('\n')).toEqual([]);
    });
  }
});

describe('parameter sweeps', () => {
  it('every control value renders without throwing', () => {
    const failures = [];
    for (const t of TOOLS) {
      for (const c of t.controls) {
        for (const v of controlValues(c)) {
          const svg = freshSvg();
          const state = { ...defaultState(t), [c.id]: v };
          try {
            t.render(svg, 600, 900, state);
          } catch (e) {
            failures.push(`${t.slug} [${c.id}=${JSON.stringify(v)}]: ${e.message}`);
          }
        }
      }
    }
    expect(failures, `parameter sweep failures:\n${failures.slice(0, 25).join('\n')}`).toEqual([]);
  });

  it('survives 20 randomized states per generator', () => {
    const failures = [];
    for (const t of TOOLS) {
      for (let i = 0; i < 20; i++) {
        const state = defaultState(t);
        for (const c of t.controls) {
          const opts = controlValues(c);
          state[c.id] = opts[Math.floor(Math.random() * opts.length)];
        }
        const svg = freshSvg();
        try { t.render(svg, 600, 900, state); }
        catch (e) { failures.push(`${t.slug}: ${e.message} state=${JSON.stringify(state)}`); }
      }
    }
    expect(failures, `randomized failures:\n${failures.slice(0, 15).join('\n')}`).toEqual([]);
  });
});
