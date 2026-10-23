export type DayBounds = {
  startToday: Date;
  endToday: Date;
};

export function getUtcDayBounds(now: Date): DayBounds {
  const startToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const endToday = new Date(startToday.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startToday, endToday };
}

export type FollowUpBucket = "overdue" | "today" | "upcoming";

export function bucketOf(
  dueDate: Date,
  bounds: DayBounds,
): FollowUpBucket {
  if (dueDate.getTime() < bounds.startToday.getTime()) {
    return "overdue";
  }
  if (dueDate.getTime() <= bounds.endToday.getTime()) {
    return "today";
  }
  return "upcoming";
}
