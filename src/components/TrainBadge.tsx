import type { Train } from "../railway/stages";
export function TrainBadge({ train }: { train: Train }) {
  return (
    <svg viewBox="0 0 160 100" className="train-badge" aria-hidden="true">
      <ellipse cx="81" cy="84" rx="60" ry="6" fill="#68593a" opacity=".09" />
      <rect x="30" y="69" width="106" height="9" rx="4" fill={train.dark} />
      <rect x="35" y="28" width="43" height="45" rx="8" fill={train.color} />
      <rect x="29" y="22" width="56" height="10" rx="5" fill={train.dark} />
      <rect x="43" y="35" width="26" height="23" rx="5" fill="#fff4d4" />
      <rect x="48" y="39" width="16" height="15" rx="3" fill="#acd4d3" />
      <rect x="75" y="46" width="50" height="25" rx="12" fill={train.color} />
      <rect x="111" y="43" width="14" height="30" rx="6" fill={train.dark} />
      <rect x="97" y="26" width="11" height="25" rx="3" fill={train.dark} />
      <rect x="93" y="25" width="19" height="7" rx="3" fill={train.dark} />
      <circle cx="123" cy="54" r="5" fill="#ffe2a0" />
      {[48, 79, 111].map((x) => (
        <g key={x}>
          <circle cx={x} cy="77" r="11" fill="#43534b" />
          <circle cx={x} cy="77" r="6" fill="#efd19a" />
          <circle cx={x} cy="77" r="2.5" fill="#9b7953" />
        </g>
      ))}
      <rect x="40" y="63" width="33" height="4" rx="2" fill="#ffe4a7" />
    </svg>
  );
}
