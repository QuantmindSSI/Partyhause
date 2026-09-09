import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web variant of {@link useColorScheme}, narrowed to the two schemes the app
 * themes, matching the native implementation's signature.
 *
 * The hydration guard is the reason this variant exists: under static
 * rendering the server has no colour scheme to report, so the first client
 * render must match the server's output or React logs a hydration mismatch.
 * Returning 'light' until `useEffect` has run makes the first paint agree with
 * the server, then the real preference takes over.
 *
 * See the native file for why 'unspecified' is collapsed into 'light'.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme === 'dark' ? 'dark' : 'light';
  }

  return 'light';
}
