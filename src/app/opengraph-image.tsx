import { ImageResponse } from "next/og";

export const alt = "PlainCode — From idea to shipped system";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0a0f",
          backgroundImage:
            "radial-gradient(60% 60% at 30% 0%, rgba(99,102,241,0.35), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)",
              color: "#fff",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {"</>"}
          </div>
          <div style={{ color: "#e5e7eb", fontSize: 34, fontWeight: 600 }}>PlainCode</div>
        </div>
        <div style={{ display: "flex", color: "#fff", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
          From idea to shipped system
        </div>
        <div style={{ display: "flex", color: "#a1a1aa", fontSize: 32, marginTop: 28, maxWidth: 900 }}>
          Turn a vague idea into a build-ready spec for Codex, Claude, ChatGPT, or Cursor — then ship it.
        </div>
      </div>
    ),
    { ...size }
  );
}
