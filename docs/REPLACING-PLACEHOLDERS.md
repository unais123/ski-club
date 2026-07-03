# Replacing Placeholder Assets

Every image on the site is currently a lightweight **SVG scene placeholder**
in `assets/images/`. Swap them for final photography without touching any
HTML by keeping the same filenames — or update the `src` attributes if you
prefer different names.

## 1. The image manifest

| File | Used for | Suggested final shot |
|------|----------|----------------------|
| `skiing.svg` | Skiing sections, hero cards | Skier carving powder, Apharwat behind |
| `snowboarding.svg` | Snowboarding pages | Rider spraying powder, blue sky |
| `heli-ski.svg` | Freeride / gallery | Deep powder action shot |
| `gondola.svg` | Gondola references | Gondola cabin above clouds |
| `apharwat.svg` | Apharwat summit trek | Summit ridge in summer |
| `great-lakes.svg` | KGL trek | Vishansar/Gangbal turquoise lake |
| `tarsar-marsar.svg` | Tarsar Marsar trek | Tarsar lake from the pass |
| `sunset-peak.svg` | Sunset Peak | Alpenglow ridgeline |
| `gurez.svg` | Gurez Valley | Log village + Habba Khatoon peak |
| `bangus.svg` | Bangus Valley | Rolling green meadow |
| `chatpal.svg` | Chatpal | Forest brook / hamlet |
| `daksum.svg` | Daksum | Bringhi river through deodars |
| `ladakh.svg` | Ladakh pages | High-pass road, barren peaks |
| `luxury-hotel.svg` | Stays / accommodation | 5★ resort in snow, warm lights |
| `luxury-tour.svg` | Luxury tour cards | Houseboat or lantern dinner |
| `tour-package.svg` | Classic packages | Gondola or Dal Lake shikara |
| `camping.svg` | Trek camps | Tents under stars |
| `drone.svg` | Aerial / map section | Drone shot of the valley |
| `winter-landscape.svg` | Winter scenics | Snow-laden pines, meadow |
| `mountain-lake.svg` | Lakes | Mirror-still alpine lake |
| `sunrise.svg` | Sunrise scenics | First light on summits |
| `about-hero.svg` | About page hero | Team or valley panorama |
| `gallery-hero.svg` | Gallery hero | Best action collage shot |
| `reviews-hero.svg` | Reviews hero | Happy guests on slope |
| `contact-hero.svg` | Contact hero | Meadow at dusk |

## 2. How to swap

1. Export final photos as **WebP or JPEG**, ~1600×1067 (3:2) or larger.
2. Either:
   - **Keep names:** save as e.g. `assets/images/skiing.webp` and find/replace
     `skiing.svg` → `skiing.webp` across the HTML files, **or**
   - **Same-name SVG→raster trick:** just replace the file contents keeping the
     `.svg` name is *not* recommended — use the find/replace route.
3. Keep the `alt` text (already descriptive) unless the new photo differs.
4. Preserve `loading="lazy"` and the `width`/`height` attributes (update the
   numbers to the real intrinsic size to keep zero layout shift).

## 3. Hero frames

See `assets/hero-frames/README.md`. Summary: drop `frame_0001.webp` …
`frame_0500.webp` into that folder — the site detects and uses them
automatically.

## 4. Other placeholders to finalise

- **Phone / email / address** in the footer, contact page and JSON-LD
  (`+91 99060 00000`, `hello@gulmargskiclub.com`) — search and replace.
- **Domain**: all canonical/OG/sitemap URLs use
  `https://www.gulmargskiclub.com/` — replace with the live domain.
- **Contact form**: `js/main.js` handles `form[data-demo]` with a friendly
  local confirmation. Point it at a real endpoint (Formspree, your backend,
  WhatsApp API) by replacing that handler.
- **Map**: contact page has a marked aerial-image placeholder for an
  embedded map.
- **Social links**: footer + JSON-LD `sameAs` point at
  `instagram/facebook/youtube.com/@gulmargskiclub` — update handles.
- **Review numbers**: ratings/counts on the homepage and reviews page are
  illustrative; sync with your live Google/TripAdvisor profiles.
