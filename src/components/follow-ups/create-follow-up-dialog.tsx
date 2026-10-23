"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createFollowUp,
  suggestFollowUpMessage,
  type FollowUpFormState,
} from "@/lib/actions/follow-ups";

const initialState: FollowUpFormState = {};

function CreateFollowUpContent({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    createFollowUp,
    initialState,
  );
  const [isSuggesting, startSuggestTransition] = useTransition();
  const [message, setMessage] = useState("");
  const handledSuccess = useRef(false);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      toast.success("Follow-up created");
      onClose();
    }
  }, [state, onClose]);

  function handleSuggest() {
    startSuggestTransition(async () => {
      const result = await suggestFollowUpMessage(leadId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.message !== undefined) {
        setMessage(result.message);
        toast.success("Suggestion ready — review before saving");
      }
    });
  }

  const fieldErrors = state.fieldErrors;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add follow-up</DialogTitle>
        <DialogDescription>
          Create a reminder for this lead. Nothing is sent automatically.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="grid gap-4" noValidate>
        <input type="hidden" name="leadId" value={leadId} />
        <div className="grid gap-1.5">
          <Label htmlFor="followup-title">Title (optional)</Label>
          <Input
            id="followup-title"
            name="title"
            maxLength={200}
            placeholder="e.g. Call back about the quote"
          />
          {fieldErrors?.title?.[0] ? (
            <p className="text-sm text-destructive">{fieldErrors.title[0]}</p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="followup-due">Due date</Label>
          <Input id="followup-due" name="dueDate" type="date" required />
          {fieldErrors?.dueDate?.[0] ? (
            <p className="text-sm text-destructive">{fieldErrors.dueDate[0]}</p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="followup-message">Message (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleSuggest}
              disabled={isSuggesting}
            >
              {isSuggesting ? "Suggesting…" : "Suggest with AI"}
            </Button>
          </div>
          <Textarea
            id="followup-message"
            name="message"
            rows={4}
            maxLength={5000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Draft the message you plan to send"
          />
          {fieldErrors?.message?.[0] ? (
            <p className="text-sm text-destructive">
              {fieldErrors.message[0]}
            </p>
          ) : null}
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
            {isPending ? "Saving…" : "Create follow-up"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CreateFollowUpDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Add follow-up</DialogTrigger>
      {open ? (
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <CreateFollowUpContent leadId={leadId} onClose={() => setOpen(false)} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
