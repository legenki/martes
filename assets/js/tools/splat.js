// ── 19. sssplatter — organic blob ─────
//
// Original math:
//   N evenly-spaced angles, each vertex at random r in [lowerBound, H] / 3 + H/6
//   lowerBound = map(splatterLevel, 0, H, H, 0)  → high splatter = low lowerBound = more variance
//   Smooth mode: Catmull-Rom tangent formula: cp = p ± (next - prev) / 6
//   Rough mode:  straight polygon lines
//   Gradient: vertical linearGradient spanning full canvas height

function splatBlobPath(N, splatterLevel, cx, cy, W, H, smooth) {
  // Exact Two.js original:
  //   two.height = H (canvas height, was 700 in original but we scale)
  //   lowerBound = map(splatterLevel, 0, 700, 700, 0) mapped to our H
  //   radius = random(lowerBound, two.height) / 3 + two.height / 6
  //
  // We keep splatterLevel in 0–700 range (matches slider), then scale to H:
  const lowerBound = map(splatterLevel, 0, 700, H, 0); // high splatter → low lowerBound → more variance
  const H0 = H;

  // Build vertices: evenly spaced angles, random radius per vertex
  const verts = [];
  for (let i = 0; i < N; i++) {
    const theta = ((i + 1) / N) * Math.PI * 2;
    const r = rnd(lowerBound, H0) / 3 + H0 / 6;
    verts.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta)]);
  }

  if (!smooth) {
    // Rough mode: straight polygon
    return verts.map((v, i) => (i === 0 ? `M ${v[0].toFixed(2)} ${v[1].toFixed(2)}` : `L ${v[0].toFixed(2)} ${v[1].toFixed(2)}`)).join(' ') + ' Z';
  }

  // Smooth mode: exact Two.js getCurveFromPoints / getControlPoints algorithm
  // Source: two.js/src/utils/curves.js — getControlPoints(a, b, c)
  //
  // For each point b (with neighbours a=prev, c=next):
  //   a1 = angleBetween(a, b)  — angle FROM a TO b
  //   a2 = angleBetween(c, b)  — angle FROM c TO b
  //   mid = (a1 + a2) / 2
  //   if (a2 < a1) mid += PI/2  else mid -= PI/2
  //   left  handle: (cos(mid)*d1,  sin(mid)*d1)   where d1 = dist(a,b)*0.33
  //   right handle: (cos(mid-PI)*d2, sin(mid-PI)*d2) where d2 = dist(b,c)*0.33
  //
  // In SVG cubic bezier terms:
  //   segment from verts[i] to verts[i+1]:
  //     cp1 = right handle of verts[i]   (= cur + cos(mid-PI)*d2, ...)
  //     cp2 = left  handle of verts[i+1] (relative, added to verts[i+1])
  const n = verts.length;
  const HALF_PI = Math.PI / 2;

  // Store [leftX, leftY, rightX, rightY] for each vertex (absolute coords)
  const handles = new Array(n);

  for (let i = 0; i < n; i++) {
    const a = verts[(i - 1 + n) % n]; // prev
    const b = verts[i];               // current
    const c = verts[(i + 1) % n];     // next

    // Vector.angleBetween(v1, v2) = atan2(v1.y - v2.y, v1.x - v2.x) — вектор от v2 к v1
    const a1 = Math.atan2(a[1] - b[1], a[0] - b[0]); // angleBetween(a, b) = вектор от b к a (к prev)
    const a2 = Math.atan2(c[1] - b[1], c[0] - b[0]); // angleBetween(c, b) = вектор от b к c (к next)

    const d1 = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.33;
    const d2 = Math.hypot(c[0] - b[0], c[1] - b[1]) * 0.33;

    let mid = (a1 + a2) / 2;
    if (a2 < a1) mid += HALF_PI;
    else         mid -= HALF_PI;

    // left handle (points toward prev neighbour direction)
    const lx = b[0] + Math.cos(mid) * d1;
    const ly = b[1] + Math.sin(mid) * d1;

    // right handle (opposite direction, points toward next neighbour)
    const rx = b[0] + Math.cos(mid - Math.PI) * d2;
    const ry = b[1] + Math.sin(mid - Math.PI) * d2;

    handles[i] = [lx, ly, rx, ry];
  }

  // Build SVG path: M v[0], then C right[i] left[i+1] v[i+1] for each segment
  let d = `M ${verts[0][0].toFixed(2)} ${verts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // cp1 = right handle of current vertex
    // cp2 = left handle of next vertex
    const cp1x = handles[i][2],  cp1y = handles[i][3];
    const cp2x = handles[j][0],  cp2y = handles[j][1];
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}` +
         ` ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}` +
         ` ${verts[j][0].toFixed(2)} ${verts[j][1].toFixed(2)}`;
  }
  return d + ' Z';
}

