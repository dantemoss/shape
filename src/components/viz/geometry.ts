export function topRoundedBar(x: number, y: number, width: number, height: number, radius: number): string {
  const safeHeight = Math.max(height, 0);
  const safeWidth = Math.max(width, 0);
  const r = Math.min(radius, safeWidth / 2, safeHeight / 2);
  if (safeHeight <= 0.5 || safeWidth <= 0) return "";
  const bottom = y + safeHeight;
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + safeWidth - r} ${y}`,
    `Q ${x + safeWidth} ${y} ${x + safeWidth} ${y + r}`,
    `L ${x + safeWidth} ${bottom}`,
    "Z",
  ].join(" ");
}

export function smoothLine(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

export function smoothArea(points: { x: number; y: number }[], baseline: number): string {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${smoothLine(points)} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
}

export function yAt(value: number, min: number, max: number, top: number, bottom: number): number {
  if (max === min) return (top + bottom) / 2;
  return bottom - ((value - min) / (max - min)) * (bottom - top);
}

export function clampPercent(value: number, min = 12, max = 88): number {
  return Math.min(max, Math.max(min, value));
}
