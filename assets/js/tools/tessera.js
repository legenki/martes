// ── 6. mmmotif — isometric tiling pattern ───────────────────
// All 15 original shapes in 40×40 tile space.
// Each shape uses base/light/dark color roles.
// Custom shapes also supported (single-color path).
const MM_SHAPES = [
  { id:1,  label:'Cube',         markup: (b,l,d) => `<rect width="18" height="18" transform="matrix(0.866025 0.5 -0.866025 0.5 20 2)" fill="${b}"/><rect width="18" height="18" transform="matrix(0.866025 0.5 -2.20305e-08 1 4.41162 11)" fill="${l}"/><rect width="18" height="18" transform="matrix(0.866025 -0.5 2.20305e-08 1 20 20)" fill="${d}"/>` },
  { id:2,  label:'Plank',        markup: (b,l,d) => `<rect width="64.4123" height="124.995" transform="matrix(0.24201 0.970274 0 1 4.41162 -64.7517)" fill="${b}"/><rect width="64.4123" height="124.995" transform="matrix(0.24201 -0.970274 0 1 19.9995 -2.25317)" fill="${d}"/>` },
  { id:3,  label:'Cylinder A',   markup: (b,l,d) => `<circle r="7.34831" transform="matrix(0.866044 -0.499967 0.866044 0.499967 20.0004 23.5002)" fill="${d}"/><circle r="7.34831" transform="matrix(0.866044 -0.499967 0.866044 0.499967 20.0004 20.5002)" fill="${l}"/><circle r="7.34831" transform="matrix(0.866044 -0.499967 0.866044 0.499967 19.9999 16.4998)" fill="${b}"/>` },
  { id:4,  label:'Cylinder B',   markup: (b,l,d) => `<circle r="7.34831" transform="matrix(0.866044 -0.499967 0.866044 0.499967 20.0004 23.5002)" fill="${l}"/><circle r="7.34831" transform="matrix(0.866044 -0.499967 0.866044 0.499967 20.0004 20.5002)" fill="${d}"/><circle r="7.34831" transform="matrix(0.866044 -0.499967 0.866044 0.499967 19.9999 16.4998)" fill="${b}"/>` },
  { id:5,  label:'Pyramid S',    markup: (b,l,d) => `<path d="M9.39371 8.87681L34.4892 12.7588L16.118 23.3644L9.39371 8.87681Z" fill="${b}"/><path d="M9.39711 18.8738L9.39697 8.87378L16.1171 23.3638V33.3638L9.39711 18.8738Z" fill="${l}"/><path d="M34.4871 22.7538L34.4872 12.7539L16.1173 23.3439L16.1172 33.3638L34.4871 22.7538Z" fill="${d}"/>` },
  { id:6,  label:'Cube S',       markup: (b,l,d) => `<rect width="11.3638" height="11.3638" transform="matrix(0.872008 0.489492 -0.872008 0.489492 20.0005 5.4375)" fill="${b}"/><rect width="11.3638" height="18" transform="matrix(0.872008 0.489492 0 1 10.0908 11)" fill="${l}"/><rect width="11.3638" height="18" transform="matrix(0.872008 -0.489492 0 1 20 16.5625)" fill="${d}"/>` },
  { id:7,  label:'Pyramid T',    markup: (b,l,d) => `<path d="M9.39371 2.87681L34.4892 6.75876L16.118 17.3644L9.39371 2.87681Z" fill="${b}"/><path d="M9.39711 22.8738L9.39697 2.87378L16.1171 17.3638V37.3638L9.39711 22.8738Z" fill="${l}"/><path d="M34.4871 16.7538L34.4872 6.75391L16.1173 17.3439L16.1172 37.3638L34.4871 16.7538Z" fill="${d}"/>` },
  { id:8,  label:'Pyramid W',    markup: (b,l,d) => `<path d="M9.39371 2.87681L34.4892 6.75876L16.118 17.3644L9.39371 2.87681Z" fill="${b}"/><path d="M9.39711 22.8738L9.39697 2.87378L16.1171 17.3638V37.3638L9.39711 22.8738Z" fill="${l}"/><path d="M34.4871 26.7538L34.4872 6.75391L16.1173 17.3439L16.1172 37.3638L34.4871 26.7538Z" fill="${d}"/>` },
  { id:9,  label:'Cube M',       markup: (b,l,d) => `<rect width="11.3638" height="11.3638" transform="matrix(0.872008 0.489492 -0.872008 0.489492 20 11.4375)" fill="${b}"/><rect width="11.3638" height="6" transform="matrix(0.872008 0.489492 0 1 10.0903 17)" fill="${l}"/><rect width="11.3638" height="6" transform="matrix(0.872008 -0.489492 0 1 19.9995 22.5625)" fill="${d}"/>` },
  { id:10, label:'Cube ×2',      markup: (b,l,d) => `<rect width="11.3638" height="11.3638" transform="matrix(0.872008 0.489492 -0.872008 0.489492 20.0005 6.4375)" fill="${b}"/><rect width="11.3638" height="6" transform="matrix(0.872008 0.489492 0 1 10.0908 12)" fill="${l}"/><rect width="11.3638" height="6" transform="matrix(0.872008 -0.489492 0 1 20 17.5625)" fill="${d}"/><rect width="11.3638" height="11.3638" transform="matrix(0.872008 0.489492 -0.872008 0.489492 20.0005 16.4375)" fill="${b}"/><rect width="11.3638" height="6" transform="matrix(0.872008 0.489492 0 1 10.0908 22)" fill="${l}"/><rect width="11.3638" height="6" transform="matrix(0.872008 -0.489492 0 1 20 27.5625)" fill="${d}"/>` },
  { id:11, label:'Hexprism',     markup: (b,l,d) => `<path d="M18.2565 9.41648C19.2197 8.87581 20.7813 8.87581 21.7445 9.41648L29.9098 14L20.0005 19.5625L10.0912 14L18.2565 9.41648Z" fill="${b}"/><path d="M10.0908 14L20.0001 19.5625V31.5625L11.8348 26.979C10.8716 26.4383 10.0908 25.1046 10.0908 24V14Z" fill="${l}"/><path d="M20 19.5625L29.9093 14V24C29.9093 25.1046 29.1285 26.4383 28.1653 26.979L20 31.5625V19.5625Z" fill="${d}"/>` },
  { id:12, label:'Gem S',        markup: (b,l,d) => `<path d="M7.92969 25.4865L7.92986 19.4866L16.7597 24.5865V30.5865L7.92969 25.4865Z" fill="${l}"/><path d="M16.76 30.5865L16.7598 24.5865L28.84 22.7278L28.8435 28.7265L16.76 30.5865Z" fill="${d}"/><path d="M32.07 21.7465V15.7466L28.8398 22.7266L28.84 28.7266L32.07 21.7465Z" fill="${l}"/><path d="M11.1611 12.5162L23.2352 10.6485L32.074 15.7512L28.8388 22.7216L16.7647 24.5893L7.92586 19.4866L11.1611 12.5162Z" fill="${b}"/>` },
  { id:13, label:'Gem T',        markup: (b,l,d) => `<path d="M7.92969 27.4865L7.92986 16.4866L16.7597 21.5865V32.5865L7.92969 27.4865Z" fill="${l}"/><path d="M16.76 32.5865L16.7598 21.5865L28.84 19.7278L28.8435 30.7265L16.76 32.5865Z" fill="${d}"/><path d="M32.07 23.7465V12.7466L28.8398 19.7266L28.84 30.7266L32.07 23.7465Z" fill="${l}"/><path d="M11.1611 9.51624L23.2352 7.64853L32.074 12.7512L28.8388 19.7216L16.7647 21.5893L7.92586 16.4866L11.1611 9.51624Z" fill="${b}"/>` },
  { id:14, label:'Star S',       markup: (b,l,d) => `<path d="M13.6359 11.713L9.39326 14.1623L15.7572 17.8362L9.39326 21.5101L13.6359 23.9594L19.9999 20.2855L26.3638 23.9594L30.6065 21.5101L24.2425 17.8362L30.6065 14.1623L26.3638 11.713L19.9999 15.3869L13.6359 11.713Z" fill="${b}"/><path d="M9.38965 18.1608L9.38979 14.1609L15.7596 17.8408L12.2967 19.8196L9.38965 18.1608Z" fill="${l}"/><path d="M9.38965 25.5108L9.38979 21.5107L13.6396 23.9608L13.64 27.9608L9.38965 25.5108Z" fill="${l}"/><path d="M13.6401 27.9608V23.9608L20.0001 20.2808V24.2808L13.6401 27.9608Z" fill="${d}"/><path d="M20 24.2808V20.2808L26.36 23.9608V27.9608L20 24.2808Z" fill="${l}"/><path d="M26.3599 27.9608V23.9607L30.6099 21.5107L30.61 25.507L26.3599 27.9608Z" fill="${d}"/><path d="M30.6102 18.1634V14.1609L24.2402 17.8408L27.6992 19.8391L30.6102 18.1634Z" fill="${d}"/>` },
  { id:15, label:'Star T',       markup: (b,l,d) => `<path d="M13.6359 9.71299L9.39326 12.1623L15.7572 15.8362L9.39326 19.5101L13.6359 21.9594L19.9999 18.2855L26.3638 21.9594L30.6065 19.5101L24.2425 15.8362L30.6065 12.1623L26.3638 9.71299L19.9999 13.3869L13.6359 9.71299Z" fill="${b}"/><path d="M9.38965 21.1608L9.38979 12.1609L15.7596 15.8408L12.2967 22.8196L9.38965 21.1608Z" fill="${l}"/><path d="M9.38965 28.5108L9.38979 19.5107L13.6396 21.9608L13.64 30.9608L9.38965 28.5108Z" fill="${l}"/><path d="M13.6401 30.9608V21.9608L20.0001 18.2808V27.2808L13.6401 30.9608Z" fill="${d}"/><path d="M20 27.2808V18.2808L26.36 21.9608V30.9608L20 27.2808Z" fill="${l}"/><path d="M26.3599 30.9608V21.9607L30.6099 19.5107L30.61 28.507L26.3599 30.9608Z" fill="${d}"/><path d="M30.6102 21.1634V12.1609L24.2402 15.8408L27.6992 22.8391L30.6102 21.1634Z" fill="${d}"/>` },
];

