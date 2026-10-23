const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatCurrency(value: string | number | null): string {
  if (value === null || value === "") {
    return "—";
  }
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) {
    return "—";
  }
  return currencyFormatter.format(amount);
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateWithTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatMonthDay(iso: string): string {
  return monthDayFormatter.format(new Date(iso));
}
