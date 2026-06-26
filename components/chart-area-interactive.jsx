"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Download } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"

const fmtDate = (value) => new Date(value).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })

// Resolve a config color (which may be `var(--brand)`) to a concrete value for export.
function resolveColor(c) {
  if (typeof c !== "string") return "#0D6B8A"
  const m = c.match(/var\((--[^)]+)\)/)
  if (m && typeof window !== "undefined") {
    const v = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim()
    return v || "#0D6B8A"
  }
  return c
}

// Data-driven interactive area chart with metric selection + PNG export.
// data: [{ date, ...seriesKeys }]; config: shadcn chart config keyed by series.
export function ChartAreaInteractive({ data = [], config = {}, title, description, filename = "chart" }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const allKeys = Object.keys(config)
  const [active, setActive] = React.useState(allKeys.slice(0, 2))
  const chartRef = React.useRef(null)

  React.useEffect(() => { if (isMobile) setTimeRange("7d") }, [isMobile])
  // Keep the active selection valid if the available series change.
  React.useEffect(() => {
    setActive((a) => {
      const v = a.filter((k) => allKeys.includes(k))
      return v.length ? v : allKeys.slice(0, 2)
    })
  }, [allKeys.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredData = React.useMemo(() => {
    if (!data.length) return []
    const last = new Date(data[data.length - 1].date)
    const days = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90
    const start = new Date(last)
    start.setDate(start.getDate() - days)
    return data.filter((d) => new Date(d.date) >= start)
  }, [data, timeRange])

  const visibleKeys = active.length ? active : allKeys

  function downloadPng() {
    const svg = chartRef.current?.querySelector("svg")
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const w = Math.round(rect.width) || 800
    const h = Math.round(rect.height) || 300
    let s = new XMLSerializer().serializeToString(svg)
    for (const k of allKeys) s = s.split(`var(--color-${k})`).join(resolveColor(config[k].color))
    s = s.replace(/var\(--color-[^)]+\)/g, "#0D6B8A")
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement("canvas")
      canvas.width = w * scale; canvas.height = h * scale
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((b) => {
        if (!b) return
        const a = document.createElement("a")
        a.href = URL.createObjectURL(b); a.download = `${filename}.png`; a.click()
        URL.revokeObjectURL(a.href)
      }, "image/png")
    }
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s)
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="flex items-center gap-2">
          <ToggleGroup
            type="single" value={timeRange} onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[900px]/card:flex">
            <ToggleGroupItem value="90d">90 j</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 j</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 j</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="flex w-24 @[900px]/card:hidden" size="sm" aria-label="Période">
              <SelectValue placeholder="90 j" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d">90 j</SelectItem>
              <SelectItem value="30d">30 j</SelectItem>
              <SelectItem value="7d">7 j</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="size-8" onClick={downloadPng}
            disabled={filteredData.length === 0} title="PNG" aria-label="Download PNG">
            <Download className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>

      {/* Metric chooser — pick which series to show */}
      <div className="px-4 sm:px-6 -mt-2">
        <ToggleGroup
          type="multiple" value={active} variant="outline" size="sm"
          onValueChange={(v) => setActive(v.length ? v : active)}
          className="flex flex-wrap justify-start gap-1">
          {allKeys.map((k) => (
            <ToggleGroupItem key={k} value={k} className="px-3 gap-1.5 data-[state=on]:text-white"
              style={active.includes(k) ? { backgroundColor: resolveColor(config[k].color), borderColor: "transparent" } : undefined}>
              {config[k].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-4">
        {filteredData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">—</div>
        ) : (
          <div ref={chartRef}>
            <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
              <AreaChart data={filteredData}>
                <defs>
                  {visibleKeys.map((k) => (
                    <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.08} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={fmtDate} />
                <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={fmtDate} indicator="dot" />} />
                {visibleKeys.map((k) => (
                  <Area key={k} dataKey={k} type="monotone" fill={`url(#fill-${k})`} stroke={`var(--color-${k})`} strokeWidth={2} />
                ))}
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
