import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * The active colour scheme, narrowed to the two the app actually themes.
 *
 * React Native 0.86 widened `ColorSchemeName` to
 * `'light' | 'dark' | 'unspecified' | null`. `'unspecified'` is what the
 * platform reports when the user has expressed no preference, and it is not a
 * key in `constants/theme.ts`, so every call site indexing `Colors[scheme]`
 * stopped type-checking at SDK 57.
 *
 * Narrowing here rather than at each call site is deliberate. All four
 * consumers already wrote `useColorScheme() ?? 'light'`, meaning they had
 * decided that "no preference" is light; that decision was just expressed four
 * times and only covered `null`. Returning the narrow union states it once and
 * makes the type honest about what the app supports.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
