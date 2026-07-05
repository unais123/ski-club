# Hero Image-Sequence Frames

This folder holds the homepage hero scroll sequence — **500 frames**, currently
named:

```
0001.jpg
0002.jpg
…
0500.jpg
```

The hero engine (`js/hero-sequence.js`) is configured for exactly this:

```js
frameCount: 500,
path: (i) => `assets/hero-frames/${String(i).padStart(4, "0")}${CONFIG.ext}`,
ext: ".jpg",
```

## Replacing or re-exporting frames

- Keep the `0001.jpg … 0500.jpg` naming and the count at 500 — or update
  `frameCount` / `path` / `ext` in `js/hero-sequence.js` to match.
- On load the engine probes `0001.jpg`; if present it preloads all frames
  coarse-to-fine (every 10th frame first so scrubbing works within a second or
  two, then the gaps fill in).
- If the frames are ever missing, the hero falls back automatically — first to
  the static photo `assets/images/hero_winter_mountain.jpg` (set via
  `CONFIG.poster`), then to a procedural mountain scene.

## Performance note

The current frames are 4K (3840×2160) JPEGs, ~150–260 KB each — roughly
90–120 MB for the full set. That works, but for the fastest possible load you
can down-res the frames to ~1920×1080 and re-encode at quality ~70 (or convert
to WebP and set `ext: ".webp"`), which typically cuts the total to ~25–40 MB
with no visible loss at hero size.
