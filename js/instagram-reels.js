/* ==========================================================================
   Gulmarg Ski Club — instagram-reels.js
   Auto-populates the "reels" sections with the latest reels from Instagram.

   WHY A FEED URL?
   ---------------
   A static site (HTML/CSS/JS only) cannot securely read an Instagram account's
   recent posts: there is no public endpoint, and the Meta Graph API requires a
   secret token that must never sit in client-side code. The safe, no-backend
   approach is a feed service that holds the token on its side and exposes a
   read-only JSON URL. We recommend Behold.so (free, supports reels). See
   docs/INSTAGRAM-REELS.md for 2-minute setup. Meta Graph API also works.

   Until CONFIG.feedUrl is set, the existing static reel cards remain as a
   graceful fallback.
   ========================================================================== */

(() => {
  "use strict";

  const IG_CONFIG = {
    // Paste your Behold.so feed JSON URL (or a Graph API media endpoint) here:
    feedUrl: "",                    // e.g. "https://feeds.behold.so/XXXXXXXX"
    handle: "gulmargskiclub",       // your Instagram handle (no @) — used for links
    limit: 5,                       // show this many most-recent reels
    reelsOnly: true,                // prefer video/reels; fall back to latest if none
  };

  /* ------------------------------------------------ update "follow" links */
  function updateHandleLinks() {
    const url = `https://www.instagram.com/${IG_CONFIG.handle}/`;
    document.querySelectorAll("[data-ig-follow]").forEach((a) => {
      a.href = url; a.target = "_blank"; a.rel = "noopener";
    });
    document.querySelectorAll("[data-ig-handle-label]").forEach((el) => {
      el.textContent = "@" + IG_CONFIG.handle;
    });
  }

  /* ---------------------------------------------- normalise a feed record */
  function normalise(it) {
    const type = (it.mediaType || it.media_type || it.type || "").toString().toUpperCase();
    const thumb =
      it.thumbnailUrl || it.thumbnail_url ||
      (it.sizes && ((it.sizes.medium && it.sizes.medium.mediaUrl) ||
                    (it.sizes.small && it.sizes.small.mediaUrl) ||
                    (it.sizes.full && it.sizes.full.mediaUrl))) ||
      it.mediaUrl || it.media_url || it.thumbnail || "";
    return {
      type,
      permalink: it.permalink || it.url || "#",
      caption: (it.caption || it.prunedCaption || "").toString(),
      thumb,
      ts: it.timestamp || it.takenAt || it.created_time || 0,
    };
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* ------------------------------------------------------- render a track */
  function renderTrack(track, items) {
    track.innerHTML = items.map((r) => {
      const cap = r.caption ? esc(r.caption.replace(/\s+/g, " ").trim().slice(0, 70)) +
        (r.caption.length > 70 ? "…" : "") : "Watch on Instagram";
      const img = r.thumb
        ? `<img src="${esc(r.thumb)}" alt="Instagram reel — ${cap}" loading="lazy" width="720" height="1280">`
        : `<img src="assets/images/heli-ski.svg" alt="Instagram reel" loading="lazy" width="720" height="1280">`;
      return `<figure class="reel">
        <a class="reel__cover" href="${esc(r.permalink)}" target="_blank" rel="noopener" aria-label="Open reel on Instagram"></a>
        ${img}
        <span class="reel__play" aria-hidden="true"><span>▶</span></span>
        <figcaption>${cap}</figcaption>
      </figure>`;
    }).join("");
  }

  /* -------------------------------------------------------------- fetch */
  async function loadReels() {
    updateHandleLinks();
    const tracks = document.querySelectorAll("[data-ig-reels]");
    if (!tracks.length) return;
    if (!IG_CONFIG.feedUrl || IG_CONFIG.feedUrl.startsWith("YOUR_") || IG_CONFIG.feedUrl === "") {
      return; // not configured — keep the static fallback cards
    }
    try {
      const res = await fetch(IG_CONFIG.feedUrl, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("feed HTTP " + res.status);
      const json = await res.json();
      let list = Array.isArray(json) ? json : (json.media || json.data || json.posts || []);
      list = list.map(normalise).filter((r) => r.thumb);
      if (IG_CONFIG.reelsOnly) {
        const vids = list.filter((r) => r.type.includes("VIDEO") || r.type.includes("REEL"));
        if (vids.length) list = vids;
      }
      // newest first (feeds usually are, but sort defensively when we have timestamps)
      list.sort((a, b) => (new Date(b.ts).getTime() || 0) - (new Date(a.ts).getTime() || 0));
      const items = list.slice(0, IG_CONFIG.limit);
      if (!items.length) return; // keep fallback
      tracks.forEach((t) => renderTrack(t, items));
    } catch (err) {
      // Network/config error — keep the static fallback silently.
      console.warn("[reels] Instagram feed unavailable, using fallback:", err.message);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadReels);
  else loadReels();
})();
