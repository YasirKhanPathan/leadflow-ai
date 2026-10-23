import Link from "next/link";
import { BoardView } from "@/components/pipeline/board-view";
import { ListView } from "@/components/pipeline/list-view";
import type { PipelineLead } from "@/components/pipeline/types";
import {
  ViewToggle,
  type PipelineView,
} from "@/components/pipeline/view-toggle";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { getPipelineLeads } from "@/lib/queries/leads";

export default async function PipelinePage({
  searchParams,
}: PageProps<"/pipeline">) {
  const user = await requireAuth();
  const params = await searchParams;
  const view: PipelineView = params.view === "list" ? "list" : "board";

  const leads = await getPipelineLeads(user.organizationId);
  const rows: PipelineLead[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    company: lead.company,
    budget: lead.budget ? lead.budget.toString() : null,
    status: lead.status,
    priority: lead.priority,
    createdAt: lead.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <ViewToggle view={view} />
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <h2 className="text-lg font-semibold">No leads yet</h2>
          <Link
            href="/leads"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Add your first lead
          </Link>
        </div>
      ) : view === "list" ? (
        <ListView leads={rows} />
      ) : (
        <BoardView leads={rows} />
      )}
    </div>
  );
}
