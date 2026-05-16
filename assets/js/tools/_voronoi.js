// ═══════════════════════════════════════════════════════════════
// SHARED — Voronoi engine + SVG shape parsing utilities
// Used by: burst.js, leaf.js, prism.js
// ═══════════════════════════════════════════════════════════════

// ── SVG path sanitiser ────────────────────────────────────────
// Whitelist-only: strips any character that isn't a valid SVG path
// command letter, digit, sign, decimal, comma, or whitespace.
// This blocks XSS payloads injected via custom shape textareas.
const _SVG_PATH_SAFE = /[^MmLlHhVvCcSsQqTtAaZz0-9.,\s\-+eE]/g;
function sanitizeSvgPath(d) {
  if (typeof d !== 'string') return '';
  return d.replace(_SVG_PATH_SAFE, '');
}

// ── SVG Shape Input Parser ─────────────────────────────────────
// Accepts: full <svg>…</svg>, just <path d="…"/>, or bare d-string
// Returns: { d, vbW, vbH, fillRule } or null on failure
function parseSvgShapeInput(text) {
  text = text.trim();
  if (!text) return null;

  let d = null, vbW = null, vbH = null, fillRule = 'nonzero';

  // Case 1: contains an SVG tag — parse via DOMParser
  if (text.includes('<svg') || text.includes('<path') || text.includes('<polygon') || text.includes('<circle')) {
    const parser = new DOMParser();
    // Wrap bare elements in an svg if needed
    const wrapped = text.startsWith('<svg') ? text : `<svg xmlns="http://www.w3.org/2000/svg">${text}</svg>`;
    const doc = parser.parseFromString(wrapped, 'image/svg+xml');
    const svgRoot = doc.querySelector('svg');

    // Extract viewBox dimensions
    if (svgRoot) {
      const vb = svgRoot.getAttribute('viewBox');
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/);
        if (parts.length === 4) { vbW = parseFloat(parts[2]); vbH = parseFloat(parts[3]); }
      }
      if (!vbW) vbW = parseFloat(svgRoot.getAttribute('width')) || null;
      if (!vbH) vbH = parseFloat(svgRoot.getAttribute('height')) || null;
    }

    // Find path, polygon, rect, circle and convert to path d
    const pathEl = doc.querySelector('path');
    const polyEl = doc.querySelector('polygon');
    const circleEl = doc.querySelector('circle');

    if (pathEl) {
      d = pathEl.getAttribute('d') || '';
      fillRule = pathEl.getAttribute('fill-rule') || 'nonzero';
    } else if (polyEl) {
      // Convert polygon points to path
      const pts = (polyEl.getAttribute('points') || '').trim().split(/[\s,]+/);
      let pd = '';
      for (let i = 0; i < pts.length - 1; i += 2) {
        pd += (i === 0 ? 'M' : 'L') + pts[i] + ',' + pts[i+1] + ' ';
      }
      d = pd + 'Z';
    } else if (circleEl) {
      const cx = parseFloat(circleEl.getAttribute('cx') || 0);
      const cy = parseFloat(circleEl.getAttribute('cy') || 0);
      const r  = parseFloat(circleEl.getAttribute('r') || 10);
      d = `M ${cx+r},${cy} A ${r},${r} 0 1 1 ${cx+r-0.001},${cy} Z`;
    }
  } else {
    // Case 2: bare d-string
    d = text;
  }

  if (!d) return null;
  // Sanitize before returning
  d = sanitizeSvgPath(d);
  return { d, vbW, vbH, fillRule };
}

// Scale a path d-string to fit in targetW×targetH centered at (cx,cy)
// Uses SVG getBBox via a temporary element in the document
function normalizeSvgPath(d, fillRule, targetW, targetH, centerX, centerY) {
  // Create temp SVG to measure bounding box
  const tmpSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tmpSvg.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0;overflow:hidden';
  const tmpPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tmpPath.setAttribute('d', d);
  if (fillRule) tmpPath.setAttribute('fill-rule', fillRule);
  tmpSvg.appendChild(tmpPath);
  document.body.appendChild(tmpSvg);

  let bbox;
  try { bbox = tmpPath.getBBox(); } catch(e) { bbox = null; }
  document.body.removeChild(tmpSvg);

  if (!bbox || bbox.width === 0 || bbox.height === 0) return d; // can't normalize

  // Scale to fit targetW×targetH preserving aspect ratio
  const scale = Math.min(targetW / bbox.width, targetH / bbox.height) * 0.88;
  const tx = centerX - (bbox.x + bbox.width / 2) * scale;
  const ty = centerY - (bbox.y + bbox.height / 2) * scale;

  // Apply transform via matrix embedded in a group — return as nested path
  return { d, transform: `translate(${tx.toFixed(3)},${ty.toFixed(3)}) scale(${scale.toFixed(5)})`, fillRule };
}

