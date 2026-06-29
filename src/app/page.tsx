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
                className="text-2xl font-semibold mb-2"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
              >
                How it works
              </h2>
              <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
                Click any node to learn what that stage does.
              </p>
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
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Real Anthropic tool-calling running server-side. Select a scenario and watch the
                  agent investigate.
                </p>
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
