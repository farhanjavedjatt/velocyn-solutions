# Liquid V — Hero Scroll-Scrub (Design Spec)

**Date:** 2026-05-24
**Status:** Approved (pending spec review)
**Owner:** Velocyn Solutions

## 1. Purpose

Replace the SVG line-art `HeroAnimation` in the Velocyn hero with a 3D
scroll-scrubbed video sequence ("Editorial Obsidian Liquid V") to give the
hero a distinctive, defensible "wow" moment without disturbing the rest of
the site's editorial-on-cream-paper aesthetic.

## 2. Constraints

- Must match the existing cream paper backdrop (`~#F4EDD6` family) and the
  navy ink palette (`#1D3461`). No environment HDRI bleed.
- Hero must remain interactive within the existing time-to-interactive
  budget. Total scrub asset payload ≤ 10 MB desktop, ≤ 3 MB mobile.
- Must degrade to a static poster frame under `prefers-reduced-motion`,
  on JS disabled, and on slow connections.
- Scoped surgically: only `Hero.jsx` and a new `HeroScrub.jsx` change.
  No restyling of sections below the hero.

## 3. User-facing behavior

- On hero scroll (within first viewport), a polished obsidian "V" sculpture
  drawn in 3D runs through a four-beat morph cycle, frame-locked to the
  user's scroll position.
- If the user stops scrolling, the V freezes at the current frame.
- Reverse scroll plays the morph backwards.
- The four beats:
  1. **Repose** (frames 1–30): V at rest, slow 8° rotation.
  2. **Trace** (frames 31–60): hairline navy chrome traces the V's
     perimeter.
  3. **Dissolve** (frames 61–90): V breaks into ~8 K obsidian flakes,
     slow vortex.
  4. **Reform & breathe** (frames 91–120): flakes reassemble; one soft
     inner-glow pulse radiates outward, then settles.

## 4. Composition

- The 3D V occupies the right two-thirds of the hero.
- The existing headline column (lead, `Software, shipped...` headline,
  CTAs) stays put on the left.
- The existing low-opacity drifting word-strips also stay (they layer
  below the V on z-axis).

## 5. Asset pipeline

```
Higgsfield Seedance 2.0           (3D render, 1920×1080 / 16:9, 5s @ 24fps, 120 frames)
        │
        ▼  MP4 download
ffmpeg -vf "fps=24,scale=1920:1080" -q:v 82  hero/desktop/frame_%04d.webp
ffmpeg -vf "fps=24,scale=960:540"   -q:v 82  hero/mobile/frame_%04d.webp
        │
        ▼
public/hero/desktop/frame_0001.webp … frame_0120.webp   (~60 KB ea, ≈7.2 MB)
public/hero/mobile/frame_0001.webp  … frame_0120.webp   (~22 KB ea, ≈2.6 MB)
public/hero/poster.webp                                 (frame 30, hi-q, ≈90 KB)
```

### 5.1 Higgsfield prompt (Seedance 2.0)

