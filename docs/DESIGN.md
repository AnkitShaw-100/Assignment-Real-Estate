# Niwas — Design System

Visual reference: `docs/reference/homepage-mockup.webp`. **The mockup wins any conflict with this file.**
Motion and interaction follow Apple's Human Interface principles: clarity, deference (UI steps back so the homes lead), depth through layering and physics-based motion.

---

## 1. Subject, audience, job

- **Subject:** high-end homes, sold by people who know them.
- **Website audience:** buyers and renters comparing homes on a phone at night or on a laptop at work. The site's job is to make the house the hero, then make asking about it effortless.
- **CRM audience:** agents working all day in the dashboard. Its job is to show what needs doing next. Dense, calm, fast.

The two surfaces share tokens but not temperament: the website is **editorial and spacious**, the CRM is **quiet and information-dense**.

---

## 2. Color

The palette is taken from the mockup and tuned for contrast.

| Token | Hex | Use |
|---|---|---|
| `navy-900` | `#0C1A3B` | Trust band, CTA band, footer, CRM sidebar, primary text on light |
| `navy-700` | `#1E2E57` | Hover on navy, secondary dark surfaces |
| `brass-400` | `#E8AD47` | The single accent: primary CTA, active arrow, badge, focus ring |
| `brass-500` | `#D49A33` | Brass hover/pressed |
| `brass-700` | `#94650F` | Brass **text** on white (prices): 5:1, passes AA at any size |
| `mist-100` | `#F2F3F5` | Section panels (story, testimonial, logo strip), CRM canvas |
| `paper` | `#FFFFFF` | Page background, cards in CRM |
| `slate-500` | `#5D6678` | Body copy, secondary text (AA on white and mist) |
| `line` | `#E3E5EA` | Hairlines, input borders, table rules |

Body text is `navy-900`, never a neutral near-black. Brass appears **only on things you can act on** (buttons, arrows, the badge, focus) plus prices. That keeps it meaningful.

**CRM status colors** (soft background + strong text, never used decoratively):
| Stage | bg / text |
|---|---|
| New | `#EEF2FF` / `#3949AB` |
| Contacted | `#E8F4FD` / `#1769AA` |
| Qualified | `#F3EEFC` / `#6B3FA0` |
| Site visit | `#FFF6E5` / `#9A6200` |
| Negotiation | `#FDEFE7` / `#B04A12` |
| Won | `#E9F7EF` / `#1E7B45` |
| Lost | `#F4F4F5` / `#6B6B73` |
Priority: high `#C2410C`, medium `#9A6200`, low `#5D6678`.

Dark mode: CRM only, phase 2 if time allows (tokens are CSS variables so it is a swap, not a rewrite).

---

## 3. Typography

| Role | Family | Settings |
|---|---|---|
| Display / headings | **SF Pro Display** via `-apple-system`, falling back to **Inter** | weight 600, tracking −0.022em. Apple-style headlines |
| UI / body / numbers | **SF Pro Text** via `-apple-system`, falling back to **Inter** | 400 / 500 / 600; `font-variant-numeric: tabular-nums` for prices and stats |

Why: SF Pro's license allows use only on Apple platforms, so it can't be served as a web font. The system stack renders real SF Pro on macOS/iOS. Everywhere else, Inter (Google Fonts, variable with `opsz`) is the closest free match.

**Scale** (1.25 ratio; display sizes clamp fluidly):
| Token | Size / line-height | Font |
|---|---|---|
| `display` | clamp(44px, 6vw, 88px) / 0.98, tracking −0.02em | Display 600 |
| `h1` | clamp(34px, 4vw, 52px) / 1.05, −0.015em | Display 600 |
| `h2` | clamp(28px, 3vw, 40px) / 1.1 | Display 600 |
| `h3` | 22px / 1.25 | Display 600 |
| `lead` | 18px / 1.6 | Sans 400 |
| `body` | 16px / 1.6 | Sans 400 |
| `small` | 14px / 1.5 | Sans 400/500 |
| `micro` | 12px / 1.4 | Sans 500 |

Rules:
- Sentence case everywhere. **No all-caps labels, no eyebrow text above headings**, no single-word color/italic accents in headlines.
- Measure ≤ 68ch for body copy.
- Prices: Sans 600, tabular, `brass-700` on white cards; navy in tables.
- CRM headings use the display face only for the page title. Everything else in the CRM is Sans.

---

## 4. Layout

- Container: max 1240px, gutters 20px (mobile) / 32px (tablet) / 48px (desktop).
- 12-column grid, 24px gap. Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Section rhythm on the website: 96–128px vertical on desktop, 64px on mobile.
- Alignment: **left-aligned** content; only the trust band and testimonial heading are centered (as in the mockup).

