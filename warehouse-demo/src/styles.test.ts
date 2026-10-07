import { describe, expect, it, vi } from 'vitest';

describe('narrow-screen context recovery notice', () => {
  it('places the notice below search and above the camera toolbar at widths up to 900px', async () => {
    const { readFileSync } = await vi.importActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('node:fs');
    const styles = readFileSync('src/styles.css', 'utf8');
    const mobileRule = styles.match(/@media\s*\(max-width:\s*900px\)\s*\{\s*\.scene-context-warning\s*\{([^}]+)\}/);
    expect(mobileRule).not.toBeNull();
    expect(mobileRule?.[1]).toMatch(/top:\s*64px/);
    expect(mobileRule?.[1]).toMatch(/padding:\s*10px\s+14px/);
  });
});
