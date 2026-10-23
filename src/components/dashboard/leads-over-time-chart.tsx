"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/labels";
import type { LeadsOverTimePoint } from "@/lib/queries/dashboard";

export function LeadsOverTimeChart({ data }: { data: LeadsOverTimePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} />
          <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
          <Tooltip />
          <Bar dataKey="count" name="Leads" fill={CHART_COLORS.NEW} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
