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
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-semibold tracking-tight"
            >
              LeadFlow AI
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
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
          </div>
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
    </div>
  );
}