// User custom shapes for mmmotif
window.mmCustomShapes = window.mmCustomShapes || [];

// Color brightening/darkening — works with any CSS color via canvas
function mmAdjustColor(color, amount) {
  // Parse via canvas to get rgb values regardless of input format
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return rgbToHex(
    clamp(r + amount, 0, 255),
    clamp(g + amount, 0, 255),
    clamp(b + amount, 0, 255)
  );
}

function renderTessera(svg, W, H, s) {
  if (!Array.isArray(s.mmActiveShapes)) s.mmActiveShapes = [1];

  const activeIds = Array.isArray(s.mmActiveShapes) && s.mmActiveShapes.length > 0
    ? s.mmActiveShapes : [1];

  const allShapes = [...MM_SHAPES, ...mmCustomShapes];
  const activeShapes = allShapes.filter(sh => activeIds.includes(sh.id));
  if (activeShapes.length === 0) return;

  // Colors
  const base  = s.baseColor;
  const light = s.autoColors ? mmAdjustColor(base, 55) : s.lightColor;
  const dark  = s.autoColors ? mmAdjustColor(base, -55) : s.darkColor;

  // Pick shape markup for this render (cycle through active shapes — one per tile)
  // We embed all selected shapes as <symbol> and use a randomized defs approach.
  // Strategy: use one <pattern> per shape, pick which to show per tile via JS grid render.
  // Since SVG pattern can't randomize, we render a grid of groups manually instead.

  svg.appendChild(svgEl('rect', {x:0, y:0, width:W, height:H, fill:s.bgColor}));

  const TILE = 40; // original tile space
  const sc = s.scale; // scale factor (tile becomes TILE*sc px)
  const tileW = TILE * sc;
  const tileH = TILE * sc;

  const angle   = s.angle;
  const tx      = s.translateX;
  const ty      = s.translateY;
  const skewX   = s.skewX;
  const skewY   = s.skewY;
  const opacity = s.opacity;

  // Create defs with one symbol per active shape
  const defs = svgEl('defs');
  activeShapes.forEach((sh, i) => {
    const sym = svgEl('symbol', {id:`mm-sh-${i}`, viewBox:'0 0 40 40', overflow:'visible'});
    // inject markup as innerHTML via temporary container
    const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
    if (sh.isCustom) {
      tmp.innerHTML = `<path d="${sh.d}" fill="${base}" opacity="0.9"/>`;
    } else {
      tmp.innerHTML = sh.markup(base, light, dark);
    }
    while (tmp.firstChild) sym.appendChild(tmp.firstChild);
    defs.appendChild(sym);
  });
  svg.appendChild(defs);

  // Build a padded grid that covers W×H after transform
  // We over-cover by large margin and apply transform on a group
  const diagSize = Math.hypot(W, H);
  const cols = Math.ceil(diagSize / tileW) + 8;
  const rows = Math.ceil(diagSize / tileH) + 8;

  // Cap total tiles to avoid DOM explosion at very small scales
  const MAX_TILES = 5000;
  const totalTiles = cols * rows;
  const skipFactor = totalTiles > MAX_TILES ? Math.ceil(totalTiles / MAX_TILES) : 1;

  const startX = -(cols * tileW) / 2 + W / 2;
  const startY = -(rows * tileH) / 2 + H / 2;

  // Original patternTransform order: translate → scale → rotate → skewX → skewY
  // We rotate around canvas center, then apply skew
  const transform = `translate(${W/2 + tx},${H/2 + ty}) rotate(${angle}) skewX(${skewX}) skewY(${skewY}) translate(${-W/2},${-H/2})`;
  const g = svgEl('g', {transform, opacity});
  svg.appendChild(g);

  let shapeIdx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      shapeIdx++;
      if (skipFactor > 1 && shapeIdx % skipFactor !== 0) continue;
      const x = startX + col * tileW;
      const y = startY + row * tileH;
      const si = shapeIdx % activeShapes.length;

      const use = svgEl('use');
      use.setAttribute('href', `#mm-sh-${si}`);
      use.setAttribute('x', x.toFixed(2));
      use.setAttribute('y', y.toFixed(2));
      use.setAttribute('width', tileW);
      use.setAttribute('height', tileH);
      g.appendChild(use);
    }
  }
}

