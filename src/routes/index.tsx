import { useMemo, useState } from 'react'
import { HeroCard } from '@/components/planify/HeroCard'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransactions, useTransactionsYear } from '@/hooks/useTransactions'
import { useFixedExpenses } from '@/hooks/useFixedExpenses'
import { useHouseholdFinancialConfig } from '@/hooks/useHouseholdMembers'
import { useHousehold } from '@/lib/HouseholdProvider'
import { SummaryCharts } from '@/components/summary/SummaryCharts'
import { DailyTrendChart } from '@/components/summary/DailyTrendChart'
import { buildAnnualSummary, buildDailySeries, buildMonthlySummary, type FinancialConfig, DEFAULT_FINANCIAL_CONFIG } from '@/lib/summary'
import { cn } from '@/lib/utils'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const formatPercentage = (value: number) => `${value.toFixed(1)}%`

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
]

type StatTileProps = {
  label: string
  value: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'muted' | 'warning'
  className?: string
}

const StatTile = ({ label, value, description, size = 'md', tone = 'default', className }: StatTileProps) => (
  <div
    className={cn(
      'rounded-2xl border border-border/60 p-4 shadow-planify-soft/40',
      tone === 'muted' && 'bg-card/60 text-muted-foreground',
      tone === 'default' && 'bg-card/80 text-foreground',
      tone === 'warning' && 'border-amber-400/40 bg-amber-400/10 text-amber-50',
      className,
    )}
  >
    <p
      className={cn(
        'text-xs uppercase tracking-wide',
        tone === 'warning' ? 'text-amber-200/90' : 'text-muted-foreground/80',
      )}
    >
      {label}
    </p>
    <p
      className={cn(
        'leading-tight',
        size === 'lg' && 'text-3xl font-semibold',
        size === 'md' && 'text-2xl font-semibold',
        size === 'sm' && 'text-base font-semibold',
        tone === 'warning' ? 'text-amber-50' : 'text-foreground',
      )}
    >
      {value}
    </p>
    {description && (
      <p className={cn('text-xs', tone === 'warning' ? 'text-amber-200/80' : 'text-muted-foreground')}>{description}</p>
    )}
  </div>
)

