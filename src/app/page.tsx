import { Suspense } from "react";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/overview/Hero";
import ArchDiagram from "@/components/sections/overview/ArchDiagram";
import WhyItMatters from "@/components/sections/overview/WhyItMatters";
import { DemoConsole } from "@/components/sections/demo/DemoConsole";
import ProductionSection from "@/components/sections/production/ProductionSection";
import RoadmapSection from "@/components/sections/roadmap/RoadmapSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Nav />

      <main className="flex-1">
        {/* Overview */}
        <section id="overview">
          <Hero />

          {/* Architecture diagram */}
          <div
            className="py-16 px-4 md:px-8"
            style={{
              background: "var(--bg-elevated)",
              borderTop: "1px solid var(--border-hairline)",
              borderBottom: "1px solid var(--border-hairline)",
            }}
          >
            <div className="max-w-5xl mx-auto">
              <h2
                className="text-2xl font-semibold mb-8"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
              >
                How it works
              </h2>
              <Suspense
                fallback={
                  <div
                    className="h-64 animate-pulse rounded-xl"
                    style={{ background: "var(--bg-card)" }}
                  />
                }
              >
                <ArchDiagram />
              </Suspense>
            </div>
          </div>

          {/* Why it matters */}
          <div className="py-16 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
              <WhyItMatters />
            </div>
          </div>
        </section>

        {/* Live Demo */}
        <section
          id="demo"
          style={{
            background: "var(--bg-elevated)",
            borderTop: "1px solid var(--border-hairline)",
          }}
        >
          <div className="py-16 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2
                  className="text-3xl font-semibold mb-2"
                  style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                >
                  Live Demo
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                  Real Anthropic tool-calling running server-side. Select a scenario and watch the
                  agent investigate.
                </p>

                {/* How-to card */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  {[
                    {
                      step: "01",
                      label: "Choose a scenario",
                      detail: "Pick from three pre-loaded incidents on the left: a verified fire, planted misinformation, or an ambiguous flood.",
                    },
                    {
                      step: "02",
                      label: "Run Pipeline, then Investigate",
                      detail: "Click Run pipeline first to cluster and classify signals, then click Investigate to launch the live agent.",
                    },
                    {
                      step: "03",
                      label: "Reset before switching",
                      detail: "Hit Reset before selecting a different scenario, otherwise the previous run state carries over.",
                    },
                    {
                      step: "04",
                      label: "Run Evaluation after escalation",
                      detail: "The eval rail scores decision accuracy, false-verify rate, and grounding. It runs 3 live agent calls so it costs a few cents and takes ~30s.",
                    },
                  ].map(({ step, label, detail }, i) => (
                    <div
                      key={step}
                      style={{
                        flex: "1 1 200px",
                        padding: "14px 18px",
                        borderRight: i < 3 ? "1px solid var(--border-hairline)" : "none",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "10px",
                          color: "var(--accent-primary)",
                          marginBottom: "5px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {step}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: "4px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          lineHeight: "1.55",
                        }}
                      >
                        {detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DemoConsole />
            </div>
          </div>
        </section>

        {/* In Production */}
        <section
          id="production"
          style={{ borderTop: "1px solid var(--border-hairline)" }}
        >
          <div className="py-16 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
              <ProductionSection />
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section
          id="roadmap"
          style={{
            background: "var(--bg-elevated)",
            borderTop: "1px solid var(--border-hairline)",
          }}
        >
          <div className="py-16 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
              <RoadmapSection />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
