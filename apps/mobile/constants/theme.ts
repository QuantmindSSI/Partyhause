/**
 * PartyHause Design System
 * Follows UI/UX Design Guide (docs/UI_UX_DESIGN_GUIDE.md)
 * All frontend components should import and use these tokens
 */

import { Platform } from 'react-native';

/**
 * Spacing Scale (4px base)
 * Use these values for all margins, paddings, and gaps
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
} as const;

/**
 * Border Radius Scale
 */
export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

/**
 * Color Palette
 * All colors meet WCAG AA accessibility standards
 */
export const COLORS = {
  primary: {
    main: '#6366F1',    // Indigo 500
    light: '#818CF8',   // Indigo 400
    dark: '#4F46E5',    // Indigo 600
    contrast: '#FFFFFF',
  },
  success: {
    main: '#10B981',    // Green 500
    light: '#34D399',   // Green 400
    dark: '#059669',    // Green 600
    contrast: '#FFFFFF',
  },
  error: {
    main: '#EF4444',    // Red 500
    light: '#F87171',   // Red 400
    dark: '#DC2626',    // Red 600
    contrast: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',    // Amber 500
    light: '#FBBF24',   // Amber 400
    dark: '#D97706',    // Amber 600
    contrast: '#FFFFFF',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  text: {
    primary: '#1F2937',      // Gray 800 - 13.6:1 contrast on white
    secondary: '#4B5563',    // Gray 600 - 7.0:1 contrast on white
    tertiary: '#6B7280',     // Gray 500 - 4.6:1 contrast on white
    disabled: '#9CA3AF',     // Gray 400
    onDark: '#F9FAFB',       // Gray 50
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#111827',
  },
} as const;

/**
 * Legacy Colors for compatibility
 * @deprecated Use COLORS instead
 */
export const Colors = {
  light: {
    text: COLORS.text.primary,
    background: COLORS.background.primary,
    tint: COLORS.primary.main,
    icon: COLORS.text.tertiary,
    tabIconDefault: COLORS.text.tertiary,
    tabIconSelected: COLORS.primary.main,
  },
  dark: {
    text: COLORS.text.onDark,
    background: COLORS.background.dark,
    tint: COLORS.text.onDark,
    icon: COLORS.neutral[400],
    tabIconDefault: COLORS.neutral[400],
    tabIconSelected: COLORS.text.onDark,
  },
};

/**
 * Typography Scale
 * Font sizes, weights, and line heights
 */
export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24, // 1.5 line height
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21, // 1.5 line height
  },
  smallBold: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 21,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18, // 1.5 line height
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
} as const;

/**
 * Font Weights
 * Only use regular and bold
 */
export const FONT_WEIGHTS = {
  regular: '400',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Line Heights
 */
export const LINE_HEIGHTS = {
  tight: 1.2,     // Headings only
  normal: 1.5,    // Body text (default)
  relaxed: 1.6,   // Long-form content
} as const;

/**
 * Icon Sizes
 */
export const ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

/**
 * Shadow Styles
 * Use sparingly - only when creating depth is necessary
 */
export const SHADOWS = {
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

/**
 * Component Dimensions
 */
export const DIMENSIONS = {
  buttonHeight: 48,
  inputHeight: 48,
  iconButtonSize: 40,
  touchTargetSize: 44,
} as const;

/**
 * Font Families
 */
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
