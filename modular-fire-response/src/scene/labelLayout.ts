export interface LabelBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface LabelAnchor {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
}

export interface LabelPlacement {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

export function placeSceneLabels(labels: LabelAnchor[], bounds: LabelBounds, obstacles: LabelBounds[] = []): LabelPlacement[] {
  const placed: LabelPlacement[] = [];
  const gap = 8;
  for (const label of [...labels].sort((a, b) => b.priority - a.priority || a.id - b.id)) {
    const { x, y, width, height } = label;
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0 ||
      width > bounds.right - bounds.left || height > bounds.bottom - bounds.top ||
      x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) continue;
    const dx = width + gap, dy = height + gap;
    const offsets = [
      [0, 0], [0, -dy], [0, dy], [-dx, 0], [dx, 0],
      [-dx, -dy], [dx, -dy], [-dx, dy], [dx, dy],
      [0, -dy * 2], [0, dy * 2],
      [-dx, -dy * 2], [dx, -dy * 2], [-dx, dy * 2], [dx, dy * 2],
    ];
    for (const [offsetX, offsetY] of offsets) {
      const candidate: LabelPlacement = {
        id: label.id,
        left: Math.max(bounds.left, Math.min(bounds.right - width, x - width / 2 + offsetX)),
        top: Math.max(bounds.top, Math.min(bounds.bottom - height, y - height / 2 + offsetY)),
        width, height, anchorX: x, anchorY: y,
      };
      const collides = placed.some(other =>
        candidate.left < other.left + other.width + gap && candidate.left + width + gap > other.left &&
        candidate.top < other.top + other.height + gap && candidate.top + height + gap > other.top);
      const coversInterface = obstacles.some(other =>
        candidate.left < other.right + gap && candidate.left + width + gap > other.left &&
        candidate.top < other.bottom + gap && candidate.top + height + gap > other.top);
      if (!collides && !coversInterface) {
        placed.push(candidate);
        break;
      }
    }
  }
  return placed;
}
