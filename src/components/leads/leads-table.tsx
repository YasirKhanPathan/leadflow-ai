import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteLeadButton } from "@/components/leads/delete-lead-button";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import type { LeadRow } from "@/components/leads/types";
import { leadSourceLabel, leadStatusStyle, priorityStyle } from "@/lib/labels";

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="hidden md:table-cell">Service</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead className="hidden md:table-cell">Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const status = leadStatusStyle[row.status];
            const priority = priorityStyle[row.priority];
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/leads/${row.id}`}
                    className="hover:underline"
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>{row.company ?? <Dash />}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {row.serviceNeeded ?? <Dash />}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {row.budgetLabel ?? <Dash />}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {leadSourceLabel[row.source]}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className={status.className}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={priority.variant} className={priority.className}>
                    {priority.label}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {row.createdAtLabel}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <LeadFormDialog lead={row} />
                    <DeleteLeadButton id={row.id} name={row.name} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
