export function layoutAnnotations(items, { width, height, obstacles = [] }) {
  const placed = [];
  const overlaps = (a, b) =>
    a.x < b.x + b.width + 6 &&
    a.x + a.width + 6 > b.x &&
    a.y < b.y + b.height + 6 &&
    a.y + a.height + 6 > b.y;
  for (const item of items) {
    const preferredX = item.x + item.offset[0] - 40;
    const preferredY = item.y + item.offset[1] - 10;
    let found = false;
    for (const shiftX of [0, -item.width / 2, item.width / 2]) {
      if (found) break;
      for (const shift of [0, -34, 34, -68, 68, -102, 102]) {
        const box = {
          id: item.id,
          x: Math.max(8, Math.min(width - item.width - 8, preferredX + shiftX)),
          y: Math.max(120, Math.min(height - 135 - item.height, preferredY + shift)),
          width: item.width,
          height: item.height,
        };
        if (box.width > width - 16 || box.y + box.height > height - 135) continue;
        if ([...obstacles, ...placed].some((other) => overlaps(box, other))) continue;
        placed.push(box);
        found = true;
        break;
      }
    }
  }
  return placed;
}
