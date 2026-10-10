/// <reference types="vite/client" />
import { parse } from 'postcss';
import { describe, expect, it } from 'vitest';
import source from './CargoRescueIntervention.css?raw';

const sheet = parse(source);
function value(selector: string, property: string) {
  const values: string[] = [];
  sheet.walkRules(rule => {
    if (rule.selectors.includes(selector)) rule.walkDecls(property, declaration => { values.push(declaration.value); });
  });
  return values.at(-1);
}

describe('cargo rescue intervention layout', () => {
  it('stays unframed and wraps within either existing inspector surface', () => {
    expect(value('.cargo-rescue-intervention', 'min-width')).toBe('0');
    expect(value('.cargo-rescue-intervention', 'background')).toBe('transparent');
    expect(value('.cargo-rescue-intervention', 'border-radius')).toBe('0');
    expect(value('.cargo-rescue-intervention', 'box-shadow')).toBe('none');
    expect(value('.cargo-rescue-intervention', 'overflow-wrap')).toBe('anywhere');
    expect(value('.cargo-rescue-intervention', 'letter-spacing')).toBe('0');
    expect(value('.cargo-rescue-actions', 'grid-template-columns')).toBe('minmax(0, 1fr)');
    expect(value('.cargo-rescue-heading', 'grid-template-columns')).toBe('minmax(0, 1fr) auto');
    expect(source).not.toMatch(/font-size:\s*[^;]*vw/);
  });

  it('reserves stable icon dimensions and readable wrapping labels', () => {
    expect(value('.cargo-rescue-intervention .cargo-rescue-icon', 'width')).toBe('32px');
    expect(value('.cargo-rescue-intervention .cargo-rescue-icon', 'height')).toBe('32px');
    expect(value('.cargo-rescue-actions button', 'min-height')).toBe('36px');
    expect(value('.cargo-rescue-actions button', 'white-space')).toBe('normal');
    expect(value('.cargo-rescue-actions button', 'overflow-wrap')).toBe('anywhere');
    expect(value('.cargo-rescue-intervention .cargo-rescue-opt-in', 'grid-template-columns')).toBe('minmax(0, 1fr) auto');
    for (const selector of ['.cargo-rescue-heading h3', '.cargo-rescue-stage', '.cargo-rescue-reason', '.cargo-rescue-risk']) {
      expect(Number.parseFloat(value(selector, 'font-size')!)).toBeGreaterThanOrEqual(11);
    }
  });

  it('keeps disabled safety reasons and keyboard focus legible in the night palette', () => {
    expect(value('.cargo-rescue-intervention button:disabled', 'opacity')).toBe('1');
    expect(value('.cargo-rescue-intervention button:disabled', 'color')).toBe('var(--night-muted)');
    expect(value('.cargo-rescue-intervention button:focus-visible', 'outline')).toBe('2px solid var(--night-water)');
    expect(value('.cargo-rescue-intervention input:focus-visible', 'outline-offset')).toBe('3px');
    expect(value('.cargo-rescue-reason', 'color')).toBe('var(--night-muted)');
  });
});
