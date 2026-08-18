import { useState, useCallback, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  /** Optional element rendered when the image is missing or fails to load. */
  fallback?: React.ReactNode;
  /** Class applied to the fallback container (defaults to the img className). */
  fallbackClassName?: string;
}

/**
 * Hardened <img>:
 *  - null/empty sources render the fallback instead of a broken-image glyph
 *  - onerror swaps to the fallback exactly once (no error loops)
 *  - only http(s), blob and data:image/* sources are honored — anything else
 *    (javascript:, data:text/html, ...) renders the fallback
 *  - lazy-loaded and async-decoded by default
 */
export const SafeImage = ({
  src,
  alt,
  fallback,
  fallbackClassName,
  className,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: SafeImageProps) => {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => setFailed(true), []);

  const isSafeSrc =
    typeof src === 'string' &&
    src.length > 0 &&
    (/^https?:\/\//i.test(src) ||
      src.startsWith('/') ||
      src.startsWith('blob:') ||
      /^data:image\//i.test(src));

  if (!isSafeSrc || failed) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          fallbackClassName || className,
        )}
      >
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      {...rest}
    />
  );
};

export default SafeImage;
