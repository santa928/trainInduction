import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RailwayGame } from "./components/RailwayGame";
import { DioramaView } from "./components/DioramaView";
import { TrainBadge } from "./components/TrainBadge";
import { RailIcon } from "./components/RailIcon";
import { createRun, railAt } from "./railway/model";
import { stages, trains } from "./railway/stages";
import { completeJourney, loadJourney, saveJourney } from "./railway/progress";
import { RailwayAudio } from "./railway/audio";

export function SoundButton({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="round-button sound-toggle"
      aria-label={enabled ? "おとを けす" : "おとを だす"}
      aria-pressed={enabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {enabled ? (
          <>
            <path d="M16 8q4 4 0 8M19 5q7 7 0 14" />
          </>
        ) : (
          <path d="m17 9 5 6m0-6-5 6" />
        )}
      </svg>
    </button>
  );
}

export default function App() {
  const [journey, setJourney] = useState(loadJourney);
  const [page, setPage] = useState<"home" | "map" | "game">("home");
  const [stageIndex, setStageIndex] = useState(0);
  const audio = useRef(new RailwayAudio()).current;
  const train = trains.find((t) => t.id === journey.trainId) ?? trains[0];
  const preview = useMemo(() => createRun(stages[0], 1), []);
  useEffect(() => {
    saveJourney(journey);
    audio.setEnabled(journey.sound);
  }, [journey, audio]);
  useEffect(() => () => audio.dispose(), [audio]);
  const toggleSound = () => {
    audio.setEnabled(!journey.sound);
    if (!journey.sound) void audio.unlock();
    else void audio.suspend();
    setJourney((p) => ({ ...p, sound: !p.sound }));
  };
  const clear = useCallback(
    (id: string) => setJourney((p) => completeJourney(p, id)),
    [],
  );
  const play = (index: number) => {
    void audio.unlock();
    setStageIndex(index);
    setPage("game");
  };
  const sound = <SoundButton enabled={journey.sound} onClick={toggleSound} />;

  if (page === "game")
    return (
      <RailwayGame
        key={stages[stageIndex].id}
        stage={stages[stageIndex]}
        train={train}
        audio={audio}
        sound={sound}
        onClear={clear}
        onExit={() => setPage("map")}
        onNext={stageIndex < 11 ? () => play(stageIndex + 1) : undefined}
      />
    );

  return (
    <main className={`welcome-shell ${page === "map" ? "map-shell" : ""}`}>
      <header className="site-header">
        {page === "map" ? (
          <button
            className="round-button"
            aria-label="でんしゃを えらぶ"
            onClick={() => setPage("home")}
          >
            <span aria-hidden="true">←</span>
          </button>
        ) : (
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              ▰
            </span>
            <span>ちいさな てつどうのたび</span>
          </div>
        )}
        {page === "map" && <span className="map-train-name">{train.name}</span>}
        {sound}
      </header>
      {page === "home" ? (
        <>
          <div className="home-content">
            <section className="home-copy">
              <div className="eyebrow">
                <span /> きみの ひらめきで、しゅっぱつ！
              </div>
              <h1>
                レールを
                <br />
                <span>つなごう！</span>
              </h1>
              <p className="home-description">
                でんしゃが くるよ。
                <br />
                ぴったりの レールは どれかな？
              </p>
              <div className="home-action">
                <button
                  className="primary-button start-button"
                  onClick={() => {
                    void audio.unlock();
                    setPage("map");
                  }}
                >
                  あそぶ <span aria-hidden="true">→</span>
                </button>
                <span className="journey-caption">12の ちいさな ぼうけん</span>
              </div>
            </section>
            <div className="hero-scene" aria-label="おもちゃの てつどう">
              <div className="hero-sun" />
              <DioramaView run={preview} train={train} preview />
              <span className="hero-seal" aria-hidden="true">
                しゅっぱつ
                <br />
                <b>しんこう！</b>
              </span>
            </div>
          </div>
          <section className="train-picker" aria-label="でんしゃを えらぼう">
            <div className="picker-heading">
              <span className="mini-rail" aria-hidden="true" />
              <h2>どの でんしゃで いく？</h2>
              <span className="mini-rail" aria-hidden="true" />
            </div>
            <div className="train-options">
              {trains.map((t) => (
                <button
                  key={t.id}
                  className={`train-option ${train.id === t.id ? "chosen" : ""}`}
                  aria-label={t.name}
                  aria-pressed={train.id === t.id}
                  onClick={() => {
                    setJourney((p) => ({ ...p, trainId: t.id }));
                    void audio.unlock();
                  }}
                >
                  <TrainBadge train={t} />
                  <span>{t.name}</span>
                  <i className="selection-dot" aria-hidden="true">
                    {train.id === t.id ? "✓" : ""}
                  </i>
                </button>
              ))}
            </div>
          </section>
          <footer className="home-footer">
            <span aria-hidden="true">✿</span> つないで、はしって、また あした。
          </footer>
        </>
      ) : (
        <>
          <section className="map-intro">
            <span className="eyebrow">きょうは どこまで いこう？</span>
            <h1>たびを えらぼう</h1>
            <div
              className="collected-stars"
              aria-label={`${journey.clearedStageIds.length}ステージ クリア`}
            >
              <span aria-hidden="true">★</span> {journey.clearedStageIds.length}
              <span className="star-total"> / 12</span>
            </div>
          </section>
          <div className="journey-map">
            {[1, 2, 3].map((chapter) => (
              <section
                className={`chapter chapter-${chapter}`}
                key={chapter}
                aria-label={`${chapter}つめの たび`}
              >
                <div className="chapter-title">
                  <span className="chapter-symbol" aria-hidden="true">
                    {["✿", "≈", "☀"][chapter - 1]}
                  </span>
                  <h2>
                    {
                      [
                        "はじめての レール",
                        "むきを よくみて",
                        "さきを みてみよう",
                      ][chapter - 1]
                    }
                  </h2>
                  <span className="chapter-index">0{chapter}</span>
                </div>
                <div className="stage-row">
                  {stages
                    .filter((s) => s.chapter === chapter)
                    .map((stage) => {
                      const cleared = journey.clearedStageIds.includes(
                          stage.id,
                        ),
                        locked = stage.number > journey.unlockedThrough;
                      return (
                        <button
                          className={`stage-stop ${cleared ? "stage-cleared" : ""} ${locked ? "stage-locked" : ""}`}
                          disabled={locked}
                          key={stage.id}
                          aria-label={`ステージ ${stage.number} ${stage.title}${cleared ? " クリア" : ""}`}
                          onClick={() => play(stage.number - 1)}
                        >
                          <span className="stage-number">{stage.number}</span>
                          <span className="stage-picture">
                            {locked ? (
                              <svg viewBox="0 0 32 32" aria-hidden="true">
                                <rect
                                  x="8"
                                  y="14"
                                  width="16"
                                  height="13"
                                  rx="4"
                                />
                                <path d="M11 14V9a5 5 0 0 1 10 0v5" />
                              </svg>
                            ) : (
                              <RailIcon
                                rail={railAt(stage, stage.gaps[0].pathIndex)}
                              />
                            )}
                          </span>
                          <span className="stage-star" aria-hidden="true">
                            {cleared ? "★" : locked ? "·" : "▷"}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </section>
            ))}
          </div>
          <footer className="map-footer">
            <TrainBadge train={train} />
            <span>レールを つないで、えきまで！</span>
          </footer>
        </>
      )}
    </main>
  );
}
