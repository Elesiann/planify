import type { TransactionWithOwner } from '@/hooks/useTransactions'
import type { FixedExpense } from '@/types/database'

// Default due day for expenses when not specified in household settings
const DEFAULT_DUE_DAY = 5

// Financial configuration passed from household members data
export type FinancialConfig = {
  shareMemberA: number  // Share ratio for current user (0-1)
  shareMemberB: number  // Share ratio for partner (0-1)
  incomeMemberA: number // Monthly income for current user
  incomeMemberB: number // Monthly income for partner
}

// Default config when no members data available
export const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  shareMemberA: 0.5,
  shareMemberB: 0.5,
  incomeMemberA: 0,
  incomeMemberB: 0,
}

export type CategoryBreakdown = {
  name: string
  value: number
  percentage: number
}

export type DailyPoint = {
  day: number
  value: number
}

export type NextDueExpense = {
  id: string
  description: string
  amount: number
  dueDate: string
}

export type SummaryComputation = {
  totalGasto: number
  parteMemberA: number
  parteMemberB: number
  incomeMemberA: number
  incomeMemberB: number
  incomeTotal: number
  porcentagemRendaMemberA: number
  porcentagemRendaMemberB: number
  porcentagemRendaTotal: number
  categoriasMensal: CategoryBreakdown[]
  categoriasAnual: CategoryBreakdown[]
  proximoVencimento: NextDueExpense[]
  logsSincronizados: number
  mediaDiaria: number
  custoPorDia: number
  custoPorDiaUtil: number
  projecaoFimMes: number
  diasConsiderados: number
  diasNoMes: number
  diasUteis: number
  serieDiaria: DailyPoint[]
}

const normalizeCategory = (category?: string | null) => {
  if (!category) return 'Outros'
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate()
}

const getDaysElapsed = (month: number, year: number, daysInMonth: number) => {
  const now = new Date()
  const selectedKey = year * 12 + month
  const currentKey = now.getFullYear() * 12 + (now.getMonth() + 1)

  if (selectedKey < currentKey) {
    return daysInMonth
  }

  if (selectedKey === currentKey) {
    return Math.min(daysInMonth, now.getDate())
  }

  return 1
}

const countBusinessDays = (month: number, year: number, daysInMonth: number) => {
  let businessDays = 0
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day)
    const weekDay = date.getDay()
    if (weekDay !== 0 && weekDay !== 6) {
      businessDays += 1
    }
  }
  return businessDays
}

export const buildDailySeries = (
  transactions: TransactionWithOwner[],
  fixedExpenses: FixedExpense[],
  daysInMonth: number,
  includeFixed = true,
  fixedDueDay: number = DEFAULT_DUE_DAY,
): DailyPoint[] => {
  const totals = Array.from({ length: daysInMonth }, () => 0)

  transactions.forEach((transaction) => {
    if (!transaction.date) return
    const day = new Date(transaction.date).getDate()
    if (day >= 1 && day <= daysInMonth) {
      totals[day - 1] += transaction.total_amount
    }
  })

  const totalFixed = sumFixedExpenses(fixedExpenses)
  if (includeFixed && totalFixed > 0) {
    const dueDay = Math.min(fixedDueDay, daysInMonth)
    totals[dueDay - 1] += totalFixed
  }

  return totals.map((value, index) => ({ day: index + 1, value }))
}

const formatDueDate = (year: number, month: number, fixedDueDay: number = DEFAULT_DUE_DAY) => {
  const maxDays = getDaysInMonth(month, year)
  const clampedDay = Math.min(fixedDueDay, maxDays)
  const date = new Date(year, month - 1, clampedDay)
  return date.toISOString()
}

const toCategoryBreakdowns = (map: Map<string, number>, totalBase: number): CategoryBreakdown[] => {
  if (totalBase <= 0) {
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: 0,
    }))
  }

  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
    percentage: (value / totalBase) * 100,
  }))
}

const sumTransactions = (transactions: TransactionWithOwner[]) =>
  transactions.reduce((acc, transaction) => acc + transaction.total_amount, 0)

const sumFixedExpenses = (fixedExpenses: FixedExpense[]) =>
  fixedExpenses.reduce((acc, expense) => acc + expense.amount, 0)

const baseSummary = (
  totalGasto: number,
  config: FinancialConfig
): Pick<SummaryComputation, 'parteMemberA' | 'parteMemberB'> => ({
  parteMemberA: totalGasto * config.shareMemberA,
  parteMemberB: totalGasto * config.shareMemberB,
})

