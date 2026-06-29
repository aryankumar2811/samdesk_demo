"use client";

import { useReducedMotion, motion } from "framer-motion";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease, delay },
  },
});

const statChips = [
  "56 signals · 7 incident types",
  "Real Anthropic tool use",
  "P/R/F1 + agent eval metrics",
];

export default function Hero() {
  const prefersReduced = useReducedMotion();

  function scrollToDemo() {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  }

  const motionProps = (delay: number) =>
    prefersReduced
      ? {}
      : {
          initial: "hidden" as const,
          animate: "visible" as const,
          variants: fadeUp(delay),
        };

  return (
    <section
      className="relative flex min-h-screen flex-col items-start justify-center px-6 py-20 md:px-16 lg:px-24"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex max-w-3xl flex-col gap-5">
        {/* Headline */}
        <motion.h1
          {...motionProps(0)}
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            fontFamily: "var(--font-inter)",
          }}
        >
          Samdesk Demo
        </motion.h1>

        {/* By-line */}
        <motion.p
          {...motionProps(0.08)}
          style={{
            color: "var(--accent-agent)",
            fontSize: "20px",
            fontWeight: 500,
            fontFamily: "var(--font-inter)",
          }}
        >
          by Aryan
        </motion.p>

        {/* Attribution row */}
        <motion.div
          {...motionProps(0.16)}
          className="flex flex-wrap items-center gap-3 text-sm"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-inter)",
          }}
        >
          <span>Built by Aryan —</span>
          <a
            href="https://github.com/aryankumar2811"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            <GithubIcon size={15} />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/aryan-kumar-10a548297/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            <LinkedinIcon size={15} />
            LinkedIn
          </a>
        </motion.div>

        {/* Tagline */}
        <motion.p
          {...motionProps(0.24)}
          className="max-w-xl text-base leading-relaxed"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-inter)",
          }}
        >
          Turning a flood of noisy signals into verified, decision-ready crisis
          intelligence — in seconds, with a human in the loop and a citation
          behind every claim.
        </motion.p>

        {/* Problem paragraph */}
        <motion.p
          {...motionProps(0.32)}
          className="max-w-lg text-sm leading-relaxed"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-inter)",
          }}
        >
          Security and government teams can&apos;t act on rumors — they need to
          be first to know AND provably right. Traditional pipelines are fast
          but opaque. This system pairs a transparent clustering pipeline with
          an autonomous investigative agent that cites every claim before
          alerting.
        </motion.p>

        {/* CTA button */}
        <motion.div {...motionProps(0.40)}>
          <button
            onClick={scrollToDemo}
            className="cursor-pointer rounded-lg px-6 py-3 text-sm font-medium transition-all duration-150 hover:brightness-110 active:brightness-95"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "#0A0E14",
              fontFamily: "var(--font-inter)",
              fontWeight: 500,
            }}
          >
            Run the live demo →
          </button>
        </motion.div>

        {/* Stat chips */}
        <motion.div
          {...motionProps(0.48)}
          className="flex flex-wrap gap-2"
        >
          {statChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full px-3 py-1 text-xs"
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-hairline)",
                backgroundColor: "var(--bg-elevated)",
              }}
            >
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
