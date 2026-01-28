import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

type CreateHouseholdInput = {
    name: string
    currency?: string
    fixed_due_day?: number | null
}

export const useCreateHousehold = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ name, currency = 'BRL', fixed_due_day = 5 }: CreateHouseholdInput) => {
            // Use RPC function that bypasses RLS
            const { data, error } = await supabase.rpc('create_household_for_user', {
                p_name: name,
                p_currency: currency,
                p_fixed_due_day: fixed_due_day,
            })

            if (error) {
                throw new Error(error.message)
            }

            return { id: data }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['households'] })
        },
    })
}

export const useUpdateHousehold = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, name, currency, fixed_due_day }: { id: string; name?: string; currency?: string; fixed_due_day?: number | null }) => {
            const updates: { name?: string; currency?: string; fixed_due_day?: number | null } = {}
            if (name !== undefined) updates.name = name
            if (currency !== undefined) updates.currency = currency
            if (fixed_due_day !== undefined) updates.fixed_due_day = fixed_due_day

            const { data, error } = await supabase
                .from('households')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['households'] })
        },
    })
}

export const useDeleteHousehold = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('households')
                .delete()
                .eq('id', id)

            if (error) {
                throw new Error(error.message)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['households'] })
        },
    })
}

export const useUpdateMemberShare = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ memberId, shareRatio }: { memberId: string; shareRatio: number }) => {
            const { data, error } = await supabase
                .from('household_members')
                .update({ share_ratio: shareRatio })
                .eq('id', memberId)
                .select()
                .single()

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['households'] })
            queryClient.invalidateQueries({ queryKey: ['household_members'] })
        },
    })
}

export const useRemoveMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (memberId: string) => {
            const { error } = await supabase
                .from('household_members')
                .delete()
                .eq('id', memberId)

            if (error) {
                throw new Error(error.message)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['households'] })
            queryClient.invalidateQueries({ queryKey: ['household_members'] })
        },
    })
}
