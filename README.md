# Martes

A local design canvas that bundles two views into one tabbed interface:

- **Tools** — a single canvas with **34 SVG generators** in one sidebar:
  - 7 Weave generators (Slash, Quartz, Dust, Tessera, Orbit, Scale, Prism)
  - 8 Form generators (Burst, Halo, Vortex, Coil, Leaf, Splat, Mirror, Bloom)
  - 6 Flow generators (Surf, Wave, Ripple, Drift, Whorl, Shine)
  - 2 Field generators (Haze, Flux)
  - 11 Tile presets (Radius, Mixtape, Odessa, Veil, Blossom, Disque, Bloks, Terrain, Trigram, Ring, Symmetry) — pure SVG grid engine, no dependency.
- **Textures** — browser/downloader for a library of 360 textures, paginated as a **2 × 3 canvas grid** (6 per page).

Everything is plain HTML, CSS and ES2017 JavaScript served by a tiny Node.js process. No build step, no framework.

---

## Screenshot

> Add a screenshot of `index.html` to `docs/screenshot.png` once published.

---

## Quick start

Requires Node.js 16 or newer.

```bash
git clone https://github.com/<you>/martes.git
cd martes
npm start           # or: node server.js
```

Then open <http://localhost:8081>.

On macOS you can also double-click `start.command` from Finder — it picks Node if available, otherwise falls back to a static Python server.

---

## Project structure

```
martes/
├── index.html                    # entry point, two-tab shell
├── server.js                   # minimal static file server
├── start.command               # macOS double-click launcher
├── start.sh                    # POSIX launcher
├── package.json
│
├── assets/
│   ├── css/
│   │   └── style.css           # all interface styles (light minimal theme,
│   │                           #   responsive layout, system font stacks)
│   │
│   └── js/
│       ├── core.js             # utilities (svgEl, uid, rnd…), canvas state,
│       │                       #   render dispatcher, tab logic, sidebar toggle
│       ├── registry.js         # TOOLS array, sidebar + panel builder,
│       │                       #   controls, undo/redo, keyboard shortcuts,
│       │                       #   RAF throttle, actions (save/copy/PNG)
│       ├── textures.js         # paginated 2×3 gallery, filter, shuffle
│       └── tools/
│           ├── _helpers.js     # shared tile engine (tileGrid, clipPaths,
│           │                   #   filters, registerTilePreset)
│           ├── _voronoi.js     # shared Voronoi engine (buildUniformVoronoi),
│           │                   #   SVG shape parser, path sanitiser
│           ├── slash.js        # Weave: 10-Print diagonal lines
│           ├── quartz.js       # Weave: crystalline grid
│           ├── dust.js         # Weave: noise particles
│           ├── tessera.js      # Weave: isometric 3D tiling
│           ├── orbit.js        # Weave: orbital circles
│           ├── scale.js        # Weave: fish scale pattern
│           ├── prism.js        # Weave: rainbow Voronoi circles
│           ├── burst.js        # Form: Voronoi burst, multi-shape
│           ├── halo.js         # Form: halo rings
│           ├── vortex.js       # Form: spiral vortex
│           ├── coil.js         # Form: spring coil
│           ├── leaf.js         # Form: organic leaf grid
│           ├── splat.js        # Form: paint splatter
│           ├── mirror.js       # Form: reflected geometry
│           ├── bloom.js        # Form: bloom circles
│           ├── surf.js         # Flow: wave surface
│           ├── wave.js         # Flow: oscillating wave
│           ├── ripple.js       # Flow: ripple rings
│           ├── drift.js        # Flow: drifting scribble
│           ├── whorl.js        # Flow: whorl spiral
│           ├── shine.js        # Flow: twinkling stars
│           ├── haze.js         # Field: blurry gradient
│           ├── flux.js         # Field: flux distortion
│           └── tile/           # 11 grid presets
│               ├── radius.js, mixtape.js, odessa.js, veil.js,
│               ├── blossom.js, disque.js, bloks.js, terrain.js,
│               └── trigram.js, ring.js, symmetry.js
│
├── textures/
│   ├── thumb/                  # 360 thumbnail JPGs
│   └── full/                   # 360 full-resolution JPGs
└── LICENSE
```

The split keeps each concern in one file. Render functions are declared in `tools/<slug>.js`. Each tool self-registers via `TOOLS.push(...)` in `registry.js`. Shared utilities live in `_helpers.js` (tile engine) and `_voronoi.js` (Voronoi + SVG parser). There is no bundler.

---

## How it works

### Two-tab shell (`index.html`)
Top tabbar offers **Tools** and **Textures**. Each tab corresponds to a `.tab-panel`. The Tools tab is rendered eagerly; Textures is initialised lazily on first open (see `core.js` tab handler).

### Tools tab — unified canvas
Three-column layout: **sidebar** with all 34 generators (grouped by category), **center canvas** (one `<svg>` element), and **right panel** with controls.

On screens narrower than 1024px, the sidebar collapses into a hamburger drawer. Below 768px, the panel moves under the canvas.

Every tool renders into the same SVG, so Save SVG / Save PNG / Copy / Randomize work identically across the board:

