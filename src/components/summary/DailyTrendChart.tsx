import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, YAxis, CartesianGrid, type TooltipProps } from 'recharts'
import type { DailyPoint } from '@/lib/summary'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type DailyTrendChartProps = {
  data: DailyPoint[]
}

type DailyTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{ payload?: DailyPoint }>
}

const DailyTooltip = (props: DailyTooltipProps) => {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload as DailyPoint | undefined
  if (!entry) return null

  return (
    <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 text-sm shadow-planify-soft">
      <p className="font-medium">Dia {entry.day.toString().padStart(2, '0')}</p>
      <p className="text-muted-foreground">{currencyFormatter.format(entry.value)}</p>
    </div>
  )
}

const buildTicks = (points: DailyPoint[]) => {
  if (points.length <= 10) {
    return points.map((point) => point.day)
  }
  const step = Math.ceil(points.length / 8)
  const ticks = points.filter((_, index) => index % step === 0).map((point) => point.day)
  const lastDay = points.at(-1)?.day
  if (lastDay && ticks[ticks.length - 1] !== lastDay) {
    ticks.push(lastDay)
  }
  return ticks
}

export const DailyTrendChart = ({ data }: DailyTrendChartProps) => {
  const ticks = buildTicks(data)

  return (
    <div className="h-full min-h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -40, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => String(value).padStart(2, '0')}
            tickMargin={12}
            dy={5}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(value)
            }
            width={80}
            domain={[0, (dataMax: number) => Math.ceil((dataMax || 1) * 1.5)]}
          />
          <Tooltip content={<DailyTooltip />} cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }} />
          <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
