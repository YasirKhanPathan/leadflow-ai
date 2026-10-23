"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateLeadStatus } from "@/lib/actions/leads";
import { formatCurrency, formatDate } from "@/lib/format";
import { LEAD_STATUSES, leadStatusStyle } from "@/lib/labels";
import type { LeadStatus } from "@prisma/client";
import type { PipelineLead } from "./types";

const statusItems = LEAD_STATUSES.map((value) => ({
  value,
  label: leadStatusStyle[value].label,
}));

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

export function ListView({ leads }: { leads: PipelineLead[] }) {
  const [optimisticLeads, setOptimisticStatus] = useOptimistic(
    leads,
    (
      state: PipelineLead[],
      update: { id: string; status: LeadStatus },
    ) =>
      state.map((lead) =>
        lead.id === update.id ? { ...lead, status: update.status } : lead,
      ),
  );
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function changeStatus(id: string, status: LeadStatus) {
    startTransition(async () => {
      setPendingId(id);
      setOptimisticStatus({ id, status });
      try {
        const result = await updateLeadStatus({ id, status });
        if (result.error) {
          toast.error(result.error);
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell>{lead.company ?? <Dash />}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {formatCurrency(lead.budget)}
              </TableCell>
              <TableCell>
                <Select
                  value={lead.status}
                  items={statusItems}
                  disabled={isPending && pendingId === lead.id}
                  onValueChange={(value) => {
                    if (value === null) return;
                    changeStatus(lead.id, value as LeadStatus);
                  }}
                >
                  <SelectTrigger
                    className="w-36"
                    aria-label={`Status for ${lead.name}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(lead.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
