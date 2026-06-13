"use client";
import {
  Target,
  ListChecks,
  Ban,
  Workflow,
  Database,
  Bot,
  Ticket,
  CheckSquare,
} from "lucide-react";
import type { BriefResult } from "@/types/brief";

interface Props {
  result: BriefResult;
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None specified.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
          <span className="text-muted-foreground mt-0.5">•</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3 section-fade-in">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-amber-500/10 text-amber-500",
  low: "bg-green-500/10 text-green-500",
};

export function BriefPanel({ result }: Props) {
  return (
    <div className="space-y-4">
      {/* Goal + promise header */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-3 section-fade-in">
        <h1 className="text-xl font-bold text-foreground">{result.goal}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Target user: </span>
            <span className="text-foreground">{result.targetUser}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Problem: </span>
            <span className="text-foreground">{result.problem}</span>
          </p>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-primary pl-3">
          {result.corePromise}
        </p>
      </div>

      <Section icon={<ListChecks className="h-4 w-4 text-primary" />} title="MVP Features">
        <BulletList items={result.mvpFeatures} />
      </Section>

      <Section icon={<Ban className="h-4 w-4 text-amber-500" />} title="Non-Goals">
        <BulletList items={result.nonGoals} />
      </Section>

      <Section icon={<Workflow className="h-4 w-4 text-primary" />} title="User Flow">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{result.userFlow}</p>
      </Section>

      <Section icon={<Database className="h-4 w-4 text-teal-500" />} title="Technical Requirements">
        <div className="space-y-2 text-sm text-foreground/90">
          <p>
            <span className="text-muted-foreground">Stack: </span>
            {result.techStack}
          </p>
          <p>
            <span className="text-muted-foreground">Data needs: </span>
            {result.dbNeeds}
          </p>
          <p className="flex items-start gap-1.5">
            <Bot className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>
              <span className="text-muted-foreground">AI behavior: </span>
              {result.aiBehavior}
            </span>
          </p>
        </div>
      </Section>

      <Section icon={<Ticket className="h-4 w-4 text-indigo-500" />} title="Build Tickets">
        {result.buildTickets.length ? (
          <ol className="space-y-2.5">
            {result.buildTickets.map((t, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {i + 1}. {t.title}
                  </span>
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      PRIORITY_STYLE[t.priority] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <p className="text-foreground/80 mt-0.5">{t.description}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">None specified.</p>
        )}
      </Section>

      <Section icon={<CheckSquare className="h-4 w-4 text-green-500" />} title="Validation Checklist">
        <BulletList items={result.validationChecklist} />
      </Section>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
        <Target className="h-3.5 w-3.5" />
        Paste a prompt below into your AI tool — the brief above is the human-readable version.
      </div>
    </div>
  );
}
