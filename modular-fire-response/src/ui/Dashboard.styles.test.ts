/// <reference types="vite/client" />
import { parse, type Root } from 'postcss';
import { describe, expect, it } from 'vitest';
import dashboardSource from './Dashboard.css?raw';
import themeSource from './NightTheme.css?raw';

const layout = parse(dashboardSource);
const theme = parse(themeSource);
const mobile = '(max-width: 800px)';

function values(sheet: Root, selector: string, property: string, media?: string | null) {
  const result: string[] = [];
  sheet.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    const scope = rule.parent?.type === 'atrule' ? rule.parent.params : null;
    if (media !== undefined && scope !== media) return;
    rule.walkDecls(property, declaration => { result.push(declaration.value); });
  });
  return result;
}

function value(sheet: Root, selector: string, property: string, media: string | null = null) {
  return values(sheet, selector, property, media).at(-1);
}

describe('command interface readability', () => {
  it('keeps KPI text on a flat dark band without decorative framing', () => {
    expect(value(theme, '.metrics', 'background-color')).toBe('#11191ff2');
    expect(value(theme, '.metrics', 'background-image')).toBe('none');
    expect(value(theme, '.metrics', 'border-radius')).toBe('0');
    expect(value(theme, '.metrics', 'box-shadow')).toBe('none');
    expect(value(theme, '.metrics', 'text-shadow')).toBe('none');
  });

  it.each(['.task-map-road.vertical', '.task-map-road.horizontal'])(
    'gives %s an explicit border color at the geometry rule specificity', selector => {
      expect(value(theme, selector, 'border-color')).toBe('#31424b');
    },
  );

  it.each([
    '.metrics span', '.status-pill', '.life-state small', '.force-count-label',
    '.force-row dt', '.force-row dd span', '.section-label > span', '.meter > div',
    '.meter small', '.water-grid small', '.water-grid b span', '.supply-status',
    '.supply-readings .meter > div', '.supply-readings .water-grid small',
    '.reserve-gauge small', '.checklist li span', '.fleet-unit strong', '.fleet-unit-status',
  ])('keeps critical %s text at least 11px across responsive overrides', selector => {
    const sizes = [...values(layout, selector, 'font-size'), ...values(theme, selector, 'font-size')];
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) {
      expect(size).toMatch(/^\d+(?:\.\d+)?px$/);
      expect(Number.parseFloat(size)).toBeGreaterThanOrEqual(11);
    }
  });

  it('allows force and supply content to wrap inside the existing rail width', () => {
    expect(value(layout, '.force-row dt', 'white-space')).toBe('normal');
    expect(value(layout, '.force-row dt', 'overflow-wrap')).toBe('anywhere');
    expect(value(layout, '.force-row dd', 'white-space')).toBe('nowrap');
    expect(value(layout, '.supply-readings .meter > div', 'flex-wrap')).toBe('wrap');
    expect(value(layout, '.supply-status', 'flex-wrap')).toBe('wrap');
    expect(value(layout, '.water-grid', 'grid-template-columns')).toBe('minmax(0, 1fr) minmax(0, 1fr)');
    expect(value(layout, '.water-grid b', 'overflow-wrap')).toBe('anywhere');
    expect(Number.parseFloat(value(layout, '.fleet-unit-meta', 'line-height')!)).toBeGreaterThanOrEqual(14);
  });

  it('fits the KPI band within the existing scene-safe top edge at each breakpoint', () => {
    const desktopHeight = Number.parseFloat(value(layout, '.metrics', 'min-height')!);
    const mobileHeight = Number.parseFloat(value(layout, '.metrics', 'min-height', mobile)!);
    expect(desktopHeight).toBe(48);
    expect(mobileHeight).toBe(42);
    expect(Number.parseFloat(value(layout, '.metrics', 'top')!) + desktopHeight).toBeLessThanOrEqual(170);
    expect(Number.parseFloat(value(layout, '.metrics', 'top', '(max-width: 1050px)')!) + desktopHeight)
      .toBeLessThanOrEqual(222);
    expect(Number.parseFloat(value(layout, '.metrics', 'top', mobile)!) + mobileHeight).toBeLessThanOrEqual(244);
    expect(value(layout, '.metrics', 'padding')).toBe('0 10px');
    expect(value(layout, '.metrics', 'padding', mobile)).toBe('0 8px');
  });

  it('keeps the narrow-desktop completion notice below KPIs while preserving mobile placement', () => {
    const narrowDesktop = '(max-width: 1050px)';
    const metricsBottom = Number.parseFloat(value(layout, '.metrics', 'top', narrowDesktop)!)
      + Number.parseFloat(value(layout, '.metrics', 'min-height')!);
    const completionTop = value(layout, '.completion', 'top', narrowDesktop);
    expect(completionTop).toBe('232px');
    expect(Number.parseFloat(completionTop!) - metricsBottom).toBeGreaterThanOrEqual(12);
    expect(value(layout, '.completion', 'top')).toBe('180px');
    expect(value(layout, '.completion', 'top', mobile)).toBe('260px');
  });
});

describe('command interface layout contracts', () => {
  it.each([
    ['--header-height', '64px', null],
    ['--footer-height', '164px', null],
    ['--inspector-width', '300px', null],
    ['--inspector-width', '272px', '(max-width: 1050px)'],
    ['--inspector-width', '320px', '(min-width: 1550px)'],
    ['--header-height', '104px', mobile],
    ['--footer-height', '180px', mobile],
  ])('preserves %s as %s in %s', (property, expected, media) => {
    expect(value(layout, '.dashboard', property!, media)).toBe(expected);
  });

  it('preserves equipment card dimensions and contained image proportions', () => {
    expect(value(layout, '.fleet-unit', 'width')).toBe('160px');
    expect(value(layout, '.fleet-unit', 'height')).toBe('100px');
    expect(value(layout, '.fleet-unit', 'width', mobile)).toBe('144px');
    expect(value(layout, '.fleet-unit', 'height', mobile)).toBe('92px');
    expect(value(layout, '.equipment-illustration img', 'width')).toBe('112px');
    expect(value(layout, '.equipment-illustration img', 'height')).toBe('55px');
    expect(value(layout, '.equipment-illustration img', 'height', mobile)).toBe('45px');
    expect(value(layout, '.equipment-illustration img', 'object-fit')).toBe('contain');
  });
});
