import { useQuery } from '@tanstack/react-query'
import { transactionsKeys } from '../lib/queryKeys'
import { supabase } from '../lib/supabaseClient'
import { useHousehold } from '../lib/HouseholdProvider'
import type { Transaction } from '../types/database.ts'

export type TransactionWithOwner = Transaction & {
  owner_name?: string | null
}

type DateRange = {
  startDate: string
  endDate: string
}

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const getMonthDateRange = ({ month, year }: { month: number; year: number }): DateRange => {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  }
}

export const useTransactions = ({ month, year }: { month: number; year: number }) => {
  const { activeHouseholdId } = useHousehold()

  return useQuery({
    queryKey: [...transactionsKeys.list({ month, year }), activeHouseholdId],
    enabled: Boolean(activeHouseholdId),
    queryFn: async (): Promise<TransactionWithOwner[]> => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      const { startDate, endDate } = getMonthDateRange({ month, year })

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: false })
        .order('inserted_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      const transactions = data ?? []
      const ownerIds = Array.from(
        new Set(transactions.map((transaction) => transaction.owner_id).filter(Boolean)),
      ) as string[]

      let ownerMap = new Map<string, string | null>()

      if (ownerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ownerIds)

        if (profilesError) {
          throw new Error(profilesError.message)
        }

        ownerMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]))
      }

      return transactions.map((transaction) => ({
        ...transaction,
        owner_name: transaction.owner_id ? ownerMap.get(transaction.owner_id) ?? null : null,
      }))
    },
  })
}

export const useTransaction = (id?: string) => {
  return useQuery({
    queryKey: id ? transactionsKeys.byId(id) : transactionsKeys.byId(''),
    enabled: Boolean(id),
    queryFn: async (): Promise<Transaction | null> => {
      if (!id) {
        return null
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data ?? null
    },
  })
}

export const useTransactionsYear = (year: number) => {
  const { activeHouseholdId } = useHousehold()

  return useQuery({
    queryKey: [...transactionsKeys.year(year), activeHouseholdId],
    enabled: Boolean(activeHouseholdId),
    queryFn: async (): Promise<TransactionWithOwner[]> => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      const startDate = `${year}-01-01`
      const endDate = `${year + 1}-01-01`

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: false })
        .order('inserted_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      const transactions = data ?? []
      const ownerIds = Array.from(
        new Set(transactions.map((transaction) => transaction.owner_id).filter(Boolean)),
      ) as string[]

      let ownerMap = new Map<string, string | null>()

      if (ownerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ownerIds)

        if (profilesError) {
          throw new Error(profilesError.message)
        }

        ownerMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]))
      }

      return transactions.map((transaction) => ({
        ...transaction,
        owner_name: transaction.owner_id ? ownerMap.get(transaction.owner_id) ?? null : null,
      }))
    },
  })
}

