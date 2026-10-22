import { ends, sampleRail, type Rail } from "../railway/model";

export function RailIcon({ rail }: { rail: Rail }) {
  const [entry, exit] = ends[rail];
  const samples = Array.from({ length: 17 }, (_, i) =>
    sampleRail(entry, exit, i / 16),
  );
  const line = (offset: number) =>
    samples
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${50 + (p.x + p.dz * offset) * 80},${50 + (p.z - p.dx * offset) * 80}`,
      )
      .join(" ");
  return (
    <svg className="rail-icon" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="6" y="6" width="88" height="88" rx="16" fill="#f1dbad" />
      <rect x="9" y="9" width="82" height="79" rx="13" fill="#f9e6bd" />
      {[0.08, 0.29, 0.5, 0.71, 0.92].map((t) => {
        const p = sampleRail(entry, exit, t);
        return (
          <line
            key={t}
            x1={50 + (p.x + p.dz * 0.34) * 80}
            y1={50 + (p.z - p.dx * 0.34) * 80}
            x2={50 + (p.x - p.dz * 0.34) * 80}
            y2={50 + (p.z + p.dx * 0.34) * 80}
            stroke="#b88a58"
            strokeWidth="9"
            strokeLinecap="round"
          />
        );
      })}
      {[-0.17, 0.17].map((offset) => (
        <g key={offset}>
          <path
            d={line(offset)}
            fill="none"
            stroke="#694e3c"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d={line(offset)}
            fill="none"
            stroke="#e9e4cd"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}
