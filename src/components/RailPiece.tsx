import type { RailDirection, RailShape } from "../data/types";

interface RailPieceProps {
  readonly shape: RailShape;
  readonly direction: RailDirection;
}

const straightRotation = (direction: RailDirection): number =>
  direction === "north" || direction === "south" ? 90 : 0;

const curveRotation = (direction: RailDirection): number => {
  const rotations: Partial<Record<RailDirection, number>> = {
    northEast: 0,
    southEast: 90,
    southWest: 180,
    northWest: 270,
  };
  return rotations[direction] ?? 0;
};

/**
 * Renders a reusable top-down rail tile whose direction matches the course data.
 */
export function RailPiece({ shape, direction }: RailPieceProps): React.JSX.Element {
  const isCurve = shape === "curve";
  const isBridge = shape === "bridge";
  const rotation = isCurve ? curveRotation(direction) : straightRotation(direction);

  return (
    <svg className="rail-piece" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <rect className="rail-piece__base" x="10" y="10" width="76" height="76" rx="18" />
      <g transform={`rotate(${rotation} 48 48)`}>
        {isCurve ? (
          <>
            <path className="rail-piece__sleeper" d="M33 18 L61 18" />
            <path className="rail-piece__sleeper" d="M31 34 L63 40" />
            <path className="rail-piece__sleeper" d="M40 55 L66 66" />
            <path className="rail-piece__sleeper" d="M58 76 L84 76" />
            <path className="rail-piece__track" d="M34 12 C34 48 48 62 84 62" />
            <path className="rail-piece__track" d="M58 12 C58 31 65 38 84 38" />
          </>
        ) : (
          <>
            <rect className="rail-piece__sleeper-plank" x="18" y="22" width="9" height="52" rx="4.5" />
            <rect className="rail-piece__sleeper-plank" x="32" y="22" width="9" height="52" rx="4.5" />
            <rect className="rail-piece__sleeper-plank" x="46" y="22" width="9" height="52" rx="4.5" />
            <rect className="rail-piece__sleeper-plank" x="60" y="22" width="9" height="52" rx="4.5" />
            <rect className="rail-piece__sleeper-plank" x="74" y="22" width="9" height="52" rx="4.5" />
            <path className="rail-piece__track" d="M12 35 H84" />
            <path className="rail-piece__track" d="M12 61 H84" />
          </>
        )}
        {isBridge ? <path className="rail-piece__bridge" d="M22 68 L36 32 L50 68 L64 32 L78 68" /> : null}
      </g>
    </svg>
  );
}