**Radius hierarchy** (size signals importance; not one radius everywhere):
| Element | Radius |
|---|---|
| Hero frame, navy bands | 32px |
| Section panels (story, testimonial) | 20px |
| Property images / cards | 14px |
| Inputs, small buttons | 12px |
| Primary CTAs, search pill, chips | 999px (pill) |
| Badge, arrow buttons, avatars | circle |

**Depth:** mostly flat tonal surfaces (paper on mist), as the mockup does. Shadows are reserved for things that **float above content**: the glass nav, the search pill, dropdowns, drawers, a card while dragged.
`--shadow-float: 0 1px 2px rgba(12,26,59,.06), 0 12px 32px -8px rgba(12,26,59,.18)`

### Home wireframe (desktop)
```
┌──────────────────────────────────────────────┐
│ [hero image, 32r frame]                      │
│ Niwas            About Projects Sell Prop [Get in touch]
│ Discover                                     │
│ heavenly                                     │
│ homes                       (◎ Lake Como… [Search]) │
├──────────────────────────────────────────────┤
│ mist strip: monaco delaware amsterdam ...    │
├──────────────────────────────────────────────┤
│ [photo]◐badge   │  Our story of excellence   │ ← mist panel
├──────────────────────────────────────────────┤
│ Popular listings                     (‹)(›)  │
│ [text+img expanded card][img][img][img]→     │
├──────────────────────────────────────────────┤
│ ██ navy: We build trust through numbers ██   │
│ ██ $500M+ │ 1,200+ │ 30+ │ 98%           ██   │
├──────────────────────────────────────────────┤
│ Featured homes                       (‹)(›)  │
│ [img][img][img][img]                         │
├──────────────────────────────────────────────┤
│ mist: What our clients say   "quote" (◯photo)│
├──────────────────────────────────────────────┤
│ ██ navy image: ◐badge  Let's find your home ██│
│ ██ footer: brand │ links │ properties │ social│
└──────────────────────────────────────────────┘
```
Mobile: hero headline stacks, search pill goes full-width under it, carousels become swipeable with scroll-snap, the trust stats become a 2×2 grid, and footer columns stack.

### CRM shell
```
┌────────┬─────────────────────────────────────┐
│ navy   │ Page title (display)   [search][+] │
│ sidebar│─────────────────────────────────────│
│ Niwas  │ mist canvas                         │
│ ○ Home │ ┌white┐┌white┐┌white┐┌white┐  KPIs  │
│ ○ Leads│ └─────┘└─────┘└─────┘└─────┘        │
│ ○ Pipe │ ┌ chart ───────────┐┌ today ──┐     │
│ ○ Cust │ └──────────────────┘└─────────┘     │
│ ○ Tasks│                                     │
│ ○ Props│                                     │
│ ○ Team │                                     │
│ [user] │                                     │
└────────┴─────────────────────────────────────┘
```
White cards on mist with a 1px `line` border, no shadow. Sidebar collapses to icons at < 1280px and becomes a bottom sheet menu on mobile. Tables become stacked cards below 768px.

---

## 5. Motion (Apple principles)

Motion explains change. It is never decoration. Animate **transform and opacity only** (GPU, 60fps). Everything respects `prefers-reduced-motion` (fades only, no movement).

**Curves & durations**
| Token | Value | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances, reveals |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Page/route crossfades |
| `spring-ui` | `{ type:"spring", stiffness: 400, damping: 32 }` | Buttons, toggles, drawers, chips |
| `spring-soft` | `{ type:"spring", stiffness: 180, damping: 26 }` | Carousels, shared-element transitions |
| `fast` / `base` / `slow` | 160 / 280 / 600 ms | micro / UI / hero |

**The one orchestrated moment: hero load**
1. The hero image starts at scale 1.08 and settles to 1 over 1.4s (ease-out), like a camera finishing focus.
2. Headline lines rise 24px and unblur, staggered 90ms.
3. Nav and search pill fade in last (+300ms).
Nothing else on the page auto-animates on load.

**Signature detail: the badge.** The circular "Explore properties" text ring rotates slowly (20s per turn, linear) and pauses on hover while the chevrons nudge right. It's the brand's memorable element and appears twice (story + CTA band).

**Scroll.** Each section's image does a single soft clip reveal (inset 6% → 0, 700ms) the first time it enters the viewport. Text does **not** fade up per section. The trust numbers count up once when visible (1.2s, ease-out).

