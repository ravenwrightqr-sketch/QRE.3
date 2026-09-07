import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Screen = {
  id: string;
  text: string;
  duration: number;
};

type Sequence = {
  title: string;
  screens: Screen[];
};

const DRAFT_KEY = "qre-admin-sequence-draft";

const makeScreen = (text = ""): Screen => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  text,
  duration: 2500,
});

const starter: Sequence = {
  title: "",
  screens: [makeScreen(""), makeScreen(""), makeScreen("")],
};

function readDraft(): Sequence {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Sequence;
      if (Array.isArray(parsed.screens) && parsed.screens.length) return parsed;
    }
  } catch {}
  return starter;
}

function shareUrl(sequence: Sequence) {
  const encoded = btoa(JSON.stringify(sequence));
  return `${window.location.origin}/admin/sequence/preview#${encodeURIComponent(encoded)}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sequence, setSequence] = useState<Sequence>(readDraft);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [saved, setSaved] = useState(false);

  const selectedScreen = sequence.screens[selected] ?? sequence.screens[0];

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(sequence));
  }, [sequence]);

  useEffect(() => {
    if (!playing || sequence.screens.length < 2) return;
    const duration = Math.max(700, selectedScreen?.duration ?? 2500);
    const timer = window.setTimeout(() => {
      setSelected((current) => (current + 1) % sequence.screens.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [playing, selected, selectedScreen?.duration, sequence.screens.length]);

  const completed = useMemo(
    () => sequence.screens.filter((screen) => screen.text.trim()).length,
    [sequence.screens],
  );

  function updateScreen(index: number, patch: Partial<Screen>) {
    setSequence((current) => ({
      ...current,
      screens: current.screens.map((screen, screenIndex) =>
        screenIndex === index ? { ...screen, ...patch } : screen,
      ),
    }));
    setSaved(false);
  }

  function addScreen(after = sequence.screens.length - 1) {
    setSequence((current) => {
      const next = [...current.screens];
      next.splice(after + 1, 0, makeScreen());
      return { ...current, screens: next };
    });
    setSelected(after + 1);
    setPlaying(false);
    setSaved(false);
  }

  function removeScreen(index: number) {
    if (sequence.screens.length <= 1) return;
    setSequence((current) => ({
      ...current,
      screens: current.screens.filter((_, screenIndex) => screenIndex !== index),
    }));
    setSelected((current) => Math.max(0, Math.min(current, sequence.screens.length - 2)));
    setSaved(false);
  }

  function moveScreen(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sequence.screens.length) return;
    setSequence((current) => {
      const next = [...current.screens];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, screens: next };
    });
    setSelected(target);
    setSaved(false);
  }

  function duplicateScreen(index: number) {
    const source = sequence.screens[index];
    const copy = makeScreen(source.text);
    copy.duration = source.duration;
    setSequence((current) => {
      const next = [...current.screens];
      next.splice(index + 1, 0, copy);
      return { ...current, screens: next };
    });
    setSelected(index + 1);
    setPlaying(false);
    setSaved(false);
  }

  async function share() {
    const url = shareUrl(sequence);
    try {
      await navigator.clipboard.writeText(url);
      setSaved(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  function openPreview() {
    try {
      sessionStorage.setItem("qre-sequence-preview", JSON.stringify(sequence));
    } catch {}
    window.open(shareUrl(sequence), "_blank", "noopener,noreferrer");
  }

  return (
    <main className="qreStudio">
      <style>{css}</style>

      <header className="studioNav">
        <button className="brand" onClick={() => navigate("/dashboard")}>QRE</button>
        <div className="navTitle">Create</div>
        <div className="navRight">
          <span className={saved ? "saved" : "quiet"}>{saved ? "Ready to share" : `${completed}/${sequence.screens.length}`}</span>
          <button className="shareButton" onClick={share}>Share</button>
        </div>
      </header>

      <section className="studioShell">
        <div className="editor">
          <div className="intro">
            <input
              className="titleInput"
              value={sequence.title}
              onChange={(event) => {
                setSequence((current) => ({ ...current, title: event.target.value }));
                setSaved(false);
              }}
              placeholder="Name this"
              aria-label="Sequence name"
            />
            <p>Make something worth watching.</p>
          </div>

          <div className="screenList">
            {sequence.screens.map((screen, index) => (
              <article
                className={`screenRow ${index === selected ? "selected" : ""}`}
                key={screen.id}
                onClick={() => {
                  setSelected(index);
                  setPlaying(false);
                }}
              >
                <div className="screenIndex">{String(index + 1).padStart(2, "0")}</div>
                <div className="screenBody">
                  <textarea
                    value={screen.text}
                    onChange={(event) => updateScreen(index, { text: event.target.value })}
                    placeholder={index === 0 ? "Start with what happened..." : "Keep going..."}
                    rows={2}
                    aria-label={`Screen ${index + 1}`}
                  />
                  {index === selected && (
                    <div className="screenTools" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => moveScreen(index, -1)} disabled={index === 0}>↑</button>
                      <button onClick={() => moveScreen(index, 1)} disabled={index === sequence.screens.length - 1}>↓</button>
                      <button onClick={() => duplicateScreen(index)}>Duplicate</button>
                      <button onClick={() => removeScreen(index)} disabled={sequence.screens.length <= 1}>Delete</button>
                      <label className="duration">
                        {((screen.duration / 1000).toFixed(1))}s
                        <input
                          type="range"
                          min="1000"
                          max="6000"
                          step="250"
                          value={screen.duration}
                          onChange={(event) => updateScreen(index, { duration: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <button className="addButton" onClick={() => addScreen()}>
            <span>＋</span> Add screen
          </button>
        </div>

        <aside className="previewArea">
          <div className="previewTop">
            <span>Preview</span>
            <button onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button>
          </div>

          <button className="phone" onClick={() => setPlaying((value) => !value)} aria-label="Play preview">
            <div className="phoneTop">
              <span>{sequence.title || "Untitled"}</span>
              <span>{selected + 1}/{sequence.screens.length}</span>
            </div>
            <div className="phoneStage">
              <div key={selectedScreen?.id} className="previewText">
                {selectedScreen?.text || "Your first screen appears here."}
              </div>
            </div>
            <div className="previewProgress">
              {sequence.screens.map((screen, index) => (
                <span key={screen.id} className={index === selected ? "active" : ""} />
              ))}
            </div>
            <div className="phoneHint">Tap to {playing ? "pause" : "play"}</div>
          </button>

          <div className="previewActions">
            <button onClick={openPreview}>Open full screen</button>
            <button className="primary" onClick={share}>Copy link</button>
          </div>
        </aside>
      </section>
    </main>
  );
}

const css = `
* { box-sizing: border-box; }
.qreStudio {
  min-height: 100dvh;
  background: #f7f7f5;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif;
  letter-spacing: -.012em;
}
.studioNav {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid rgba(0,0,0,.07);
  background: rgba(247,247,245,.82);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand, .shareButton, .studioNav button, .previewTop button, .previewActions button, .addButton, .screenTools button {
  font: inherit;
}
.brand {
  border: 0;
  background: none;
  font-size: 18px;
  font-weight: 750;
  padding: 0;
  cursor: pointer;
}
.navTitle { color: #777; font-size: 15px; }
.navRight { margin-left: auto; display: flex; align-items: center; gap: 13px; }
.quiet, .saved { font-size: 12px; color: #888; }
.saved { color: #188447; }
.shareButton {
  border: 0;
  background: #111;
  color: white;
  border-radius: 999px;
  padding: 9px 16px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.studioShell {
  width: min(1180px, 100%);
  margin: 0 auto;
  min-height: calc(100dvh - 64px);
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(340px, .88fr);
  gap: 56px;
  padding: 42px 28px 54px;
}
.editor { min-width: 0; }
.intro { padding: 8px 0 30px; }
.titleInput {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: clamp(38px, 5vw, 64px);
  font-weight: 650;
  letter-spacing: -.055em;
}
.titleInput::placeholder { color: #c3c3c0; }
.intro p { margin: 10px 0 0; color: #949490; font-size: 15px; }
.screenList { display: grid; gap: 7px; }
.screenRow {
  display: grid;
  grid-template-columns: 34px minmax(0,1fr);
  gap: 11px;
  padding: 18px 8px;
  border-bottom: 1px solid rgba(0,0,0,.08);
  transition: .18s ease;
}
.screenRow.selected { background: #fff; border-radius: 18px; padding-left: 14px; padding-right: 14px; box-shadow: 0 10px 35px rgba(0,0,0,.045); }
.screenIndex { color: #b0b0ac; font-size: 12px; padding-top: 6px; }
.screenBody { min-width: 0; }
.screenBody textarea {
  width: 100%;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: #111;
  font: inherit;
  font-size: 21px;
  line-height: 1.28;
  letter-spacing: -.025em;
}
.screenBody textarea::placeholder { color: #b5b5b1; }
.screenTools { display: flex; align-items: center; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.screenTools button { border: 0; background: #f0f0ed; color: #555; border-radius: 999px; padding: 7px 10px; font-size: 11px; cursor: pointer; }
.screenTools button:disabled { opacity: .28; cursor: default; }
.duration { margin-left: auto; color: #999; font-size: 11px; display: flex; align-items: center; gap: 8px; }
.duration input { accent-color: #111; width: 90px; }
.addButton {
  width: 100%;
  margin-top: 16px;
  border: 0;
  background: transparent;
  color: #777;
  padding: 15px 10px;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
}
.addButton span { font-size: 18px; color: #111; margin-right: 7px; }
.previewArea { position: sticky; top: 92px; align-self: start; }
.previewTop { display: flex; align-items: center; justify-content: space-between; padding: 0 8px 16px; color: #8b8b87; font-size: 13px; }
.previewTop button { border: 0; background: none; color: #111; font-size: 13px; cursor: pointer; }
.phone {
  width: min(100%, 400px);
  margin: 0 auto;
  aspect-ratio: 9 / 17.2;
  max-height: 690px;
  border: 0;
  border-radius: 38px;
  background: #090909;
  color: #fff;
  padding: 21px 21px 18px;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  box-shadow: 0 35px 90px rgba(0,0,0,.16);
  cursor: pointer;
}
.phoneTop { display: flex; justify-content: space-between; color: rgba(255,255,255,.45); font-size: 11px; text-align: left; }
.phoneStage { display: grid; place-items: center; padding: 30px; text-align: center; }
.previewText { font-size: clamp(27px, 4vw, 48px); line-height: 1.02; letter-spacing: -.055em; font-weight: 650; animation: qreIn .35s ease both; }
.previewProgress { display: flex; gap: 3px; }
.previewProgress span { height: 3px; flex: 1; background: rgba(255,255,255,.2); border-radius: 4px; }
.previewProgress span.active { background: #fff; }
.phoneHint { color: rgba(255,255,255,.3); font-size: 10px; text-align: center; padding-top: 13px; }
.previewActions { display: flex; gap: 9px; margin: 16px auto 0; width: min(100%,400px); }
.previewActions button { flex: 1; border: 0; background: #eaeae7; border-radius: 999px; padding: 12px; color: #333; cursor: pointer; font-size: 12px; font-weight: 600; }
.previewActions .primary { background: #111; color: #fff; }
@keyframes qreIn { from { opacity: 0; transform: translateY(7px) scale(.99); } to { opacity: 1; transform: none; } }
@media (max-width: 850px) {
  .studioNav { padding: 0 16px; }
  .studioShell { display: block; padding: 26px 16px 110px; }
  .previewArea { position: static; margin-top: 26px; }
  .previewTop { display: none; }
  .phone { width: min(100%, 430px); max-height: none; }
  .titleInput { font-size: 43px; }
  .screenBody textarea { font-size: 19px; }
  .screenRow { grid-template-columns: 28px minmax(0,1fr); }
  .duration { width: 100%; margin-left: 0; }
  .duration input { flex: 1; width: auto; }
}
@media (max-width: 480px) {
  .navTitle { display: none; }
  .quiet { display: none; }
  .shareButton { padding: 8px 14px; }
  .phone { border-radius: 31px; }
}
`;
