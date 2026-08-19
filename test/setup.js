// jsdom ships no 2D canvas backend, so HTMLCanvasElement.getContext('2d')
// returns null. core.js parseColor() and tessera.js both rely on a real
// context, and would throw for reasons that have nothing to do with the
// generators themselves. Install a minimal, deterministic stub that supports
// exactly the surface the app uses: fill a 1x1 pixel and read it back.
const NAMED = {
  white:[255,255,255], black:[0,0,0], red:[255,0,0], green:[0,128,0],
  blue:[0,0,255], gray:[128,128,128], grey:[128,128,128], transparent:[0,0,0],
};

function parseCssColor(input) {
  const c = String(input ?? '#000000').trim().toLowerCase();
  if (NAMED[c]) return NAMED[c];
  let m = /^#([0-9a-f]{3})$/.exec(c);
  if (m) return [...m[1]].map(ch => parseInt(ch + ch, 16));
  m = /^#([0-9a-f]{6})$/.exec(c);
  if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
  m = /^rgba?\(([^)]+)\)$/.exec(c);
  if (m) return m[1].split(',').slice(0, 3).map(v => Math.round(parseFloat(v)));
  return [0, 0, 0];
}

HTMLCanvasElement.prototype.getContext = function () {
  let fillStyle = '#000000';
  const pixel = [0, 0, 0, 0];
  return {
    get fillStyle() { return fillStyle; },
    set fillStyle(v) { fillStyle = v; },
    strokeStyle: '#000000',
    globalAlpha: 1,
    lineWidth: 1,
    clearRect() { pixel.fill(0); },
    fillRect() { const [r, g, b] = parseCssColor(fillStyle); pixel[0] = r; pixel[1] = g; pixel[2] = b; pixel[3] = 255; },
    getImageData(x, y, w, h) {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) data.set(pixel, i * 4);
      return { data, width: w, height: h };
    },
    putImageData() {}, createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }; },
    drawImage() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {}, rect() {},
    fill() {}, stroke() {}, clip() {}, measureText() { return { width: 0 }; },
    fillText() {}, createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
};
