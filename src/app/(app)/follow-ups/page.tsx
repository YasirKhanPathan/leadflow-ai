import { FollowUpsBoard, type FollowUpTab } from "@/components/follow-ups/follow-ups-board";
import { requireAuth } from "@/lib/auth";
import { getFollowUpCounts, getFollowUpsForOrg } from "@/lib/queries/follow-ups";

const TAB_KEYS: readonly string[] = ["overdue", "today", "upcoming", "completed"];

export default async function FollowUpsPage({
  searchParams,
}: PageProps<"/follow-ups">) {
  const user = await requireAuth();
  const params = await searchParams;
  const tabParam = typeof params.tab === "string" ? params.tab : "";
  const initialTab: FollowUpTab = TAB_KEYS.includes(tabParam)
    ? (tabParam as FollowUpTab)
    : "overdue";

  const [counts, rows] = await Promise.all([
    getFollowUpCounts({ organizationId: user.organizationId }),
    getFollowUpsForOrg({ organizationId: user.organizationId }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">
          Reminders from your leads — nothing is sent automatically.
        </p>
      </div>
      <FollowUpsBoard
        counts={counts}
        open={rows.open}
        completed={rows.completed}
        initialTab={initialTab}
      />
    </div>
  );
}
