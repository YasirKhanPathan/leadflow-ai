"use client";

import { CreateFollowUpDialog } from "@/components/follow-ups/create-follow-up-dialog";
import { FollowUpItem } from "@/components/follow-ups/follow-up-item";
import type { FollowUpRow } from "@/lib/queries/follow-ups";

export function LeadFollowUps({
  leadId,
  open,
  completed,
}: {
  leadId: string;
  open: FollowUpRow[];
  completed: FollowUpRow[];
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Follow-ups</h2>
        <CreateFollowUpDialog leadId={leadId} />
      </div>

      {open.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm italic text-muted-foreground">
          No open follow-ups — add one to remember this lead.
        </p>
      ) : (
        <div className="space-y-2">
          {open.map((row) => (
            <FollowUpItem key={row.id} item={row} showLeadLink={false} />
          ))}
        </div>
      )}

      {completed.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recently completed
          </h3>
          {completed.map((row) => (
            <FollowUpItem key={row.id} item={row} showLeadLink={false} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
