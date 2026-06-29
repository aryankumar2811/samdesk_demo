"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function MotionSection({
  children,
  className,
  delay = 0,
}: MotionSectionProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReduced ? 0 : 0.4,
        delay: prefersReduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
