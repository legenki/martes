import { currentTool, toolState, getState, renderTool } from './core.js';
import { applyPaletteGlobal, currentPaletteIndex } from './palettes.js';
import { buildPanel } from './registry.js';

// ═══════════════════════════════════════════════════════════════
// UNDO / REDO — stack of 20 snapshots
// ═══════════════════════════════════════════════════════════════
export const UNDO_LIMIT = 20;
export const _undoStack = [];
export let   _redoStack = [];

// A snapshot is one of two kinds:
//   { kind: 'tool', slug, data }       — single-tool state (range/colour/etc)
//   { kind: 'all',  toolState, palette, paletteIndex }
//                                       — global state (palette change)
export function _snapshotTool() {
  if (!currentTool) return null;
  return { kind: 'tool', slug: currentTool.slug,
           data: JSON.stringify(toolState[currentTool.slug] || {}) };
}
export function _snapshotAll() {
  return {
    kind: 'all',
    toolState: JSON.stringify(toolState),
    palette: currentPalette ? [...currentPalette] : null,
    paletteIndex: currentPaletteIndex
  };
}

export function pushUndo() {
  if (!currentTool) return;
  const snap = _snapshotTool();
  if (!snap) return;
  // De-dupe consecutive identical tool-only pushes.
  const top = _undoStack[_undoStack.length - 1];
  if (top && top.kind === 'tool' && top.slug === snap.slug && top.data === snap.data) return;
  _undoStack.push(snap);
  if (_undoStack.length > UNDO_LIMIT) _undoStack.shift();
  _redoStack = [];
}

// Used by palette-change — saves global state so undo restores colours
// across every tool (not just the active one).
export function pushUndoGlobal() {
  _undoStack.push(_snapshotAll());
  if (_undoStack.length > UNDO_LIMIT) _undoStack.shift();
  _redoStack = [];
}

export function applyStateSnap(snap) {
  if (snap.kind === 'all') {
    // Restore every tool's state at once.
    const restored = JSON.parse(snap.toolState);
    Object.keys(toolState).forEach(k => delete toolState[k]);
    Object.assign(toolState, restored);
    if (typeof currentPalette !== 'undefined') {
      currentPalette = snap.palette;
      currentPaletteIndex = snap.paletteIndex;
      // Update the palette dropdown button (if present).
      if (window._refreshPaletteButton) window._refreshPaletteButton();
    }
  } else if (snap.kind === 'tool') {
    toolState[snap.slug] = JSON.parse(snap.data);
  }
  // Restore canvas ratio (if saved with the snapshot).
  if (currentTool) {
    const r = (toolState[currentTool.slug] || {})._ratio;
    if (r && RATIOS[r]) {
      [canvasW, canvasH] = RATIOS[r];
      const sel = document.getElementById('ratioSelect');
      if (sel) sel.value = r;
      resizeCanvas();
    }
    buildPanel(currentTool);
    renderTool();
  }
}

export function undo() {
  if (!currentTool || _undoStack.length === 0) return;
  // Mirror the kind of the snap we're about to apply.
  const top = _undoStack[_undoStack.length - 1];
  _redoStack.push(top.kind === 'all' ? _snapshotAll() : _snapshotTool());
  applyStateSnap(_undoStack.pop());
}

export function redo() {
  if (!currentTool || _redoStack.length === 0) return;
  const top = _redoStack[_redoStack.length - 1];
  _undoStack.push(top.kind === 'all' ? _snapshotAll() : _snapshotTool());
  applyStateSnap(_redoStack.pop());
}
