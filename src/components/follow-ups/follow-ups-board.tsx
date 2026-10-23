"use client";

import { useState } from "react";
import { FollowUpItem } from "@/components/follow-ups/follow-up-item";
import type { FollowUpCounts, FollowUpRow } from "@/lib/queries/follow-ups";

const TABS = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
] as const;

export type FollowUpTab = (typeof TABS)[number]["key"];

const EMPTY_MESSAGES: Record<FollowUpTab, string> = {
  overdue: "Nothing overdue — nice.",
  today: "Nothing due today.",
  upcoming: "No upcoming follow-ups — create one from a lead.",
  completed: "No completed follow-ups yet.",
};

export function FollowUpsBoard({
  counts,
  open,
  completed,
  initialTab,
}: {
  counts: FollowUpCounts;
  open: FollowUpRow[];
  completed: FollowUpRow[];
  initialTab: FollowUpTab;
}) {
  const [tab, setTab] = useState<FollowUpTab>(initialTab);

  const tabCounts: Record<FollowUpTab, number> = {
    overdue: counts.overdue,
    today: counts.today,
    upcoming: counts.upcoming,
    completed: completed.length,
  };

  const rows =
    tab === "completed"
      ? completed
      : open.filter((row) => row.bucket === tab);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Follow-up views"
        className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
      >
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={
                active
                  ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
                  : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {item.label}
              <span className="ml-1.5 tabular-nums text-xs text-muted-foreground">
                {tabCounts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={TABS.find((t) => t.key === tab)?.label}>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            {EMPTY_MESSAGES[tab]}
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <FollowUpItem key={row.id} item={row} />
            ))}
          </div>
        )}
        {tab === "completed" && completed.length >= 50 ? (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Showing the latest 50 completed follow-ups.
          </p>
        ) : null}
      </div>
    </div>
  );
}
