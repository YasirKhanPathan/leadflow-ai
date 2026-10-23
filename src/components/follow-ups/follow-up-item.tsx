"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CancelFollowUp } from "@/components/follow-ups/cancel-follow-up";
import { RescheduleDialog } from "@/components/follow-ups/reschedule-dialog";
import { completeFollowUp, reopenFollowUp } from "@/lib/actions/follow-ups";
import type { FollowUpRow } from "@/lib/queries/follow-ups";

export function FollowUpItem({
  item,
  showLeadLink = true,
}: {
  item: FollowUpRow;
  showLeadLink?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      const result = await completeFollowUp(item.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Follow-up completed");
      }
    });
  }

  function handleReopen() {
    startTransition(async () => {
      const result = await reopenFollowUp(item.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Follow-up reopened");
      }
    });
  }

  const isCompleted = item.status === "COMPLETED";

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {showLeadLink ? (
            <Link
              href={`/leads/${item.leadId}`}
              className="text-sm font-medium hover:underline"
            >
              {item.leadName}
            </Link>
          ) : null}
          <p className="text-sm font-medium">
            {item.title ?? "Follow-up"}
          </p>
        </div>
        {item.message ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.message}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {isCompleted && item.completedAtLabel
            ? `Completed ${item.completedAtLabel} · due ${item.dueDateLabel}`
            : `Due ${item.dueDateLabel}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        {isCompleted ? (
          <Button
            variant="outline"
            size="xs"
            onClick={handleReopen}
            disabled={isPending}
          >
            {isPending ? "Working…" : "Reopen"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="xs"
            onClick={handleComplete}
            disabled={isPending}
          >
            {isPending ? "Working…" : "Complete"}
          </Button>
        )}
        <RescheduleDialog id={item.id} currentDueDate={item.dueDate} />
        <CancelFollowUp id={item.id} />
      </div>
    </div>
  );
}