const incomeSummary = (
  totalGasto: number,
  config: FinancialConfig,
  multiplier = 1
) => {
  const incomeMemberA = config.incomeMemberA * multiplier
  const incomeMemberB = config.incomeMemberB * multiplier
  const incomeTotal = incomeMemberA + incomeMemberB

  const porcentagemRendaMemberA =
    incomeMemberA > 0 ? ((totalGasto * config.shareMemberA) / incomeMemberA) * 100 : 0
  const porcentagemRendaMemberB =
    incomeMemberB > 0 ? ((totalGasto * config.shareMemberB) / incomeMemberB) * 100 : 0
  const porcentagemRendaTotal =
    incomeTotal > 0 ? (totalGasto / incomeTotal) * 100 : 0

  return {
    incomeMemberA,
    incomeMemberB,
    incomeTotal,
    porcentagemRendaMemberA,
    porcentagemRendaMemberB,
    porcentagemRendaTotal,
  }
}

export const buildMonthlySummary = (
  transactions: TransactionWithOwner[],
  fixedExpenses: FixedExpense[],
  month: number,
  year: number,
  config: FinancialConfig = DEFAULT_FINANCIAL_CONFIG,
  fixedDueDay: number = DEFAULT_DUE_DAY,
): SummaryComputation => {
  const totalVariables = sumTransactions(transactions)
  const totalFixed = sumFixedExpenses(fixedExpenses)
  const totalGasto = totalVariables + totalFixed
  const diasNoMes = getDaysInMonth(month, year)
  const diasConsiderados = Math.max(1, Math.min(diasNoMes, getDaysElapsed(month, year, diasNoMes)))
  const diasUteis = countBusinessDays(month, year, diasNoMes)
  const mediaDiaria = diasConsiderados > 0 ? totalGasto / diasConsiderados : 0
  const custoPorDia = diasNoMes > 0 ? totalGasto / diasNoMes : 0
  const custoPorDiaUtil = diasUteis > 0 ? totalGasto / diasUteis : 0
  const projecaoFimMes = mediaDiaria * diasNoMes

  const serieDiaria = buildDailySeries(transactions, fixedExpenses, diasNoMes, true, fixedDueDay)

  const monthlyCategoryMap = new Map<string, number>()
  transactions.forEach((transaction) => {
    const key = normalizeCategory(transaction.category)
    monthlyCategoryMap.set(key, (monthlyCategoryMap.get(key) ?? 0) + transaction.total_amount)
  })
  if (totalFixed > 0) {
    monthlyCategoryMap.set('Despesas fixas', totalFixed)
  }

  const categoriasMensal = toCategoryBreakdowns(monthlyCategoryMap, totalGasto)

  const proximoVencimento = fixedExpenses.map((expense) => ({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    dueDate: formatDueDate(year, month, fixedDueDay),
  }))

  const { parteMemberA, parteMemberB } = baseSummary(totalGasto, config)
  const incomeStats = incomeSummary(totalGasto, config)

  return {
    totalGasto,
    parteMemberA,
    parteMemberB,
    ...incomeStats,
    categoriasMensal,
    categoriasAnual: [],
    proximoVencimento,
    logsSincronizados: transactions.length,
    mediaDiaria,
    custoPorDia,
    custoPorDiaUtil,
    projecaoFimMes,
    diasConsiderados,
    diasNoMes,
    diasUteis,
    serieDiaria,
  }
}

export const buildAnnualSummary = (
  transactions: TransactionWithOwner[],
  fixedExpenses: FixedExpense[],
  _year: number,
  config: FinancialConfig = DEFAULT_FINANCIAL_CONFIG,
): SummaryComputation => {
  void _year
  const totalVariables = sumTransactions(transactions)
  const totalFixedMonthly = sumFixedExpenses(fixedExpenses)
  const totalFixedAnnual = totalFixedMonthly * 12
  const totalGasto = totalVariables + totalFixedAnnual

  const annualCategoryMap = new Map<string, number>()
  transactions.forEach((transaction) => {
    const key = normalizeCategory(transaction.category)
    annualCategoryMap.set(key, (annualCategoryMap.get(key) ?? 0) + transaction.total_amount)
  })
  if (totalFixedAnnual > 0) {
    annualCategoryMap.set('Despesas fixas', totalFixedAnnual)
  }

  const categoriasAnual = toCategoryBreakdowns(annualCategoryMap, totalGasto)

  const { parteMemberA, parteMemberB } = baseSummary(totalGasto, config)
  const incomeStats = incomeSummary(totalGasto, config, 12)

  return {
    totalGasto,
    parteMemberA,
    parteMemberB,
    ...incomeStats,
    categoriasMensal: [],
    categoriasAnual,
    proximoVencimento: [],
    logsSincronizados: transactions.length,
    mediaDiaria: 0,
    custoPorDia: 0,
    custoPorDiaUtil: 0,
    projecaoFimMes: 0,
    diasConsiderados: 0,
    diasNoMes: 0,
    diasUteis: 0,
    serieDiaria: [],
  }
}

