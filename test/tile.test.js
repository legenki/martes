import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { installCanvasDom, freshSvg, defaultState, countPainted } from './helpers.js';

installCanvasDom();

const TILE_SLUGS = ['terrain','symmetry','bloks','disque','trigram','mixtape','ring','blossom','veil','radius','odessa'];
let TILES = [], helpers;

beforeAll(async () => {
  helpers = await import('../assets/js/tools/_helpers.js');
  const mods = await Promise.all(TILE_SLUGS.map(s => import(`../assets/js/tools/tile/${s}.js`)));
  TILES = mods.map(m => m.default);
});

beforeEach(() => { installCanvasDom(); });

describe('tile helpers', () => {
  it('parseGrid parses "COLSxROWS"', () => {
    expect(helpers.parseGrid('4x6')).toEqual({ cols: 4, rows: 6 });
    expect(helpers.parseGrid('10x15')).toEqual({ cols: 10, rows: 15 });
  });

  it('parseGrid falls back on malformed input', () => {
    expect(helpers.parseGrid('')).toEqual({ cols: 4, rows: 6 });
    expect(helpers.parseGrid('garbage')).toEqual({ cols: 4, rows: 6 });
  });

  // Regression: _helpers.js used svgEl without importing it, so every one of
  // these threw ReferenceError and no tile generator could render at all.
  it('tileGrid builds a cell group per grid slot', () => {
    const svg = freshSvg();
    const painted = [];
    helpers.tileGrid(svg, 600, 900, '4x6', '#fff', (cell, x, y, w, h) => painted.push([x, y, w, h]));
    expect(painted).toHaveLength(24);
    expect(painted[0]).toEqual([0, 0, 150, 150]);
    // Background rect + one <g> per cell.
    expect(svg.querySelector('rect')).toBeTruthy();
    expect(svg.querySelectorAll('g')).toHaveLength(24);
  });

  it('tileGrid passes 1-based col/row indices', () => {
    const svg = freshSvg();
    const idx = [];
    helpers.tileGrid(svg, 100, 100, '2x2', '#fff', (cell, x, y, w, h, c, r) => idx.push([c, r]));
    expect(idx).toEqual([[1,1],[2,1],[1,2],[2,2]]);
  });

  it('addClipPath registers a clipPath in defs and returns its id', () => {
    const svg = freshSvg();
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    const id = helpers.addClipPath(defs, 'M0 0 L10 10 Z');
    expect(id).toBeTruthy();
    expect(defs.querySelector(`clipPath#${id}`)).toBeTruthy();
    expect(defs.querySelector('path').getAttribute('d')).toBe('M0 0 L10 10 Z');
  });

  it('addClipPath returns a unique id each call', () => {
    const svg = freshSvg();
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    const ids = new Set(Array.from({ length: 50 }, () => helpers.addClipPath(defs, 'M0 0')));
    expect(ids.size).toBe(50);
  });

  it('addDropShadow builds a usable filter', () => {
    const svg = freshSvg();
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    const id = helpers.addDropShadow(defs, 8, 0.3);
    const filter = defs.querySelector(`filter#${id}`);
    expect(filter).toBeTruthy();
    expect(filter.querySelector('feGaussianBlur').getAttribute('stdDeviation')).toBe('8');
    expect(filter.querySelector('feMerge')).toBeTruthy();
  });

  it('setupTile resolves the six palette slots from state', () => {
    const svg = freshSvg();
    const { pal, grid, freq } = helpers.setupTile(svg, 600, 900, {
      color0:'#000', color1:'#111', color2:'#222', color3:'#333', color4:'#444', color5:'#555',
      grid:'4x6', frequency:0.8,
    });
    expect(pal).toEqual(['#000','#111','#222','#333','#444','#555']);
    expect(grid).toBe('4x6');
    expect(freq).toBe(0.8);
    expect(svg.querySelector('defs')).toBeTruthy();
  });

  it('clipCircleInCell centres the circle inside the cell', () => {
    // r = rPct * min(w,h) = 0.5 * 100 = 50, centred at (50,50);
    // pathCircleAt starts the arc at cx - r.
    const d = helpers.clipCircleInCell(0, 0, 100, 100, 0.5, 0.5, 0.5);
    expect(d).toContain('M0 50');
    expect(d).toContain('a50 50');
    expect(d).not.toMatch(/NaN/);
    // A quarter-cell circle sits centred but smaller.
    expect(helpers.clipCircleInCell(0, 0, 100, 100, 0.25, 0.5, 0.5)).toContain('M25 50');
  });

  it('hypocycloidPath produces a closed path with no NaN', () => {
    const d = helpers.hypocycloidPath(50, 50, 40, 4, 20);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).not.toMatch(/NaN/);
  });

  it('pathPolygon builds a closed polygon path', () => {
    expect(helpers.pathPolygon([[0,0],[10,0],[10,10]])).toBe('M0 0L10 0L10 10Z');
  });
});

