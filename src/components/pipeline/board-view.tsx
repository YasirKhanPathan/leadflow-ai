"use client";

import { useState, useOptimistic, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { updateLeadStatus } from "@/lib/actions/leads";
import { formatCurrency } from "@/lib/format";
import {
  LEAD_STATUSES,
  leadStatusStyle,
  priorityStyle,
} from "@/lib/labels";
import type { LeadStatus } from "@prisma/client";
import type { PipelineLead } from "./types";

type StatusUpdate = { id: string; status: LeadStatus };

function BoardCard({
  lead,
  className,
  overlay = false,
  pending = false,
  setNodeRef,
  listeners,
  attributes,
}: {
  lead: PipelineLead;
  className?: string;
  overlay?: boolean;
  pending?: boolean;
  setNodeRef?: (element: HTMLElement | null) => void;
  listeners?: ReturnType<typeof useDraggable>["listeners"];
  attributes?: ReturnType<typeof useDraggable>["attributes"];
}) {
  const priority = priorityStyle[lead.priority];
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "space-y-1.5 rounded-lg border bg-background p-3 shadow-sm",
        !overlay && "cursor-grab active:cursor-grabbing",
        overlay && "shadow-lg ring-1 ring-ring/20",
        pending && "animate-pulse opacity-60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${lead.id}`}
          className="text-sm font-medium leading-snug hover:underline"
        >
          {lead.name}
        </Link>
        <Badge variant={priority.variant} className={priority.className}>
          {priority.label}
        </Badge>
      </div>
      {lead.company ? (
        <p className="truncate text-xs text-muted-foreground">
          {lead.company}
        </p>
      ) : null}
      <p className="text-xs tabular-nums text-muted-foreground">
        {formatCurrency(lead.budget)}
      </p>
    </div>
  );
}

function DraggableCard({
  lead,
  pending,
}: {
  lead: PipelineLead;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.status },
  });
  return (
    <BoardCard
      lead={lead}
      pending={pending}
      setNodeRef={setNodeRef}
      listeners={listeners}
      attributes={attributes}
      className={isDragging ? "opacity-40" : undefined}
    />
  );
}

function Column({
  stage,
  leads,
  pendingId,
  pendingActive,
}: {
  stage: LeadStatus;
  leads: PipelineLead[];
  pendingId: string | null;
  pendingActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const style = leadStatusStyle[stage];
  const total = leads.reduce(
    (sum, lead) => sum + (lead.budget ? Number(lead.budget) : 0),
    0,
  );

  return (
    <section className="flex w-[260px] min-w-[260px] shrink-0 flex-col gap-3">
      <header className="space-y-1 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={style.variant} className={style.className}>
            {style.label}
          </Badge>
          <span className="text-xs tabular-nums text-muted-foreground">
            {leads.length} {leads.length === 1 ? "lead" : "leads"}
          </span>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatCurrency(total)}
        </p>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-lg p-1 transition-colors",
          isOver && "bg-primary/5",
        )}
      >
        {leads.length === 0 ? (
          <div
            className={cn(
              "flex min-h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground",
              isOver && "border-primary text-primary",
            )}
          >
            Drop here
          </div>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.id}
              lead={lead}
              pending={pendingActive && pendingId === lead.id}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function BoardView({ leads }: { leads: PipelineLead[] }) {
  const [optimisticLeads, setOptimisticStatus] = useOptimistic(
    leads,
    (state: PipelineLead[], update: StatusUpdate) =>
      state.map((lead) =>
        lead.id === update.id ? { ...lead, status: update.status } : lead,
      ),
  );
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const activeLead = activeId
    ? (optimisticLeads.find((lead) => lead.id === activeId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const lead = optimisticLeads.find((item) => item.id === active.id);
    if (!lead) return;

    const target = over.id;
    if (typeof target !== "string") return;
    if (!LEAD_STATUSES.includes(target as LeadStatus)) return;
    const nextStatus = target as LeadStatus;
    if (nextStatus === lead.status) return;

    startTransition(async () => {
      setPendingId(lead.id);
      setOptimisticStatus({ id: lead.id, status: nextStatus });
      try {
        const result = await updateLeadStatus({
          id: lead.id,
          status: nextStatus,
        });
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-max gap-4">
          {LEAD_STATUSES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              leads={optimisticLeads.filter((lead) => lead.status === stage)}
              pendingId={pendingId}
              pendingActive={isPending}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeLead ? (
          <BoardCard lead={activeLead} overlay className="w-[260px]" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
