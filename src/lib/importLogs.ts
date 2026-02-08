import Papa from 'papaparse'
import type { TransactionInsert } from '@/types/database'

type CsvRow = {
  Tipo?: string
  'Forma de pagamento'?: string
  'Data da compra'?: string
  Descrição?: string
  'Valor total (R$)'?: string
  'Parcelado?'?: string
  'Parcelado?.1'?: string
  'Valor/parcela (R$/mês)'?: string
}

// Context required for import operations
export type ImportContext = {
  householdId: string
  userId: string
}

const ISO_DATE_SUFFIX = 'T00:00:00.000Z'

const normalizeString = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

export const brlToNumber = (value?: string | null): number | null => {
  if (!value) return null
  const normalized = value.replace(/\s/g, '').replace(/^R\$/, '').replace(/\./g, '').replace(',', '.')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : null
}

export const parseDatePtBr = (value?: string | null): string | null => {
  if (!value) return null
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`
  return iso
}

export const parseInstallments = (info?: string | null) => {
  const normalized = info?.trim()
  if (!normalized) {
    return { isInstallment: false as const, count: null as number | null }
  }

  const simplified = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (simplified.includes('vista') || simplified.includes('nao')) {
    return { isInstallment: false as const, count: null }
  }

  const match = normalized.match(/(\d+)\s*[xX]/)
  if (match) {
    const count = Number(match[1])
    if (Number.isFinite(count) && count > 0) {
      return { isInstallment: true as const, count }
    }
  }

  return { isInstallment: false as const, count: null }
}

const addMonths = (isoDate: string, months: number): string => {
  const base = new Date(`${isoDate}${ISO_DATE_SUFFIX}`)
  base.setUTCMonth(base.getUTCMonth() + months)
  return base.toISOString().slice(0, 10)
}

const buildInstallmentFields = (
  purchaseDate: string,
  installmentInfo?: string | null,
  installmentValueText?: string | null,
) => {
  const { isInstallment, count } = parseInstallments(installmentInfo)
  if (!isInstallment || !count) {
    return {
      is_installment: false,
      installment_count: null,
      installment_value: null,
      first_installment_date: null,
      last_installment_date: null,
    }
  }

  const installmentValue = brlToNumber(installmentValueText)

  return {
    is_installment: true,
    installment_count: count,
    installment_value: installmentValue,
    first_installment_date: purchaseDate,
    last_installment_date: addMonths(purchaseDate, count - 1),
  }
}

export const parseTransactionsCsv = (csvText: string, context: ImportContext): TransactionInsert[] => {
  const { data, errors } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
  })

  if (errors.length > 0) {
    console.warn('CSV parsing reported errors:', errors)
  }

  const transactions: TransactionInsert[] = []

  data.forEach((row: CsvRow, index: number) => {
    try {
      const totalAmount = brlToNumber(row['Valor total (R$)'])
      if (totalAmount === null) {
        console.warn(`Linha ${index + 1} ignorada: valor total inválido`, row['Valor total (R$)'])
        return
      }

      const purchaseDate = parseDatePtBr(row['Data da compra'])
      if (!purchaseDate) {
        console.warn(`Linha ${index + 1} ignorada: data inválida`, row['Data da compra'])
        return
      }

      const installmentFields = buildInstallmentFields(
        purchaseDate,
        row['Parcelado?.1'] ?? row['Parcelado?'],
        row['Valor/parcela (R$/mês)'],
      )

      const insertedAt = new Date(`${purchaseDate}${ISO_DATE_SUFFIX}`).toISOString()

      const transaction: TransactionInsert = {
        household_id: context.householdId,
        created_by: context.userId,
        paid_by: context.userId,
        owner_id: context.userId,
        category: normalizeString(row['Tipo']),
        payment_method: normalizeString(row['Forma de pagamento']),
        description: normalizeString(row['Descrição']),
        total_amount: totalAmount,
        date: purchaseDate,
        is_shared: true,
        inserted_at: insertedAt,
        ...installmentFields,
      }

      transactions.push(transaction)
    } catch (error) {
      console.error(`Erro ao processar linha ${index + 1}`, error)
    }
  })

  return transactions
}
