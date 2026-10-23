"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/labels";
import type { PipelineSlice } from "@/lib/queries/dashboard";

export function PipelineChart({ data }: { data: PipelineSlice[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} fontSize={12} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            fontSize={12}
            tickLine={false}
          />
          <Tooltip />
          <Bar dataKey="count" name="Leads">
            {data.map((entry) => (
              <Cell key={entry.status} fill={CHART_COLORS[entry.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
