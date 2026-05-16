// ── 2. qqquad — Bauhaus quadtree triangles ──────
// Original: `frequency` random points scattered → quadtree subdivision
// Each quadtree cell → draw triangle (3 of 4 corners randomly chosen)
// gap = padding inside each cell

function qtInsert(node, point) {
  if (node.points.length < node.capacity || node.depth >= node.maxDepth) {
    node.points.push(point);
    return;
  }
  if (!node.children) {
    // subdivide
    const hx = node.x + node.w / 2, hy = node.y + node.h / 2;
    node.children = [
      { x:node.x,  y:node.y,  w:node.w/2, h:node.h/2, points:[], depth:node.depth+1, capacity:node.capacity, maxDepth:node.maxDepth, children:null },
      { x:hx,      y:node.y,  w:node.w/2, h:node.h/2, points:[], depth:node.depth+1, capacity:node.capacity, maxDepth:node.maxDepth, children:null },
      { x:node.x,  y:hy,      w:node.w/2, h:node.h/2, points:[], depth:node.depth+1, capacity:node.capacity, maxDepth:node.maxDepth, children:null },
      { x:hx,      y:hy,      w:node.w/2, h:node.h/2, points:[], depth:node.depth+1, capacity:node.capacity, maxDepth:node.maxDepth, children:null },
    ];
    // redistribute existing points
    for (const p of node.points) qtInsert(qtChild(node, p), p);
    node.points = [];
  }
  qtInsert(qtChild(node, point), point);
}

function qtChild(node, p) {
  const hx = node.x + node.w/2, hy = node.y + node.h/2;
  const right = p.x >= hx, bottom = p.y >= hy;
  return node.children[bottom ? (right ? 3 : 2) : (right ? 1 : 0)];
}

function qtLeaves(node, out) {
  if (!node.children) { out.push(node); return; }
  for (const c of node.children) qtLeaves(c, out);
}

function renderQuartz(svg, W, H, s) {
  svg.appendChild(svgEl('rect', {x:0,y:0,width:W,height:H,fill:s.bgColor}));

  // Build quadtree from random points
  const N     = s.density || 333;
  const gap   = s.gap     || 0;
  const sw    = s.strokeWidth || 2;

  const root = { x:0, y:0, w:W, h:H, points:[], depth:0, capacity:10, maxDepth:7, children:null };
  for (let i = 0; i < N; i++) {
    qtInsert(root, { x: rnd(0, W), y: rnd(0, H) });
  }

  // Collect leaf cells
  const leaves = [];
  qtLeaves(root, leaves);

  const g = svgEl('g', {'shape-rendering':'crispEdges'});
  svg.appendChild(g);

  for (const leaf of leaves) {
    // Skip tiny cells
    if (leaf.w < 4 || leaf.h < 4) continue;

    const g2 = gap / 2;
    const x0 = leaf.x + g2, y0 = leaf.y + g2;
    const x1 = leaf.x + leaf.w - g2, y1 = leaf.y + leaf.h - g2;

    // 4 corners of this cell
    const corners = [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    // remove one random corner → triangle
    corners.splice(rndInt(0, 3), 1);
    const pts = corners.map(p => p.join(',')).join(' ');

    if (s.filled) {
      g.appendChild(svgEl('polygon', {points:pts, fill:s.color, stroke:'none'}));
    } else {
      g.appendChild(svgEl('polygon', {points:pts, fill:'none', stroke:s.color, 'stroke-width':sw}));
    }
  }
}

TOOLS.push({
  cat: 'Weave', slug: 'quartz', name: 'Quartz', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14"/><path d="M3 3 L17 17 M17 3 L3 17"/></svg>',
  desc: 'Quadtree triangle grid',
  render: renderQuartz,
  controls: [
    { type:'color',  id:'color',       label:'Shape color',  default:'hsl(220,62%,45%)' },
    { type:'color',  id:'bgColor',     label:'Background',   default:'hsl(220,43%,13%)' },
    { type:'toggle', id:'filled',      label:'Filled shapes',default:true },
    { type:'range',  id:'density',     label:'Points',       default:333, min:10,  max:800, step:10 },
    { type:'range',  id:'gap',         label:'Gap',          default:0,   min:0,   max:20,  step:0.5 },
    { type:'range',  id:'strokeWidth', label:'Stroke width', default:2,   min:0.5, max:8,   step:0.5 },
  ]
});
