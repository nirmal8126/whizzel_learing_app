import { Platform, type TextStyle, type ViewStyle } from 'react-native';

// ─── Color palette (refined for modern kid app) ─────────────────────
export const Colors = {
  // Backgrounds — soft, warm, slightly muted
  bgPrimary: '#FAF7F2',
  bgAccent1: '#FEF1E2',
  bgAccent2: '#E8EFFC',
  bgAccent3: '#EFE8FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5F2',

  // Text
  textPrimary: '#1A1B2E',
  textSecondary: '#5A5C7A',
  textMuted: '#9B9DB5',
  textInverse: '#FFFFFF',

  // Brand
  primary: '#7B61FF',
  primaryDark: '#5B3FE0',
  primaryLight: '#EFEAFF',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#065F46',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerDark: '#991B1B',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  info: '#0EA5E9',
  infoLight: '#E0F2FE',

  // UI structural
  border: '#E8E6F0',
  borderFocus: '#C4B5FD',
  divider: '#F0EEF7',
  white: '#FFFFFF',
  slate100: '#F4F2F8',
  slate200: '#E8E6F0',
  slate300: '#CBC9D9',

  // Backwards compat (used in older screens)
  bgWhite: '#FFFFFF',
};

// ─── Spacing scale (4-point) ────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// ─── Radii ──────────────────────────────────────────────────────────
export const Radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

// ─── Font families (loaded in app/_layout.tsx) ──────────────────────
export const Fonts = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
};

// ─── Type scale ─────────────────────────────────────────────────────
export const Type: Record<string, TextStyle> = {
  h1:        { fontFamily: Fonts.bold,     fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: Colors.textPrimary },
  h2:        { fontFamily: Fonts.bold,     fontSize: 26, lineHeight: 32, letterSpacing: -0.3, color: Colors.textPrimary },
  h3:        { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 26, color: Colors.textPrimary },
  h4:        { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 22, color: Colors.textPrimary },
  body:      { fontFamily: Fonts.regular,  fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
  bodyBold:  { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
  small:     { fontFamily: Fonts.regular,  fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  smallBold: { fontFamily: Fonts.semibold, fontSize: 13, lineHeight: 18, color: Colors.textPrimary },
  caption:   { fontFamily: Fonts.medium,   fontSize: 11, lineHeight: 14, color: Colors.textMuted },
  label:     { fontFamily: Fonts.semibold, fontSize: 11, lineHeight: 14, color: Colors.textMuted, letterSpacing: 1 },
  button:    { fontFamily: Fonts.semibold, fontSize: 16, lineHeight: 20, color: Colors.textInverse },
};

// ─── Shadows (tuned for soft modern depth) ──────────────────────────
export const Shadows: Record<'sm' | 'md' | 'lg' | 'xl', ViewStyle> = {
  sm: Platform.select({
    ios: { shadowColor: '#0F0A2A', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    default: { elevation: 1 },
  })!,
  md: Platform.select({
    ios: { shadowColor: '#0F0A2A', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
    default: { elevation: 3 },
  })!,
  lg: Platform.select({
    ios: { shadowColor: '#0F0A2A', shadowOpacity: 0.10, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
    default: { elevation: 6 },
  })!,
  xl: Platform.select({
    ios: { shadowColor: '#0F0A2A', shadowOpacity: 0.14, shadowRadius: 32, shadowOffset: { width: 0, height: 12 } },
    default: { elevation: 10 },
  })!,
};

// ─── Background gradient palette (consistent across screens) ────────
export const BgGradient = {
  warm: [Colors.bgPrimary, Colors.bgAccent1, Colors.bgAccent2, Colors.bgAccent3] as const,
  warmStops: [0, 0.3, 0.7, 1] as const,
};
