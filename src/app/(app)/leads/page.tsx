import {
  ClearFiltersButton,
  FilterBar,
} from "@/components/leads/filter-bar";
import { LeadsHeader } from "@/components/leads/header";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadPagination } from "@/components/leads/pagination";
import { LeadsTable } from "@/components/leads/leads-table";
import type { LeadRow } from "@/components/leads/types";
import { requireAuth } from "@/lib/auth";
import { countLeads, getLeads, PAGE_SIZE } from "@/lib/queries/leads";
import { leadFilterSchema } from "@/lib/validations/lead";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const user = await requireAuth();
  const parsedFilters = leadFilterSchema.safeParse(await searchParams);
  const filters = parsedFilters.success ? parsedFilters.data : { page: 1 };
  const organizationId = user.organizationId;

  const [filteredTotal, allTotal, leads] = await Promise.all([
    countLeads({ organizationId, filters }),
    countLeads({ organizationId, filters: { page: 1 } }),
    getLeads({ organizationId, filters }),
  ]);

  const rows: LeadRow[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    serviceNeeded: lead.serviceNeeded,
    budget: lead.budget ? lead.budget.toString() : null,
    budgetLabel: lead.budget
      ? currencyFormatter.format(Number(lead.budget.toString()))
      : null,
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    notes: lead.notes,
    inquiry: lead.inquiry,
    createdAtLabel: dateFormatter.format(lead.createdAt),
  }));

  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);

  const filterParams = new URLSearchParams();
  if (filters.q) filterParams.set("q", filters.q);
  if (filters.status) filterParams.set("status", filters.status);
  if (filters.source) filterParams.set("source", filters.source);
  if (filters.priority) filterParams.set("priority", filters.priority);
  const filterQuery = filterParams.toString();
  const basePath = filterQuery ? `/leads?${filterQuery}` : "/leads";

  return (
    <div className="flex flex-col gap-4">
      <LeadsHeader />
      <FilterBar />
      {allTotal === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <h2 className="text-lg font-semibold">No leads yet</h2>
          <LeadFormDialog triggerLabel="Add your first lead" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <h2 className="text-lg font-semibold">No leads match your filters</h2>
          <ClearFiltersButton />
        </div>
      ) : (
        <>
          <LeadsTable rows={rows} />
          <LeadPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
          />
        </>
      )}
    </div>
  );
}
