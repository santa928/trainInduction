import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  createRun,
  editableGap,
  railNames,
  reduceRun,
  routeTiles,
  type Stage,
} from "../railway/model";
import type { Train } from "../railway/stages";
import type { RailwayAudio } from "../railway/audio";
import type { Projection } from "../scene/Diorama";
import type { RailImages } from "../scene/railPreviews";
import { DioramaView } from "./DioramaView";
import { RailIcon } from "./RailIcon";
import { TrainBadge } from "./TrainBadge";

interface Props {
  stage: Stage;
  train: Train;
  audio: RailwayAudio;
  sound: ReactNode;
  onClear: (id: string) => void;
  onExit: () => void;
  onNext?: () => void;
}
interface Drag {
  id: string;
  pointer: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  active: boolean;
}
export function RailwayGame({
  stage,
  train,
  audio,
  sound,
  onClear,
  onExit,
  onNext,
}: Props) {
  const [run, dispatch] = useReducer(reduceRun, stage, (s) =>
    createRun(s, crypto.getRandomValues(new Uint32Array(1))[0]),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [projection, setProjection] = useState<Projection[]>([]);
  const [railImages, setRailImages] = useState<RailImages>();
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const runRef = useRef(run);
  runRef.current = run;
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const previous = useRef(run.status),
    notified = useRef(false),
    lastChug = useRef(0);
  const dialog = useRef<HTMLDivElement>(null);
  const ended = run.status === "failed" || run.status === "cleared";
  const modal = ended || (run.paused && available);
  const modalRef = useRef(modal);
  modalRef.current = modal;
  const pause = useCallback(() => {
    dispatch({ type: "pause" });
    setSelected(null);
    dragRef.current = null;
    setDrag(null);
    void audio.suspend();
  }, [audio]);
  const frame = useCallback((seconds: number) => {
    dispatch({ type: "tick", seconds });
  }, []);
  const sceneReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) pause();
    };
    const blur = () => pause();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") pause();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", key);
    };
  }, [pause]);
  useEffect(() => {
    if (run.status !== previous.current) {
      if (run.status === "running") audio.depart();
      if (run.status === "failed") {
        audio.fail();
        setSelected(null);
      }
      if (run.status === "cleared") {
        audio.arrive();
        setSelected(null);
      }
      previous.current = run.status;
    }
    if (run.status === "cleared" && !notified.current) {
      notified.current = true;
      onClear(stage.id);
    }
    if (
      run.status === "running" &&
      !run.paused &&
      Math.floor(run.distance * 3) > lastChug.current
    ) {
      lastChug.current = Math.floor(run.distance * 3);
      audio.chug();
    }
  }, [run.status, run.distance, run.paused, audio, onClear, stage.id]);
  useEffect(() => {
    if (modal) {
      setSelected(null);
      dragRef.current = null;
      setDrag(null);
      dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }, [modal]);
  const select = (id: string) => {
    if (modalRef.current || runRef.current.paused || !ready) return;
    setSelected((current) => (current === id ? null : id));
    void audio.unlock();
  };
  const place = (gapId: string, pieceId: string) => {
    if (!editableGap(runRef.current, gapId)) return;
    dispatch({ type: "place", gapId, pieceId });
    setSelected(null);
    audio.place();
  };
  const gapClick = (gapId: string) => {
    if (selected) place(gapId, selected);
    else if (run.placements[gapId]) {
      dispatch({ type: "return", gapId });
      audio.returnPiece();
    }
  };
  const nearestGap = (x: number, y: number) => {
    let best: string | null = null,
      distance = Infinity;
    for (const element of document.querySelectorAll<HTMLButtonElement>(
      ".rail-gap:not(:disabled)",
    )) {
      const rect = element.getBoundingClientRect(),
        dx = x - (rect.x + rect.width / 2),
        dy = y - (rect.y + rect.height / 2);
      if (
        Math.abs(dx) > rect.width / 2 + 10 ||
        Math.abs(dy) > rect.height / 2 + 10
      )
        continue;
      const d = Math.hypot(dx, dy);
      if (d < distance) {
        distance = d;
        best = element.dataset.gap!;
      }
    }
    return best;
  };
  const pointerDown = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (event.button !== 0 || dragRef.current || modalRef.current || !ready)
      return;
    void audio.unlock();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
    };
  };
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current || current.pointer !== event.pointerId) return;
    const next = {
      ...current,
      x: event.clientX,
      y: event.clientY,
      active:
        current.active ||
        Math.hypot(
          event.clientX - current.startX,
          event.clientY - current.startY,
        ) > 10,
    };
    dragRef.current = next;
    if (next.active) {
      setDrag(next);
      setSelected(next.id);
    }
  };
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current || current.pointer !== event.pointerId) return;
    dragRef.current = null;
    setDrag(null);
    if (modalRef.current) return;
    if (current.active) {
      const gap = nearestGap(event.clientX, event.clientY);
      if (gap) place(gap, current.id);
      else setSelected(null);
    } else select(current.id);
  };
  const retry = () => {
    notified.current = false;
    lastChug.current = 0;
    setSelected(null);
    dispatch({ type: "retry" });
    void audio.unlock();
  };
  const total = routeTiles(stage).at(-1)!.end;
  const upcoming = stage.gaps[run.nextGap];
  const urgent =
    run.status === "running" &&
    upcoming &&
    routeTiles(stage)[upcoming.pathIndex].start - run.distance <
      stage.speed * 3;
  const dragPiece = drag
    ? stage.pieces.find((p) => p.id === drag.id)
    : undefined;
  return (
    <main
      className={`railway-game theme-${stage.theme}`}
      data-status={run.status}
      data-paused={run.paused}
      data-distance={run.distance.toFixed(5)}
      data-next-gap={run.nextGap}
    >
      <div className="play-shell" inert={modal}>
        <header className="play-header">
          <button
            className="round-button"
            aria-label="たびを えらぶ"
            onClick={onExit}
          >
            ←
          </button>
          <div className="play-title">
            <span>たび {String(stage.number).padStart(2, "0")} / 12</span>
            <h1>{stage.title}</h1>
          </div>
          <div className="play-actions">
            {sound}
            <button
              className="round-button"
              aria-label="ひとやすみ"
              onClick={pause}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 6v12M16 6v12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="play-status">
          <span className={`status-pill ${urgent ? "urgent" : ""}`}>
            {run.status === "ready" ? (
              <>
                <span className="countdown-dots" aria-hidden="true">
                  {[3, 2, 1].map((n) => (
                    <i key={n} className={run.preparation <= n ? "lit" : ""} />
                  ))}
                </span>
                もうすぐ しゅっぱつ
              </>
            ) : (
              <>
                <span aria-hidden="true">▰</span> あと{" "}
                {stage.gaps.length - run.nextGap} かしょ
              </>
            )}
          </span>
          <span className="play-hint">
            {run.nextGap >= stage.gaps.length
              ? "えきまで いこう！"
              : selected
                ? "あなに おいてね"
                : stage.gaps.every((gap) => Boolean(run.placements[gap.id]))
                  ? "でんしゃが くるよ"
                  : "レールを えらんでね"}
          </span>
        </div>
        <div className="play-board" role="region" aria-label="3Dの せんろ">
          <DioramaView
            run={run}
            train={train}
            onProjection={setProjection}
            onRailImages={setRailImages}
            onFrame={frame}
            onReady={sceneReady}
            onInterrupt={pause}
            onAvailability={setAvailable}
          />
          <div className="gap-layer">
            {stage.gaps.map((gap, index) => {
              const point = projection.find((p) => p.id === gap.id);
              if (!point) return null;
              const filled = Boolean(run.placements[gap.id]),
                locked = index < run.nextGap;
              return (
                <button
                  key={gap.id}
                  className={`rail-gap ${filled ? "filled" : ""} ${selected && !locked ? "receiving" : ""} ${urgent && index === run.nextGap ? "approaching" : ""} ${run.failedGap === gap.id ? "failed-gap" : ""}`}
                  data-gap={gap.id}
                  data-filled={filled}
                  data-locked={locked}
                  aria-label={`あな ${index + 1}${filled ? " おいたレール" : ""}`}
                  disabled={!ready || run.paused || locked}
                  style={
                    {
                      left: point.x,
                      top: point.y,
                      width: point.size,
                      height: point.size,
                    } as CSSProperties
                  }
                  onClick={() => gapClick(gap.id)}
                >
                  <span aria-hidden="true">{!filled ? "+" : ""}</span>
                </button>
              );
            })}
          </div>
          {ready &&
            run.status === "ready" &&
            stage.number === 1 &&
            !selected && (
              <div className="first-gesture" aria-hidden="true">
                <span>☝</span>
              </div>
            )}
        </div>
        <section className="rail-tray" aria-label="レールの おきば">
          <div className="tray-caption">
            <span aria-hidden="true">✦</span>
            <span>ぴったりの レールを さがそう</span>
            <span aria-hidden="true">✦</span>
          </div>
          <div
            className="tray-pieces"
            style={{ "--piece-count": stage.pieces.length } as CSSProperties}
          >
            {run.order.map((id) => {
              const piece = stage.pieces.find((p) => p.id === id)!;
              const used = Object.values(run.placements).includes(id);
              return used ? (
                <div
                  key={id}
                  className="rail-placeholder"
                  aria-label={`${railNames[piece.rail]} おいたよ`}
                >
                  <span aria-hidden="true">✓</span>
                </div>
              ) : (
                <button
                  key={id}
                  className={`rail-choice ${selected === id ? "selected" : ""}`}
                  aria-label={`レール ${railNames[piece.rail]}`}
                  aria-pressed={selected === id}
                  data-piece={id}
                  data-rail={piece.rail}
                  disabled={
                    !ready || run.paused || run.nextGap >= stage.gaps.length
                  }
                  onPointerDown={(e) => pointerDown(e, id)}
                  onPointerMove={pointerMove}
                  onPointerUp={pointerUp}
                  onPointerCancel={() => {
                    dragRef.current = null;
                    setDrag(null);
                    setSelected(null);
                  }}
                  onLostPointerCapture={() => {
                    if (dragRef.current) {
                      dragRef.current = null;
                      setDrag(null);
                      setSelected(null);
                    }
                  }}
                  onClick={(e) => {
                    if (e.detail === 0) select(id);
                  }}
                >
                  <RailIcon src={railImages?.[piece.rail]} />
                  <span className="piece-selection" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>
        <div className="journey-meter" aria-hidden="true">
          <span>●</span>
          <div>
            <i style={{ width: `${(run.distance / total) * 100}%` }} />
          </div>
          <span>⚑</span>
        </div>
      </div>
      {dragPiece && drag && (
        <div
          className="drag-rail"
          aria-hidden="true"
          style={{ left: drag.x, top: drag.y }}
        >
          <RailIcon src={railImages?.[dragPiece.rail]} />
        </div>
      )}
      {modal && (
        <div
          className={`game-modal ${run.paused ? "pause-modal" : run.status === "cleared" ? "success-modal" : "failure-modal"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="railway-result-title"
          ref={dialog}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const buttons = Array.from(
              dialog.current?.querySelectorAll<HTMLButtonElement>("button") ??
                [],
            );
            if (!buttons.length) return;
            event.preventDefault();
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            buttons[
              (index + (event.shiftKey ? -1 : 1) + buttons.length) %
                buttons.length
            ].focus();
          }}
        >
          <div className="result-cloud">
            <div className="result-emblem" aria-hidden="true">
              {run.paused ? "☁" : run.status === "cleared" ? "★" : "!"}
            </div>
            <h2 id="railway-result-title">
              {run.paused
                ? "ひとやすみ"
                : run.status === "cleared"
                  ? "えきに ついたよ！"
                  : "あっ、レールが！"}
            </h2>
            <p>
              {run.paused
                ? "じゅんびが できたら つづけよう"
                : run.status === "cleared"
                  ? "じょうずに つながったね！"
                  : "つぎは つなげるかな？"}
            </p>
            <TrainBadge train={train} />
            {run.paused ? (
              <button
                className="primary-button"
                onClick={() => {
                  void audio.unlock();
                  dispatch({ type: "resume" });
                }}
              >
                つづける <span aria-hidden="true">▶</span>
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={run.status === "cleared" && onNext ? onNext : retry}
              >
                {run.status === "cleared" && onNext
                  ? "つぎの たびへ"
                  : "もういちど"}
                <span aria-hidden="true">
                  {run.status === "cleared" && onNext ? "→" : "↻"}
                </span>
              </button>
            )}
            <div className="result-secondary">
              {run.status === "cleared" && onNext && (
                <button className="soft-button" onClick={retry}>
                  もういちど
                </button>
              )}
              <button className="soft-button" onClick={onExit}>
                たびを えらぶ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
