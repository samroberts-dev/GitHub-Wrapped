"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { reportRequestSchema } from "@/lib/validation/report";
import { themes, type ThemeId } from "@/themes";
import { EmbedPreview } from "../cards/embed-preview";

const sample = [
  {
    eyebrow: "01 / THE BIG PICTURE",
    title: "Small commits.\nBig energy.",
    value: "1,284",
    label: "sample contributions",
    detail: "Every little push adds up to something worth celebrating.",
  },
  {
    eyebrow: "02 / KEEPING THE FIRE ALIVE",
    title: "You kept\nshowing up.",
    value: "32 days",
    label: "sample longest streak",
    detail:
      "One day at a time. One idea at a time. That’s how things get built.",
  },
  {
    eyebrow: "03 / YOUR DEVELOPER DNA",
    title: "The Consistent\nDeveloper.",
    value: "🔥",
    label: "sample personality",
    detail:
      "An illustrative personality. Real assignments and transparent rules arrive in the analytics milestone.",
  },
];

export function Landing() {
  const currentYear = new Date().getUTCFullYear();
  const [mode, setMode] = useState<"yearly" | "all-time">("yearly");
  const [year, setYear] = useState(currentYear - 1);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [cardTheme, setCardTheme] = useState<ThemeId>("default");
  const [slide, setSlide] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemeId>("default");
  const reduced = useReducedMotion();
  const active = slide === null ? null : sample[slide];
  const sampleOpen = slide !== null;
  useEffect(() => {
    if (!sampleOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const background = document.querySelectorAll<HTMLElement>(
      "body > header, body > main, body > footer",
    );
    background.forEach((element) => {
      element.inert = true;
    });
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      background.forEach((element) => {
        element.inert = false;
      });
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [sampleOpen]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = reportRequestSchema(currentYear).safeParse({
      username,
      mode,
      year,
    });
    if (!result.success) {
      setMessage(result.error.issues[0].message);
      return;
    }
    const params = new URLSearchParams({
      username: result.data.username,
      mode: result.data.mode,
      theme: cardTheme,
    });
    if (result.data.mode === "yearly")
      params.set("year", String(result.data.year));
    setEmbedUrl(`${window.location.origin}/api/card?${params}`);
    setMessage(
      "Your card URL and Markdown are ready below. The preview loads from the API.",
    );
  }

  useEffect(() => {
    if (embedUrl)
      document.getElementById("live-report")?.focus({ preventScroll: false });
  }, [embedUrl]);

  return (
    <>
      <header className="nav shell">
        <a href="#" className="brand" aria-label="GitHub Wrapped home">
          <span className="brand-icon">↗</span> github
          <span className="brand-light">wrapped</span>
          <span className="beta">BETA</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#community" className="nav-community">
            Built by the community <span>↗</span>
          </a>
        </nav>
      </header>

      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> A YEAR OF BUILDING. A STORY WORTH
              TELLING.
            </div>
            <h1>
              Your code.
              <br />
              Your journey.
              <br />
              <span>Your Wrapped.</span>
              <i>✳</i>
            </h1>
            <p className="intro">
              The late nights. The first pull request. The “it finally works.”
              <br className="desktop-break" /> Turn your GitHub activity into a
              card for your GitHub profile README.
            </p>
            <form onSubmit={submit} noValidate className="generator">
              <div
                className="mode-switch"
                role="group"
                aria-label="Report period"
              >
                <button
                  type="button"
                  aria-pressed={mode === "yearly"}
                  onClick={() => setMode("yearly")}
                >
                  Year in review <span>↗</span>
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "all-time"}
                  onClick={() => setMode("all-time")}
                >
                  All-time journey <span>∞</span>
                </button>
              </div>
              <label htmlFor="username">YOUR GITHUB USERNAME</label>
              <div className="input-row">
                <div className="username-input">
                  <span aria-hidden="true">@</span>
                  <input
                    id="username"
                    autoComplete="username"
                    placeholder="e.g. octocat"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-describedby="form-message"
                  />
                </div>
                {mode === "yearly" && (
                  <select
                    aria-label="Year"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {Array.from(
                      { length: currentYear - 2007 },
                      (_, i) => currentYear - i,
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                        {y === currentYear ? " · so far" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <label className="theme-label">
                Card theme{" "}
                <select
                  value={cardTheme}
                  onChange={(e) => setCardTheme(e.target.value as ThemeId)}
                >
                  {Object.entries(themes).map(([id, value]) => (
                    <option key={id} value={id}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="generate" type="submit">
                Generate my card <span>↗</span>
              </button>
              <p
                id="form-message"
                className={message ? "form-message" : "privacy"}
                role="status"
              >
                {message ||
                  "No sign-up. No fuss. Just your public GitHub story."}
              </p>
            </form>
            <button className="sample-link" onClick={() => setSlide(0)}>
              Take a peek at a sample <span>→</span>
            </button>
          </div>

          <div
            className="hero-art"
            aria-label="Illustrative Wrapped card with sample data"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-spark spark-one">✳</span>
            <span className="art-spark spark-two">✦</span>
            <div className="floating-tag">
              git commit -m &quot;what a year&quot; <span>↵</span>
            </div>
            <motion.div
              className="wrapped-card"
              initial={reduced ? false : { opacity: 0, rotate: 0, y: 20 }}
              animate={{ opacity: 1, rotate: -7, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="card-top">
                <span>↗ githubwrapped</span>
                <span>{year} ↗</span>
              </div>
              <div className="card-title">
                A little code.
                <br />A lot of <em>you.</em>
              </div>
              <div className="card-flower" aria-hidden="true">
                ✳
              </div>
              <div className="card-number">
                1,284<span>contributions. countless possibilities.</span>
              </div>
              <div className="heatmap" aria-hidden="true">
                {Array.from({ length: 112 }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      opacity: [0.18, 0.35, 0.65, 1, 0.45][
                        (i * 7 + Math.floor(i / 9)) % 5
                      ],
                    }}
                  />
                ))}
              </div>
              <div className="card-bottom">
                <span>ILLUSTRATIVE SAMPLE</span>
                <span>✦</span>
              </div>
            </motion.div>
            <div className="streak-tag">
              <span>🔥</span>
              <div>
                On a roll.<small>32-day sample streak</small>
              </div>
              <b>↗</b>
            </div>
            <div className="sample-caption">
              ILLUSTRATIVE PREVIEW · NOT LIVE GITHUB DATA
            </div>
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <span>EVERY COMMIT COUNTS</span> ✳{" "}
          <span>BUILT DIFFERENT. WRAPPED TOGETHER.</span> ✳{" "}
          <span>YOUR YEAR, IN CODE</span> ✳ <span>EVERY COMMIT COUNTS</span>
        </div>

        {embedUrl && <EmbedPreview key={embedUrl} url={embedUrl} />}
        <section className="story-section shell" id="how-it-works">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ONE URL. YOUR GITHUB STORY.</div>
              <h2>Made for your README.</h2>
            </div>
            <p>
              Turn your public activity into an embeddable card.
              <br />
              Pick your period, choose your colors, and make it yours.
            </p>
          </div>
          <div className="features">
            <article>
              <span className="feature-icon sky">↗</span>
              <span className="feature-index">01</span>
              <h3>Build your card.</h3>
              <p>
                Contributions, commits, pull requests, and issues. Choose a year
                or explore the history GitHub makes available.
              </p>
            </article>
            <article>
              <span className="feature-icon green">✳</span>
              <span className="feature-index">02</span>
              <h3>Find your colors.</h3>
              <p>
                Wrapped Default, Midnight, or Sunset. Pick a theme that feels at
                home on your profile.
              </p>
            </article>
            <article>
              <span className="feature-icon mint">∞</span>
              <span className="feature-index">03</span>
              <h3>Paste. Push. Wrapped.</h3>
              <p>
                Copy a line of Markdown into your profile README. Your card
                loads from the API and refreshes through its caches.
              </p>
            </article>
          </div>
        </section>
        <section className="community shell" id="community">
          <div className="community-symbol">{"</>"}</div>
          <div>
            <div className="eyebrow">OPEN SOURCE. OPEN POSSIBILITIES.</div>
            <h2>
              Made for developers.
              <br />
              Built by people like you.
            </h2>
            <p>
              Bring a theme. Build an insight. Fix your first bug.
              <br />
              There’s room for your next contribution here.
            </p>
          </div>
          <a
            href="https://github.com/samroberts-dev/GitHub-Wrapped"
            target="_blank"
            rel="noreferrer"
            className="community-link"
          >
            Contribute on GitHub ↗
            <small>Themes, ideas, and first contributions welcome.</small>
          </a>
        </section>
      </main>
      <footer className="shell">
        <a className="brand" href="#">
          ↗ github<span className="brand-light">wrapped</span>
        </a>
        <span>Your code. Your journey. Your year.</span>
        <span>Independent & open source · MIT licensed</span>
      </footer>

      <AnimatePresence>
        {active && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="Sample Wrapped"
              className="sample-modal"
              style={
                {
                  background: themes[theme].background,
                  "--sample-accent": themes[theme].accent,
                } as React.CSSProperties
              }
              onKeyDown={(e) => {
                if (e.key === "Escape") setSlide(null);
                if (e.key === "Tab") {
                  const controls =
                    e.currentTarget.querySelectorAll<HTMLElement>(
                      "button:not(:disabled), select",
                    );
                  const first = controls[0],
                    last = controls[controls.length - 1];
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                  }
                  if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                  }
                }
              }}
            >
              <button
                autoFocus
                className="close"
                aria-label="Close sample"
                onClick={() => setSlide(null)}
              >
                ✕
              </button>
              <span className="eyebrow">
                ILLUSTRATIVE SAMPLE · NO LIVE DATA
              </span>
              <div className="progress">
                {sample.map((_, i) => (
                  <span key={i} className={i <= (slide ?? 0) ? "filled" : ""} />
                ))}
              </div>
              <p>{active.eyebrow}</p>
              <h2>{active.title}</h2>
              <strong>{active.value}</strong>
              <span>{active.label}</span>
              <p>{active.detail}</p>
              <div className="sample-controls">
                <button
                  disabled={slide === 0}
                  onClick={() => setSlide((s) => (s ?? 0) - 1)}
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    slide === sample.length - 1
                      ? setSlide(null)
                      : setSlide((s) => (s ?? 0) + 1)
                  }
                >
                  {slide === sample.length - 1 ? "Finish ↗" : "Next →"}
                </button>
              </div>
              <label className="theme-label">
                Sample theme{" "}
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as ThemeId)}
                >
                  {Object.entries(themes).map(([id, t]) => (
                    <option key={id} value={id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
