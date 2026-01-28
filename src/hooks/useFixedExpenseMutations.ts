import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  FixedExpense,
  FixedExpenseInsert,
  FixedExpenseUpdate,
} from '@/types/database'
import { supabase } from '@/lib/supabaseClient'
import { fixedExpensesKeys } from '@/lib/queryKeys'
import { useHousehold } from '@/lib/HouseholdProvider'

type CreateFixedExpenseInput = Omit<FixedExpenseInsert, 'household_id'>

type UpdateFixedExpenseVariables = {
  id: string
  data: FixedExpenseUpdate
}

export const useCreateFixedExpense = () => {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useHousehold()

  return useMutation<FixedExpense, Error, CreateFixedExpenseInput>({
    mutationFn: async (values) => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      const payload: FixedExpenseInsert = {
        ...values,
        household_id: activeHouseholdId,
      }

      const { data, error } = await supabase.from('fixed_expenses').insert(payload).select('*').single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fixedExpensesKeys.all })
    },
  })
}

export const useUpdateFixedExpense = () => {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useHousehold()

  return useMutation<FixedExpense, Error, UpdateFixedExpenseVariables>({
    mutationFn: async ({ id, data }) => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      if (!id) {
        throw new Error('ID da despesa fixa é obrigatório.')
      }

      const { data: updated, error } = await supabase
        .from('fixed_expenses')
        .update(data)
        .eq('id', id)
        .eq('household_id', activeHouseholdId)
        .select('*')
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fixedExpensesKeys.all })
    },
  })
}

export const useDeleteFixedExpense = () => {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useHousehold()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      if (!id) {
        throw new Error('ID da despesa fixa é obrigatório.')
      }

      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id)
        .eq('household_id', activeHouseholdId)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fixedExpensesKeys.all })
    },
  })
}

