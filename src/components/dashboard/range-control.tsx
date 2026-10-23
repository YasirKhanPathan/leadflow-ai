"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RangeControlProps = {
  currentRange: "7" | "30" | "90" | "custom";
  currentFrom: string | null;
  currentTo: string | null;
};

const PRESETS = [
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
] as const;

export function RangeControl({
  currentRange,
  currentFrom,
  currentTo,
}: RangeControlProps) {
  const router = useRouter();
  const [customOpen, setCustomOpen] = useState(currentRange === "custom");
  const [from, setFrom] = useState(currentFrom ?? "");
  const [to, setTo] = useState(currentTo ?? "");

  function go(range: string, f?: string, t?: string) {
    const params = new URLSearchParams({ range });
    if (range === "custom" && f && t) {
      params.set("from", f);
      params.set("to", t);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.value}
          variant={currentRange === p.value ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setCustomOpen(false);
            go(p.value);
          }}
        >
          {p.label}
        </Button>
      ))}
      <Button
        variant={currentRange === "custom" ? "default" : "outline"}
        size="sm"
        onClick={() => setCustomOpen((v) => !v)}
      >
        Custom
      </Button>
      {customOpen ? (
        <span className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
          <Button
            size="sm"
            disabled={!from || !to}
            onClick={() => go("custom", from, to)}
          >
            Apply
          </Button>
        </span>
      ) : null}
    </div>
  );
}
