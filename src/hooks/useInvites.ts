import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useHousehold } from '@/lib/HouseholdProvider'

type Invite = {
    id: string
    household_id: string
    token: string
    invited_by: string
    role: string
    status: 'pending' | 'accepted' | 'expired' | 'revoked'
    created_at: string
    expires_at: string
}

// Type for invite with joined relations (used in useInviteByToken)
export type InviteWithRelations = Omit<Invite, 'invited_by' | 'created_at' | 'expires_at'> & {
    invited_by: string | null
    created_at: string | null
    expires_at: string | null
    households: { name: string } | null
    profiles: { name: string } | null
}

type CreateInviteInput = {
    role?: 'member' | 'admin'
    expiresInDays?: number
}

// Fetch pending invites for current household
export const useInvites = () => {
    const { activeHouseholdId } = useHousehold()

    return useQuery({
        queryKey: ['invites', activeHouseholdId],
        enabled: Boolean(activeHouseholdId),
        queryFn: async (): Promise<Invite[]> => {
            if (!activeHouseholdId) return []

            const { data, error } = await supabase
                .from('household_invites')
                .select('*')
                .eq('household_id', activeHouseholdId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(error.message)
            }

            return data ?? []
        },
    })
}

// Create a new invite
export const useCreateInvite = () => {
    const queryClient = useQueryClient()
    const { activeHouseholdId } = useHousehold()

    return useMutation({
        mutationFn: async ({ role = 'member', expiresInDays = 7 }: CreateInviteInput) => {
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user?.id) {
                throw new Error('Usuário não autenticado.')
            }

            if (!activeHouseholdId) {
                throw new Error('Nenhuma household ativa.')
            }

            // Check current member count (limit: 2 members per household)
            const { count, error: countError } = await supabase
                .from('household_members')
                .select('*', { count: 'exact', head: true })
                .eq('household_id', activeHouseholdId)

            if (countError) {
                throw new Error('Erro ao verificar membros da household.')
            }

            if (count !== null && count >= 2) {
                throw new Error('Esta household já atingiu o limite máximo de 2 membros.')
            }

            // Generate a unique token
            const token = crypto.randomUUID()

            // Calculate expiry date
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + expiresInDays)

            const { data, error } = await supabase
                .from('household_invites')
                .insert({
                    household_id: activeHouseholdId,
                    token,
                    invited_by: user.id,
                    role,
                    status: 'pending',
                    expires_at: expiresAt.toISOString(),
                })
                .select()
                .single()

            if (error) {
                throw new Error(error.message)
            }

            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invites', activeHouseholdId] })
        },
    })
}

// Revoke an invite
export const useRevokeInvite = () => {
    const queryClient = useQueryClient()
    const { activeHouseholdId } = useHousehold()

    return useMutation({
        mutationFn: async (inviteId: string) => {
            if (!activeHouseholdId) {
                throw new Error('Nenhuma household ativa.')
            }

            const { error } = await supabase
                .from('household_invites')
                .update({ status: 'revoked' })
                .eq('id', inviteId)
                .eq('household_id', activeHouseholdId)

            if (error) {
                throw new Error(error.message)
            }
        },
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ['invites'] })
        },
    })
}

// Accept an invite (used on the invite page)
export const useAcceptInvite = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (token: string) => {
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user?.id) {
                throw new Error('Você precisa estar logado para aceitar o convite.')
            }

            // Use secure RPC to accept invite
            const { data, error } = await supabase.rpc('accept_invite_by_token', {
                p_token: token,
            })

            if (error) {
                throw new Error(error.message)
            }

            return data as { household_id: string }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['households'] })
        },
    })
}

// Get invite details by token (for the accept page)
export const useInviteByToken = (token: string | undefined) => {
    return useQuery({
        queryKey: ['invite', token],
        enabled: Boolean(token),
        queryFn: async (): Promise<InviteWithRelations | null> => {
            if (!token) return null

            // Use secure RPC function that bypasses RLS to get invite details
            const { data, error } = await supabase.rpc('get_invite_by_token', {
                p_token: token,
            })

            if (error) {
                throw new Error('Convite não encontrado.')
            }

            if (!data || data.length === 0) {
                throw new Error('Convite não encontrado.')
            }

            // Map RPC result to InviteWithRelations structure
            const result = data[0]
            return {
                id: result.id,
                household_id: result.household_id,
                token: token,
                role: result.role,
                status: result.status,
                // Nested objects structure required by UI
                households: result.household_name ? { name: result.household_name } : null,
                profiles: result.inviter_name ? { name: result.inviter_name } : null,
                invited_by: result.invited_by ?? null,
                created_at: result.created_at ?? null,
                expires_at: result.expires_at ?? null,
            }
        },
    })
}
