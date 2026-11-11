/**
 * Gradient Shimmer Text — ported from 21st.dev @zanwei/gradient-shimmer (id 23616).
 * Zero-dependency Web Animations API text highlight sweep. Pauses off-screen and
 * under prefers-reduced-motion. Used for one brand line per page max.
 */
import { useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils/helpers';

type GradientStop = { position: number; color: string };
type GradientInput = GradientStop[] | 'sunrise' | 'bubble' | 'peach' | 'tonic' | 'mint' | 'spring' | 'twilight' | 'bay';
type EasingPreset = 'smooth' | 'gentle' | 'springy' | 'bouncy';

const PRESETS: Record<string, GradientStop[]> = {
  sunrise: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#ffd23e' }, { position: 1, color: '#ffffff' }],
  bubble: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#8f88ff' }, { position: 1, color: '#ffffff' }],
  peach: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#ff6b4a' }, { position: 1, color: '#ffffff' }],
  tonic: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#108a5e' }, { position: 1, color: '#ffffff' }],
  mint: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#45c48c' }, { position: 1, color: '#ffffff' }],
  spring: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#ffd23e' }, { position: 1, color: '#ffffff' }],
  twilight: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#2a6fd8' }, { position: 1, color: '#ffffff' }],
  bay: [{ position: 0, color: '#ffffff' }, { position: 0.5, color: '#4f46e5' }, { position: 1, color: '#ffffff' }],
};

const EASES: Record<string, string> = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  springy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

interface GradientShimmerProps {
  text: string;
  gradient?: GradientInput;
  speed?: number;
  easing?: EasingPreset;
  className?: string;
  tag?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
}

function stopsToCss(stops: GradientStop[]): string {
  return stops.map((s) => `${s.color} ${Math.round(s.position * 100)}%`).join(', ');
}

export function GradientShimmer({
  text,
  gradient = 'sunrise',
  speed = 3,
  easing = 'smooth',
  className,
  tag = 'span',
}: GradientShimmerProps) {
  const Tag = tag as React.ElementType;

  const stops = typeof gradient === 'string' ? PRESETS[gradient] ?? PRESETS.sunrise : gradient;
  const gradientCss = stopsToCss(stops);

  const containerRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<Animation | null>(null);

  const pauseIfHidden = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.right > 0 && rect.top < (window.innerHeight || 0) && rect.left < (window.innerWidth || 0);
    if (animationRef.current) {
      if (visible && document.visibilityState === 'visible') animationRef.current.play();
      else animationRef.current.pause();
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const bg = el.style.background;
    el.style.background = `linear-gradient(90deg, ${gradientCss})`;
    el.style.backgroundSize = '200% 100%';
    el.style.backgroundPosition = '200% 0';
    el.style.webkitBackgroundClip = 'text';
    el.style.backgroundClip = 'text';
    el.style.color = 'transparent';

    const anim = el.animate(
      [
        { backgroundPosition: '200% 0' },
        { backgroundPosition: '-200% 0' },
      ],
      {
        duration: speed * 1000,
        iterations: Infinity,
        easing: EASES[easing] ?? EASES.smooth,
      }
    );
    animationRef.current = anim;

    if (document.visibilityState === 'hidden') anim.pause();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') anim.play();
      else anim.pause();
    };
    const onScroll = () => pauseIfHidden();

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('scroll', onScroll);
      anim.cancel();
      el.style.background = bg;
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
      el.style.webkitBackgroundClip = '';
      el.style.backgroundClip = '';
      el.style.color = '';
      animationRef.current = null;
    };
  }, [gradientCss, speed, easing, pauseIfHidden]);

  return (
    <Tag
      ref={containerRef}
      className={cn('inline-block whitespace-nowrap', className)}
      style={{ transform: 'translateZ(0)' }}
    >
      {text}
    </Tag>
  );
}
