import type { PieceDefinition, RailPoint } from "./types";

type CardinalRailDirection = "north" | "east" | "south" | "west";

/**
 * Returns the board direction from one adjacent route point to the next.
 */
export function directionBetweenAdjacentPoints(
  from: RailPoint,
  to: RailPoint,
): CardinalRailDirection | undefined {
  if (to.x === from.x + 1 && to.y === from.y) {
    return "east";
  }
  if (to.x === from.x - 1 && to.y === from.y) {
    return "west";
  }
  if (to.y === from.y + 1 && to.x === from.x) {
    return "south";
  }
  if (to.y === from.y - 1 && to.x === from.x) {
    return "north";
  }
  return undefined;
}

/**
 * Lists the open edge directions a rail piece can connect to.
 */
export function getRailOpenEnds(piece: Pick<PieceDefinition, "shape" | "direction">): readonly CardinalRailDirection[] {
  if (piece.shape === "straight" || piece.shape === "bridge") {
    return piece.direction === "north" || piece.direction === "south" ? ["north", "south"] : ["east", "west"];
  }

  switch (piece.direction) {
    case "northEast":
      return ["north", "east"];
    case "southEast":
      return ["south", "east"];
    case "southWest":
      return ["south", "west"];
    case "northWest":
      return ["north", "west"];
    default:
      return [];
  }
}

/**
 * Checks whether a rail piece exposes every edge required by a route cell.
 */
export function pieceConnectsRouteAtPathIndex(
  piece: Pick<PieceDefinition, "shape" | "direction">,
  path: readonly RailPoint[],
  pathIndex: number,
): boolean {
  const current = path[pathIndex];
  if (!current) {
    return false;
  }

  const requiredDirections = [path[pathIndex - 1], path[pathIndex + 1]]
    .map((point) => (point ? directionBetweenAdjacentPoints(current, point) : undefined))
    .filter((direction): direction is CardinalRailDirection => Boolean(direction));
  const openEnds = getRailOpenEnds(piece);

  return requiredDirections.every((direction) => openEnds.includes(direction));
}

/**
 * Checks whether a rail piece can connect through the route cell at a board point.
 */
export function pieceConnectsRouteAtPoint(
  piece: Pick<PieceDefinition, "shape" | "direction">,
  path: readonly RailPoint[],
  point: RailPoint,
): boolean {
  const pathIndex = path.findIndex((pathPoint) => pathPoint.x === point.x && pathPoint.y === point.y);
  return pieceConnectsRouteAtPathIndex(piece, path, pathIndex);
}
