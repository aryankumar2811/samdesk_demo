"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";

const NAV_LINKS = [
  { label: "Overview", href: "#overview", id: "overview" },
  { label: "Live Demo", href: "#demo", id: "demo" },
  { label: "In Production", href: "#production", id: "production" },
  { label: "Roadmap", href: "#roadmap", id: "roadmap" },
] as const;

type SectionId = (typeof NAV_LINKS)[number]["id"];

export default function Nav() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id as SectionId);
        }
      },
      { threshold: 0.3 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "56px",
        display: "flex",
        alignItems: "center",
        backgroundColor: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border-hairline)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Brand */}
        <a
          href="#overview"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontWeight: 500,
            fontSize: "15px",
            color: "var(--text-primary)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Samdesk Demo by Aryan!
        </a>

        {/* Center nav — hidden on mobile */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          className="hidden md:flex"
        >
          {NAV_LINKS.map(({ label, href, id }) => {
            const isActive = activeSection === id;
            return (
              <a
                key={id}
                href={href}
                style={{
                  position: "relative",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  color: isActive
                    ? "var(--accent-primary)"
                    : "var(--text-secondary)",
                  textDecoration: "none",
                  borderRadius: "6px",
                  transition: "color 0.2s ease",
                }}
              >
                {label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "12px",
                      right: "12px",
                      height: "2px",
                      borderRadius: "1px",
                      backgroundColor: "var(--accent-primary)",
                      boxShadow: "0 0 6px var(--accent-primary)",
                    }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          {/* LIVE pill */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "9999px",
              border: "1px solid var(--border-hairline)",
              backgroundColor: "rgba(52,211,153,0.08)",
              fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "var(--status-verified)",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--status-verified)",
                flexShrink: 0,
                animation: "pulse-live 2s ease-in-out infinite",
              }}
            />
            LIVE
          </span>

          {/* GitHub */}
          <a
            href="https://github.com/aryankumar2811"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--text-secondary)",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-secondary)")
            }
          >
            <GithubIcon size={18} />
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/aryan-kumar-10a548297/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--text-secondary)",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-secondary)")
            }
          >
            <LinkedinIcon size={18} />
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(52,211,153,0); }
        }
      `}</style>
    </motion.header>
  );
}