// ── High-quality Voronoi via grid-accelerated Lloyd relaxation ──
// Grid resolution adapts to point count for uniform results at all amounts.
function buildUniformVoronoi(W, H, N, cx, cy, biasStrength) {
  // Step 1: seed with random-bias toward focus point
  function seedPt() {
    const rx = Math.random(), ry = Math.random();
    // Bias: pull toward (cx/W, cy/H) with strength
    const bx = cx / W, by = cy / H;
    const px = rx + (bx - rx) * (1 - Math.pow(Math.random(), biasStrength));
    const py = ry + (by - ry) * (1 - Math.pow(Math.random(), biasStrength));
    return { x: clamp(px, 0, 1) * W, y: clamp(py, 0, 1) * H };
  }
  let pts = Array.from({length: N}, seedPt);

  // Step 2: Lloyd relaxation on adaptive grid
  // Grid resolution: aim for ~8-12 pts per grid cell on average
  const GR = Math.max(40, Math.min(200, Math.round(Math.sqrt(N * 10))));
  const gW = GR, gH = Math.round(GR * H / W);
  const scx = W / gW, scy = H / gH;
  const ITERS = 18;

  for (let iter = 0; iter < ITERS; iter++) {
    // Build spatial index
    const cell = new Int32Array(gW * gH).fill(-1);
    const distSq = new Float64Array(gW * gH).fill(Infinity);

    for (let i = 0; i < pts.length; i++) {
      // Only update nearby grid cells for speed (radius = sqrt(W*H/N)*2)
      const radius = Math.sqrt(W * H / N) * 2.5;
      const gxc = pts[i].x / scx, gyc = pts[i].y / scy;
      const gr = Math.ceil(radius / Math.min(scx, scy)) + 1;
      const gx0 = Math.max(0, Math.floor(gxc - gr));
      const gx1 = Math.min(gW - 1, Math.ceil(gxc + gr));
      const gy0 = Math.max(0, Math.floor(gyc - gr));
      const gy1 = Math.min(gH - 1, Math.ceil(gyc + gr));

      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const wx = (gx + 0.5) * scx, wy = (gy + 0.5) * scy;
          const dx = wx - pts[i].x, dy = wy - pts[i].y;
          const d2 = dx*dx + dy*dy;
          const idx = gy * gW + gx;
          if (d2 < distSq[idx]) { distSq[idx] = d2; cell[idx] = i; }
        }
      }
    }

    // Compute centroids
    const sx = new Float64Array(N), sy = new Float64Array(N), cnt = new Int32Array(N);
    for (let gy = 0; gy < gH; gy++) {
      for (let gx = 0; gx < gW; gx++) {
        const i = cell[gy * gW + gx];
        if (i < 0) continue;
        sx[i] += (gx + 0.5) * scx;
        sy[i] += (gy + 0.5) * scy;
        cnt[i]++;
      }
    }

    // Move toward centroid (strong pull early, gentle later)
    const t = iter / ITERS;
    const alpha = lerp(0.85, 0.3, t);
    for (let i = 0; i < N; i++) {
      if (cnt[i] === 0) continue;
      pts[i] = {
        x: lerp(pts[i].x, sx[i] / cnt[i], alpha),
        y: lerp(pts[i].y, sy[i] / cnt[i], alpha),
      };
    }
  }

  // Step 3: compute innerCircleRadius for each point
  // Use k-d like approach: sort by x for faster nearest-neighbor
  const sorted = pts.map((p, i) => ({...p, i})).sort((a, b) => a.x - b.x);
  const pos = new Array(N);
  sorted.forEach((p, si) => { pos[p.i] = si; });

  return pts.map((p, i) => {
    const si = pos[i];
    let minD = Infinity;
    // Check nearby points in sorted order
    for (let di = 1; di < N; di++) {
      const j1 = si - di, j2 = si + di;
      let checked = 0;
      for (const sj of [j1, j2]) {
        if (sj < 0 || sj >= N) continue;
        const q = sorted[sj];
        const dx = Math.abs(p.x - q.x);
        if (dx >= minD) { checked++; continue; }
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < minD) minD = d;
      }
      if (checked === 2) break;
    }
    const edgeDist = Math.min(p.x, p.y, W - p.x, H - p.y);
    const r = Math.min(minD * 0.46, edgeDist * 0.9);
    return { cx: p.x, cy: p.y, r: Math.max(r, 1) };
  });
}
