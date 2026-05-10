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
            <path className="rail-piece__sleeper" d="M33 18 L63 18" />
            <path className="rail-piece__sleeper" d="M29 34 L64 38" />
            <path className="rail-piece__sleeper" d="M36 54 L68 66" />
            <path className="rail-piece__sleeper" d="M54 68 L84 68" />
            <path className="rail-piece__track" d="M36 14 Q36 60 82 60" />
            <path className="rail-piece__track" d="M58 14 Q58 38 82 38" />
          </>
        ) : (
          <>
            <path className="rail-piece__sleeper" d="M22 24 V72" />
            <path className="rail-piece__sleeper" d="M36 24 V72" />
            <path className="rail-piece__sleeper" d="M50 24 V72" />
            <path className="rail-piece__sleeper" d="M64 24 V72" />
            <path className="rail-piece__sleeper" d="M78 24 V72" />
            <path className="rail-piece__track" d="M14 36 H82" />
            <path className="rail-piece__track" d="M14 60 H82" />
          </>
        )}
        {isBridge ? <path className="rail-piece__bridge" d="M22 68 L36 32 L50 68 L64 32 L78 68" /> : null}
      </g>
    </svg>
  );
}
