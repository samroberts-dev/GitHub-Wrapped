"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GitHubReport } from "../../types/report";
import { publicProfileSchema } from "../../lib/validation/profile";

export function ProfilePreview({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [profile, setProfile] = useState<GitHubReport["profile"] | null>(null);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const requested = useRef(false);
  const mounted = useRef(true);
  const toggle = useRef<HTMLButtonElement>(null);
  const open = hovered || focused || pinned;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  async function load(retry = false) {
    if (requested.current && !retry) return;
    requested.current = true;
    setError("");
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 60_000);
    try {
      const endpoint = new URL(url);
      endpoint.pathname = "/api/wrapped";
      endpoint.searchParams.delete("theme");
      const response = await fetch(endpoint, { signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error("Profile lookup failed");
      const parsed = publicProfileSchema.safeParse(body.profile);
      if (!parsed.success) throw new Error("Invalid profile response");
      if (mounted.current) setProfile(parsed.data);
    } catch {
      if (!mounted.current) return;
      setError(
        "The profile could not load. You can retry or open GitHub directly.",
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }
  const username = new URL(url).searchParams.get("username") ?? "";
  const fallbackUrl = `https://github.com/${encodeURIComponent(username)}`;
  return (
    <div
      className="profile-preview"
      onMouseEnter={() => {
        setHovered(true);
        void load();
      }}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => {
        setFocused(true);
        void load();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          toggle.current?.focus();
          setPinned(false);
          setHovered(false);
          setFocused(false);
        }
      }}
    >
      <div className="profile-preview-stage">
        <div className={`profile-flip-inner${open ? " is-flipped" : ""}`}>
          <div className="profile-front" aria-hidden={open} inert={open}>
            {children}
          </div>
          <section
            className="profile-overlay"
            id="profile-preview"
            aria-label="GitHub profile preview"
            aria-hidden={!open}
            inert={!open}
          >
            <span className="eyebrow">BEHIND THE COMMITS</span>
            {profile ? (
              <>
                <div className="profile-identity">
                  <img
                    className="profile-avatar"
                    src={profile.avatarUrl}
                    alt={`${profile.login}’s GitHub avatar`}
                    width="80"
                    height="80"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                  <div>
                    <h3>{profile.name || profile.login}</h3>
                    <a href={profile.url} target="_blank" rel="noreferrer">
                      @{profile.login} ↗
                    </a>
                  </div>
                </div>
                <p className="profile-bio">
                  {profile.bio || "This developer hasn’t added a bio yet."}
                </p>
                <div className="profile-facts">
                  <span>
                    <b>{profile.publicRepositories.toLocaleString()}</b> public
                    repositories
                  </span>
                  <span>Joined {profile.createdAt.slice(0, 10)}</span>
                </div>
              </>
            ) : (
              <p aria-live="polite">{error || "Loading GitHub profile…"}</p>
            )}
            {error && (
              <button
                type="button"
                className="sample-link"
                onClick={() => void load(true)}
              >
                Retry profile →
              </button>
            )}
            <a
              className="profile-visit"
              href={profile?.url ?? fallbackUrl}
              target="_blank"
              rel="noreferrer"
            >
              View GitHub profile ↗
            </a>
          </section>
        </div>
      </div>
      <button
        ref={toggle}
        className="sample-link profile-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="profile-preview"
        onClick={() => {
          setPinned(!pinned);
          setHovered(false);
          setFocused(false);
          void load();
        }}
      >
        {pinned ? "Flip to stats" : "Flip to profile"} <span>↗</span>
      </button>
    </div>
  );
}
