// Shared test utilities for the generator suites.
//
// core.js reads #svgCanvas / #canvasArea at module-evaluation time, so any
// test importing a tool must have those nodes in the DOM *first*.
export function installCanvasDom() {
  document.body.innerHTML = `
    <div id="canvasArea"><svg id="svgCanvas"></svg></div>
    <div id="toolList"></div>
    <div id="controlPanel"></div>`;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function freshSvg(w = 600, h = 900) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  document.body.appendChild(svg);
  return svg;
}

// Build the state object a tool expects, straight from its own `controls`
// metadata — the same contract core.js:getState() implements.
export function defaultState(tool) {
  const s = {};
  for (const c of tool.controls || []) s[c.id] = c.default;
  return s;
}

// Every value a btngroup/range control can legally take, used to sweep
// each generator across its whole declared parameter space.
export function controlValues(control) {
  if (control.type === 'toggle') return [true, false];
  if (control.type === 'btngroup') return control.values || control.options;
  if (control.type === 'range') {
    const { min, max } = control;
    return [min, (min + max) / 2, max];
  }
  return [control.default];
}

// Count real painted geometry, ignoring <defs> (filters/clipPaths live there
// and are not visible output on their own).
const PAINTED = 'rect,circle,ellipse,path,polygon,polyline,line,g,use,text,image';
export function countPainted(svg) {
  return [...svg.querySelectorAll(PAINTED)].filter(el => !el.closest('defs')).length;
}

// Recursively assert no attribute is NaN/undefined/null — the classic way a
// generator "renders" while producing geometry the browser silently drops.
export function findBadAttrs(root) {
  const bad = [];
  for (const el of root.querySelectorAll('*')) {
    for (const attr of el.attributes) {
      const v = attr.value;
      if (v === 'NaN' || v === 'undefined' || v === 'null' || /\bNaN\b/.test(v)) {
        bad.push(`<${el.tagName} ${attr.name}="${v}">`);
      }
    }
  }
  return bad;
}
