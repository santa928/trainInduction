import type { CSSProperties } from "react";
import type { RailDirection, RailShape } from "../data/types";
import railEastUrl from "../assets/rail-east.png";
import railNorthEastUrl from "../assets/rail-north-east.png";
import railNorthWestUrl from "../assets/rail-north-west.png";
import railNorthUrl from "../assets/rail-north.png";
import railSouthEastUrl from "../assets/rail-south-east.png";
import railSouthWestUrl from "../assets/rail-south-west.png";

interface RailPieceProps {
  readonly shape: RailShape;
  readonly direction: RailDirection;
}

const railAssetByDirection: Partial<Record<RailDirection, string>> = {
  east: railEastUrl,
  west: railEastUrl,
  north: railNorthUrl,
  south: railNorthUrl,
  northEast: railNorthEastUrl,
  southEast: railSouthEastUrl,
  southWest: railSouthWestUrl,
  northWest: railNorthWestUrl,
};

/**
 * Renders a generated top-down rail tile asset for a course piece.
 */
export function RailPiece({ shape, direction }: RailPieceProps): React.JSX.Element {
  const assetUrl = shape === "bridge" ? railEastUrl : (railAssetByDirection[direction] ?? railEastUrl);

  return (
    <span
      className="rail-piece"
      style={{ "--rail-image": `url(${assetUrl})` } as CSSProperties}
      aria-hidden="true"
    />
  );
}
