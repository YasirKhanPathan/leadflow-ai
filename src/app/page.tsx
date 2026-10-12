import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { Suspense } from "react";

async function DatabaseStatus() {
  await connection();

  let connected = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    connected = false;
  }

  return (
    <p
      className={`text-sm font-medium ${
        connected ? "text-green-600" : "text-red-600"
      }`}
    >
      {connected ? "Database: connected" : "Database: error"}
    </p>
  );
}

function DatabaseStatusFallback() {
  return (
    <p className="text-sm font-medium text-muted-foreground">
      Database: checking…
    </p>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">LeadFlow AI</CardTitle>
          <CardDescription>
            Smart lead management &amp; follow-up for agencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DatabaseStatusFallback />}>
            <DatabaseStatus />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
