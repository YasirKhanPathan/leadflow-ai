import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { getFollowUpCounts } from "@/lib/queries/follow-ups";

export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const counts = await getFollowUpCounts({
    organizationId: user.organizationId,
  });
  const attention = counts.overdue + counts.today;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:h-14 sm:flex-nowrap sm:py-0">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight"
          >
            LeadFlow AI
          </Link>
          <nav className="order-last flex w-full items-center gap-4 text-sm text-muted-foreground sm:order-none sm:w-auto">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/leads" className="hover:text-foreground">
              Leads
            </Link>
            <Link href="/pipeline" className="hover:text-foreground">
              Pipeline
            </Link>
            <Link
              href="/follow-ups"
              className="flex items-center gap-1.5 hover:text-foreground"
            >
              Follow-ups
              {attention > 0 ? (
                <Badge variant="destructive">{attention}</Badge>
              ) : null}
            </Link>
          </nav>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © 2026 LeadFlow AI
        </div>
      </footer>
    </div>
  );
}