describe('tile generators', () => {
  it('all 11 tile presets are registered under the Tile category', () => {
    expect(TILES).toHaveLength(11);
    for (const t of TILES) {
      expect(t.cat, `${t.slug} category`).toBe('Tile');
      expect(t.slug.startsWith('tile-'), `${t.slug} slug prefix`).toBe(true);
    }
  });

  it('every tile preset exposes six colour controls', () => {
    for (const t of TILES) {
      const colors = t.controls.filter(c => c.type === 'color');
      expect(colors, `${t.slug} colour count`).toHaveLength(6);
      expect(colors.map(c => c.id)).toEqual(['color0','color1','color2','color3','color4','color5']);
    }
  });

  it('every tile preset renders geometry with defaults', () => {
    const failures = [];
    for (const t of TILES) {
      const svg = freshSvg();
      try {
        t.render(svg, 600, 900, defaultState(t));
        if (countPainted(svg) === 0) failures.push(`${t.slug}: rendered nothing`);
      } catch (e) {
        failures.push(`${t.slug}: ${e.constructor.name}: ${e.message}`);
      }
    }
    expect(failures, `tile generators failed:\n${failures.join('\n')}`).toEqual([]);
  });

  it('honours the selected grid density', () => {
    for (const t of TILES) {
      const gridCtl = t.controls.find(c => c.id === 'grid');
      if (!gridCtl) continue;
      const svg = freshSvg();
      // frequency 1 (where supported) so every cell paints deterministically.
      t.render(svg, 600, 900, { ...defaultState(t), grid: '10x15', frequency: 1 });
      const { cols, rows } = helpers.parseGrid('10x15');
      expect(svg.querySelectorAll('g').length, `${t.slug} cell groups`).toBeGreaterThanOrEqual(cols * rows);
    }
  });

  it('paints more with high frequency than with low', () => {
    for (const t of TILES) {
      if (!t.controls.some(c => c.id === 'frequency')) continue;
      const count = (freq) => {
        let total = 0;
        // Average over runs — these generators are stochastic by design.
        for (let i = 0; i < 12; i++) {
          const svg = freshSvg();
          t.render(svg, 600, 900, { ...defaultState(t), grid: '8x12', frequency: freq });
          total += countPainted(svg);
        }
        return total / 12;
      };
      expect(count(1), `${t.slug} frequency has no effect`).toBeGreaterThan(count(0.2));
    }
  });

  it('uses the palette colours it was given', () => {
    for (const t of TILES) {
      const svg = freshSvg();
      const state = { ...defaultState(t),
        color0:'#010101', color1:'#ff0000', color2:'#ff0000',
        color3:'#ff0000', color4:'#ff0000', color5:'#ff0000',
        frequency: 1 };
      t.render(svg, 600, 900, state);
      const fills = [...svg.querySelectorAll('*')]
        .map(el => (el.getAttribute('fill') || el.getAttribute('stroke') || '').toLowerCase())
        .filter(Boolean);
      const known = new Set(['#010101', '#ff0000', 'none']);
      // url(#…) references a gradient/pattern defined in <defs>; those are
      // built from the same palette, so they are not "foreign" colours.
      const foreign = fills.filter(f => !known.has(f) && !f.startsWith('url('));
      expect(foreign, `${t.slug} painted unexpected colours: ${[...new Set(foreign)].join(',')}`).toEqual([]);
    }
  });
});
