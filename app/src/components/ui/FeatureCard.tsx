"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../utils/helpers';

/**
 * FeatureCard — inspired by 21st.dev "Feature Grid Spotlight Cards" (id 26797).
 * Warm-tinted top glow per card, radial spotlight that follows the pointer on hover,
 * corner crosshair marks, staggered entrance. Different color per card.
 * Reduced-motion safe: spotlight is static, hover is lift-only.
 */
export interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: 'lime' | 'sand' | 'olive' | 'taupe';
  index: number;
  total: number;
  className?: string;
}

const COLOR_CONFIG: Record<string, { glow: string; border: string; iconBg: string; iconText: string; title: string }> = {
  lime: {
    glow: 'radial-gradient(600px 300px at 50% 0%, rgba(196, 242, 4, 0.18), transparent 70%)',
    border: 'border-accent/30',
    iconBg: 'bg-accent',
    iconText: 'text-loud-ink',
    title: 'text-accent',
  },
  sand: {
    glow: 'radial-gradient(600px 300px at 50% 0%, rgba(223, 197, 162, 0.16), transparent 70%)',
    border: 'border-text/20',
    iconBg: 'bg-text/10',
    iconText: 'text-text',
    title: 'text-text',
  },
  olive: {
    glow: 'radial-gradient(600px 300px at 50% 0%, rgba(117, 145, 4, 0.16), transparent 70%)',
    border: 'border-success/30',
    iconBg: 'bg-success',
    iconText: 'text-text-inverted',
    title: 'text-success',
  },
  taupe: {
    glow: 'radial-gradient(600px 300px at 50% 0%, rgba(171, 137, 93, 0.16), transparent 70%)',
    border: 'border-coral/30',
    iconBg: 'bg-coral/10',
    iconText: 'text-coral',
    title: 'text-coral',
  },
};

export function FeatureCard({ icon, title, description, color, index, total, className }: FeatureCardProps) {
  const cfg = COLOR_CONFIG[color];
  const [isHovered, setIsHovered] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);
  const spotlightOpacity = useMotionValue(0);

  const springX = useSpring(spotlightX, { stiffness: 300, damping: 30 });
  const springY = useSpring(spotlightY, { stiffness: 300, damping: 30 });
  const springOpacity = useSpring(spotlightOpacity, { stiffness: 400, damping: 20 });

  useEffect(() => {
    if (!cardRef.current) return;
    const handleMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setPointer({ x, y });
      spotlightX.set(x);
      spotlightY.set(y);
      spotlightOpacity.set(isHovered ? 1 : 0);
    };
    const handleEnter = () => {
      setIsHovered(true);
      spotlightOpacity.set(1);
    };
    const handleLeave = () => {
      setIsHovered(false);
      spotlightOpacity.set(0);
    };
    cardRef.current.addEventListener('mousemove', handleMove);
    cardRef.current.addEventListener('mouseenter', handleEnter);
    cardRef.current.addEventListener('mouseleave', handleLeave);
    return () => {
      if (cardRef.current) {
        cardRef.current.removeEventListener('mousemove', handleMove);
        cardRef.current.removeEventListener('mouseenter', handleEnter);
        cardRef.current.removeEventListener('mouseleave', handleLeave);
      }
    };
  }, [spotlightX, spotlightY, spotlightOpacity, isHovered]);

  // Staggered entrance delay
  const delay = index * 70;

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative p-6 rounded-xl card-signal card-signal-hover group magnetic-hover soft-aurora',
        cfg.border,
        'transition-all duration-300 ease-out',
        'hover:bg-bg-hover hover:border-accent/50',
        className
      )}
      role="listitem"
      aria-label={title}
      style={{ animationDelay: `${delay}ms`, animation: 'nr-slide-up 650ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      {/* Warm-tinted top glow (21st.dev Feature Grid Spotlight Cards) */}
      <div
        className="absolute -top-8 left-0 right-0 h-8"
        style={{
          background: cfg.glow,
          opacity: isHovered ? 1 : 0.4,
          transition: 'opacity 400ms ease',
        }}
        aria-hidden="true"
      />
      {/* Radial spotlight following pointer */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-accent/10 blur-[60px]"
          style={{
            x: springX,
            y: springY,
            opacity: springOpacity,
          }}
        />
      </motion.div>
      {/* Corner crosshair marks */}
      <div className="absolute inset-0 rounded-xl pointer-events-none" aria-hidden="true">
        <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-accent/40" />
        <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-accent/40" />
        <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-accent/40" />
        <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-accent/40" />
      </div>
      <div className="relative z-10 flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = icon as React.ComponentType<{ className?: string }>;
            return (
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', cfg.iconBg, cfg.iconText)}>
                <Icon className="w-5 h-5" />
              </div>
            );
          })()}
          <div className="h-10 w-px bg-accent/20" aria-hidden="true" />
        </div>
        <h3 className={cn('font-semibold text-text mb-1', cfg.title)}>{title}</h3>
        <p className="text-body text-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
