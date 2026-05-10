import type { RailShape } from "../data/types";

interface RailPieceProps {
  readonly shape: RailShape;
}

/**
 * Renders a reusable child-friendly SVG rail piece.
 */
export function RailPiece({ shape }: RailPieceProps): React.JSX.Element {
  const isCurve = shape === "curve";
  const isBridge = shape === "bridge";

  return (
    <svg className="rail-piece" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <rect className="rail-piece__base" x="10" y="10" width="76" height="76" rx="18" />
      {isCurve ? (
        <>
          <path className="rail-piece__tie" d="M24 70 Q24 30 66 26" />
          <path className="rail-piece__track" d="M30 76 Q30 36 72 32" />
        </>
      ) : (
        <>
          <path className="rail-piece__tie" d="M18 39 H78" />
          <path className="rail-piece__track" d="M18 57 H78" />
        </>
      )}
      {isBridge ? <path className="rail-piece__bridge" d="M22 68 L36 32 L50 68 L64 32 L78 68" /> : null}
    </svg>
  );
}
