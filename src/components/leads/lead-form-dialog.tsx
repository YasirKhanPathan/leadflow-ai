"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLead, updateLead, type LeadFormState } from "@/lib/actions/leads";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRIORITIES,
  leadSourceLabel,
  leadStatusStyle,
  priorityStyle,
} from "@/lib/labels";
import { cn } from "cn";
import type { LeadRow } from "./types";

const initialState: LeadFormState = {};

const sourceItems = LEAD_SOURCES.map((value) => ({
  value,
  label: leadSourceLabel[value],
}));
const statusItems = LEAD_STATUSES.map((value) => ({
  value,
  label: leadStatusStyle[value].label,
}));
const priorityItems = PRIORITIES.map((value) => ({
  value,
  label: priorityStyle[value].label,
}));

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error?.[0] ? <p className="text-sm text-destructive">{error[0]}</p> : null}
    </div>
  );
}

function LeadFormContent({
  lead,
  onClose,
}: {
  lead?: LeadRow;
  onClose: () => void;
}) {
  const action = lead ? updateLead : createLead;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [source, setSource] = useState<LeadRow["source"]>(lead?.source ?? "OTHER");
  const [status, setStatus] = useState<LeadRow["status"]>(lead?.status ?? "NEW");
  const [priority, setPriority] = useState<LeadRow["priority"]>(
    lead?.priority ?? "MEDIUM",
  );
  const handledSuccess = useRef(false);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      toast.success(lead ? "Lead updated" : "Lead created");
      onClose();
    }
  }, [state, lead, onClose]);

  const fieldErrors = state.fieldErrors;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{lead ? "Edit lead" : "Add lead"}</DialogTitle>
        <DialogDescription>
          {lead
            ? "Update the details for this lead."
            : "Add a new lead to your organization."}
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="grid gap-4" noValidate>
        {lead ? <input type="hidden" name="id" value={lead.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            htmlFor="lead-name"
            error={fieldErrors?.name}
            className="sm:col-span-2"
          >
            <Input id="lead-name" name="name" defaultValue={lead?.name} />
          </Field>
          <Field
            label="Email"
            htmlFor="lead-email"
            error={fieldErrors?.email}
            className="sm:col-span-2"
          >
            <Input
              id="lead-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={lead?.email}
            />
          </Field>
          <Field label="Company" htmlFor="lead-company" error={fieldErrors?.company}>
            <Input id="lead-company" name="company" defaultValue={lead?.company ?? ""} />
          </Field>
          <Field
            label="Service needed"
            htmlFor="lead-service"
            error={fieldErrors?.serviceNeeded}
          >
            <Input
              id="lead-service"
              name="serviceNeeded"
              defaultValue={lead?.serviceNeeded ?? ""}
            />
          </Field>
          <Field label="Budget (USD)" htmlFor="lead-budget" error={fieldErrors?.budget}>
            <Input
              id="lead-budget"
              name="budget"
              inputMode="decimal"
              placeholder="e.g. 5000"
              defaultValue={lead?.budget ?? ""}
            />
          </Field>
          <Field label="Source" error={fieldErrors?.source}>
            <Select
              value={source}
              onValueChange={(value) => {
                if (value) setSource(value);
              }}
              items={sourceItems}
            >
              <SelectTrigger className="w-full" aria-label="Source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="source" value={source} />
          </Field>
          <Field label="Status" error={fieldErrors?.status}>
            <Select
              value={status}
              onValueChange={(value) => {
                if (value) setStatus(value);
              }}
              items={statusItems}
            >
              <SelectTrigger className="w-full" aria-label="Status">
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
            <input type="hidden" name="status" value={status} />
          </Field>
          <Field label="Priority" error={fieldErrors?.priority}>
            <Select
              value={priority}
              onValueChange={(value) => {
                if (value) setPriority(value);
              }}
              items={priorityItems}
            >
              <SelectTrigger className="w-full" aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="priority" value={priority} />
          </Field>
          <Field
            label="Notes"
            htmlFor="lead-notes"
            error={fieldErrors?.notes}
            className="sm:col-span-2"
          >
            <Textarea
              id="lead-notes"
              name="notes"
              rows={3}
              defaultValue={lead?.notes ?? ""}
            />
          </Field>
          <Field
            label="Inquiry"
            htmlFor="lead-inquiry"
            error={fieldErrors?.inquiry}
            className="sm:col-span-2"
          >
            <Textarea
              id="lead-inquiry"
              name="inquiry"
              rows={3}
              defaultValue={lead?.inquiry ?? ""}
            />
          </Field>
        </div>
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : lead ? "Save changes" : "Create lead"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function LeadFormDialog({
  lead,
  triggerLabel,
}: {
  lead?: LeadRow;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={lead ? "ghost" : "default"}
            size={lead ? "xs" : "default"}
          />
        }
      >
        {lead ? "Edit" : (triggerLabel ?? "Add Lead")}
      </DialogTrigger>
      {open ? (
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <LeadFormContent lead={lead} onClose={() => setOpen(false)} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
