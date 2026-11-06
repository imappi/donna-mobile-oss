/** CSS gradient endpoints projected onto a native view of the same size.
 * A fixed normalized diagonal changes its angle when the card gets taller. */
export const gradientPoints = (degrees: number, width: number, height: number) => {
  const w = Math.max(width, 1), h = Math.max(height, 1);
  const angle = degrees * Math.PI / 180;
  const dx = Math.sin(angle), dy = -Math.cos(angle);
  const half = (w * Math.abs(dx) + h * Math.abs(dy)) / 2;
  return {
    start: { x: 0.5 - dx * half / w, y: 0.5 - dy * half / h },
    end: { x: 0.5 + dx * half / w, y: 0.5 + dy * half / h }
  };
};