> A polished black obsidian sculpture in the shape of a stylized letter V
> with sharp serif foot caps, centered on a flat warm cream paper backdrop
> (#F4EDD6). Gallery lighting: single hard key light from upper-left, soft
> cream bounce from below.
>
> Beat 1 (0–1.25s): the V slowly rotates 8 degrees, almost still.
> Beat 2 (1.25–2.5s): a thin deep-navy chrome line traces around the V's
> silhouette like a draftsman's pen, completing once.
> Beat 3 (2.5–3.75s): the V breaks apart into approximately 8000 small
> flat obsidian flakes that swirl in a slow vortex, catching the key light
> as sparse occasional glints.
> Beat 4 (3.75–5s): the flakes reassemble into the same V, slightly
> sharper and more resolved than before, and a soft inner-glow pulse
> radiates outward exactly once before settling.
>
> Render style: editorial product photography, Cartier product film,
> Apple keynote product reveal. No camera shake. No chromatic aberration.
> No lens flare. The backdrop must stay flat cream paper throughout —
> no environment reflections, no HDRI gradients, no skybox.

CLI invocation: `higgsfield generate create seedance_2_0
--prompt "…" --aspect_ratio 16:9 --resolution 1080p --duration 5 --mode std --wait`.

### 5.2 Acceptance criteria for the rendered video

- Backdrop remains flat cream throughout (no environment bleed).
- All four beats are visually distinguishable.
- No camera shake / chromatic aberration / lens flare.
- V silhouette is recognizable in beats 1, 2, 4.
- Loop is seamless (last frame ≈ first frame).

If a generation fails any criterion, re-prompt up to two additional times,
adjusting the offending instruction. If still failing after three runs,
stop and surface the result to the user before spending more credits.

## 6. Implementation architecture

### 6.1 New component: `src/components/HeroScrub.jsx`

Client component. Props: `total` (frame count, default 120), `srcBase`
(e.g. `/hero/desktop`), `srcBaseSm` (e.g. `/hero/mobile`), `poster` (path
to poster). Owns:

- A `<canvas>` element, sized to its parent box via `ResizeObserver`,
  scaled by `devicePixelRatio`.
- A `useEffect` mount block that:
  1. Reads `window.matchMedia('(prefers-reduced-motion: reduce)')` —
     if reduced, draw poster once, return.
  2. Picks `srcBase` vs `srcBaseSm` from
     `window.innerWidth * window.devicePixelRatio`.
  3. Preloads frames 1–60 eagerly, 61–120 lazily once frame 30 paints.
  4. Sets up a GSAP `ScrollTrigger` against the parent `<section>` with
     `scrub: 0.4`, tweening a `proxy.frame` 0 → `total - 1`. The
     `onUpdate` handler draws `images[Math.floor(proxy.frame)]` into the
     canvas.
- A render method that emits the `<canvas>` plus a hidden `<img>` poster
  for non-JS fallback (`<noscript>` siblings).

### 6.2 Edit: `src/components/Hero.jsx`

Replace the `<HeroAnimation />` inside `.hero-backdrop` with
`<HeroScrub total={120} srcBase="/hero/desktop" srcBaseSm="/hero/mobile"
poster="/hero/poster.webp" />`. The existing `<HeroAnimation />` component
file is deleted along with `src/components/HeroAnimation.jsx`.

### 6.3 New dependency

`gsap` (^3.13.0). Imported in `HeroScrub.jsx`:

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```

GSAP 3.13+ is no-cost for commercial use under the standard GSAP license.

### 6.4 Styling

A small CSS addition to `globals.css`:

```css
.hero-scrub-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
.hero-scrub-poster {
  /* identical box; fades out once canvas is ready */
}
```

The existing `.hero-backdrop` rules are unchanged.

## 7. Performance budget

| Item                          | Desktop  | Mobile   |
|-------------------------------|----------|----------|
| Total frame payload           | ≤ 7.5 MB | ≤ 2.8 MB |
| Eager preload (frames 1–60)   | ≤ 3.8 MB | ≤ 1.4 MB |
| First contentful paint impact | none — poster ships as `<img fetchpriority="high">` |
| JS bundle delta (GSAP+ST)     | ≈ 40 KB gz |

## 8. Out of scope

- Reusing the V outside the hero (CTA bookend, etc.). Possible follow-up.
- Audio. The existing `useSceneWhoosh` is unchanged.
- Server-side video re-encoding. We commit pre-rendered frames to git LFS
  or just to `public/` (it's < 10 MB, plain git is fine).
- Variations per breakpoint other than desktop / mobile (no tablet ladder).

## 9. Risk & mitigation

- **Higgsfield may add environment bleed or chromatic aberration despite
  the prompt.** Mitigation: explicit negatives in the prompt; up to three
  generation attempts; if still bad, surface to user and ask for prompt
  tweaks rather than burning credits silently.
- **Mobile Safari may stutter scrubbing 120 frames.** Mitigation: the
  mobile ladder uses 960px frames (≈22 KB each, fully decoded in ~3 ms on
  modern A-series silicon). GSAP `scrub: 0.4` adds easing that hides
  drops.
- **Frame preload may delay interactivity on slow connections.**
  Mitigation: poster `<img>` is the very first thing painted; canvas
  upgrade is non-blocking. If frame 30 hasn't loaded after 6 s, abandon
  the canvas upgrade and keep the poster.

## 10. Files touched

```
A  src/components/HeroScrub.jsx
M  src/components/Hero.jsx
D  src/components/HeroAnimation.jsx
A  public/hero/desktop/frame_0001.webp … frame_0120.webp
A  public/hero/mobile/frame_0001.webp  … frame_0120.webp
A  public/hero/poster.webp
M  src/app/globals.css        (~20 lines added)
M  package.json               (+gsap dependency)
```
