import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { marketListKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabaseClient'
import { useHousehold } from '@/lib/HouseholdProvider'
import { useAuth } from '@/lib/auth'
import type { MarketListItem } from '@/types/database'

export const useMarketListItems = (enabled = true) => {
  const { activeHouseholdId } = useHousehold()

  return useQuery({
    queryKey: marketListKeys.byHousehold(activeHouseholdId ?? ''),
    enabled: Boolean(activeHouseholdId) && enabled,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<MarketListItem[]> => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')

      const { data, error } = await supabase
        .from('market_list_items')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

// ─── helpers ────────────────────────────────────────────────────────────────

type OptimisticContext = { previousItems: MarketListItem[] | undefined; householdId: string }

// ─── create ─────────────────────────────────────────────────────────────────

export const useCreateMarketListItem = () => {
  const { activeHouseholdId } = useHousehold()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    onMutate: async (name: string): Promise<OptimisticContext | undefined> => {
      if (!activeHouseholdId || !user) return undefined

      await queryClient.cancelQueries({ queryKey: marketListKeys.all })

      const householdId = activeHouseholdId
      const previousItems = queryClient.getQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
      )

      const tempItem: MarketListItem = {
        id: crypto.randomUUID(),
        name,
        checked: false,
        sort_order: Date.now(),
        created_at: new Date().toISOString(),
        household_id: householdId,
        created_by: user.id,
      }

      queryClient.setQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
        (old) => [...(old ?? []), tempItem],
      )

      return { previousItems, householdId }
    },
    mutationFn: async (name: string) => {
      if (!activeHouseholdId || !user) throw new Error('Nenhum household ativo.')

      const { data, error } = await supabase
        .from('market_list_items')
        .insert({
          name,
          household_id: activeHouseholdId,
          created_by: user.id,
          sort_order: Date.now(),
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onError: (_err, _name, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(
          marketListKeys.byHousehold(context.householdId),
          context.previousItems,
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: marketListKeys.all })
    },
  })
}

// ─── toggle ─────────────────────────────────────────────────────────────────

export const useToggleMarketListItem = () => {
  const { activeHouseholdId } = useHousehold()
  const queryClient = useQueryClient()

  return useMutation({
    onMutate: async ({ id, checked }: { id: string; checked: boolean }): Promise<OptimisticContext | undefined> => {
      if (!activeHouseholdId) return undefined

      await queryClient.cancelQueries({ queryKey: marketListKeys.all })

      const householdId = activeHouseholdId
      const previousItems = queryClient.getQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
      )

      queryClient.setQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
        (old) => old?.map((item) => item.id === id ? { ...item, checked } : item) ?? [],
      )

      return { previousItems, householdId }
    },
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')

      const { error } = await supabase
        .from('market_list_items')
        .update({ checked })
        .eq('id', id)
        .eq('household_id', activeHouseholdId)

      if (error) throw new Error(error.message)
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(
          marketListKeys.byHousehold(context.householdId),
          context.previousItems,
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: marketListKeys.all })
    },
  })
}

// ─── delete ─────────────────────────────────────────────────────────────────

export const useDeleteMarketListItem = () => {
  const { activeHouseholdId } = useHousehold()
  const queryClient = useQueryClient()

  return useMutation({
    onMutate: async (id: string): Promise<OptimisticContext | undefined> => {
      if (!activeHouseholdId) return undefined

      await queryClient.cancelQueries({ queryKey: marketListKeys.all })

      const householdId = activeHouseholdId
      const previousItems = queryClient.getQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
      )

      queryClient.setQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
        (old) => old?.filter((item) => item.id !== id) ?? [],
      )

      return { previousItems, householdId }
    },
    mutationFn: async (id: string) => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')

      const { error } = await supabase
        .from('market_list_items')
        .delete()
        .eq('id', id)
        .eq('household_id', activeHouseholdId)

      if (error) throw new Error(error.message)
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(
          marketListKeys.byHousehold(context.householdId),
          context.previousItems,
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: marketListKeys.all })
    },
  })
}

// ─── clear ───────────────────────────────────────────────────────────────────

export const useClearMarketList = () => {
  const { activeHouseholdId } = useHousehold()
  const queryClient = useQueryClient()

  return useMutation({
    onMutate: async (): Promise<OptimisticContext | undefined> => {
      if (!activeHouseholdId) return undefined

      await queryClient.cancelQueries({ queryKey: marketListKeys.all })

      const householdId = activeHouseholdId
      const previousItems = queryClient.getQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
      )

      queryClient.setQueryData<MarketListItem[]>(
        marketListKeys.byHousehold(householdId),
        [],
      )

      return { previousItems, householdId }
    },
    mutationFn: async () => {
      if (!activeHouseholdId) throw new Error('Nenhum household ativo.')

      const { error } = await supabase
        .from('market_list_items')
        .delete()
        .eq('household_id', activeHouseholdId)

      if (error) throw new Error(error.message)
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(
          marketListKeys.byHousehold(context.householdId),
          context.previousItems,
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: marketListKeys.all })
    },
  })
}
