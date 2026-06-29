export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderTop: "1px solid var(--border-hairline)",
        paddingTop: "16px",
        paddingBottom: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "8px",
          fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        <span>Built by Aryan</span>

        <Separator />

        <a
          href="https://github.com/aryankumar2811"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--text-muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          GitHub
        </a>

        <Separator />

        <a
          href="https://www.linkedin.com/in/aryan-kumar-10a548297/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--text-muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          LinkedIn
        </a>

        <Separator />

        <span>Synthetic data · real Anthropic tool-calling · built as a demo</span>
      </div>
    </footer>
  );
}

function Separator() {
  return (
    <span
      aria-hidden="true"
      style={{ color: "var(--border-strong)", userSelect: "none" }}
    >
      ·
    </span>
  );
}
