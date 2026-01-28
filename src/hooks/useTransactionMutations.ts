import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Transaction, TransactionInsert, TransactionUpdate } from '../types/database.ts'
import { supabase } from '../lib/supabaseClient'
import { transactionsKeys } from '../lib/queryKeys'
import { useAuth } from '../lib/auth'
import { useHousehold } from '../lib/HouseholdProvider'

type CreateTransactionInput = Omit<
  TransactionInsert,
  'household_id' | 'created_by' | 'paid_by' | 'owner_id'
>

type UpdateTransactionVariables = {
  id: string
  data: TransactionUpdate
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { activeHouseholdId } = useHousehold()

  return useMutation<Transaction, Error, CreateTransactionInput>({
    mutationFn: async (values) => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      const userId = user?.id
      if (!userId) {
        throw new Error('Usuário não autenticado.')
      }

      const payload: TransactionInsert = {
        ...values,
        household_id: activeHouseholdId,
        created_by: userId,
        paid_by: userId,
        owner_id: userId,
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKeys.all })
    },
  })
}

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useHousehold()

  return useMutation<Transaction, Error, UpdateTransactionVariables>({
    mutationFn: async ({ id, data }) => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      if (!id) {
        throw new Error('ID da transação é obrigatório.')
      }

      const { data: updated, error } = await supabase
        .from('transactions')
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
      queryClient.invalidateQueries({ queryKey: transactionsKeys.all })
    },
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useHousehold()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!activeHouseholdId) {
        throw new Error('Nenhum household ativo.')
      }

      if (!id) {
        throw new Error('ID da transação é obrigatório.')
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('household_id', activeHouseholdId)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKeys.all })
    },
  })
}

