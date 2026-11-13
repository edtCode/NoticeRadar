import { cn } from '../../utils/helpers';

const TILE_SIZES = {
  sm: 'h-7 w-7 rounded-md',
  md: 'h-9 w-9 rounded-lg',
  lg: 'h-12 w-12 rounded-xl',
} as const;

const MARK_SIZES = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

const WORDMARK_SIZES = {
  sm: 'text-body',
  md: 'text-h3',
  lg: 'text-h2',
} as const;

type LogoSize = keyof typeof TILE_SIZES;

type LogoProps = {
  size?: LogoSize;
  /** Hide the "Oppora" wordmark and render only the mark. */
  markOnly?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

/**
 * Oppora brand mark. The logo artwork is forest green, so it sits on a warm
 * sand tile to stay legible on the dark canvas.
 */
export function OpporaMark({ size = 'md', className }: { size?: LogoSize; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-ink shadow-[2px_2px_0_rgba(0,0,0,0.28)]',
        TILE_SIZES[size],
        className
      )}
    >
      <img
        src="/oppora-mark.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn('select-none', MARK_SIZES[size])}
      />
    </span>
  );
}

export function OpporaLogo({
  size = 'md',
  markOnly = false,
  className,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <OpporaMark size={size} />
      {!markOnly && (
        <span
          className={cn(
            'font-display font-bold tracking-[-0.03em] text-text',
            WORDMARK_SIZES[size],
            wordmarkClassName
          )}
        >
          Oppora
        </span>
      )}
    </span>
  );
}