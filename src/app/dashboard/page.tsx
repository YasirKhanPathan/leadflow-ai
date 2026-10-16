import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function DashboardContent() {
  const user = await requireAuth();

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Signed in as {user.name} ({user.email})
      </h1>
      <p className="text-sm text-muted-foreground">
        Organization: {organization?.name ?? "Unknown"}
      </p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center font-sans dark:bg-black">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        }
      >
        <DashboardContent />
      </Suspense>
    </main>
  );
}
