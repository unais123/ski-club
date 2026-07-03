# Hero Image-Sequence Frames

Drop the 500 rendered hero frames into this folder, named exactly:

```
frame_0001.webp
frame_0002.webp
…
frame_0500.webp
```

- **Format:** WebP recommended (best size/quality). JPEG also works — change
  `ext: ".webp"` to `ext: ".jpg"` in `js/hero-sequence.js`.
- **Resolution:** 1920×1080 is the sweet spot. The canvas cover-fits any
  aspect ratio.
- **Compression:** target ≤ 60 KB per frame (quality 60–70 WebP). 500 frames
  at 60 KB ≈ 30 MB total; the loader streams them coarse-to-fine so the hero
  is scrubbable within a second or two.

No code changes are needed: `js/hero-sequence.js` probes for `frame_0001`
on page load. If found, the real sequence is used; if not, the built-in
procedural mountain flyover renders instead.
