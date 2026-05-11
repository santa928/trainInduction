import type { CSSProperties } from "react";
import type { TrainDefinition } from "../data/types";

interface TrainSelectProps {
  readonly trains: readonly TrainDefinition[];
  readonly onSelectTrain: (trainId: TrainDefinition["id"]) => void;
}

/**
 * Shows large child-friendly train cards.
 */
export function TrainSelect({ trains, onSelectTrain }: TrainSelectProps): React.JSX.Element {
  return (
    <section className="screen">
      <h1>レールをつなごう！</h1>
      <div className="card-grid" aria-label="でんしゃをえらぶ">
        {trains.map((train, index) => (
          <button
            autoFocus={index === 0}
            className="train-card"
            key={train.id}
            style={{ "--train-color": train.color, "--train-accent": train.accentColor } as CSSProperties}
            onClick={() => onSelectTrain(train.id)}
          >
            <span className={`train-card-sprite train-art train-art-${train.id}`} aria-hidden="true" />
            <span>{train.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
