"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CarrierPerformanceChartProps,
  PieChartLabelProps,
} from "@tms/shared-types";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export function CarrierPerformance({ data }: CarrierPerformanceChartProps) {
  // Ensure data has valid values
  const validData = data?.filter((item) => item.value > 0) || [];

  if (!data || data.length === 0 || validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carrier Performance</CardTitle>
          <CardDescription>
            Top performing carriers by load count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No carrier performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier Performance</CardTitle>
        <CardDescription>Top performing carriers by load count</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <PieChart>
              <Pie
                data={validData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieChartLabelProps) => {
                  const { name, percent } = props;
                  if (!name || percent === undefined) return "";
                  return `${name} ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                innerRadius={20}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {validData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0]?.name}
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0]?.value} loads
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
