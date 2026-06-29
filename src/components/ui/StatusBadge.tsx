"use client";

import { motion } from "framer-motion";

type Decision =
  | "verified"
  | "flag_misinformation"
  | "escalate_to_human"
  | "pending";

interface StatusBadgeProps {
  decision: Decision;
  className?: string;
  animate?: boolean;
}

interface BadgeConfig {
  label: string;
  color: string;
  bg: string;
}

const CONFIG: Record<Decision, BadgeConfig> = {
  verified: {
    label: "VERIFIED",
    color: "#34D399",
    bg: "rgba(52,211,153,0.15)",
  },
  flag_misinformation: {
    label: "MISINFORMATION",
    color: "#F43F5E",
    bg: "rgba(244,63,94,0.15)",
  },
  escalate_to_human: {
    label: "ESCALATED",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.15)",
  },
  pending: {
    label: "PENDING",
    color: "#94A3B8",
    bg: "rgba(100,116,139,0.15)",
  },
};

export default function StatusBadge({
  decision,
  className,
  animate = true,
}: StatusBadgeProps) {
  const { label, color, bg } = CONFIG[decision];

  const pill = (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "9999px",
        backgroundColor: bg,
        border: `1px solid ${color}22`,
        fontFamily:
          "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
        fontSize: "11px",
        fontWeight: 500,
        color,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );

  if (!animate) return pill;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "inline-flex" }}
    >
      {pill}
    </motion.span>
  );
}
