import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Marquee — continuous CSS ticker. The track is duplicated `repeat` times and
 * each copy is translated by its own width + gap, so the loop is seamless with
 * no JS and no layout thrash. Motion lives in `styles/globals.css` under
 * `--animate-marquee`; it is disabled for `prefers-reduced-motion`.
 *
 * Copies after the first are aria-hidden so screen readers hear the content
 * once. Set `fade` to feather both ends with a mask.
 */
export interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Animate right-to-left (true) or left-to-right (false). */
  reverse?: boolean;
  /** Freeze the track while the pointer is over it. */
  pauseOnHover?: boolean;
  /** Stack copies vertically instead of horizontally. */
  vertical?: boolean;
  /** Number of duplicated tracks — needs to be enough to fill the viewport. */
  repeat?: number;
  /** Animation duration, any CSS time value. */
  duration?: string;
  /** Distance between chips in the track. */
  gap?: string;
  /** Feather the leading/trailing edges. */
  fade?: boolean;
}

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  vertical = false,
  repeat = 3,
  duration = '45s',
  gap = '0.75rem',
  fade = false,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden',
        vertical ? 'flex-col' : 'flex-row',
        fade && 'marquee-fade',
        className
      )}
      style={
        {
          '--duration': duration,
          '--gap': gap,
        } as CSSProperties
      }
    >
      {Array.from({ length: repeat }).map((_, index) => (
        <div
          key={index}
          aria-hidden={index > 0 ? true : undefined}
          className={cn(
            'flex shrink-0 items-center justify-around [gap:var(--gap)]',
            vertical ? 'animate-marquee-vertical flex-col' : 'animate-marquee flex-row',
            reverse && '[animation-direction:reverse]',
            pauseOnHover && 'group-hover:[animation-play-state:paused]'
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
