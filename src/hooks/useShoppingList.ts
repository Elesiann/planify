import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shoppingListKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabaseClient'
import { useHousehold } from '@/lib/HouseholdProvider'
import { useAuth } from '@/lib/auth'
import type { ShoppingListItem, ShoppingListItemInsert, ShoppingListItemUpdate } from '@/types/database'

export const useShoppingListItems = () => {
  const { activeHouseholdId } = useHousehold()

  return useQuery({
    queryKey: activeHouseholdId ? shoppingListKeys.byHousehold(activeHouseholdId) : shoppingListKeys.all,
    enabled: Boolean(activeHouseholdId),
    queryFn: async (): Promise<ShoppingListItem[]> => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')

      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

export const useCreateShoppingListItem = () => {
  const { activeHouseholdId } = useHousehold()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<ShoppingListItemInsert, 'household_id' | 'created_by'>) => {
      if (!activeHouseholdId || !user) throw new Error('Nenhum household ativo.')

      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          ...input,
          household_id: activeHouseholdId,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useUpdateShoppingListItem = () => {
  const { activeHouseholdId } = useHousehold()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShoppingListItemUpdate }) => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')

      const updatePayload: ShoppingListItemUpdate = { ...data }
      if (data.status === 'purchased' && !data.purchased_at) {
        updatePayload.purchased_at = new Date().toISOString()
      } else if (data.status && data.status !== 'purchased') {
        updatePayload.purchased_at = null
      }

      const { data: result, error } = await supabase
        .from('shopping_list_items')
        .update(updatePayload)
        .eq('id', id)
        .eq('household_id', activeHouseholdId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return result
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useBatchUpdateShoppingListItems = () => {
  const { activeHouseholdId } = useHousehold()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number; status?: ShoppingListItemUpdate['status'] }[]) => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')
      await Promise.all(
        updates.map(({ id, sort_order, status }) =>
          supabase
            .from('shopping_list_items')
            .update({ sort_order, ...(status !== undefined && { status }) })
            .eq('id', id)
            .eq('household_id', activeHouseholdId)
        )
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}

export const useDeleteShoppingListItem = () => {
  const { activeHouseholdId } = useHousehold()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')

      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', id)
        .eq('household_id', activeHouseholdId)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shoppingListKeys.all })
    },
  })
}
