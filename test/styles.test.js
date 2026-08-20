import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { resolve } from 'path';
// jsdom's import.meta.url is not a file: URL, so resolve from the cwd
// (vitest runs from the project root) instead.
const raw = readFileSync(resolve(process.cwd(), 'assets/css/style.css'), 'utf8');
// Strip comments — otherwise a rule that merely *explains* a declaration
// reads as if it applied it.
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

// Pull the declarations of a rule whose selector matches `re`.
function ruleBody(re) {
  const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)];
  return rules.filter(m => re.test(m[1].trim())).map(m => m[2]).join('\n');
}

describe('native control theming', () => {
  it('declares color-scheme so native widgets follow the theme', () => {
    // Without this the browser paints spinners, scrollbars and focus rings in
    // light mode on top of the dark UI — the arrows stay white and stand out.
    const root = ruleBody(/^:root$/m);
    expect(/color-scheme\s*:\s*dark/.test(root),
      ':root must declare `color-scheme: dark`').toBe(true);
  });

  it('flips color-scheme for the light theme', () => {
    const light = ruleBody(/\[data-theme="light"\]$/m);
    expect(/color-scheme\s*:\s*light/.test(light),
      '[data-theme="light"] must declare `color-scheme: light`').toBe(true);
  });
});

describe('number input spinners', () => {
  it('does not strip the native spinner in any engine', () => {
    // Hiding the spinner is engine-asymmetric: `-webkit-appearance: none` on
    // the ::-webkit-*-spin-button pseudo-elements only affects Chromium, while
    // `appearance: textfield` on the input removes Firefox's spinner outright.
    // Applying both left Chromium with a plain field and Firefox with no
    // stepper at all — a control the user could no longer click.
    const num = ruleBody(/\.ctrl-num-input/);
    expect(/appearance\s*:\s*textfield/.test(num),
      'appearance:textfield removes the spinner in Firefox').toBe(false);
    expect(/::-webkit-(outer|inner)-spin-button/.test(css),
      'the webkit spinner must not be suppressed either').toBe(false);
  });

  it('reserves room for the value next to the spinner', () => {
    const num = ruleBody(/^\.ctrl-num-input$/m);
    const w = /width\s*:\s*([\d.]+)rem/.exec(num);
    expect(w, '.ctrl-num-input needs an explicit width').toBeTruthy();
    // The spinner occupies part of the box, so the field has to be wide
    // enough for the longest value ("1555") *plus* the stepper.
    expect(parseFloat(w[1]), 'too narrow for a 4-digit value plus the spinner')
      .toBeGreaterThanOrEqual(4.75);
  });
});

describe('option buttons', () => {
  it('never shrinks an option below its label width', () => {
    const opt = ruleBody(/^\.btn-opt$/m);
    expect(/min-width\s*:\s*max-content/.test(opt),
      '.btn-opt must not shrink below its text (clipped "Saturation" -> "Satur")').toBe(true);
    expect(/flex\s*:\s*1\s+0\s+auto/.test(opt)).toBe(true);
  });
});
