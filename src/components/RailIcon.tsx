export function RailIcon({ src }: { src?: string }) {
  return src ? (
    <img
      className="rail-icon"
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  ) : (
    <span className="rail-icon" aria-hidden="true" />
  );
}
