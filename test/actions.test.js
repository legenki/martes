import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { installCanvasDom } from './helpers.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// These are static-wiring tests. The action buttons were dead in the browser
// because actions.js referenced eight identifiers it never imported, imported
// two names registry.js never exported, and was itself never loaded by any
// <script> or import. Each of those failures is invisible to a render test —
// they only show up when the module graph is actually resolved.
describe('module wiring', () => {
  it('registry.js exports what other modules import from it', () => {
    const registry = read('../assets/js/registry.js');
    for (const name of ['TOOLS', 'selectTool', 'buildPanel']) {
      expect(
        new RegExp(`export\\s+(?:const|let|function)\\s+${name}\\b`).test(registry) ||
        new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(registry),
        `registry.js must export ${name}`
      ).toBe(true);
    }
  });

  it('actions.js declares every identifier it uses', () => {
    const src = read('../assets/js/actions.js');
    const imported = [...src.matchAll(/import\s*\{([^}]+)\}/g)]
      .flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()));
    const declared = [...src.matchAll(/(?:function|const|let|var)\s+(\w+)/g)].map(m => m[1]);
    const known = new Set([...imported, ...declared]);
    for (const name of ['pushUndo','getState','rndInt','pick','buildPanel','renderTool','BB_SHAPES','MM_SHAPES']) {
      expect(known.has(name), `actions.js uses ${name} without importing/declaring it`).toBe(true);
    }
  });

  it('every named import resolves to a real export in the target module', () => {
    const files = ['actions.js', 'keyboard.js', 'registry.js', 'palettes.js', 'history.js'];
    const problems = [];
    for (const f of files) {
      const src = read(`../assets/js/${f}`);
      for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'\.\/([\w-]+\.js)'/g)) {
        const target = read(`../assets/js/${m[2]}`);
        for (const raw of m[1].split(',')) {
          const name = raw.trim().split(/\s+as\s+/)[0].trim();
          if (!name) continue;
          // `export let a = 1, b = 2;` declares both names, so match any
          // declarator in the statement, not just the first one.
          const ok = new RegExp(`export\\s+(?:async\\s+)?(?:const|let|var|function|class)\\s+[^;=]*\\b${name}\\b`).test(target)
                  || new RegExp(`export\\s+(?:const|let|var)\\s+[\\w\\s,=\\d'"\\.]*\\b${name}\\b`).test(target)
                  || new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(target);
          if (!ok) problems.push(`${f} imports "${name}" from ${m[2]}, which does not export it`);
        }
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('actions.js and keyboard.js are actually loaded by the app', () => {
    const html = read('../index.html');
    const entry = read('../assets/js/registry.js');
    const loaded = (mod) =>
      html.includes(`assets/js/${mod}`) || entry.includes(`./${mod}`);
    expect(loaded('actions.js'), 'nothing loads actions.js — the action buttons are dead').toBe(true);
    expect(loaded('keyboard.js'), 'nothing loads keyboard.js — shortcuts are dead').toBe(true);
  });

  it('exports every handler keyboard.js imports from actions.js', () => {
    const actions = read('../assets/js/actions.js');
    for (const fn of ['doRandomize','doSaveSVG','doCopy','doSavePNG','doExportJSON','doImportJSON']) {
      expect(
        new RegExp(`export\\s+(?:async\\s+)?function\\s+${fn}\\b`).test(actions),
        `actions.js must export ${fn}`
      ).toBe(true);
    }
  });

  it('binds a handler to every action button in the markup', () => {
    const html = read('../index.html');
    const actions = read('../assets/js/actions.js');
    const btnIds = [...html.matchAll(/id="(btn[A-Z]\w*)"/g)].map(m => m[1]);
    expect(btnIds.length).toBeGreaterThan(0);
    // Handlers are registered in the ACTION_BUTTONS map, so match the bare id.
    const unbound = btnIds.filter(id => !new RegExp(`\\b${id}\\b`).test(actions));
    expect(unbound, `action buttons with no handler: ${unbound.join(', ')}`).toEqual([]);
  });
});

describe('imported bindings are never reassigned', () => {
  it('writes cross-module state through setters, not direct assignment', () => {
    // `import { canvasW }` is a read-only binding — assigning to it throws
    // TypeError in module scope. These went unnoticed because the throwing
    // paths (ratio switch, undo of a palette change) were rarely exercised.
    const problems = [];
    for (const f of ['registry.js','history.js','actions.js','palettes.js','keyboard.js']) {
      const src = read(`../assets/js/${f}`);
      const imported = new Set([...src.matchAll(/import\s*\{([^}]+)\}/g)]
        .flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()))
        .filter(Boolean));
      for (const name of imported) {
        // direct assignment: `name = ...` (not ==, ===, =>, or a declaration)
        const assign = new RegExp(`(?<![.\\w$])${name}\\s*=(?![=>])`, 'g');
        for (const m of src.matchAll(assign)) {
          const before = src.slice(Math.max(0, m.index - 40), m.index);
          if (/\b(const|let|var|function|class)\s+$/.test(before)) continue;
          if (/[,{]\s*$/.test(before)) continue;   // object literal / destructuring default
          problems.push(`${f}: assigns to imported binding "${name}"`);
        }
        // Array-destructuring assignment `[a, b] = …`, which must start the
        // statement — otherwise this also matches a legal property write
        // like `obj[currentTool.slug] = {}`.
        if (new RegExp(`(?:^|[;{}]\\s*)\\[\\s*[\\w$,\\s]*\\b${name}\\b[\\w$,\\s]*\\]\\s*=(?![=>])`, 'm').test(src)) {
          problems.push(`${f}: destructures into imported binding "${name}"`);
        }
      }
    }
    expect([...new Set(problems)], [...new Set(problems)].join('\n')).toEqual([]);
  });
});

describe('no debug instrumentation ships', () => {
  it('leaves no scratch logging or title-setting in the sources', () => {
    const found = [];
    for (const f of ['core.js','registry.js','actions.js','keyboard.js','palettes.js','history.js']) {
      const src = read(`../assets/js/${f}`);
      if (/window\.myLogs/.test(src))            found.push(`${f}: window.myLogs`);
      if (/document\.title\s*=\s*["'](?!.*<)/.test(src)) found.push(`${f}: document.title debug assignment`);
      if (/console\.log\(/.test(src))            found.push(`${f}: console.log`);
    }
    expect(found, found.join('\n')).toEqual([]);
  });
});

describe('textures tab', () => {
  it('textures.js is loaded by the app', () => {
    const html = read('../index.html');
    const entry = read('../assets/js/registry.js');
    expect(html.includes('assets/js/textures.js') || entry.includes('./textures.js'),
      'nothing loads textures.js — the Textures tab renders an empty grid').toBe(true);
  });

  it('the markup provides every node textures.js binds to', () => {
    const html = read('../index.html');
    for (const id of ['texGrid','texPagination','texSearch','texCount','texSortNum','texSortRandom']) {
      expect(html.includes(`id="${id}"`), `index.html is missing #${id}`).toBe(true);
    }
  });
});

describe('production markup', () => {
  it('ships no debug error handler that hijacks document.title', () => {
    const html = read('../index.html');
    expect(/document\.title\s*=\s*["'](ERROR|REJ)/.test(html),
      'index.html still contains the scratch window.onerror title handler').toBe(false);
  });
});
