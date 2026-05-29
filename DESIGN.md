# Design

The visual system for Sports Tracker. Read with [PRODUCT.md](PRODUCT.md). Strategy lives there; this file is how it looks. Tokens are defined in `constants/theme.ts` and consumed everywhere through `colors / spacing / typography / radius / shadows / sportThemes / motion`.

## Overview

A warm, light, premium operations app for tournament organizers. The identity is **espresso ink on warm paper, with terracotta as the single brand accent and the sport supplying recognition color**. Restraint is the default: surfaces are calm, borders are hairline, type carries hierarchy, and saturated color appears only where it means something (a sport, a status, the primary action). It should feel closer to a well-made consumer planner than an internal admin tool.

This replaces the previous soft-pastel-cream direction (lavender gradient buttons, pastel sport gradients, emoji chrome) and the inconsistent dark-navy `TeamModal`. One coherent light system, end to end.

## Color

OKLCH-reasoned, shipped as hex (React Native has no OKLCH runtime). Strategy: **Restrained** — tinted warm neutrals plus one accent, with the sport as a second deliberate layer.

### Neutrals (warm)
| Token | Hex | Role |
|---|---|---|
| `base` | `#F5F3EF` | App background. Warm paper, deliberately lighter and less yellow than the old cream. |
| `cardSurface` | `#FFFFFF` | Primary card / panel surface. |
| `cardElevated` | `#FFFCF8` | Subtly warm raised surface (headers, sheets). |
| `border` | `#E7E2D8` | Hairline borders and dividers. The premium upgrade — structure from line, not just shadow. |
| `borderStrong` | `#D9D2C5` | Focus rings, selected outlines, emphasis dividers. |
| `inputFill` | `#F1EEE7` | Resting form-field fill. |

### Ink (text) — all WCAG AA verified on `base` and `cardSurface`
| Token | Hex | Contrast on base | Use |
|---|---|---|---|
| `textPrimary` | `#211C16` | ~14:1 | Headings, values, body emphasis. |
| `textSecondary` | `#5C5349` | ~6.8:1 | Body, labels, supporting text. |
| `textTertiary` | `#71675A` | ~5.0:1 | Meta, captions, timestamps. Never lighter than this for text. |

### Brand & semantic
| Token | Hex | Role |
|---|---|---|
| `primary` | `#211C16` | Primary action fill (ink button). `onPrimary` = `#FBF8F2`. |
| `accent` / `primaryAccent` | `#C2410C` | Terracotta. Active state, selection, links, focus, key fills. ~4.7:1 on base, 5.2:1 white-on-accent. |
| `accentSoft` | `#FBEAE0` | Tinted accent background (selected chip, highlight). |
| `success` | `#1F8F4E` | Completed, positive. |
| `warning` | `#B26B00` | Ongoing, attention. |
| `danger` | `#B3261E` | Destructive, errors, cancelled. |
| `info` | `#2563A8` | Scheduled, neutral-informational. |

### Sport layer (recognition, not decoration)
Each sport carries a mature, saturated-but-not-neon accent, a `soft` tint for fills, and a `start`/`end` pair for the thin accent bar on cards. Used for wayfinding (which sport is this?), never sprayed across chrome.

| Sport | accent |
|---|---|
| Table tennis | `#E08A0B` amber |
| Tennis | `#4E7A1A` olive-lime |
| Badminton | `#0E8C9E` teal |
| Cricket | `#6D4ABF` violet |
| Football | `#1F8F4E` green |
| Pickleball | `#D95A2B` coral |

Status colors map to semantics: scheduled→info, ongoing→warning, completed→success, cancelled→danger, draft→neutral, published→info-tint. Each is a `{ bg, text }` pair with the text side AA on its tint.

## Typography

System font stack (SF Pro / Roboto). One family, hierarchy from size + weight. Fixed scale (product register — no fluid clamp). Ratio ~1.2.

| Token | Size / Weight / Line | Use |
|---|---|---|
| `hero` | 30 / 800 / 36, ls -0.5 | Screen-defining titles only. |
| `title` | 24 / 700 / 30, ls -0.3 | Screen titles. |
| `heading` | 20 / 700 / 26 | Section / card titles. |
| `subheading` | 16 / 600 / 22 | Card titles, group labels. |
| `body` | 15 / 400 / 22 | Body copy. |
| `bodyBold` | 15 / 600 / 22 | Emphasis, values. |
| `caption` | 13 / 400 / 18 | Labels, secondary. |
| `small` | 12 / 500 / 16 | Meta, badges. |
| `stat` | 28 / 800 / 32, ls -0.5 | Dashboard numbers. |

Hierarchy comes from weight contrast (400 ↔ 600/700/800) and the ink ramp, not from color. No all-caps body; uppercase reserved for short status/format badges with letter-spacing.

## Spacing, radius, elevation

- **Spacing** (4-base): xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32, huge 40. Vary for rhythm; don't pad everything to `lg`.
- **Radius**: sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 28, pill 999. Cards xl–xxl, controls lg, chips/badges pill.
- **Elevation**: soft, low-opacity warm shadows over hairline borders. `card` (ambient), `cardElevated`, `floating` (tab bar). Shadows are warm-tinted (`rgba(33,28,22,…)`), never gray. Prefer border + small shadow over heavy drop shadows.

## Components

Familiar affordances, executed precisely. Every interactive element defines default / pressed / disabled / loading; inputs add focus + error; selectable items add selected.

- **Button**: `primary` = solid ink fill, `onPrimary` text. `secondary` = surface + hairline border. `ghost` = text-only terracotta. `danger` = danger-tint. No gradients. Pressed = scale/opacity, not color swap.
- **Cards** (Event/Session): white surface, hairline border, thin sport accent bar at top, ambient shadow. Sport emoji allowed as *content* identity; chrome uses icons.
- **Badges**: status = tinted pill with AA text; format/sport = colored dot + neutral ink label (sidesteps tint-contrast traps, reads premium).
- **Inputs**: `inputFill` resting, white + terracotta border on focus, danger border + message on error.
- **Tab bar**: floating pill, lucide icons, terracotta active state with label, inactive ink-tertiary.
- **Empty states** teach the next action with a real button, not "nothing here."
- **Skeletons** for loading, not centered spinners inside content.

## Iconography

`lucide-react-native` for all UI chrome (tabs, headers, actions, list affordances) — consistent stroke icons replace decorative emoji. Sport **emoji are retained as content** (a sport's identity glyph on its card/chip), since they're recognizable and warm; they are never used as button/nav chrome.

## Motion

`motion` tokens: durations fast 150 / base 200 / slow 280 ms; easing `standard` (ease-out), `decelerate`. Product-paced: motion conveys state (press feedback, list/skeleton transitions, selection), never page-load choreography. List entrances may stagger subtly. All motion respects `prefers-reduced-motion` / `AccessibilityInfo.isReduceMotionEnabled` with an instant or crossfade fallback.

## Accessibility

- WCAG **AA**: body ≥4.5:1, large/icon ≥3:1. Text ink ramp is pre-verified; never set body text lighter than `textTertiary`.
- Touch targets ≥44pt; controls sized for courtside use.
- Reduced-motion honored everywhere animation exists.
- Color never the sole signal: status uses tint **and** label; sport uses accent **and** emoji/name.
