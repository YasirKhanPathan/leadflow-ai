"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeLead,
  approveAiReply,
  draftReply,
  saveAiDraft,
  setLeadPriority,
  type AnalysisResult,
} from "@/lib/actions/ai";
import { priorityStyle } from "@/lib/labels";
import type { Priority } from "@prisma/client";

const NOT_MENTIONED = "Not mentioned in inquiry";

const analyzedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const approvedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatAnalyzedAt(iso: string): string {
  return analyzedAtFormatter.format(new Date(iso));
}

function formatApprovedAt(iso: string): string {
  return approvedAtFormatter.format(new Date(iso));
}

function AnalysisField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-sm font-medium">{label}</span>
      {value ? (
        <span className="text-right text-sm">{value}</span>
      ) : (
        <span className="text-right text-sm italic text-muted-foreground">
          {NOT_MENTIONED}
        </span>
      )}
    </div>
  );
}

export function AiPanel({
  leadId,
  initialAnalysis,
  initialDraft,
  initialApprovedAt,
}: {
  leadId: string;
  initialAnalysis: AnalysisResult | null;
  initialDraft: string | null;
  initialApprovedAt: string | null;
}) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    initialAnalysis,
  );
  const [draft, setDraft] = useState<string>(initialDraft ?? "");
  const [storedDraft, setStoredDraft] = useState<string>(initialDraft ?? "");
  const [approvedAt, setApprovedAt] = useState<string | null>(
    initialApprovedAt,
  );
  const [isAnalyzing, startAnalyzeTransition] = useTransition();
  const [isDrafting, startDraftTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const [isApproving, startApproveTransition] = useTransition();
  const [isApplying, startApplyTransition] = useTransition();

  function handleAnalyze() {
    startAnalyzeTransition(async () => {
      const result = await analyzeLead(leadId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.analysis) {
        setAnalysis(result.analysis);
      }
    });
  }

  function handleDraft() {
    startDraftTransition(async () => {
      const result = await draftReply(leadId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.reply !== undefined) {
        setDraft(result.reply);
        setStoredDraft(result.reply);
        setApprovedAt(null);
      }
    });
  }

  function handleSave() {
    startSaveTransition(async () => {
      const result = await saveAiDraft(leadId, draft);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setStoredDraft(draft);
      setApprovedAt(null);
      toast.success("Draft saved");
    });
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(draft)
      .then(() => toast.success("Draft copied to clipboard"))
      .catch(() =>
        toast.error("Could not copy — select the text and copy manually"),
      );
  }

  function handleApprove() {
    startApproveTransition(async () => {
      const result = await approveAiReply(leadId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setApprovedAt(new Date().toISOString());
      toast.success("Reply marked as approved");
    });
  }

  function handleApplyPriority(priority: Priority) {
    startApplyTransition(async () => {
      const result = await setLeadPriority(leadId, priority);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Priority updated");
    });
  }

  const draftDiffers = draft !== storedDraft;
  const hasDraft = storedDraft.length > 0 || draft.length > 0;

  return (
    <section
      aria-label="AI assistant"
      className="space-y-6 rounded-xl border bg-background p-4"
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold">AI assistant</h2>
        <p className="text-sm text-muted-foreground">
          Nothing is sent automatically — review, edit, and copy this reply
          yourself.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="sm"
          >
            {isAnalyzing ? "Analyzing…" : "Analyze with AI"}
          </Button>
          {analysis ? (
            <span className="text-xs text-muted-foreground">
              Analyzed {formatAnalyzedAt(analysis.analyzedAt)}
            </span>
          ) : null}
        </div>

        {analysis ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
            <div className="divide-y rounded-lg border px-3">
              <AnalysisField label="Service" value={analysis.service} />
              <AnalysisField label="Budget" value={analysis.budget} />
              <AnalysisField label="Timeline" value={analysis.timeline} />
            </div>
            {analysis.priority ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={priorityStyle[analysis.priority].variant}
                  className={priorityStyle[analysis.priority].className}
                >
                  Suggested: {priorityStyle[analysis.priority].label}
                </Badge>
                {analysis.priorityReason ? (
                  <span className="text-xs text-muted-foreground">
                    {analysis.priorityReason}
                  </span>
                ) : null}
                <Button
                  variant="outline"
                  size="xs"
                  disabled={isApplying}
                  onClick={() => handleApplyPriority(analysis.priority as Priority)}
                >
                  {isApplying ? "Applying…" : "Apply priority"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDraft}
            disabled={isDrafting}
            size="sm"
            variant="outline"
          >
            {isDrafting ? "Drafting…" : "Draft reply"}
          </Button>
          {approvedAt ? (
            <Badge
              variant="outline"
              className="border-green-200! bg-green-50! text-green-700!"
            >
              Approved {formatApprovedAt(approvedAt)}
            </Badge>
          ) : null}
        </div>

        {hasDraft ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={8}
              aria-label="Draft reply"
              className="min-h-40"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!draftDiffers || isSaving}
              >
                {isSaving ? "Saving…" : "Save draft"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={draft.length === 0}
              >
                Copy draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleApprove}
                disabled={isApproving || approvedAt !== null}
              >
                {isApproving
                  ? "Approving…"
                  : approvedAt
                    ? "Approved"
                    : "Mark as approved"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm italic text-muted-foreground">
            No draft yet — use &ldquo;Draft reply&rdquo; to generate one.
          </p>
        )}
      </div>
    </section>
  );
}
