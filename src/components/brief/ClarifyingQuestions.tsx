"use client";
import { Sparkles, ChevronRight } from "lucide-react";
import type { AnalyzeResult, AnsweredQuestion } from "@/types/brief";

interface Props {
  analysis: AnalyzeResult;
  answers: AnsweredQuestion[];
  onAnswerChange: (id: number, answer: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  disabled?: boolean;
}

export function ClarifyingQuestions({
  analysis,
  answers,
  onAnswerChange,
  onSubmit,
  onBack,
  disabled,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Context summary */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          Here&apos;s what I understood
        </h2>
        <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
        {analysis.missingContext.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Still unclear:</span>{" "}
            {analysis.missingContext.join(" · ")}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Answer what you can — blanks are fine. The more you give, the sharper the brief.
      </p>

      {/* Questions */}
      {analysis.questions.map((q) => {
        const answer = answers.find((a) => a.id === q.id)?.answer ?? "";
        return (
          <div key={q.id} className="rounded-lg border border-border bg-card p-5 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {q.category}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-relaxed">{q.question}</p>
            <textarea
              value={answer}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              rows={2}
              placeholder="Your answer (optional)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        );
      })}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={disabled}
          className="flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors text-sm disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          Compile my brief
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
