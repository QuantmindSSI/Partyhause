/**
 * PartyHause Professional Design System
 * Inspired by: Airbnb, Stripe, Linear, and Figma
 * Removes AI-style, default Expo patterns
 * Implements novel, professional UI patterns
 */

import { Platform } from 'react-native';

/**
 * TYPOGRAPHY SYSTEM
 * Custom font hierarchy with precise sizing
 */
export const Typography = {
  // Display - For hero sections
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
    letterSpacing: -1.5,
  },
  
  // Headings - Hierarchical scale
  h1: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  h5: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  
  // Body text
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  bodySemibold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  
  // Small text
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  smallMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  
  // Tiny text - labels, captions
  tiny: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  
  // Button text
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  
  // Caption
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
} as const;

/**
 * SPACING SYSTEM
 * 8px base unit for consistency (not 4px - more professional)
 */
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  xxxxl: 96,
  xxxxxl: 128,
} as const;

/**
 * BORDER RADIUS
 * Modern, subtle curves
 */
export const Radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const;

/**
 * COLOR PALETTE
 * Novel color system - not generic purple/blue
 * Inspired by: Stripe's subtle palette, Linear's vibrant accents
 */
export const Colors = {
  // Primary brand - Deep magenta/plum (unique, not generic purple)
  brand: {
    50: '#FDF4FF',
    100: '#FAE8FF',
    200: '#F5D0FE',
    300: '#F0ABFC',
    400: '#E879F9',
    500: '#D946EF',  // Main brand color
    600: '#C026D3',
    700: '#A21CAF',
    800: '#86198F',
    900: '#701A75',
  },
  
  // Accent - Vibrant coral/pink (for CTAs and highlights)
  accent: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',  // Main accent
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  
  // Success - Fresh teal (not generic green)
  success: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',  // Main success
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  
  // Warning - Warm amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Error - Bold red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Neutral - Warm grays (not cold blue-grays)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
    950: '#0C0A09',
  },
  
  // Semantic text colors
  text: {
    primary: '#1C1917',      // neutral-900
    secondary: '#57534E',    // neutral-600
    tertiary: '#78716C',     // neutral-500
    disabled: '#A8A29E',     // neutral-400
    inverse: '#FFFFFF',
    brand: '#A21CAF',        // brand-700
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAF9',
    tertiary: '#F5F5F4',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Border colors
  border: {
    light: '#F5F5F4',
    medium: '#E7E5E4',
    strong: '#D6D3D1',
    brand: '#E879F9',
  },
} as const;

/**
 * SHADOWS
 * Subtle, professional elevations (iOS-inspired)
 */
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

/**
 * ANIMATIONS
 * Timing values for consistent micro-interactions
 */
export const Animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  easing: {
    smooth: 'ease-in-out',
    bounce: 'spring',
  },
} as const;

/**
 * ICON SIZES
 * Standardized icon dimensions
 */
export const IconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
} as const;

/**
 * BUTTON VARIANTS
 * Pre-defined button styles
 */
export const ButtonVariants = {
  primary: {
    backgroundColor: Colors.brand[500],
    borderColor: Colors.brand[500],
    textColor: Colors.text.inverse,
  },
  
  secondary: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[300],
    textColor: Colors.text.primary,
  },
  
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: Colors.text.primary,
  },
  
  danger: {
    backgroundColor: Colors.error[500],
    borderColor: Colors.error[500],
    textColor: Colors.text.inverse,
  },
  
  success: {
    backgroundColor: Colors.success[500],
    borderColor: Colors.success[500],
    textColor: Colors.text.inverse,
  },
} as const;

/**
 * LAYOUT
 * Container and grid constants
 */
export const Layout = {
  containerPadding: Spacing.lg,
  maxContentWidth: 1200,
  gridGap: Spacing.md,
  sectionSpacing: Spacing.xxl,
} as const;

/**
 * BREAKPOINTS
 * Responsive design breakpoints
 */
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Z-INDEX LAYERS
 * Consistent stacking context
 */
export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
} as const;

export default {
  Typography,
  Spacing,
  Radius,
  Colors,
  Shadows,
  Animations,
  IconSizes,
  ButtonVariants,
  Layout,
  Breakpoints,
  ZIndex,
};
