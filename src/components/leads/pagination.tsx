import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

function pageHref(basePath: string, page: number) {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}page=${page}`;
}

export function LeadPagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  const previous =
    currentPage > 1 ? pageHref(basePath, currentPage - 1) : null;
  const next =
    currentPage < totalPages ? pageHref(basePath, currentPage + 1) : null;

  return (
    <div className="flex items-center justify-between gap-4">
      {previous ? (
        <Link
          href={previous}
          className={buttonVariants({ variant: "outline" })}
        >
          Previous
        </Link>
      ) : (
        <span
          className={buttonVariants({
            variant: "outline",
            className: "pointer-events-none opacity-50",
          })}
        >
          Previous
        </span>
      )}
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      {next ? (
        <Link href={next} className={buttonVariants({ variant: "outline" })}>
          Next
        </Link>
      ) : (
        <span
          className={buttonVariants({
            variant: "outline",
            className: "pointer-events-none opacity-50",
          })}
        >
          Next
        </span>
      )}
    </div>
  );
}
