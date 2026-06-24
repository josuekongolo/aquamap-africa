"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const fmtDate = (value) => new Date(value).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })

// Data-driven version of the dashboard-01 interactive area chart.
// data: [{ date, ...seriesKeys }]; config: shadcn chart config keyed by series.
export function ChartAreaInteractive({ data = [], config = {}, title, description }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => { if (isMobile) setTimeRange("7d") }, [isMobile])

  const keys = Object.keys(config)
  const filteredData = React.useMemo(() => {
    if (!data.length) return []
    const last = new Date(data[data.length - 1].date)
    const days = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90
    const start = new Date(last)
    start.setDate(start.getDate() - days)
    return data.filter((d) => new Date(d.date) >= start)
  }, [data, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single" value={timeRange} onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex">
            <ToggleGroupItem value="90d">90 j</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 j</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 j</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="flex w-28 @[767px]/card:hidden" size="sm" aria-label="Période">
              <SelectValue placeholder="90 j" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">90 j</SelectItem>
              <SelectItem value="30d" className="rounded-lg">30 j</SelectItem>
              <SelectItem value="7d" className="rounded-lg">7 j</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">—</div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                {keys.map((k) => (
                  <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={fmtDate} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={fmtDate} indicator="dot" />} />
              {keys.map((k) => (
                <Area key={k} dataKey={k} type="natural" fill={`url(#fill-${k})`} stroke={`var(--color-${k})`} stackId="a" />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
