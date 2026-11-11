import { cn } from '../../utils/helpers';

/**
 * Per-word soft blur reveal — the 21st.dev "Soft Blur In" keynote-style
 * hero entrance, implemented in pure CSS (no dependency). Splits text into
 * words, each fading in with a soft blur and gentle upward motion, capped
 * at a 340ms total stagger. Reduced-motion: simple 200ms fade.
 *
 * Optionally stamps ONE word in with `marker-loud marker-stamp` (the loud
 * accent word from the Signal palette) instead of the blur reveal — the
 * CD Baby "one loud word in an otherwise restrained headline" signature.
 */
export function BlurIn({
  text,
  className,
  stagger = 60,
  maxDelay = 340,
  highlightWord,
}: {
  text: string;
  className?: string;
  stagger?: number;
  maxDelay?: number;
  highlightWord?: string;
}) {
  const words = text.split(' ');
  return (
    <span className={cn('inline', className)} aria-label={text} role="text">
      {words.map((word, i) => {
        const isHighlight = highlightWord && word.toLowerCase() === highlightWord.toLowerCase();
        return (
          <span
            key={`${word}-${i}`}
            aria-hidden="true"
            className={cn(
              isHighlight ? 'marker-loud marker-stamp' : 'blur-in-word',
              isHighlight && 'text-loud-ink font-semibold'
            )}
            style={{ animationDelay: `${Math.min(i * stagger, maxDelay)}ms` }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
}