const DashboardPage = () => {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showFixedExpenses, setShowFixedExpenses] = useState(false)

  const { activeHousehold } = useHousehold()
  const householdConfig = useHouseholdFinancialConfig()
  const fixedDueDay = activeHousehold?.fixed_due_day ?? 5

  // Build financial config from household members data
  // MemberA = current user, MemberB = partner
  const financialConfig: FinancialConfig = useMemo(() => {
    if (householdConfig.isLoading || !householdConfig.currentUser) {
      return DEFAULT_FINANCIAL_CONFIG
    }
    return {
      shareMemberA: householdConfig.currentUser?.share ?? 0.5,
      shareMemberB: householdConfig.partner?.share ?? 0.5,
      incomeMemberA: householdConfig.currentUser?.income ?? 0,
      incomeMemberB: householdConfig.partner?.income ?? 0,
    }
  }, [householdConfig])

  // Dynamic labels based on user role
  // If owner: "Você" = MemberA (owner), "Parceiro(a)" = MemberB  
  // If not owner: "Você" = MemberB, "Parceiro(a)" = MemberA
  const labels = useMemo(() => ({
    you: 'Você',
    partner: 'Parceiro(a)',
    getMemberALabel: () => 'Você',
    getMemberBLabel: () => householdConfig.partner?.name ?? 'Parceiro(a)',
  }), [householdConfig.partner])

  const yearOptions = useMemo(() => [year - 1, year, year + 1], [year])
  const previousPeriod = useMemo(() => {
    const baseDate = new Date(year, month - 1, 1)
    baseDate.setMonth(baseDate.getMonth() - 1)
    return {
      month: baseDate.getMonth() + 1,
      year: baseDate.getFullYear(),
    }
  }, [month, year])

  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    isError: hasTransactionsError,
  } = useTransactions({ month, year })
  const {
    data: previousTransactions = [],
    isLoading: isLoadingPrevious,
    isError: hasPreviousError,
  } = useTransactions(previousPeriod)
  const { data: annualTransactions = [], isLoading: isLoadingAnnual } = useTransactionsYear(year)
  const {
    data: fixedExpenses = [],
    isLoading: isLoadingFixed,
    isError: hasFixedError,
  } = useFixedExpenses()

  const monthlySummary = useMemo(
    () => buildMonthlySummary(transactions, fixedExpenses, month, year, financialConfig, fixedDueDay),
    [transactions, fixedExpenses, month, year, financialConfig, fixedDueDay],
  )

  const dailySeries = useMemo(() => {
    const daysInMonth = monthlySummary.diasNoMes
    return buildDailySeries(transactions, fixedExpenses, daysInMonth, showFixedExpenses, fixedDueDay)
  }, [transactions, fixedExpenses, monthlySummary.diasNoMes, showFixedExpenses, fixedDueDay])

  const annualSummary = useMemo(
    () => buildAnnualSummary(annualTransactions, fixedExpenses, year, financialConfig),
    [annualTransactions, fixedExpenses, year, financialConfig],
  )

  const previousMonthlySummary = useMemo(
    () =>
      buildMonthlySummary(previousTransactions, fixedExpenses, previousPeriod.month, previousPeriod.year, financialConfig, fixedDueDay),
    [previousTransactions, fixedExpenses, previousPeriod.month, previousPeriod.year, financialConfig, fixedDueDay],
  )

  const isLoading = isLoadingTransactions || isLoadingAnnual || isLoadingFixed || isLoadingPrevious
  const hasError = hasTransactionsError || hasFixedError || hasPreviousError
  const hasData =
    monthlySummary.totalGasto > 0 ||
    annualSummary.categoriasAnual.length > 0 ||
    monthlySummary.proximoVencimento.length > 0

  const mainStats = [
    {
      label: 'Total gasto no mês',
      value: currencyFormatter.format(monthlySummary.totalGasto),
      description: 'Despesas fixas + variáveis do período selecionado.',
    },
    {
      label: `Parte de ${labels.getMemberALabel()}`,
      value: currencyFormatter.format(monthlySummary.parteMemberA),
      description: 'Proporção configurada dos gastos do mês.',
    },
    {
      label: `Parte de ${labels.getMemberBLabel()}`,
      value: currencyFormatter.format(monthlySummary.parteMemberB),
      description: 'Proporção configurada dos gastos do mês.',
    },
    {
      label: 'Logs sincronizados',
      value: `${monthlySummary.logsSincronizados} lançamento${monthlySummary.logsSincronizados === 1 ? '' : 's'}`,
      description: 'Transações variáveis registradas no período.',
    },
  ]

  const incomeStats = [
    {
      label: 'Income total do casal',
      value: currencyFormatter.format(monthlySummary.incomeTotal),
      description: 'Valores configurados conforme a planilha.',
    },
    {
      label: `Income de ${labels.getMemberALabel()}`,
      value: currencyFormatter.format(monthlySummary.incomeMemberA),
      description: `Renda mensal informada.`,
    },
    {
      label: `Income de ${labels.getMemberBLabel()}`,
      value: currencyFormatter.format(monthlySummary.incomeMemberB),
      description: `Renda mensal informada.`,
    },
  ]

  const commitmentStats = [
    {
      label: labels.getMemberALabel(),
      value: formatPercentage(monthlySummary.porcentagemRendaMemberA),
      description: 'Ideal até 50% do income.',
    },
    {
      label: labels.getMemberBLabel(),
      value: formatPercentage(monthlySummary.porcentagemRendaMemberB),
      description: 'Ideal até 50% do income.',
    },
    {
      label: 'Casal',
      value: formatPercentage(monthlySummary.porcentagemRendaTotal),
      description: 'Meta combinada de até 40%.',
    },
  ]

  const nextDueDateLabel = monthlySummary.proximoVencimento[0]
    ? new Date(monthlySummary.proximoVencimento[0].dueDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
    })
    : null
  const defaultDueDay = String(fixedDueDay).padStart(2, '0')
  const previousMonthLabel =
    MONTH_OPTIONS.find((option) => option.value === previousPeriod.month)?.label ?? 'mês anterior'
  const hasDailyData = monthlySummary.serieDiaria.some((point) => point.value > 0)

  const categoryInsight = useMemo(() => {
    const currentMap = new Map(
      monthlySummary.categoriasMensal.filter((cat) => cat.name !== 'Despesas fixas').map((cat) => [cat.name, cat.value]),
    )
    const previousMap = new Map(
      previousMonthlySummary.categoriasMensal
        .filter((cat) => cat.name !== 'Despesas fixas')
        .map((cat) => [cat.name, cat.value]),
    )

    const categories = new Set([...currentMap.keys(), ...previousMap.keys()])
    type CategoryDelta = { name: string; percentChange: number; previous: number; current: number }
    let selected: CategoryDelta | null = null

    for (const name of categories) {
      const currentValue = currentMap.get(name) ?? 0
      const previousValue = previousMap.get(name) ?? 0
      const diff = currentValue - previousValue
      if (diff === 0) continue
      const percentChange = previousValue === 0 ? (currentValue > 0 ? 100 : -100) : (diff / previousValue) * 100
      if (!selected || Math.abs(percentChange) > Math.abs(selected.percentChange)) {
        selected = { name, percentChange, previous: previousValue, current: currentValue }
      }
    }

    if (!selected) return null
    const chosen = selected

    if (chosen.previous === 0 && chosen.current > 0) {
      return `Categoria ${chosen.name} voltou a crescer neste mês.`
    }
    if (chosen.current === 0 && chosen.previous > 0) {
      return `${chosen.name} foi zerada em relação a ${previousMonthLabel}.`
    }

    const formattedChange = `${chosen.percentChange > 0 ? '+' : ''}${formatPercentage(Math.abs(chosen.percentChange))}`

    if (chosen.percentChange > 0) {
      return `Você gastou ${formattedChange} em ${chosen.name} comparado a ${previousMonthLabel}.`
    }
    return `${chosen.name} caiu ${formatPercentage(Math.abs(chosen.percentChange))} em relação a ${previousMonthLabel}.`
  }, [monthlySummary.categoriasMensal, previousMonthlySummary.categoriasMensal, previousMonthLabel])

  const alerts: string[] = []
  if (monthlySummary.porcentagemRendaMemberA > 50) {
    alerts.push(`Atenção: ${labels.getMemberALabel()} está comprometendo ${formatPercentage(monthlySummary.porcentagemRendaMemberA)} da renda neste mês.`)
  }
  if (monthlySummary.porcentagemRendaMemberB > 50) {
    alerts.push(`Atenção: ${labels.getMemberBLabel()} está comprometendo ${formatPercentage(monthlySummary.porcentagemRendaMemberB)} da renda neste mês.`)
  }
  if (monthlySummary.porcentagemRendaTotal > 40) {
    alerts.push(`Alerta combinado: o casal já comprometeu ${formatPercentage(monthlySummary.porcentagemRendaTotal)} da renda.`)
  }
  const alertMessage = alerts.join(' ')

  const insightTiles: StatTileProps[] = [
    {
      label: 'Gasto médio por dia',
      value: currencyFormatter.format(monthlySummary.mediaDiaria),
      description: `Baseado em ${monthlySummary.diasConsiderados} dia${monthlySummary.diasConsiderados === 1 ? '' : 's'} já passados.`,
    },
    {
      label: 'Custo por dia útil',
      value: currencyFormatter.format(monthlySummary.custoPorDiaUtil),
      description: `${monthlySummary.diasUteis} dias úteis no mês selecionado.`,
    },
    {
      label: 'Projeção de fim de mês',
      value: currencyFormatter.format(monthlySummary.projecaoFimMes),
      description: 'Estimativa caso o ritmo atual permaneça.',
    },
  ]

  insightTiles.push(
    categoryInsight
      ? {
        label: 'Variação por categoria',
        value: categoryInsight,
        description: `Comparado a ${previousMonthLabel}.`,
        size: 'sm',
      }
      : {
        label: 'Variação por categoria',
        value: 'Estabilidade geral',
        description: `Sem variações relevantes versus ${previousMonthLabel}.`,
        size: 'sm',
        tone: 'muted',
      },
  )

  if (alertMessage) {
    insightTiles.push({
      label: 'Alertas de renda',
      value: alertMessage,
      description: 'Revise os gastos para manter os limites acordados.',
      size: 'sm',
      tone: 'warning',
    })
  }

  return (
    <section className="space-y-6">
      <HeroCard className="gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Resumo mensal</h1>
          <p className="text-sm text-muted-foreground">
            Visualize o total gasto, a participação de cada pessoa e como isso impacta a renda configurada na planilha.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-4 text-sm md:flex">
          <div className="w-full space-y-1 md:max-w-xs">
            <Label htmlFor="summary-month" className="text-xs uppercase text-muted-foreground">
              Mês
            </Label>
            <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
              <SelectTrigger id="summary-month">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1 md:max-w-xs">
            <Label htmlFor="summary-year" className="text-xs uppercase text-muted-foreground">
              Ano
            </Label>
            <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
              <SelectTrigger id="summary-year">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </HeroCard>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-planify-soft/60" />
          ))}
        </div>
      ) : hasError ? (
        <Card className="rounded-2xl border border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar resumo</CardTitle>
            <CardDescription>
              Verifique sua conexão ou tente novamente carregando os dados de logs e despesas fixas.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !hasData ? (
        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
          <CardHeader>
            <CardTitle>Nenhum dado encontrado</CardTitle>
            <CardDescription>
              Cadastre transações ou despesas fixas para visualizar o resumo deste mês.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-planify-soft">
            <CardHeader>
              <CardTitle>Resumo do mês</CardTitle>
              <CardDescription>Participação consolidada entre os membros neste período.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mainStats.map((stat) => (
                  <StatTile key={stat.label} {...stat} size="lg" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card/70 shadow-planify-soft">
            <CardHeader className="pb-3">
              <CardTitle>Income configurado</CardTitle>
              <CardDescription>Referência mensal para o rateio proporcional.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {incomeStats.map((stat) => (
                <StatTile key={stat.label} {...stat} size="sm" tone="muted" />
              ))}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-muted-foreground">Renda comprometida</p>
              <span className="text-xs text-muted-foreground/80">Meta: Individual ≤ 50% · Casal ≤ 40%</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {commitmentStats.map((stat) => (
                <StatTile key={stat.label} {...stat} size="sm" tone="muted" />
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-12">
            <Card className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft lg:col-span-5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gastos por dia</CardTitle>
                    <CardDescription>
                      {showFixedExpenses
                        ? 'Comportamento diário com fixos.'
                        : 'Apenas gastos variáveis.'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-fixed"
                      checked={showFixedExpenses}
                      onCheckedChange={setShowFixedExpenses}
                    />
                    <Label htmlFor="show-fixed" className="text-xs text-muted-foreground">
                      Fixos
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {hasDailyData ? (
                  <DailyTrendChart data={dailySeries} />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum gasto registrado para gerar o gráfico diário.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="lg:col-span-7">
              <SummaryCharts
                monthlyData={monthlySummary.categoriasMensal}
                annualData={annualSummary.categoriasAnual}
                className="h-full"
              />
            </div>
          </div>



          {monthlySummary.proximoVencimento.length > 0 && (
            <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
              <CardHeader>
                <CardTitle>Próximos vencimentos</CardTitle>
                <CardDescription>
                  {nextDueDateLabel
                    ? `Todos vencem no dia ${defaultDueDay} (${nextDueDateLabel}).`
                    : `Despesas fixas com vencimento padrão no dia ${defaultDueDay}.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {monthlySummary.proximoVencimento.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
                    <span className="font-medium">{expense.description}</span>
                    <span className="font-semibold">{currencyFormatter.format(expense.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
            <CardHeader>
              <CardTitle>Insights do mês</CardTitle>
              <CardDescription>Indicadores inteligentes para ajustes rápidos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {insightTiles.map((stat, index) => (
                  <StatTile key={`insight-${index}`} {...stat} />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}

export default DashboardPage
