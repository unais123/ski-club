# Gulmarg Ski Club — Website

A premium, cinematic website for **Gulmarg Ski Club**, India's premier ski
school and Himalayan adventure company. Built entirely with **HTML5, CSS3 and
vanilla JavaScript (ES6)** — no frameworks, no build step, no dependencies.

## Quick start

It's a static site. Serve the folder with any web server:

```bash
# Python
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from disk also works, but a local server is
recommended so the hero frame-probing and lazy loading behave like production.

## Project structure

```
├── index.html               Homepage (cinematic canvas hero)
├── about.html               Company story, values, team
├── skiing.html              Ski courses & pricing
├── snowboarding.html        Snowboard programmes
├── treks.html               4 treks (anchors: #great-lakes, #tarsar-marsar,
│                            #apharwat, #sunset-peak)
├── luxury-tours.html        Luxury Kashmir collection (#stays)
├── tour-packages.html       Classic Kashmir circuits
├── offbeat-tours.html       Gurez / Bangus / Chatpal / Daksum (anchored)
├── ladakh.html              Ladakh expeditions
├── gallery.html             Photo & reels gallery
├── reviews.html             Google / TripAdvisor reviews
├── contact.html             Booking enquiry form (#book)
├── robots.txt / sitemap.xml SEO
├── assets/
│   ├── logo.svg             Brand badge (recreated as vector)
│   ├── images/              SVG scene placeholders (swap with real photos)
│   └── hero-frames/         Drop the 500 hero sequence frames here (see its README)
├── css/
│   ├── base.css             Design tokens, reset, typography, buttons, layout
│   ├── components.css       Navbar, mega menu, mobile menu, cards, footer, FAQ, CTA
│   ├── animations.css       Scroll reveals, keyframes, snow/fog, magnetic, marquee
│   ├── home.css             Pinned hero + homepage sections
│   └── pages.css            Inner-page hero, itineraries, pricing, contact, reviews
├── js/
│   ├── hero-sequence.js     Canvas image-sequence engine (scroll-scrubbed,
│   │                        preloaded, with procedural fallback) + hero snow
│   └── main.js              Navbar, menus, reveals, counters, FAQ, magnetic
│                            buttons, cursor glow, parallax, forms
└── docs/
    └── REPLACING-PLACEHOLDERS.md   How to swap in final images & content
```

## The cinematic hero

The homepage hero is a **200vh pinned section**. A `position: sticky` stage
holds a `<canvas>`; scrolling scrubs through a 500-frame image sequence via
`requestAnimationFrame` with lerp smoothing (Apple-product-page style).

- Real frames go in `assets/hero-frames/` (`frame_0001.webp` … `frame_0500.webp`).
- Until they exist, a **procedural renderer** draws an equivalent cinematic
  mountain flyover, so the hero works out of the box.
- Extras layered on the canvas: snow particles, drifting fog, gradient overlay,
  parallax mountain silhouettes, scroll indicator and a live frame counter.

## Brand

| Token      | Value     |
|------------|-----------|
| Primary    | `#2A24C8` |
| Dark       | `#1815A5` |
| Navy       | `#10183E` |
| White      | `#FFFFFF` |
| Background | `#F7F8FC` |
| Accent     | `#EEF1FF` |

Typography: **Montserrat** (400–800) via Google Fonts.
All tokens live in `css/base.css` under `:root`.

## Performance & accessibility

- Lazy-loaded images with explicit `width`/`height` (no layout shift)
- GPU-composited animations (transform/opacity only), `prefers-reduced-motion`
  respected everywhere
- Semantic HTML, ARIA labels, skip link, keyboard-navigable menus and FAQ
- Per-page SEO: titles, descriptions, canonical, Open Graph, Twitter Cards,
  Schema.org (Organization, BreadcrumbList, FAQPage), `robots.txt`, `sitemap.xml`

## Replacing placeholder content

See **`docs/REPLACING-PLACEHOLDERS.md`** for the image swap guide, and
`assets/hero-frames/README.md` for hero frame specs.
