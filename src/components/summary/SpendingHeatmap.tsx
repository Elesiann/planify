import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityCalendar, type ThemeInput } from 'react-activity-calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/ThemeProvider'
import { useTransactionsYear } from '@/hooks/useTransactions'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function buildHeatmapData(transactions: { date: string | null; total_amount: number }[], year: number) {
  const dailyTotals = new Map<string, number>()
  for (const t of transactions) {
    if (!t.date) continue
    const existing = dailyTotals.get(t.date) ?? 0
    dailyTotals.set(t.date, existing + t.total_amount)
  }

  const maxAmount = Math.max(...dailyTotals.values(), 1)

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  const data = []

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const amount = dailyTotals.get(dateStr) ?? 0
    const level = amount === 0 ? 0 : Math.min(4, Math.ceil((amount / maxAmount) * 4)) as 0 | 1 | 2 | 3 | 4

    data.push({
      date: dateStr,
      count: Math.round(amount),
      level,
    })
  }

  return data
}

const calendarTheme: ThemeInput = {
  light: ['#f0f0f0', '#d4d4f7', '#a5a5ed', '#7c7ce0', '#5b21b6'],
  dark: ['#1e1e2e', '#2d2b55', '#4a3f8a', '#6d5cbf', '#8b5cf6'],
}

const BLOCK_MARGIN = 4
const WEEKS_IN_YEAR = 54
const LABEL_AND_LEGEND_PAD = 80

function useResponsiveBlockSize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [blockSize, setBlockSize] = useState(12)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const calculate = () => {
      const available = el.clientWidth - LABEL_AND_LEGEND_PAD
      const size = Math.floor((available + BLOCK_MARGIN) / WEEKS_IN_YEAR - BLOCK_MARGIN)
      setBlockSize(Math.max(8, Math.min(size, 24)))
    }

    calculate()

    const observer = new ResizeObserver(calculate)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  return blockSize
}

export function SpendingHeatmap() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { theme } = useTheme()
  const { data: transactions = [] } = useTransactionsYear(year)
  const data = useMemo(() => buildHeatmapData(transactions, year), [transactions, year])
  const containerRef = useRef<HTMLDivElement>(null)
  const blockSize = useResponsiveBlockSize(containerRef)

  return (
    <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mapa de gastos</CardTitle>
            <CardDescription>Intensidade de gasto por dia ao longo do ano.</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setYear(y => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium tabular-nums w-12 text-center">{year}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setYear(y => y + 1)}
              disabled={year >= currentYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent ref={containerRef}>
        <ActivityCalendar
          data={data}
          blockSize={blockSize}
          blockMargin={BLOCK_MARGIN}
          theme={calendarTheme}
          colorScheme={theme === 'dark' ? 'dark' : 'light'}
          labels={{
            totalCount: '{{count}} gastos registrados em {{year}}',
          }}
          renderBlock={(block, activity) => (
            <g>
              <title>{`${activity.date}: ${currencyFormatter.format(activity.count)}`}</title>
              {block}
            </g>
          )}
          showWeekdayLabels
        />
      </CardContent>
    </Card>
  )
}
