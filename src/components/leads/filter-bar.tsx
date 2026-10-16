"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRIORITIES,
  leadSourceLabel,
  leadStatusStyle,
  priorityStyle,
} from "@/lib/labels";

const statusOptions = LEAD_STATUSES.map((value) => ({
  value,
  label: leadStatusStyle[value].label,
}));
const sourceOptions = LEAD_SOURCES.map((value) => ({
  value,
  label: leadSourceLabel[value],
}));
const priorityOptions = PRIORITIES.map((value) => ({
  value,
  label: priorityStyle[value].label,
}));

function validatedEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null {
  return allowed.find((option) => option === value) ?? null;
}

type FilterSelectProps = {
  label: string;
  placeholder: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
};

function FilterSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} items={options}>
      <SelectTrigger className="w-40" aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ClearFiltersButton() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Button variant="outline" size="sm" onClick={() => router.push(pathname)}>
      Clear filters
    </Button>
  );
}

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const urlQ = searchParams.get("q") ?? "";
  const status = validatedEnumParam(searchParams.get("status"), LEAD_STATUSES);
  const source = validatedEnumParam(searchParams.get("source"), LEAD_SOURCES);
  const priority = validatedEnumParam(searchParams.get("priority"), PRIORITIES);
  const hasFilters = Boolean(urlQ || status || source || priority);

  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setQuery((current) => (current.trim() === urlQ ? current : urlQ));
  }

  useEffect(() => {
    const q = query.trim();
    if (q === urlQ) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, urlQ, searchParams, router, pathname]);

  function pushFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search leads…"
          aria-label="Search leads"
          className="pl-8"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Filter by status"
          placeholder="All statuses"
          value={status}
          options={statusOptions}
          onChange={(value) => pushFilters({ status: value })}
        />
        <FilterSelect
          label="Filter by source"
          placeholder="All sources"
          value={source}
          options={sourceOptions}
          onChange={(value) => pushFilters({ source: value })}
        />
        <FilterSelect
          label="Filter by priority"
          placeholder="All priorities"
          value={priority}
          options={priorityOptions}
          onChange={(value) => pushFilters({ priority: value })}
        />
        {hasFilters ? <ClearFiltersButton /> : null}
      </div>
    </div>
  );
}
