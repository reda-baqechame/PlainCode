import type { DesignTypography } from "@/types/polish";

// Client-only: render a design screen in a hidden, sandboxed iframe and capture
// it to a JPEG data URL with html2canvas (already a dependency, see RoastCard).
// Used to feed the *actual rendered pixels* back to Claude's vision critique.
//
// Security: the iframe uses sandbox="allow-same-origin" WITHOUT allow-scripts —
// the parent can read the DOM for the screenshot, but no JS in the (already
// sanitized) HTML can execute. html2canvas is an approximation of the real
// render; it's enough to judge hierarchy / spacing / contrast / alignment.

export function googleFontsHref(typography: DesignTypography): string {
  const families = (typography.googleFonts?.length
    ? typography.googleFonts
    : [typography.displayFont, typography.bodyFont, typography.monoFont]
  ).filter(Boolean);
  const unique = Array.from(new Set(families));
  const params = unique
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function buildScreenDoc(html: string, css: string, fontsHref: string, dark: boolean): string {
  return `<!doctype html>
<html lang="en" class="${dark ? "dark" : ""}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${fontsHref}" />
<style>
${css}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: var(--background); color: var(--foreground); font-family: var(--font-body); -webkit-font-smoothing: antialiased; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

const CAPTURE_WIDTH = 1280;

/** Render the screen offscreen and return a JPEG data URL, or "" on failure. */
export async function captureHtml(html: string, css: string, fontsHref: string): Promise<string> {
  if (typeof document === "undefined") return "";
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-same-origin");
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${CAPTURE_WIDTH}px;height:900px;border:0;opacity:0;pointer-events:none;`;
  iframe.srcdoc = buildScreenDoc(html, css, fontsHref, false);
  document.body.appendChild(iframe);

  try {
    return await withTimeout(
      (async () => {
        await new Promise<void>((resolve) => {
          iframe.addEventListener("load", () => resolve(), { once: true });
        });
        const doc = iframe.contentDocument;
        if (!doc) return "";
        try {
          await (doc as Document & { fonts?: FontFaceSet }).fonts?.ready;
        } catch {
          /* fonts best-effort */
        }
        await new Promise((r) => setTimeout(r, 400));
        const html2canvas = (await import("html2canvas")).default;
        const target = doc.body;
        const canvas = await html2canvas(target, {
          backgroundColor: null,
          scale: 1,
          width: CAPTURE_WIDTH,
          windowWidth: CAPTURE_WIDTH,
          useCORS: true,
          logging: false,
        });
        return downscale(canvas, 1200);
      })(),
      9000
    );
  } catch {
    return "";
  } finally {
    iframe.remove();
  }
}

function downscale(canvas: HTMLCanvasElement, maxWidth: number): string {
  if (canvas.width <= maxWidth) return canvas.toDataURL("image/jpeg", 0.85);
  const scale = maxWidth / canvas.width;
  const out = document.createElement("canvas");
  out.width = maxWidth;
  out.height = Math.round(canvas.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", 0.85);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.85);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("capture timeout")), ms)),
  ]);
}
