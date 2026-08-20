import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { resolve } from 'path';
// jsdom's import.meta.url is not a file: URL, so resolve from the cwd
// (vitest runs from the project root) instead.
const css = readFileSync(resolve(process.cwd(), 'assets/css/style.css'), 'utf8');

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
  it('hides the webkit spinner buttons', () => {
    expect(/::-webkit-(outer|inner)-spin-button/.test(css)).toBe(true);
    const spin = ruleBody(/-webkit-(outer|inner)-spin-button/);
    expect(/-webkit-appearance\s*:\s*none/.test(spin)).toBe(true);
  });

  it('sets appearance textfield on the number input itself', () => {
    const num = ruleBody(/\.ctrl-num-input/);
    expect(/appearance\s*:\s*textfield/.test(num)).toBe(true);
  });

  it('keeps the value from overflowing the field', () => {
    const num = ruleBody(/^\.ctrl-num-input$/m);
    const w = /width\s*:\s*([\d.]+)rem/.exec(num);
    expect(w, '.ctrl-num-input needs an explicit width').toBeTruthy();
    expect(parseFloat(w[1]), 'too narrow for values like "1555"').toBeGreaterThanOrEqual(4);
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
