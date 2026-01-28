import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipProps } from 'recharts'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { CategoryBreakdown } from '@/lib/summary'
import { cn } from '@/lib/utils'

const COLORS = ['#7C3AED', '#6366F1', '#38BDF8', '#22D3EE', '#34D399', '#10B981', '#4ADE80', '#2563EB']
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type ChartTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{ payload?: CategoryBreakdown }>
}

const ChartTooltip = (props: ChartTooltipProps) => {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const breakdown = entry.payload as CategoryBreakdown

  return (
    <div className="rounded-xl border border-border/70 bg-background/95 p-3 text-sm shadow-planify-soft">
      <p className="font-semibold">{breakdown.name}</p>
      <p className="text-muted-foreground">
        {currencyFormatter.format(breakdown.value)} · {breakdown.percentage.toFixed(1)}%
      </p>
    </div>
  )
}

type SummaryChartsProps = {
  monthlyData: CategoryBreakdown[]
  annualData: CategoryBreakdown[]
  className?: string
}

export const SummaryCharts = ({ monthlyData, annualData, className }: SummaryChartsProps) => {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly')
  const [showFixed, setShowFixed] = useState(true)

  const rawData = view === 'monthly' ? monthlyData : annualData

  const data = useMemo(() => {
    if (showFixed) return rawData
    return rawData.filter((item) => item.name !== 'Despesas fixas')
  }, [rawData, showFixed])

  const total = useMemo(() => data.reduce((acc, entry) => acc + entry.value, 0), [data])

  const normalizedData = useMemo(() => {
    if (total === 0) return data
    return data.map((item) => ({
      ...item,
      percentage: (item.value / total) * 100,
    }))
  }, [data, total])

  return (
    <Card className={cn('flex flex-col rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft', className)}>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Distribuição de gastos</CardTitle>
          <p className="text-sm text-muted-foreground">Compare os gastos mensais e o acumulado anual por categoria.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="chart-fixed" checked={showFixed} onCheckedChange={setShowFixed} />
            <Label htmlFor="chart-fixed" className="text-xs text-muted-foreground">
              Fixos
            </Label>
          </div>
          <Tabs value={view} onValueChange={(value) => setView(value as 'monthly' | 'annual')}>
            <TabsList className="bg-secondary/30">
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="annual">Anual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {normalizedData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ainda não existem dados para o período selecionado.
          </p>
        ) : (
          <div className="flex h-full flex-col gap-6 md:flex-row">
            <div className="h-full min-h-[320px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    nameKey="name"
                    data={normalizedData}
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {normalizedData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border/40 bg-muted/10 p-4 text-sm text-muted-foreground">
                {normalizedData.map((point, index) => (
                  <div key={point.name} className="flex items-center gap-2 rounded-full border border-border/50 px-3 py-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="font-medium text-foreground">{point.name}</span>
                    <span>{point.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border/40 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                Total {currencyFormatter.format(total)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
