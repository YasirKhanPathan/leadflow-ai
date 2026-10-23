import Link from "next/link";
import { cn } from "cn";

export type PipelineView = "board" | "list";

const baseClass = "rounded-md px-3 py-1.5 text-sm transition-colors";

export function ViewToggle({ view }: { view: PipelineView }) {
  return (
    <nav
      aria-label="View mode"
      className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1"
    >
      <Link
        href="/pipeline?view=board"
        aria-current={view === "board" ? "page" : undefined}
        className={cn(
          baseClass,
          view === "board"
            ? "bg-background font-medium shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Board
      </Link>
      <Link
        href="/pipeline?view=list"
        aria-current={view === "list" ? "page" : undefined}
        className={cn(
          baseClass,
          view === "list"
            ? "bg-background font-medium shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        List
      </Link>
    </nav>
  );
}
