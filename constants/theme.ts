export const colors = {
  background: '#0D0B0A',
  surface: '#1A1612',
  card: '#241E18',
  border: '#3D3228',
  gold: '#C9A84C',
  goldLight: '#E8C97A',
  parchment: '#F2E8D5',
  parchmentMuted: '#A89880',
  red: '#8B2020',
  green: '#4A7C59',
  blue: '#2D5A7A',
  elvish: '#7AB8B0',
  overlay: 'rgba(13, 11, 10, 0.85)',
  cardHover: '#2E2620',
} as const;

export const typography = {
  // Size scale
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,

  // Weight names mapped to numeric strings for RN
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
