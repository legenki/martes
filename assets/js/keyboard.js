import { currentTool, toolState, renderTool, canvasW, canvasH } from './core.js';
import { TOOLS, selectTool, buildPanel } from './registry.js';
import { undo, redo, pushUndoGlobal } from './history.js';
import { doRandomize, doSaveSVG, doCopy, doSavePNG, doExportJSON, doImportJSON } from './actions.js';

// ═══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════
// Coalesce rapid arrow-key tool switching: one rAF per frame, so
// holding ↑/↓ doesn't pile up 60+ buildPanel/renderTool calls per second.
export let _navPendingDelta = 0;
export let _navScheduled = false;
export function navigateTool(delta) {
  _navPendingDelta += delta;
  if (_navScheduled) return;
  _navScheduled = true;
  requestAnimationFrame(() => {
    _navScheduled = false;
    if (!currentTool) { _navPendingDelta = 0; return; }
    const idx  = TOOLS.indexOf(currentTool);
    const next = Math.max(0, Math.min(TOOLS.length - 1, idx + _navPendingDelta));
    _navPendingDelta = 0;
    if (next !== idx) selectTool(TOOLS[next]);
  });
}

document.addEventListener('keydown', (e) => {
  // Skip when typing in inputs/textareas
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  // Ctrl/Cmd+Z = undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z = redo
  if ((e.ctrlKey || e.metaKey) && !e.altKey) {
    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (e.key === 'z' && e.shiftKey)  { e.preventDefault(); redo(); return; }
    if (e.key === 'y')                { e.preventDefault(); redo(); return; }
  }

  // Single-key shortcuts (no modifiers)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key.toLowerCase()) {
    case 'r': e.preventDefault(); doRandomize(); break;
    case 's': e.preventDefault(); doSaveSVG(); break;
    case 'p': e.preventDefault(); doSavePNG(); break;
    case 'c': e.preventDefault(); doCopy(); break;
    case 'arrowdown': e.preventDefault(); navigateTool(+1); break;
    case 'arrowup':   e.preventDefault(); navigateTool(-1); break;
  }
});

// ═══════════════════════════════════════════════════════════════
// INIT — exposed as a global; index.html calls it after every tool
// file has had a chance to push into TOOLS.
// ═══════════════════════════════════════════════════════════════