**Response to touch (where most motion lives)**
- Press: buttons and cards scale to 0.97 with `spring-ui`; release springs back.
- Hover (pointer devices only): property images zoom 1.04 over 600ms inside a fixed frame; arrows fill brass.
- Carousel: drag/swipe with momentum (`spring-soft`), snap to card; arrow buttons disable at the ends.
- **Shared-element transition:** a listing card image morphs into the detail-page hero (`layoutId`). This is the key "Apple" moment of navigation.
- Nav: transparent over the hero, then a frosted glass bar once scrolled (`backdrop-filter: blur(20px) saturate(180%)`, `rgba(255,255,255,.72)`), and hides on scroll down / shows on scroll up.
- Drawers/sheets slide from their edge with `spring-ui`; the backdrop fades to `rgba(12,26,59,.32)`.
- Kanban: the lifted card tilts 2°, gains `shadow-float` and scales 1.02; the drop settles with a spring.
- Toasts: bottom-center on mobile, bottom-right on desktop; slide + fade, auto-dismiss 4s.
- Route change: 200ms crossfade; dashboard content keeps the sidebar static.

---

## 6. Components (key specs)

- **Button / primary**: pill, brass-400 bg, navy-900 text, 44px tall (touch target), 0 20px padding, Sans 600 14px. Hover brass-500. Focus: 2px brass ring + 2px offset.
- **Button / secondary**: pill, 1px `line` border, navy text; on dark backgrounds a white 20% border with white text.
- **Arrow button**: 40px circle; disabled = `line` border, navy at 40%; active = brass fill.
- **Search pill**: white, `shadow-float`, location icon + input + navy "Search" button inside; on the listings page it expands into the full filter bar.
- **Property card**: image 4:3 at 14r, then title (display 600 18px) and price (Sans 600 brass). Location and facts (beds, baths, sqft) with Lucide icons, `slate-500` small. Heart button on the image's top-right (glass circle).
- **Expanded feature card** (popular listings): mist panel holding title, blurb, price, three location lines, with the image to its right.
- **Inputs**: 44px, 12r, `line` border; focus = brass ring. Labels above, 14px 500. Errors in `#B42318` below the field, saying what's wrong and how to fix it.
- **Badge (status)**: 24px pill, stage colors from §2, Sans 500 12px, sentence case.
- **KPI card**: white, label (small, slate), value (Sans 600 32px tabular), delta chip (green/red with arrow icon).
- **Table**: 52px rows, `line` row dividers, sticky header on mist, row hover mist; actions in a trailing menu.
- **Empty state**: one line saying what's missing plus one action ("No leads yet. Add a lead").
- **Skeleton**: mist blocks with a soft 1.6s shimmer (none under reduced motion).

Icons: **Lucide** at 1.5px stroke, 18/20px.

---

## 7. Imagery

- Real house photography only (Unsplash seed; Cloudinary uploads). Daylight exteriors for the hero, interiors on detail pages.
- Always `object-fit: cover` with a fixed aspect ratio (hero 16:9 desktop / 4:5 mobile; cards 4:3; avatars 1:1).
- Delivered via `f_auto,q_auto,w_<size>` with `srcset`. Lazy everywhere except the hero (eager, `fetchpriority="high"`).
- Partner logos: monochrome navy at 70% opacity, 100% on hover.

---

## 8. Voice & copy

Plain, warm, specific. Sentence case. Active verbs on buttons ("Send inquiry", "Add property", "Mark as won"); the toast echoes the verb ("Inquiry sent", "Property added").
Errors say what happened and what to do ("We couldn't reach the server. Check your connection and try again.").
No "Submit", no "Click here", no exclamation marks in the CRM.

Hero copy stays from the mockup: **"Discover heavenly homes"**.

---

## 9. Design review against the brief

The first-pass defaults I rejected, and why:
- **Playfair Display + Inter** (the default "luxury" pairing) → **SF Pro (system) + Inter fallback**: Apple-style clarity at no licensing cost.
- **Identical rounded cards with soft grey shadows everywhere** → flat tonal panels plus a radius hierarchy. Shadows are kept only for floating layers, as in the mockup.
- **Fade-up on every section** → a single hero load sequence, one image clip reveal per section, and motion otherwise only in response to the user.
- **Gold used decoratively** → brass is reserved for actionable elements and prices, so it always means "you can do something here".
- **Uppercase eyebrow labels above headings** → removed; the mockup doesn't use them.

## 10. Accessibility floor
- Contrast AA for all text; small brass text uses `brass-700`, never `brass-400/500`.
- Visible focus ring on every interactive element; logical tab order; skip link.
- Carousels: arrow buttons + keyboard arrows + `aria-roledescription="carousel"`; kanban via dnd-kit keyboard sensor.
- Touch targets ≥ 44px. Form errors are linked with `aria-describedby`.
- `prefers-reduced-motion`: disable movement, keep opacity transitions ≤ 150ms, stop badge rotation.
