import type { LeadStatus } from "@prisma/client";

export function statusTimestamps(status: LeadStatus): {
  wonAt: Date | null;
  lostAt: Date | null;
} {
  if (status === "WON") {
    return { wonAt: new Date(), lostAt: null };
  }
  if (status === "LOST") {
    return { wonAt: null, lostAt: new Date() };
  }
  return { wonAt: null, lostAt: null };
}
