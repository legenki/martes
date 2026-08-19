import { svg, currentTool, toolState, canvasW, canvasH } from './core.js';
import { currentPaletteIndex, applyPaletteGlobal } from './palettes.js';
import { TOOLS, selectTool } from './registry.js';

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════
export function doRandomize() {
  if (!currentTool) return;
  pushUndo();
  const s = getState();

  currentTool.controls.forEach(c => {
    if (c.type === 'range') {
      // For opacity/probability controls keep a reasonable minimum so result stays visible
      const isOpacity = c.id === 'opacity' || c.id === 'probability';
      // Minimum floor: 40% of the control's max (so result is not nearly invisible)
      const lo = isOpacity ? Math.max(c.min, c.max * 0.4) : c.min;
      const hi = c.max;
      // Decimal places for toFixed — robust against exponential notation
      // (e.g. step = 1e-5 stringifies as "1e-5", no decimal point).
      let decimals = 0;
      if (c.step < 1 && c.step > 0) {
        decimals = Math.max(0, Math.ceil(-Math.log10(c.step)));
      }
      s[c.id] = parseFloat((Math.random() * (hi - lo) + lo).toFixed(decimals));

    } else if (c.type === 'toggle') {
      s[c.id] = Math.random() > 0.5;

    } else if (c.type === 'color') {
      // Generate a vivid random HSL color — works for any render function regardless of format
      const h   = rndInt(0, 360);
      const sat = rndInt(55, 95);
      // Background colors tend to be dark, foreground/shape colors brighter
      const isBg = c.id === 'bgColor';
      const lit  = isBg ? rndInt(5, 25) : rndInt(45, 80);
      s[c.id] = `hsl(${h},${sat}%,${lit}%)`;

    } else if (c.type === 'btngroup') {
      // Always pick from values array if present, else options (when options === values)
      const pool = c.values !== undefined ? c.values : c.options;
      s[c.id] = pick(pool);

    } else if (c.type === 'bbshapes') {
      const allIds = BB_SHAPES.map(sh => sh.id);
      const count = rndInt(2, 5);
      s[c.id] = [...allIds].sort(() => Math.random() - 0.5).slice(0, count);

    } else if (c.type === 'mmshapes') {
      const allIds = MM_SHAPES.map(sh => sh.id);
      const count = rndInt(1, 3);
      s[c.id] = [...allIds].sort(() => Math.random() - 0.5).slice(0, count);
    }
    // svgshape / custom shape pickers: leave unchanged (no sensible random)
  });

  // Tool-specific randomize hook (e.g. seed)
  if (typeof currentTool.randomize === 'function') {
    currentTool.randomize(s, canvasW, canvasH);
  }

  buildPanel(currentTool);
  renderTool();
}

export function doSaveSVG() {
  const svgStr = getSVGString();
  const blob = new Blob([svgStr], {type:'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:`${currentTool?.slug || 'artwork'}.svg`});
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function doCopy() {
  try {
    await navigator.clipboard.writeText(getSVGString());
    const btn = document.getElementById('btnCopy');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Copied';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  } catch(e) { alert('Copy failed: ' + e); }
}


export function doExportJSON() {
  if (!currentTool) return;
  const data = {
    slug: currentTool.slug,
    state: toolState[currentTool.slug] || {},
    paletteIndex: currentPaletteIndex,
    canvas: { w: canvasW, h: canvasH }
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `martes-${currentTool.slug}.json`;
  a.click();
}

export function doImportJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.slug) throw new Error("Invalid config format");
        const tool = TOOLS.find(t => t.slug === data.slug);
        if (!tool) throw new Error("Tool not found: " + data.slug);
        
        if (typeof data.paletteIndex === 'number') {
           applyPaletteGlobal(data.paletteIndex);
        }
        
        toolState[tool.slug] = data.state;
        selectTool(tool);
      } catch (err) {
        alert("Failed to import: " + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

export function doSavePNG() {
  if (!currentTool) return;
  const svgStr = getSVGString();
  const blob = new Blob([svgStr], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width  = canvasW * 2;  // 2x for retina quality
    c.height = canvasH * 2;
    const ctx = c.getContext('2d');
    // Draw at full retina size in one call — sharper than scale() + 1x draw,
    // and lets the browser pick the best resampler.
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob(pngBlob => {
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = Object.assign(document.createElement('a'), {
        href: pngUrl,
        download: `${currentTool?.slug || 'artwork'}.png`
      });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    }, 'image/png');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('PNG export failed — the SVG may contain unsupported features');
  };
  img.src = url;
}

document.getElementById('btnRandomize').addEventListener('click', doRandomize);
document.getElementById('btnSave').addEventListener('click', doSaveSVG);
  document.getElementById('btnExport').addEventListener('click', doExportJSON);
  document.getElementById('btnImport').addEventListener('click', doImportJSON);
document.getElementById('btnCopy').addEventListener('click', doCopy);
document.getElementById('btnPng').addEventListener('click', doSavePNG);

export function getSVGString() {
  const clone = svg.cloneNode(true);
  clone.removeAttribute('style');
  clone.setAttribute('width', canvasW);
  clone.setAttribute('height', canvasH);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + clone.outerHTML;
}
