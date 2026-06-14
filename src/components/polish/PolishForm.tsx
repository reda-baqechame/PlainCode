"use client";
import { useRef, useState } from "react";
import { Palette, ChevronRight, ImagePlus, X } from "lucide-react";
import type { PolishInput } from "@/types/polish";

interface Props {
  value: PolishInput;
  onChange: (value: PolishInput) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const MAX_BYTES = 7 * 1024 * 1024;

export function PolishForm({ value, onChange, onSubmit, disabled }: Props) {
  const set = (patch: Partial<PolishInput>) => onChange({ ...value, ...patch });
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState("");
  const canSubmit = value.productType.trim().length >= 5;

  function handleFile(file: File | undefined) {
    setImgError("");
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      setImgError("Use a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setImgError("Image is too large (max 7MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set({ screenshot: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Product name</span>
        <input
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Lumen"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">What is the app?</span>
        <textarea
          value={value.productType}
          onChange={(e) => set({ productType: e.target.value })}
          rows={3}
          autoFocus
          placeholder="e.g. a habit tracker for night-shift nurses — log habits, see streaks, gentle reminders"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Who is it for?</span>
          <input
            value={value.audience}
            onChange={(e) => set({ audience: e.target.value })}
            placeholder="e.g. healthcare workers"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Desired vibe</span>
          <input
            value={value.vibe}
            onChange={(e) => set({ vibe: e.target.value })}
            placeholder="e.g. calm, trustworthy, a little warm"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      {/* Screenshot upload */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Current UI screenshot <span className="text-muted-foreground">(optional — the AI sees the slop and fixes it)</span>
        </span>
        {value.screenshot ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.screenshot}
              alt="Current UI"
              className="max-h-44 rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={() => set({ screenshot: undefined })}
              aria-label="Remove screenshot"
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-background border border-border shadow-card hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <ImagePlus className="h-4 w-4" />
            Upload a screenshot (PNG / JPG / WEBP)
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {imgError && <p className="text-xs text-destructive">{imgError}</p>}
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Paste current CSS / component code <span className="text-muted-foreground">(optional)</span>
        </span>
        <textarea
          value={value.currentCode}
          onChange={(e) => set({ currentCode: e.target.value })}
          rows={3}
          placeholder="Paste your theme / a component if you want it critiqued and replaced."
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || disabled}
        className="w-full flex items-center justify-center gap-2 bg-fuchsia-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-fuchsia-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Palette className="h-4 w-4" />
        Design my app
        <ChevronRight className="h-4 w-4" />
      </button>
      <p className="text-xs text-muted-foreground text-center">
        Free · No sign-up · Your screenshot is never stored on our servers
      </p>
    </div>
  );
}
