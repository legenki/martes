import { describe, it, expect, beforeAll } from 'vitest';
import { installCanvasDom } from './helpers.js';

installCanvasDom();

// The WebGL path cannot render under jsdom (no GL context), so these tests
// verify the contract around it: that every shader we advertise actually
// exists in the vendored library, that the controls are coherent, and that
// the SVG-export limitation is stated in the UI rather than discovered.
let mod, vendor;
beforeAll(async () => {
  mod = await import('../assets/js/shaders.js');
  vendor = await import('../assets/vendor/paper-shaders/index.js');
});

describe('shader catalogue', () => {
  it('offers a catalogue plus None', () => {
    expect(mod.SHADERS.length).toBeGreaterThanOrEqual(20);
    expect(mod.SHADERS[0].id).toBe('none');
  });

  // The decisive property: these render *over* the artwork. A shader with no
  // u_colorBack uniform always paints an opaque field and simply hides it,
  // which looks like the feature is broken rather than like an effect.
  it('every shader can render transparently over the artwork', () => {
    // Two routes to transparency: a u_colorBack uniform, or an alpha that
    // derives from u_colors (flagged with alphaFromColors). A shader with
    // neither always paints an opaque field and hides the artwork.
    const opaque = [];
    for (const s of mod.SHADERS) {
      if (!s.shader) continue;
      const src = vendor[s.shader];
      const hasColorBack = /uniform\s+vec4\s+u_colorBack/.test(src);
      if (!hasColorBack && !s.alphaFromColors) opaque.push(s.id);
      // Whichever route, the fragment stage must emit a variable alpha.
      expect(/fragColor\s*=\s*vec4\([^;]*opacity/.test(src) || hasColorBack,
        `${s.id} writes a constant alpha`).toBe(true);
    }
    expect(opaque, `these would cover the artwork: ${opaque.join(', ')}`).toEqual([]);
  });

  it('defaults to a blend and opacity that keep the artwork readable', () => {
    const blend = mod.SHADER_CONTROLS.find(c => c.id === 'blend');
    const opacity = mod.SHADER_CONTROLS.find(c => c.id === 'opacity');
    // `overlay` at 0.55 washed the artwork out badly enough to read as a bug.
    expect(blend.default).toBe('normal');
    expect(opacity.default).toBeGreaterThanOrEqual(0.6);
  });

  it('every advertised shader exists in the vendored library', () => {
    const missing = [];
    for (const s of mod.SHADERS) {
      if (!s.shader) continue;
      if (typeof vendor[s.shader] !== 'string') missing.push(`${s.id} -> ${s.shader}`);
    }
    expect(missing, `shaders not found in the library:\n${missing.join('\n')}`).toEqual([]);
  });

  it('shader ids and names are unique', () => {
    const ids = mod.SHADERS.map(s => s.id);
    const names = mod.SHADERS.map(s => s.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('the vendored library exposes the API we depend on', () => {
    expect(typeof vendor.ShaderMount).toBe('function');
    expect(typeof vendor.getShaderColorFromString).toBe('function');
  });

  it('exposes coherent shared controls', () => {
    for (const c of mod.SHADER_CONTROLS) {
      expect(c.id).toBeTruthy();
      expect(c.default).toBeDefined();
      if (c.type === 'range') {
        expect(c.max).toBeGreaterThan(c.min);
        expect(c.default).toBeGreaterThanOrEqual(c.min);
        expect(c.default).toBeLessThanOrEqual(c.max);
      }
      if (c.type === 'btngroup') expect(c.values.length).toBe(c.options.length);
    }
  });

  it('resolves shader params from state with defaults', () => {
    const d = mod.shaderState({});
    expect(d.opacity).toBe(0.8);
    const custom = mod.shaderState({ _sh_opacity: 0.9 });
    expect(custom.opacity).toBe(0.9);
  });

  it('reports no active shader before anything is mounted', () => {
    expect(mod.hasActiveShader()).toBe(false);
  });

  it('teardown is safe to call when nothing is mounted', () => {
    expect(() => mod.teardownShader()).not.toThrow();
  });
});

describe('export honesty', () => {
  it('warns in the panel that WebGL cannot be embedded in SVG', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const registry = readFileSync(resolve(process.cwd(), 'assets/js/registry.js'), 'utf8');
    // A shader that silently disappears from Save-SVG would be a trap;
    // the limitation has to be visible where the user turns it on.
    expect(/fx-warn/.test(registry), 'shader section must carry a warning').toBe(true);
    expect(/cannot be embedded in exported SVG/i.test(registry)).toBe(true);
  });

  it('PNG export composites the shader rather than rasterising SVG alone', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const actions = readFileSync(resolve(process.cwd(), 'assets/js/actions.js'), 'utf8');
    expect(/compositeToPNG/.test(actions)).toBe(true);
  });

  it('keeps the WebGL buffer readable so PNG export can sample it', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(resolve(process.cwd(), 'assets/js/shaders.js'), 'utf8');
    // Without this WebGL clears the buffer after each frame and the shader
    // reads back as transparent black — verified in the browser.
    expect(/preserveDrawingBuffer:\s*true/.test(src)).toBe(true);
  });
});
