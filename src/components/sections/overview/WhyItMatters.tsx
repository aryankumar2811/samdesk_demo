"use client";

import { useReducedMotion, motion } from "framer-motion";
import { Zap, ShieldCheck, BarChart2, type LucideIcon } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface Card {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const cards: Card[] = [
  {
    Icon: Zap,
    title: "Speed",
    body: "The agent investigates and decides in seconds — watch it work in the live demo. Tool calls happen in real time: corroboration search, source reliability check, contradiction detection, asset exposure assessment.",
  },
  {
    Icon: ShieldCheck,
    title: "Trust",
    body: "Every claim in the brief is tied to a retrieved signal ID. The grounding guard blocks publication of any unverifiable claim. When sources conflict, the agent escalates rather than guessing.",
  },
  {
    Icon: BarChart2,
    title: "Measured",
    body: "Clustering precision/recall, classification F1 per event type, agent decision accuracy, false-verify rate, mean tool calls, grounding faithfulness, and p50/p95 latency — all computed over the labeled corpus, not vibes.",
  },
];

const iconColors: Record<string, string> = {
  Speed: "var(--status-escalate)",
  Trust: "var(--status-verified)",
  Measured: "var(--accent-primary)",
};

export default function WhyItMatters() {
  const prefersReduced = useReducedMotion();

  const cardVariants = (index: number) => ({
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease,
        delay: index * 0.08,
      },
    },
  });

  return (
    <section
      className="px-6 py-20 md:px-16 lg:px-24"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Section heading */}
        <motion.h2
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease }}
          className="mb-10"
          style={{
            color: "var(--text-primary)",
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "-0.015em",
            fontFamily: "var(--font-inter)",
          }}
        >
          Why it matters
        </motion.h2>

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          {cards.map((card, index) => {
            const { Icon, title, body } = card;
            return (
              <motion.div
                key={title}
                initial={prefersReduced ? false : "hidden"}
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants(index)}
                className="flex flex-col gap-4 rounded-xl p-6"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                {/* Icon container */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  <Icon
                    size={18}
                    style={{ color: iconColors[title] ?? "var(--accent-primary)" }}
                    strokeWidth={1.75}
                  />
                </div>

                {/* Title */}
                <h3
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "16px",
                    fontWeight: 600,
                    fontFamily: "var(--font-inter)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </h3>

                {/* Body */}
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
