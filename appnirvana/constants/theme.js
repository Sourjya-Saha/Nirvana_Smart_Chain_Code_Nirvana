import { Platform } from 'react-native';

// ─── Apple iOS + Soft Skeuomorphic Design System ────────────────────────────
// Inspired by modern iOS tactile interfaces (Maison Neue typography,
// ultra-soft squircle edges, frosted glass highlights, and physical tactile depth).
// ────────────────────────────────────────────────────────────────────────────

const Theme = {
  colors: {
    // ── Primary Interactive (iOS Action Blue) ──────────────────────────────
    primary: '#0066cc',
    primaryFocus: '#0071e3',
    primaryOnDark: '#2997ff',
    primarySoft: '#eaf2ff',

    // ── Canvases & Ethereal Tints ───────────────────────────────────────────
    canvas: '#ffffff',
    canvasParchment: '#f5f5f7',
    surfacePearl: '#fafafc',
    surfaceGlass: 'rgba(255, 255, 255, 0.85)',
    surfaceGlassSubtle: 'rgba(255, 255, 255, 0.65)',
    dividerSoft: '#f0f0f2',
    hairline: '#e8e8ed',
    hairlineGlass: 'rgba(255, 255, 255, 0.8)',

    // ── Ethereal Aurora Gradients / Sheens (From Reference UI) ─────────────
    auroraBlue: '#e8f2fe',
    auroraLavender: '#ede9fe',
    auroraBlush: '#fce7f3',
    auroraPeach: '#fff1ec',
    auroraMint: '#eafbf3',
    auroraSky: '#e0f2fe',
    auroraMist: 'rgba(238, 245, 255, 0.75)',

    // ── Ink & Typography (Maison & Apple SF Pro) ──────────────────────────
    ink: '#0f172a',              // Deep, authoritative Grotesk ink
    inkMuted80: '#1e293b',
    inkMuted48: '#64748b',
    inkLight: '#94a3b8',
    bodyMuted: '#cbd5e1',

    // ── On-colour ──────────────────────────────────────────────────────────
    onPrimary: '#ffffff',
    onDark: '#ffffff',

    // ── Semantic Status (Calm, medical-grade) ──────────────────────────────
    success: '#10b981',
    successLight: '#ecfdf5',
    warning: '#f59e0b',
    warningLight: '#fffbeb',
    danger: '#ef4444',
    dangerLight: '#fef2f2',

    // ── Dark Accents (Zenvest / Track dock) ────────────────────────────────
    surfaceTile: '#111214',
    surfaceBlack: '#0a0a0c',

    // ── Compatibility Aliases ──────────────────────────────────────────────
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    textInverse: '#ffffff',
    white: '#ffffff',
    emerald: '#10b981',
    emeraldDeep: '#047857',
    emeraldLight: '#ecfdf5',
    emeraldBorder: '#a7f3d0',
    secondary: '#0066cc',
    secondaryLight: '#eaf2ff',
    indigoDepth: '#0066cc',
    warningAmber: '#f59e0b',
    warningBorder: '#fde68a',
    hazardCrimson: '#ef4444',
    hazardLight: '#fef2f2',
    hazardBorder: '#fecaca',
    darkPill: '#111214',
    primaryLight: '#eaf2ff',
    primaryBorder: '#bfdbfe',
    primaryDark: '#004fa3',
  },

  // ── Ultra-soft Squircles & Pill Radii ──────────────────────────────────────
  radius: {
    none: 0,
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 26,           // Main card squircle
    xxl: 32,          // Feature squircle
    pill: 9999,       // Pure iOS capsule
  },

  // ── Modern Skeuomorphic Elevation & Physical Depth ────────────────────────
  shadows: {
    // Soft embossed card (diffused ambient shadow + crisp white edge highlight)
    skeuoCard: Platform.select({
      ios: {
        shadowColor: '#0e1e38',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: { elevation: 3 },
      default: {},
    }),

    // Tactile floating button (physical pill elevation)
    skeuoButton: Platform.select({
      ios: {
        shadowColor: '#0066cc',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: { elevation: 4 },
      default: {},
    }),

    // Circular tactile action button (Zenvest / Track style)
    skeuoCircle: Platform.select({
      ios: {
        shadowColor: '#0e1e38',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),

    // Subtle product render shadow
    image: Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.16)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 28,
      },
      android: { elevation: 5 },
      default: {},
    }),

    card: Platform.select({
      ios: {
        shadowColor: '#0e1e38',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),

    floating: Platform.select({
      ios: {
        shadowColor: '#0e1e38',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: { elevation: 5 },
      default: {},
    }),

    cardHover: Platform.select({
      ios: {
        shadowColor: '#0e1e38',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
      default: {},
    }),

    primaryGlow: Platform.select({
      ios: {
        shadowColor: '#0066cc',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
      default: {},
    }),

    emeraldGlow: Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },

  // ── Inter Typography System (User-specified exact scale) ─────────────────
  // Reference:
  //   Headers:      display-sans-lg (40px/300/lh52), display-sans-md (32px/300/lh44)
  //   Sub-headers:  lead (24px/400/lh33.6), body (16px/400/lh22.4), body-loose (16px/300/lh24)
  //   Slight opacity applied on ink to give professional iOS fade feel.
  typography: {
    // ── Loaded font families (registered via useFonts in _layout.js)
    fontDisplay: 'Inter_300Light',    // weight 300 — for headers / display text
    fontBody: 'Inter_400Regular',     // weight 400 — for body / sub-text

    mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),

    // Tracking (letter spacing) — Inter prefers ls 0 for display
    tracking: {
      tightest: -0.4,
      tight: -0.2,
      normal: 0,
      wide: 0.3,
      caps: 0.8,
    },

    // Weight tokens
    weights: {
      light: '300',
      regular: '400',
      book: '400',
      medium: '500',
      semibold: '600',
      demi: '600',
      bold: '700',
      heavy: '800',
    },

    // ── Exact Inter type scale from reference images ─────────────────────

    // HEADER CHOICES
    // display-sans-lg · Inter · 40px / 300 / lh 52px / ls 0
    displayLg: {
      fontFamily: 'Inter_300Light',
      fontSize: 40,
      fontWeight: '300',
      lineHeight: 52,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.92)',
    },
    // display-sans-md · Inter · 32px / 300 / lh 44px / ls 0
    displayMd: {
      fontFamily: 'Inter_300Light',
      fontSize: 32,
      fontWeight: '300',
      lineHeight: 44,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.92)',
    },

    // SUB-HEADER / BODY CHOICES
    // lead · Inter · 24px / 400 / lh 33.6px / ls 0
    lead: {
      fontFamily: 'Inter_400Regular',
      fontSize: 24,
      fontWeight: '400',
      lineHeight: 33.6,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.88)',
    },
    // body · Inter · 16px / 400 / lh 22.4px / ls 0
    body: {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 22.4,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.88)',
    },
    // body-loose · Inter · 16px / weight 300 / lh 24px / ls 0
    bodyLoose: {
      fontFamily: 'Inter_300Light',
      fontSize: 16,
      fontWeight: '300',
      lineHeight: 24,
      letterSpacing: 0,
      color: 'rgba(100, 116, 139, 0.78)',
    },

    // ── Legacy iOS presets (kept for backward compat, now Inter-based) ────
    display: {
      fontFamily: 'Inter_300Light',
      fontSize: 32,
      fontWeight: '300',
      lineHeight: 44,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.92)',
    },
    title1: {
      fontFamily: 'Inter_400Regular',
      fontSize: 26,
      fontWeight: '400',
      lineHeight: 34,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.92)',
    },
    title2: {
      fontFamily: 'Inter_400Regular',
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 28,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.92)',
    },
    title3: {
      fontFamily: 'Inter_400Regular',
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.88)',
    },
    bodyMedium: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 21,
      letterSpacing: 0,
      color: 'rgba(15, 23, 42, 0.88)',
    },
    subhead: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      letterSpacing: 0,
      color: 'rgba(100, 116, 139, 0.78)',
    },
    caption: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0,
      color: 'rgba(100, 116, 139, 0.78)',
    },
    capsTag: {
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      fontWeight: '400',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: 'rgba(100, 116, 139, 0.65)',
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    section: 80,
  },
};

export default Theme;
export { Theme };
