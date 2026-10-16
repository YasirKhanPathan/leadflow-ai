import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  return session.user;
}
