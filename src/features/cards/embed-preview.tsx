"use client";
import { useState } from "react";
import { ProfilePreview } from "./profile-preview";

export function EmbedPreview({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const markdown = `![My GitHub Wrapped](${url})`;
  return (
    <section
      className="report-summary shell"
      aria-label="Your embeddable card"
      id="live-report"
      tabIndex={-1}
    >
      <div className="eyebrow">YOUR README. YOUR WRAPPED.</div>
      <h2>A little more you in your README.</h2>
      <p>
        Paste this Markdown into your GitHub profile README or a repository
        description that supports Markdown images.
      </p>
      {loading && (
        <p aria-live="polite">
          Loading your card. Available-history lookups may take up to a minute.
        </p>
      )}
      <div className="embed-preview">
        <ProfilePreview url={url}>
          <img
            src={url}
            alt="Your GitHub Wrapped card. Configuration or lookup errors appear inside the card."
            width="800"
            height="440"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setMessage(
                "The card could not load. Check your connection or deployment and try again.",
              );
            }}
          />
        </ProfilePreview>
      </div>
      <details className="grade-explainer">
        <summary>How the activity grade works</summary>
        <p>
          S ≥ 1,500 · A ≥ 750 · B ≥ 365 · C ≥ 150 · D ≥ 50 · E ≥ 1 · F = 0
          contributions per fetched year. All-time uses the average across
          fetched years; partial years count as-is. Missing or incomplete
          coverage receives no grade. This is a playful activity scale, not a
          measure of skill or a percentile of GitHub users.
        </p>
      </details>
      <label htmlFor="embed-markdown">Copy this Markdown</label>
      <textarea
        id="embed-markdown"
        readOnly
        value={markdown}
        rows={3}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        className="generate"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(markdown);
            setMessage("Markdown copied.");
          } catch {
            setMessage("Select the Markdown above and copy it manually.");
          }
        }}
      >
        Copy Markdown ↗
      </button>
      <p aria-live="polite">{message}</p>
      <p>
        For GitHub to load your card, use a publicly deployed HTTPS domain.
        Localhost is for previewing only. Cards refresh through caches; updates
        are not instant.
      </p>
      <p>
        GitHub’s short profile bio field does not render Markdown images. Put
        the card in your profile README instead.
      </p>
    </section>
  );
}
