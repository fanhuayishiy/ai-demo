import { describe, expect, it, vi } from 'vitest';

describe('desktop reference density', () => {
  it('keeps enriched rows compact and puts narrow camera controls above details', async () => {
    const { readFileSync } = await vi.importActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('node:fs');
    const style = document.createElement('style');
    style.textContent = readFileSync('src/ui/dashboard.css', 'utf8');
    document.head.append(style);
    try {
      const rules = Array.from(style.sheet!.cssRules);
      const value = (list: CSSRule[], selector: string, property: string) => list
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector)
        .at(-1)?.style.getPropertyValue(property);
      expect(value(rules, '.wt-overlay', '--wt-muted')).toBe('#62718a');
      expect(value(rules, '.wt-stock-quantity', 'white-space')).toBe('nowrap');
      expect(value(rules, '.wt-equipment-row>button', 'display')).toBe('flex');
      const mobile = rules.filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.conditionText === '(max-width: 900px)').flatMap(rule => Array.from(rule.cssRules));
      expect(value(mobile, '.wt-scene-tools', 'flex-direction')).toBe('row');
      expect(value(mobile, '.wt-scene-tools', 'top')).toBe('160px');
      expect(value(mobile, '.wt-scene-tools', 'width')).toBe('166px');
      expect(value(mobile, '.wt-detail', 'top')).toBe('206px');
      expect(value(mobile, '.wt-detail', 'max-height')).toBe('calc(100dvh - 380px)');
    } finally { style.remove(); }
  });
  it('keeps compact reference geometry scoped to desktop', async () => {
    const { readFileSync } = await vi.importActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('node:fs');
    const style = document.createElement('style');
    style.textContent = readFileSync('src/ui/dashboard.css', 'utf8');
    document.head.append(style);
    const rules = Array.from(style.sheet!.cssRules).filter((rule): rule is CSSMediaRule =>
      rule instanceof CSSMediaRule && rule.conditionText === '(min-width: 901px)');
    const compactRules = rules.flatMap(rule => Array.from(rule.cssRules)) as CSSStyleRule[];
    const value = (selector: string, property: string) => compactRules
      .filter(rule => rule.selectorText === selector).at(-1)?.style.getPropertyValue(property);
    expect(value('.wt-navbar', 'height')).toBe('56px');
    expect(value('.wt-stats', 'top')).toBe('68px');
    expect(value('.wt-stat', 'padding')).toBe('8px 11px');
    expect(value('.wt-detail-heading', 'padding')).toBe('11px 12px 7px');
    expect(value('.wt-shipment-body', 'padding')).toBe('10px 0');
    expect(value('.wt-shipment', 'width')).toBe('clamp(510px, 60vw, 760px)');
    expect(value('.wt-docks', 'width')).toBe('clamp(275px, 30vw, 370px)');
    style.remove();
  });
});
