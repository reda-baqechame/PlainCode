"use client";
import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CODE_FILE_EXTENSIONS } from "@/constants/supported-languages";

function languageFromFilename(name: string): string | undefined {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return undefined;
  return CODE_FILE_EXTENSIONS[name.slice(dot).toLowerCase()];
}

// Lazy load CodeMirror to avoid SSR issues and large initial bundle
const CodeMirrorEditor = dynamic(() => import("./CodeMirrorEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-muted rounded-md animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading editor...</span>
    </div>
  ),
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  maxLength?: number;
}

export function CodeInput({ value, onChange, placeholder = "Paste your code here...", label, maxLength = 50000 }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setLanguage(languageFromFilename(file.name));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onChange(text.slice(0, maxLength));
    };
    reader.readAsText(file);
  }, [onChange, maxLength]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div
        className={cn(
          "relative rounded-lg border border-border transition-colors",
          isDragging && "border-primary bg-primary/5"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <CodeMirrorEditor value={value} onChange={onChange} placeholder={placeholder} language={language} />

        {value && (
          <button
            onClick={() => { onChange(""); setLanguage(undefined); }}
            className="absolute top-2 right-2 p-1 rounded hover:bg-accent transition-colors z-10"
            aria-label="Clear code"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}

        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/50 rounded-b-lg">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="h-3 w-3" />
            Upload file
          </button>
          <span className="text-xs text-muted-foreground">
            {value.length.toLocaleString()} / {maxLength.toLocaleString()} chars
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={Object.keys(CODE_FILE_EXTENSIONS).join(",")}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