```js
function renderTool() {
  if (!currentTool) return;
  clearSVG();
  currentTool.render(svg, canvasW, canvasH, getState());
}
```

### Per-tool files
Each `tools/<slug>.js` declares its render function and self-registers:

```js
function renderSlash(svg, W, H, s) { /* … */ }

TOOLS.push({
  cat: 'Weave', slug: 'slash', name: 'Slash', icon: '…',
  desc: '10 Print-inspired diagonal lines',
  render: renderSlash,
  controls: [
    { type:'color', id:'color', label:'Stroke color', default:'#e83e8c' },
    { type:'range', id:'blockSize', label:'Block size', default:54, min:10, max:200, step:2 },
    // …
  ]
});
```

### Grid presets (`tools/tile/*.js`)
The 11 presets are pure SVG generators. The file `_helpers.js` ships a grid engine — `tileGrid(parent, W, H, gridStr, bg, paint)` — that walks an M × N grid and calls `paint()` for each cell. Each preset calls `registerTilePreset()` to auto-build controls from palette + extras.

### Textures tab
Six textures per page, 2 × 3 grid (single column on mobile). Layout in `assets/css/style.css`:

```css
.tex-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
```

### `server.js`
A minimal Node http server that:

1. Serves files from the project root.
2. Decodes percent-encoding and resolves every path inside `ROOT` — `..` traversal and null-byte injection are blocked.
3. Rejects requests outside the project tree with `403`.

The server intentionally has no proxy, no remote fetches, no third-party endpoints. Everything runs locally.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `R` | Randomize |
| `S` | Save as SVG |
| `P` | Save as PNG |
| `C` | Copy SVG to clipboard |
| `↑` / `↓` | Previous / Next tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |

Shortcuts are disabled when focus is inside an input, textarea, or select.

---

## Theme

A single light minimal palette in `:root` at the top of `assets/css/style.css`:

| Token            | Value                  |
|------------------|------------------------|
| `--bg-main`      | `#ffffff`              |
| `--bg-soft`      | `#fafafa`              |
| `--bg-canvas`    | `#f4f4f5`              |
| `--text-primary` | `#18181b`              |
| `--text-muted`   | `rgba(24,24,27,0.55)`  |
| `--accent`       | `#18181b` (monochrome) |
| `--border`       | `rgba(0,0,0,0.08)`     |
| `--font-sans`    | system UI stack        |
| `--font-serif`   | `ui-serif, Georgia, …` |
| `--font-mono`    | `ui-monospace, SF Mono…` |

All controls read from these tokens. To rebrand, edit `:root` and the rest follows. Fonts are **system-only** — no `@font-face` declarations, no woff2 downloads.

---

## Textures notes

`textures/full/` is large (~944 MB) because it contains 360 full-resolution JPGs. If you fork this repo:

- Recompress the JPGs (`cjpeg -quality 80` or similar) before committing.
- Or move `textures/full/` to a release asset and load it on first run.
- Or add `textures/full/` to `.gitignore` and ship only `textures/thumb/`.

Thumbnails alone (`textures/thumb/`, ~20 MB) are enough for the gallery; full files are only fetched on download.

---

## Adding a new tool

### SVG generator
1. Create `tools/<slug>.js` with a render function:
   ```js
   function renderMytool(svg, W, H, s) {
     svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:s.bgColor }));
     // …
   }
   ```
2. Self-register via `TOOLS.push(...)`:
   ```js
   TOOLS.push({
     cat:'Weave', slug:'mytool', name:'Mytool', icon:'…',
     desc:'…', render:renderMytool,
     controls:[
       { type:'color', id:'bgColor', label:'Background', default:'#fff' },
       { type:'range', id:'size',    label:'Size',       default:50, min:10, max:200, step:1 },
     ]
   });
   ```
3. Add `<script src="assets/js/tools/mytool.js"></script>` to `index.html`.

### Grid (tile) preset
1. Write a `renderTileFoo(svg, W, H, s)` function in `tools/tile/foo.js`:
   ```js
   function renderTileFoo(svg, W, H, s) {
     const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
     tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
       if (!chance(freq)) return;
       cell.appendChild(svgEl('circle', {
         cx: x + w/2, cy: y + h/2, r: Math.min(w,h)/3,
         fill: pickFrom([pal[1], pal[2], pal[3]])
       }));
     });
   }
   ```
2. Register via `registerTilePreset(...)`:
   ```js
   registerTilePreset({
     slug:'tile-foo', name:'Foo', render:renderTileFoo,
     palette:['#fff','#000','#3FFFB2','#3EECFF','#FF3D8B','#ECFF3D'],
     defaults:{ grid:'4x6', frequency:1 },
     extras:['grid','frequency']
   });
   ```
3. Add the `<script>` tag to `index.html`.

---

## Browser support

Modern Chromium / Firefox / Safari. Uses native CSS Grid, `aspect-ratio`, `backdrop-filter`, `:focus-visible`, `replaceChildren()`, and ES2017 — no transpiler, no custom elements.

---

## License

[MIT](LICENSE).
