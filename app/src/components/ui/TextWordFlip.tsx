"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from '../../utils/helpers';

export interface TextWordFlipProps extends Omit<
  React.ComponentPropsWithoutRef<"span">,
  "children"
> {
  /** Words / phrases to cycle through. */
  words: string[];
  /** Hold time per word before flipping, in milliseconds. */
  duration?: number;
  /** Stagger delay between letters, in seconds. */
  letterDelay?: number;
  /** Stagger delay between words inside a phrase, in seconds. */
  wordDelay?: number;
  /** Pause the cycle. */
  paused?: boolean;
}

const DEFAULT_WORDS = ["better", "modern", "beautiful", "awesome"] as const;

/**
 * TextWordFlip
 *
 * Cycles words with a spring flip: letters blur-stagger in, then the word
 * exits up-right with blur + scale. Distinct from TextFlip (3D glyph flip).
 * Reduced-motion safe.
 */
export function TextWordFlip({
  words: wordsProp,
  duration = 1700,
  letterDelay = 0.05,
  wordDelay = 0.3,
  paused = false,
  className,
  ...props
}: TextWordFlipProps) {
  const words = React.useMemo(() => {
    const cleaned = (wordsProp ?? [...DEFAULT_WORDS])
      .map((word) => word.trim())
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : [...DEFAULT_WORDS];
  }, [wordsProp]);

  const [index, setIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    if (paused || reduceMotion || isAnimating || words.length <= 1) return;

    const hold = Math.max(600, duration);
    const timeoutId = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % words.length);
      setIsAnimating(true);
    }, hold);

    return () => window.clearTimeout(timeoutId);
  }, [duration, isAnimating, paused, reduceMotion, words.length]);

  const safeIndex = index % words.length;
  const currentWord = words[safeIndex] ?? "";
  const phraseParts = currentWord.split(" ").filter(Boolean);

  if (reduceMotion) {
    return (
      <span
        className={cn("inline-block relative text-left", className)}
        {...props}
      >
        {currentWord}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-block relative text-left", className)}
      {...props}
    >
      <AnimatePresence onExitComplete={() => setIsAnimating(false)}>
        <motion.span
          key={`${safeIndex}-${currentWord}`}
          className="inline-block relative whitespace-nowrap will-change-transform"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: -40,
            x: 40,
            filter: "blur(8px)",
            scale: 2,
            position: "absolute",
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
          }}
        >
          {phraseParts.map((word, wordIndex) => (
            <motion.span
              key={`${word}-${wordIndex}`}
              className="inline-block whitespace-nowrap"
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: wordIndex * wordDelay,
                duration: 0.3,
              }}
            >
              {Array.from(word).map((letter, letterIndex) => (
                <motion.span
                  key={`${word}-${letterIndex}`}
                  className="inline-block will-change-transform"
                  initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: wordIndex * wordDelay + letterIndex * letterDelay,
                    duration: 0.2,
                  }}
                >
                  {letter}
                </motion.span>
              ))}
              {wordIndex < phraseParts.length - 1 ? (
                <span className="inline-block">&nbsp;</span>
              ) : null}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default TextWordFlip;
