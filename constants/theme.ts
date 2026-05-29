/**
 * Sports Tracker design system — warm, light, premium.
 *
 * Identity: espresso ink on warm paper, terracotta as the single brand accent,
 * the sport supplying recognition color. See DESIGN.md for the rationale.
 *
 * All ink colors are WCAG AA verified against `base` and `cardSurface`.
 * Legacy token keys are preserved so every existing screen keeps working;
 * new tokens (primary, accent, border, semantic states, motion) are added on top.
 */

// ─── Color ──────────────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds / surfaces (warm neutrals)
  base: '#F5F3EF',            // App background — warm paper, lighter & less yellow than old cream
  cardSurface: '#FFFFFF',     // Primary card / panel surface
  cardElevated: '#FFFCF8',    // Subtly warm raised surface (headers, sheets)

  // Structure
  border: '#E7E2D8',          // Hairline borders & dividers
  borderStrong: '#D9D2C5',    // Selected outlines, emphasis dividers
  divider: '#ECE8E0',         // Soft inline separators

  // Text (AA verified — never set body text lighter than textTertiary)
  textPrimary: '#211C16',     // ~14:1 on base — headings, values
  textSecondary: '#5C5349',   // ~6.8:1 on base — body, labels
  textTertiary: '#71675A',    // ~5.0:1 on base — meta, captions

  // Inverse (text on dark / accent fills)
  textInverse: '#FBF8F2',
  textInverseMuted: 'rgba(251, 248, 242, 0.72)',

  // Warm shadows (never gray)
  shadow: 'rgba(33, 28, 22, 0.07)',
  shadowMedium: 'rgba(33, 28, 22, 0.10)',
  shadowStrong: 'rgba(33, 28, 22, 0.14)',

  // Inputs
  inputFill: '#F1EEE7',
  inputFocusBorder: '#C2410C',   // terracotta focus
  inputBorder: '#E2DCD1',

  // Brand
  primary: '#211C16',          // Primary action fill (ink)
  onPrimary: '#FBF8F2',        // Text on primary
  primaryAccent: '#C2410C',    // Terracotta — active, selection, links, focus
  accent: '#C2410C',
  accentSoft: '#FBEAE0',       // Tinted accent background
  accentInk: '#9A330A',        // Deeper terracotta for text-on-soft

  // Primary gradient (kept for any remaining gradient consumer; tasteful terracotta)
  primaryGradient: {
    start: '#D9582B',
    end: '#C2410C',
  },

  // Semantic
  success: '#1F8F4E',
  warning: '#B26B00',
  danger: '#B3261E',
  info: '#2563A8',

  // Sport layer — accent (saturated, mature), soft (tint bg), start/end (accent bar)
  sport: {
    tableTennis: { start: '#F2A93C', end: '#E0890A', accent: '#E08A0B', soft: '#FBEFD8' },
    tennis:      { start: '#7CA82E', end: '#4E7A1A', accent: '#4E7A1A', soft: '#EEF3DF' },
    badminton:   { start: '#1BA9BC', end: '#0E8C9E', accent: '#0E8C9E', soft: '#DCF1F4' },
    cricket:     { start: '#8160D6', end: '#6D4ABF', accent: '#6D4ABF', soft: '#ECE5FA' },
    football:    { start: '#2BA85F', end: '#1F8F4E', accent: '#1F8F4E', soft: '#DEF2E6' },
    pickleball:  { start: '#E87A3C', end: '#D95A2B', accent: '#D95A2B', soft: '#FBE7DD' },
  },

  // Status — { bg tint, text } with AA text on its own tint
  status: {
    scheduled: { bg: '#E3ECF6', text: '#2C5A8C' },
    ongoing:   { bg: '#F8EAD2', text: '#8A5200' },
    completed: { bg: '#DCF0E4', text: '#19713E' },
    cancelled: { bg: '#F6E0DE', text: '#8E211B' },
    draft:     { bg: '#ECE8E0', text: '#5C5349' },
    published: { bg: '#DEEEF5', text: '#1F5E84' },
  },
};

// ─── Spacing (4-base) ─────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// ─── Radius ────────────────────────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 999,
};

// ─── Typography (system font, fixed scale ~1.2 ratio) ───────────────────────────
export const typography = {
  hero: {
    fontSize: 30,
    fontWeight: '800' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  stat: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
};

// ─── Elevation (warm, soft) ──────────────────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─── Motion ──────────────────────────────────────────────────────────────────
export const motion = {
  duration: {
    fast: 150,
    base: 200,
    slow: 280,
  },
  // Reanimated/Easing-friendly cubic-bezier control points (ease-out family)
  easing: {
    standard: [0.2, 0.0, 0.0, 1.0] as const,
    decelerate: [0.05, 0.7, 0.1, 1.0] as const,
  },
  press: {
    scale: 0.97,
    opacity: 0.9,
  },
};

// ─── Sport metadata (consumed via theme) ────────────────────────────────────
export const sportThemes = {
  table_tennis: { emoji: '🏓', label: 'Table Tennis', ...colors.sport.tableTennis },
  tennis:       { emoji: '🎾', label: 'Tennis',        ...colors.sport.tennis },
  badminton:    { emoji: '🏸', label: 'Badminton',     ...colors.sport.badminton },
  cricket:      { emoji: '🏏', label: 'Cricket',        ...colors.sport.cricket },
  football:     { emoji: '⚽', label: 'Football',       ...colors.sport.football },
  pickleball:   { emoji: '🥒', label: 'Pickleball',     ...colors.sport.pickleball },
};
