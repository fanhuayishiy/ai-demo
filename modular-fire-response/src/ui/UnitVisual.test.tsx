import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { KIND_LABELS } from '../simulation';
import type { UnitKind } from '../types';
import { EquipmentIllustration } from './UnitVisual';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const referenceAssets: [UnitKind, string][] = [
  ['water', 'water.webp'],
  ['booster', 'booster.webp'],
  ['boom', 'boom.webp'],
  ['ladder', 'ladder.webp'],
  ['fire-drone', 'fire-drone.webp'],
  ['cargo', 'cargo-drone.webp'],
  ['dog', 'robot.webp'],
];

describe.each(['/', './', '/ai-demo/modular-fire-response/dist/'])(
  'equipment illustrations with base %s', baseUrl => {
    it.each(referenceAssets)('loads the %s image beneath the deployment base', (kind, asset) => {
      vi.stubEnv('BASE_URL', baseUrl);
      render(<EquipmentIllustration kind={kind} />);

      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toBe(`${baseUrl}reference-equipment/${asset}`);
      expect(image.getAttribute('alt')).toContain(KIND_LABELS[kind]);
      expect(image.getAttribute('width')).toBe('112');
      expect(image.getAttribute('height')).toBe('55');
      expect(image.getAttribute('draggable')).toBe('false');
    });
  },
);

it.each(['power', 'recon', 'tools'] as UnitKind[])(
  'retains the %s icon fallback under a nested deployment base', kind => {
    vi.stubEnv('BASE_URL', '/ai-demo/modular-fire-response/dist/');
    const { container } = render(<EquipmentIllustration kind={kind} />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector(`svg[data-unit-kind="${kind}"]`)).not.toBeNull();
  },
);
