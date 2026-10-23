import { z } from "zod";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CUSTOM_DAYS = 366;

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const dashboardRangeSchema = z.object({
  range: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type DashboardRangeInput = z.infer<typeof dashboardRangeSchema>;

export type ResolvedRange = {
  from: Date;
  to: Date;
  rangeParam: "7" | "30" | "90" | "custom";
  fromParam: string | null;
  toParam: string | null;
};

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function endOfUtcDay(d: Date): Date {
  return new Date(startOfUtcDay(d).getTime() + DAY_MS - 1);
}

function parseDateOnly(s: string): Date | null {
  if (!dateOnlyRegex.test(s)) return null;
  const d = new Date(s + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== s) return null;
  return d;
}

export function resolveDashboardRange(
  params: DashboardRangeInput,
): ResolvedRange {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const todayEnd = endOfUtcDay(now);

  const range = params.range;

  if (range === "7" || range === "30" || range === "90") {
    const days = parseInt(range, 10);
    return {
      from: new Date(todayStart.getTime() - (days - 1) * DAY_MS),
      to: todayEnd,
      rangeParam: range,
      fromParam: null,
      toParam: null,
    };
  }

  if (range === "custom" && params.from && params.to) {
    const fromDate = parseDateOnly(params.from);
    const toDate = parseDateOnly(params.to);
    if (fromDate && toDate) {
      const from = startOfUtcDay(fromDate);
      const to = endOfUtcDay(toDate);
      if (from.getTime() <= to.getTime()) {
        const spanDays =
          Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1;
        if (spanDays <= MAX_CUSTOM_DAYS) {
          return {
            from,
            to,
            rangeParam: "custom",
            fromParam: params.from,
            toParam: params.to,
          };
        }
      }
    }
  }

  return {
    from: new Date(todayStart.getTime() - 29 * DAY_MS),
    to: todayEnd,
    rangeParam: "30",
    fromParam: null,
    toParam: null,
  };
}
