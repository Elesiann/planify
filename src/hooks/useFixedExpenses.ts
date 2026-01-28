import { useQuery } from '@tanstack/react-query'
import { fixedExpensesKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabaseClient'
import { useHousehold } from '@/lib/HouseholdProvider'
import type { FixedExpense } from '@/types/database'

export const useFixedExpenses = () => {
  const { activeHouseholdId } = useHousehold()

  return useQuery({
    queryKey: [...fixedExpensesKeys.all, activeHouseholdId],
    enabled: Boolean(activeHouseholdId),
    queryFn: async (): Promise<FixedExpense[]> => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    },
  })
}

