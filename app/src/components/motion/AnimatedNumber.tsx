import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Animated count-up number, in the spirit of 21st.dev's Number Ticker:
 * eases from 0 (or previous value) to `value` on mount and change.
 * Null-safe: renders the placeholder when there is no honest value yet.
 * Respects prefers-reduced-motion (jumps to the final value).
 */
export function AnimatedNumber({
  value,
  placeholder = '—',
  duration = 800,
  className,
  suffix,
}: {
  value: number | null | undefined;
  placeholder?: string;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [display, setDisplay] = useState<number | null>(null);
  const previous = useRef<number | null>(null);

  useEffect(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      setDisplay(null);
      previous.current = null;
      return;
    }
    if (prefersReduced) {
      setDisplay(value);
      previous.current = value;
      return;
    }

    const from = previous.current ?? 0;
    previous.current = value;
    if (from === value) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic — confident arrival, no overshoot
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, prefersReduced]);

  if (display === null) {
    return <span className={cn('text-text-muted', className)}>{placeholder}</span>;
  }

  return (
    <span className={cn('tabular-nums', className)} aria-label={String(value)}>
      {display}
      {suffix}
    </span>
  );
}