function renderSplat(svg, W, H, s) {
  // ── defs: vertical gradient (top→bottom, like original) ──────
  const defs = svgEl('defs');
  const gradId = uid('splat-grad');
  const grad = svgEl('linearGradient', {
    id: gradId,
    x1: String(W / 2), y1: '0',
    x2: String(W / 2), y2: String(H),
    gradientUnits: 'userSpaceOnUse'
  });
  grad.appendChild(svgEl('stop', { offset:'0%',   'stop-color': s.color1 }));
  grad.appendChild(svgEl('stop', { offset:'100%', 'stop-color': s.color2 }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  // ── background ───────────────────────────────────────────────
  svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill: s.bgColor }));

  const cx = W / 2, cy = H / 2;
  const fill = s.fillType === 'gradient' ? `url(#${gradId})` : s.color1;

  // ── main blob ────────────────────────────────────────────────
  const blobD = splatBlobPath(s.complexity, s.splatterLevel, cx, cy, W, H, s.smooth);
  svg.appendChild(svgEl('path', { d: blobD, fill, stroke: 'none' }));

  // ── secondary splats (bonus feature on top of original) ──────
  if (s.splats > 0) {
    for (let k = 0; k < s.splats; k++) {
      // Place smaller blobs around the canvas, not overlapping center too much
      const angle = (k / s.splats) * Math.PI * 2 + rnd(0, Math.PI * 2 / s.splats);
      const dist  = rnd(H * 0.18, H * 0.38);
      const scx = cx + Math.cos(angle) * dist;
      const scy = cy + Math.sin(angle) * dist;

      // Scale splatterLevel for sub-blobs (less variance, smaller)
      const subLevel = s.splatterLevel * rnd(0.25, 0.55);
      const subN = rndInt(10, 18);
      // Temporarily scale H for sub-blob radius
      const subH = H * rnd(0.25, 0.5);
      const subD = splatBlobPath(subN, subLevel, scx, scy, W, subH, s.smooth);
      const subOpacity = rnd(0.5, 0.92);
      svg.appendChild(svgEl('path', { d: subD, fill, stroke: 'none', opacity: subOpacity.toFixed(2) }));
    }
  }
}

TOOLS.push({
  cat: 'Form', slug: 'splat', name: 'Splat', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 C13 3 15 5 15 8 C18 9 17 13 14 14 C14 17 11 18 9 16 C6 18 3 16 4 13 C2 11 3 7 6 7 C7 4 9 3 10 3 Z"/></svg>',
  desc: 'Organic blob',
  render: renderSplat,
  controls: [
    { type:'color',    id:'bgColor',       label:'Background',   default:'#ffffff' },
    { type:'color',    id:'color1',        label:'Color 1',      default:'#ff6b6b' },
    { type:'color',    id:'color2',        label:'Color 2',      default:'#7dddd2' },
    { type:'btngroup', id:'fillType',      label:'Fill',         default:'solid',
      options:['Solid','Gradient'], values:['solid','gradient'] },
    { type:'toggle',   id:'smooth',        label:'Smooth',       default:true },
    { type:'range',    id:'complexity',    label:'Complexity',   default:22,  min:3,   max:60,  step:1 },
    { type:'range',    id:'splatterLevel', label:'Splatter',     default:700, min:0,   max:700, step:5 },
    { type:'range',    id:'splats',        label:'Extra splats', default:0,   min:0,   max:8,   step:1 },
  ]
});
