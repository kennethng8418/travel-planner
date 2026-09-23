// Decorative page backdrop: palm fronds leaning in from two corners and
// low turquoise waves along the bottom. Purely visual — hidden from assistive tech.

import { PalmCorner } from "@/components/Palm";

export function TropicalBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden text-[var(--accent)]"
    >
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-24 w-full sm:h-28"
      >
        <path
          d="M0 20 C240 -10 480 50 720 20 S1200 -10 1440 20 V110 H0Z"
          fill="#1fb5c9"
          opacity="0.1"
        />
        <path
          d="M0 50 C300 25 540 75 780 50 S1220 30 1440 52 V110 H0Z"
          fill="#0b8199"
          opacity="0.1"
        />
      </svg>

      <PalmCorner
        corner="top-right"
        opacity={0.13}
        className="absolute right-0 top-0 w-[min(34rem,70vw)]"
      />
      <PalmCorner
        corner="bottom-left"
        opacity={0.1}
        className="absolute bottom-0 left-0 w-[min(26rem,55vw)]"
      />
    </div>
  );
}
