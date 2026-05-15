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
        {isBridge ? <rect className="rail-piece__water" x="8" y="42" width="80" height="12" rx="6" /> : null}
        {isCurve ? (
          <>
            <rect className="rail-piece__sleeper-plank" x="29" y="14" width="35" height="10" rx="5" />
            <rect
              className="rail-piece__sleeper-plank"
              x="31"
              y="33"
              width="35"
              height="10"
              rx="5"
              transform="rotate(22 48.5 38)"
            />
            <rect
              className="rail-piece__sleeper-plank"
              x="45"
              y="52"
              width="35"
              height="10"
              rx="5"
              transform="rotate(52 62.5 57)"
            />
            <rect className="rail-piece__sleeper-plank" x="56" y="71" width="31" height="10" rx="5" />
            <path className="rail-piece__track rail-piece__track-outer" d="M34 12 C34 49 47 62 84 62" />
            <path className="rail-piece__track rail-piece__track-inner" d="M58 12 C58 30 66 38 84 38" />
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
        {isBridge ? (
          <>
            <path className="rail-piece__bridge-rail" d="M18 28 V68" />
            <path className="rail-piece__bridge-rail" d="M78 28 V68" />
          </>
        ) : null}
      </g>
    </svg>
  );
}
