import type { TrainDefinition } from "./types";

export const trains: readonly TrainDefinition[] = [
  { id: "sora", name: "そらでんしゃ", color: "#5db7ff", accentColor: "#ffe66d", emoji: "🚃" },
  { id: "mori", name: "もりでんしゃ", color: "#61c57b", accentColor: "#ffcf70", emoji: "🚂" },
  { id: "niji", name: "にじでんしゃ", color: "#ff78b7", accentColor: "#78e0ff", emoji: "🚆" },
] as const;
