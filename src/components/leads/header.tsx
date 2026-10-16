import { LeadFormDialog } from "@/components/leads/lead-form-dialog";

export function LeadsHeader() {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
      <LeadFormDialog />
    </div>
  );
}
