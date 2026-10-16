import { Suspense } from "react";
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
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
