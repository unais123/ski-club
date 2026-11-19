# Instagram Reels — Live Feed Setup

The homepage and gallery "Latest from Instagram" sections can auto-show your
**5 most recent reels**, updating as you post. Until you connect a feed they
show the built-in fallback cards, so the site always looks complete.

## Why a feed service (and not "just fetch Instagram")?

This site is HTML/CSS/JS only, with no backend. Instagram has **no public
endpoint** for a profile's recent posts, and the official Meta Graph API needs
a secret access token that must never live in browser code. A feed service
holds that token on its side and gives you a safe, read-only JSON URL the site
can read. That's the only secure no-backend way to do this.

## Recommended: Behold.so (free, 2 minutes, supports reels)

1. Go to **https://behold.so** and sign up (free tier).
2. Connect your Instagram account (`@gulmargskiclub`). Instagram requires a
   Professional/Creator or Business account — switch in the Instagram app under
   *Settings → Account type* if needed (free, instant).
3. Behold gives you a **feed JSON URL** like `https://feeds.behold.so/XXXXXXXX`.
4. Open **`js/instagram-reels.js`** and paste it into `IG_CONFIG.feedUrl`:

   ```js
   const IG_CONFIG = {
     feedUrl: "https://feeds.behold.so/XXXXXXXX",
     handle:  "gulmargskiclub",
     limit:   5,
     reelsOnly: true,
   };
   ```

That's it. The homepage/gallery reels now show your latest 5 reels, each
linking to the post. Behold refreshes on its side, so new reels appear
automatically.

## Alternative: Meta Graph API

If you prefer Meta directly, create a long-lived Instagram Graph API token and
expose a media endpoint that returns JSON of shape
`{ "data": [ { media_type, media_url, thumbnail_url, permalink, caption, timestamp } ] }`,
then put that URL in `feedUrl`. **Note:** a raw Graph token in client-side JS is
public — only do this with a token-refreshing proxy/serverless function, which
is why Behold is recommended for a static site.

## Config reference (`js/instagram-reels.js`)

| Key | Meaning |
|-----|---------|
| `feedUrl` | Behold (or Graph) JSON URL. Empty = keep fallback cards. |
| `handle` | Your IG handle (no `@`) — sets the section label and follow links. |
| `limit` | How many recent reels to show (default 5). |
| `reelsOnly` | `true` shows only video/reels; falls back to latest posts if the feed flags none as video. |

The loader accepts both Behold and Graph JSON shapes, filters to reels, sorts
newest-first, and renders into any element marked `data-ig-reels` (the homepage
and gallery reel tracks). If the feed is unreachable it silently keeps the
fallback cards.
