"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxBgProps {
  children: React.ReactNode;
  className?: string;
  /** Speed multiplier: 0.08 = very subtle, 0.15 = noticeable, 0.25 = dramatic */
  speed?: number;
}

/**
 * Wraps background decorative elements (orbs, rings, grids, etc.)
 * and applies a subtle parallax Y-shift on scroll to create depth.
 *
 * Usage: wrap <ParallaxBg> around absolutely‑positioned background divs.
 */
export function ParallaxBg({ children, className = "", speed = 0.12 }: ParallaxBgProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Map scroll progress to a subtle Y shift (e.g. –8% → +8% of the container)
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 60}%`, `${speed * 60}%`]);

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <motion.div className="relative h-full w-full" style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