TOOLS.push({
  cat: 'Weave', slug: 'tessera', name: 'Tessera', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 L15 8 L10 13 L5 8 Z"/><path d="M5 12 L8 15 L5 18 L2 15 Z"/><path d="M15 12 L18 15 L15 18 L12 15 Z"/></svg>',
  desc: 'Isometric 3D tiling pattern',
  render: renderTessera,
  controls: [
    { type:'color',    id:'bgColor',       label:'Background',  default:'#ffffff' },
    { type:'color',    id:'baseColor',     label:'Base color',  default:'hsl(212,91%,55%)' },
    { type:'toggle',   id:'autoColors',    label:'Auto light/dark', default:true },
    { type:'color',    id:'lightColor',    label:'Light face',  default:'#7b9cff' },
    { type:'color',    id:'darkColor',     label:'Dark face',   default:'#1a2e8a' },
    { type:'mmshapes', id:'mmActiveShapes',label:'Shapes',      default:[1] },
    { type:'range',    id:'scale',         label:'Scale',       default:2,   min:0.4, max:8,   step:0.1 },
    { type:'range',    id:'angle',         label:'Angle',       default:0,   min:0,   max:360, step:1 },
    { type:'range',    id:'translateX',    label:'Translate X', default:0,   min:-100,max:100, step:1 },
    { type:'range',    id:'translateY',    label:'Translate Y', default:0,   min:-100,max:100, step:1 },
    { type:'range',    id:'skewX',         label:'Skew X',      default:0,   min:-50, max:50,  step:1 },
    { type:'range',    id:'skewY',         label:'Skew Y',      default:0,   min:-50, max:50,  step:1 },
    { type:'range',    id:'opacity',       label:'Opacity',     default:1,   min:0.1, max:1,   step:0.05 },
  ]
});
