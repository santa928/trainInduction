export type TrainId = "sora" | "mori" | "niji";
export type CourseId = `${TrainId}-${1 | 2 | 3 | 4 | 5}`;
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type RailShape = "straight" | "curve" | "bridge";
export type RailDirection =
  | "east"
  | "south"
  | "west"
  | "north"
  | "northEast"
  | "southEast"
  | "southWest"
  | "northWest";
export type RetryMode = "checkpoint" | "courseStart";

export interface TrainDefinition {
  readonly id: TrainId;
  readonly name: string;
  readonly color: string;
  readonly accentColor: string;
  readonly emoji: string;
}

export interface RailPoint {
  readonly x: number;
  readonly y: number;
}

export interface PieceDefinition {
  readonly id: string;
  readonly shape: RailShape;
  readonly direction: RailDirection;
  readonly label: string;
}

export interface GapDefinition {
  readonly id: string;
  readonly position: RailPoint;
  readonly requiredPieceId: string;
  readonly arrivalDistance: number;
}

export interface CourseDefinition {
  readonly id: CourseId;
  readonly trainId: TrainId;
  readonly title: string;
  readonly difficulty: Difficulty;
  readonly background: "sky" | "forest" | "rainbow" | "river" | "night";
  readonly trainSpeed: number;
  readonly retryMode: RetryMode;
  readonly path: readonly RailPoint[];
  readonly pieces: readonly PieceDefinition[];
  readonly gaps: readonly GapDefinition[];
}
