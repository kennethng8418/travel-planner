// Palm crown silhouette shared by the page backdrop and in-page accents.
// Drawn with currentColor, so callers set the colour via `text-*` and strength via `opacity`.

const round = (n: number) => Math.round(n * 10) / 10;

/** One palm frond: a curved midrib (quadratic bezier) lined with leaflets on both sides. */
function frond(length: number, bend: number) {
  const cx = length / 2;
  const cy = bend;
  const leaves: { transform: string; d: string }[] = [];
  const count = 22;

  for (let i = 1; i <= count; i++) {
    const t = 0.06 + (i / count) * 0.92;
    const x = 2 * (1 - t) * t * cx + t * t * length;
    const y = 2 * (1 - t) * t * cy;
    const dx = 2 * (1 - t) * cx + 2 * t * (length - cx);
    const dy = 2 * (1 - t) * cy - 2 * t * cy;
    const theta = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Leaflets are longest mid-frond and taper toward the tip.
    const len =
      length *
      0.42 *
      Math.pow(Math.sin(Math.PI * Math.min(t + 0.12, 1)), 0.7) *
      (1 - 0.35 * t);
    const w = len * 0.1;

    for (const side of [-1, 1]) {
      const angle = theta + side * (38 + 18 * t);
      leaves.push({
        transform: `translate(${round(x)} ${round(y)}) rotate(${round(angle)})`,
        d: `M0 0Q${round(len / 2)} ${round(-w)} ${round(len)} 0Q${round(len / 2)} ${round(w)} 0 0`,
      });
    }
  }

  return { rib: `M0 0 Q${round(cx)} ${round(cy)} ${length} 0`, leaves };
}

// [rotation, length, bend] for each frond in the crown.
const CROWN = [
  [100, 420, -60],
  [130, 380, -50],
  [160, 330, -40],
  [70, 400, -70],
  [40, 340, 60],
  [190, 260, 40],
  [10, 280, 50],
].map(([angle, length, bend]) => ({ angle, ...frond(length, bend) }));

function PalmCrown() {
  return (
    <>
      {CROWN.map((f) => (
        <g key={f.angle} transform={`rotate(${f.angle})`}>
          <path d={f.rib} fill="none" stroke="currentColor" strokeWidth="3" />
          {f.leaves.map((leaf, i) => (
            <path key={i} transform={leaf.transform} d={leaf.d} />
          ))}
        </g>
      ))}
    </>
  );
}

const CORNERS = {
  "top-right": {
    viewBox: "-440 -40 460 440",
    transform: "translate(0 -30)",
    sway: "frond-sway-right",
  },
  "bottom-left": {
    viewBox: "0 -380 400 400",
    transform: "translate(-40 30) rotate(180) scale(0.8)",
    sway: "frond-sway-left",
  },
} as const;

/** A swaying palm crown framed to hang off one corner of its positioned parent. */
export function PalmCorner({
  corner,
  opacity,
  className = "",
}: {
  corner: keyof typeof CORNERS;
  opacity: number;
  className?: string;
}) {
  const c = CORNERS[corner];
  return (
    <svg
      aria-hidden
      viewBox={c.viewBox}
      className={`frond-sway ${c.sway} pointer-events-none ${className}`}
      fill="currentColor"
      opacity={opacity}
    >
      <g transform={c.transform}>
        <PalmCrown />
      </g>
    </svg>
  );
}
