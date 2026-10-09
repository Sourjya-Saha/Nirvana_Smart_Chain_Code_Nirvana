import { Platform } from 'react-native';

export const ElevenTheme = {
  colors: {
    // Brand & Accent
    primary: '#292524',
    primaryActive: '#0c0a09',

    // Surface
    canvas: '#f5f5f5',
    canvasSoft: '#fafafa',
    canvasDeep: '#0c0a09',
    surfaceCard: '#ffffff',
    surfaceStrong: '#f0efed',
    surfaceDark: '#0c0a09',
    surfaceDarkElevated: '#1c1917',

    // Hairlines
    hairline: '#e7e5e4',
    hairlineSoft: '#f0efed',
    hairlineStrong: '#d6d3d1',

    // Text
    ink: '#0c0a09',
    body: '#4e4e4e',
    bodyStrong: '#292524',
    muted: '#777169',
    mutedSoft: '#a8a29e',
    onPrimary: '#ffffff',
    onDark: '#ffffff',
    onDarkSoft: '#a8a29e',

    // Atmospheric Gradient Stops (signature)
    gradientMint: '#a7e5d3',
    gradientPeach: '#f4c5a8',
    gradientLavender: '#c8b8e0',
    gradientSky: '#a8c8e8',
    gradientRose: '#e8b8c4',

    // Semantic
    semanticSuccess: '#16a34a',
    semanticError: '#dc2626',
  },
  rounded: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    pill: 9999,
    full: 9999,
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    base: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
    section: 96,
  },
  typography: {
    displayFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    bodyFamily: Platform.select({ ios: 'system-ui', android: 'sans-serif', default: 'sans-serif' }),
  }
};

const tintColorLight = '#292524';
const tintColorDark = '#ffffff';

export const Colors = {
  light: {
    text: '#0c0a09',
    background: '#f5f5f5',
    tint: tintColorLight,
    icon: '#777169',
    tabIconDefault: '#a8a29e',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ffffff',
    background: '#0c0a09',
    tint: tintColorDark,
    icon: '#a8a29e',
    tabIconDefault: '#777169',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Georgia',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'EB Garamond', Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
