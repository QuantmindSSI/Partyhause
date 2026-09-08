/**
 * The PartyHause mark: a house with the roof hinged open and confetti escaping.
 *
 * Inlined rather than loaded from `public/brand/partyhause-mark.svg` for two
 * reasons. It renders in the fixed navigation, which is above the fold on
 * every page, so an `<img>` would be a render-blocking round trip for under a
 * kilobyte of path data. And the house body has to flip between the dark
 * neutral and white depending on the surface it sits on, which an `<img>`
 * cannot do without shipping the file twice.
 *
 * Geometry is byte-identical to the committed SVG assets, so the favicon, the
 * app icon and this component cannot drift.
 */

export type BrandMarkTone = 'onLight' | 'onDark';

interface BrandMarkProps {
  /** Which surface the mark sits on. Decides the house-body fill only; the
   *  roof and confetti stay brand coral and magenta on both. */
  tone?: BrandMarkTone;
  /** Rendered size in pixels, applied to both axes. The artwork is a 48x48
   *  square viewBox and scales cleanly; below 20px the confetti dots stop
   *  being legible, so the nav uses 32. */
  size?: number;
  className?: string;
}

/** neutral-950 from the brand scale. The house body on light surfaces. */
const HOUSE_ON_LIGHT = '#26201D';

export function BrandMark({ tone = 'onLight', size = 32, className }: BrandMarkProps) {
  const houseFill = tone === 'onDark' ? '#FFFFFF' : HOUSE_ON_LIGHT;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="PartyHause"
      className={className}
    >
      {/* Roof, hinged open */}
      <path
        d="M 23.016 3.947 L 39.423 17.839 L 9.561 20.714 Z"
        fill="#FF5233"
        stroke="#FF5233"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* House body with a doorway punched out via fill-rule evenodd */}
      <path
        d="M 14.5 22.0 H 33.5 A 2.0 2.0 0 0 1 35.5 24.0 V 40.0 A 2.0 2.0 0 0 1 33.5 42.0 H 14.5 A 2.0 2.0 0 0 1 12.5 40.0 V 24.0 A 2.0 2.0 0 0 1 14.5 22.0 Z M 20.5 42.0 V 34.9 A 3.5 3.5 0 0 1 27.5 34.9 V 42.0 Z"
        fill={houseFill}
        fillRule="evenodd"
      />
      {/* Confetti */}
      <circle cx="41.0" cy="10.2" r="1.9" fill="#EC4699" />
      <circle cx="36.8" cy="4.4" r="1.25" fill="#FF7D66" />
      <circle cx="7.4" cy="12.4" r="1.55" fill="#EC4699" />
    </svg>
  );
}

export default BrandMark;
