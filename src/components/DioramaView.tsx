import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Run } from "../railway/model";
import type { Train } from "../railway/stages";
import type { Diorama, Projection } from "../scene/Diorama";
import type { RailImages } from "../scene/railPreviews";

interface Props {
  run: Run;
  train: Train;
  preview?: boolean;
  onFrame?: (seconds: number) => void;
  onReady?: () => void;
  onProjection?: (points: Projection[]) => void;
  onRailImages?: (images: RailImages) => void;
  onInterrupt?: () => void;
  onAvailability?: (available: boolean) => void;
}
export function DioramaView(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const lastFrame = useRef(0);
  useLayoutEffect(() => {
    // A background tab may deliver no frames between pausing and resuming.
    // The first active frame must not charge that suspended interval.
    lastFrame.current = 0;
  }, [props.run.paused]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    let disposed = false,
      scene: Diorama | undefined,
      frame = 0;
    lastFrame.current = 0;
    setLoading(true);
    setError(false);
    void import("../scene/Diorama")
      .then(({ Diorama }) => {
        if (disposed || !host.current) return;
        try {
          scene = new Diorama({
            host: host.current,
            stage: latest.current.run.stage,
            train: latest.current.train,
            preview: latest.current.preview,
            onProjection: (points) => latest.current.onProjection?.(points),
            onRailImages: (images) => latest.current.onRailImages?.(images),
            onContextLost: () => {
              setError(true);
              latest.current.onAvailability?.(false);
              latest.current.onInterrupt?.();
            },
            onContextRestored: () => {
              setError(false);
              latest.current.onAvailability?.(true);
              latest.current.onInterrupt?.();
            },
          });
          scene.render(latest.current.run, performance.now() / 1000);
          setLoading(false);
          latest.current.onAvailability?.(true);
          latest.current.onReady?.();
          const animate = (now: number) => {
            if (disposed) return;
            frame = requestAnimationFrame(animate);
            const last = lastFrame.current;
            if (last && now - last < 1000 / 30) return;
            const seconds = last ? (now - last) / 1000 : 0;
            lastFrame.current = now;
            latest.current.onFrame?.(seconds);
            scene?.render(latest.current.run, now / 1000);
          };
          frame = requestAnimationFrame(animate);
        } catch {
          setLoading(false);
          setError(true);
          latest.current.onAvailability?.(false);
          latest.current.onInterrupt?.();
        }
      })
      .catch(() => {
        if (!disposed) {
          setLoading(false);
          setError(true);
          latest.current.onAvailability?.(false);
          latest.current.onInterrupt?.();
        }
      });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      scene?.dispose();
    };
  }, [props.run.stage.id, props.train.id, props.preview, epoch]);
  return (
    <>
      <div className="diorama-host" ref={host} />
      {loading && (
        <div className="scene-loading" role="status">
          <span className="loading-wheel" />
          じゅんびちゅう…
        </div>
      )}
      {error && (
        <div className="scene-error" role="alert">
          <span aria-hidden="true">☁</span>
          <p>でんしゃを よみこめなかったよ</p>
          <button
            className="soft-button"
            onClick={() => setEpoch((e) => e + 1)}
          >
            もういちど ひらく
          </button>
        </div>
      )}
    </>
  );
}
