"use client";

import { useTransition, useState } from "react";
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
import { rescheduleFollowUp } from "@/lib/actions/follow-ups";

export function RescheduleDialog({
  id,
  currentDueDate,
}: {
  id: string;
  currentDueDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentDueDate.slice(0, 10));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value) {
      toast.error("Pick a date");
      return;
    }
    startTransition(async () => {
      const result = await rescheduleFollowUp(id, value);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Follow-up rescheduled");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="xs" />}>
        Reschedule
      </DialogTrigger>
      {open ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule follow-up</DialogTitle>
            <DialogDescription>
              Pick the new due date. Past dates are allowed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={`reschedule-${id}`}>Due date</Label>
              <Input
                id={`reschedule-${id}`}
                type="date"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save date"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
