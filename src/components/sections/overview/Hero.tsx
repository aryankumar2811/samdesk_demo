"use client";

import { useReducedMotion, motion } from "framer-motion";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay } },
});

const fadeIn = (delay: number) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease, delay } },
});

// ─── Static agent-output preview card ────────────────────────────────────────

const TOOL_TRACE = [
  { name: "search_signals",        arg: '"chemical fire port halworth"', ms: "2.1s" },
  { name: "check_source_reliability", arg: "src-016",                    ms: "0.8s" },
  { name: "get_asset_exposure",    arg: "48.42°N, 123.37°W · 0.5km",    ms: "0.4s" },
  { name: "submit_decision",       arg: "verified",                      ms: "0.6s" },
];

function AgentPreviewCard({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      variants={fadeIn(0.35)}
      style={{
        background: "rgba(17,23,34,0.92)",
        border: "1px solid rgba(52,211,153,0.2)",
        borderRadius: "16px",
        boxShadow: "0 0 0 1px rgba(52,211,153,0.06), 0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(52,211,153,0.04)",
        overflow: "hidden",
        backdropFilter: "blur(16px)",
        width: "100%",
        maxWidth: "420px",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "7px", height: "7px", borderRadius: "50%",
              backgroundColor: "var(--status-verified)",
              boxShadow: "0 0 8px var(--status-verified)",
              animation: reduced ? "none" : "pulse 2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            inc-001 · Fire / Hazmat
          </span>
        </div>
        <span
          style={{
            fontSize: "10px", fontFamily: "var(--font-jetbrains-mono)",
            color: "var(--status-verified)",
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.2)",
            padding: "2px 8px", borderRadius: "999px",
          }}
        >
          VERIFIED
        </span>
      </div>

      {/* Brief */}
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{
          margin: 0, fontSize: "12px", lineHeight: "1.65",
          color: "var(--text-secondary)", fontFamily: "var(--font-inter)",
          borderLeft: "2px solid rgba(52,211,153,0.4)", paddingLeft: "10px",
        }}>
          Port Halworth Fire Dept confirmed an active chemical fire at 1400 Docklands Way at 14:02 UTC, with a second alarm by 14:20 UTC [sig-001, sig-010]. Four independent sources corroborate; no contradictory signals found. Three high-criticality assets within 0.5km [sig-052, sig-003].
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "10px" }}>
          {["sig-001", "sig-003", "sig-010", "sig-043", "sig-052"].map((c) => (
            <span key={c} style={{
              fontSize: "10px", fontFamily: "var(--font-jetbrains-mono)",
              color: "var(--text-muted)", background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-hairline)", borderRadius: "4px",
              padding: "1px 6px",
            }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Tool trace */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{
          fontSize: "9px", fontFamily: "var(--font-jetbrains-mono)",
          color: "var(--text-muted)", letterSpacing: "0.08em",
          marginBottom: "8px",
        }}>
          TOOL CALLS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {TOOL_TRACE.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                fontSize: "10px", fontFamily: "var(--font-jetbrains-mono)",
                color: t.name === "submit_decision" ? "var(--accent-agent)" : "var(--accent-primary)",
                background: t.name === "submit_decision" ? "rgba(167,139,250,0.08)" : "rgba(56,189,248,0.06)",
                border: `1px solid ${t.name === "submit_decision" ? "rgba(167,139,250,0.2)" : "rgba(56,189,248,0.15)"}`,
                borderRadius: "999px", padding: "2px 8px", flexShrink: 0,
              }}>
                {t.name}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {t.arg}
              </span>
              <span style={{ fontSize: "10px", color: "var(--status-verified)", fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0 }}>
                {t.ms}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer metadata */}
      <div style={{
        padding: "10px 18px",
        display: "flex", gap: "16px", flexWrap: "wrap",
      }}>
        {[
          { label: "Grounding", value: "100%" },
          { label: "Latency",   value: "3.9s"  },
          { label: "Sources",   value: "4 independent" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-muted)", letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-primary)", fontWeight: 600, marginTop: "1px" }}>{value}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero() {
  const prefersReduced = useReducedMotion() ?? false;

  function scrollToDemo() {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  }

  const m = (delay: number) =>
    prefersReduced ? {} : { initial: "hidden" as const, animate: "visible" as const, variants: fadeUp(delay) };

  const mf = (delay: number) =>
    prefersReduced ? {} : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn(delay) };

  return (
    <section
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 md:px-16 lg:px-24 py-24"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Background orbs — stronger than body defaults */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div style={{
          position: "absolute", top: "-15%", left: "-10%",
          width: "70%", height: "70%",
          background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-5%",
          width: "55%", height: "55%",
          background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 65%)",
        }} />
      </div>

      {/* Two-column grid */}
      <div
        className="relative z-10 mx-auto w-full"
        style={{ maxWidth: "1200px" }}
      >
        <div className="grid lg:grid-cols-[1fr_420px] gap-14 items-center">
          {/* ── LEFT: text ── */}
          <div className="flex flex-col" style={{ gap: "20px", maxWidth: "640px" }}>

            {/* Live badge */}
            <motion.div {...mf(0)}>
              <span
                className="inline-flex items-center gap-2"
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "999px",
                  padding: "5px 12px",
                  background: "rgba(255,255,255,0.02)",
                  letterSpacing: "0.05em",
                }}
              >
                <span style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  backgroundColor: "var(--status-verified)",
                  boxShadow: "0 0 6px var(--status-verified)",
                  animation: prefersReduced ? "none" : "pulse 2s ease-in-out infinite",
                }} />
                LIVE · claude-sonnet-4-6
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...m(0.06)} style={{ margin: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(44px, 6vw, 80px)",
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.0,
                  fontFamily: "var(--font-inter)",
                  background: "linear-gradient(135deg, #E6EAF0 30%, #7BB8D4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Samdesk
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(44px, 6vw, 80px)",
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.0,
                  fontFamily: "var(--font-inter)",
                  color: "var(--text-primary)",
                }}
              >
                Demo
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              {...m(0.12)}
              style={{
                margin: 0,
                fontSize: "clamp(15px, 1.6vw, 18px)",
                lineHeight: "1.6",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-inter)",
                maxWidth: "520px",
              }}
            >
              An autonomous investigative agent that turns noisy social signals into verified, cited crisis intelligence in seconds.
            </motion.p>

            {/* CTA + attribution */}
            <motion.div {...m(0.18)} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
              <button
                onClick={scrollToDemo}
                style={{
                  cursor: "pointer",
                  backgroundColor: "var(--accent-primary)",
                  color: "#0A0E14",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  fontSize: "14px",
                  padding: "11px 24px",
                  borderRadius: "8px",
                  border: "none",
                  letterSpacing: "-0.01em",
                  transition: "filter 150ms ease, transform 100ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)"; }}
                onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                Run live demo
              </button>

              <div style={{ width: "1px", height: "28px", background: "var(--border-strong)", flexShrink: 0 }} />

              {[
                { href: "https://github.com/aryankumar2811", Icon: GithubIcon, label: "GitHub" },
                { href: "https://www.linkedin.com/in/aryan-kumar-10a548297/", Icon: LinkedinIcon, label: "LinkedIn" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    fontSize: "13px", fontFamily: "var(--font-inter)",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)"; }}
                >
                  <Icon size={14} />
                  {label}
                </a>
              ))}

              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
                by Aryan Kumar
              </span>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              {...m(0.24)}
              style={{
                display: "flex", flexWrap: "wrap", gap: "0",
                borderTop: "1px solid var(--border-hairline)",
                paddingTop: "20px",
                marginTop: "4px",
              }}
            >
              {[
                { value: "56",   label: "synthetic signals" },
                { value: "Real", label: "Anthropic tool use" },
                { value: "P/R/F1", label: "eval harness" },
              ].map(({ value, label }, i) => (
                <div
                  key={label}
                  style={{
                    flex: "1 1 120px",
                    paddingRight: "24px",
                    borderRight: i < 2 ? "1px solid var(--border-hairline)" : "none",
                    paddingLeft: i > 0 ? "24px" : "0",
                  }}
                >
                  <div style={{
                    fontSize: "clamp(20px, 2.5vw, 28px)",
                    fontWeight: 700,
                    fontFamily: "var(--font-inter)",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-jetbrains-mono)",
                    color: "var(--text-muted)",
                    marginTop: "3px",
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: preview card (desktop only) ── */}
          <div className="hidden lg:flex justify-center items-center">
            <motion.div {...mf(0.3)} style={{ width: "100%", transform: "rotate(1.5deg)" }}>
              <AgentPreviewCard reduced={prefersReduced} />
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </section>
  );
}
