import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useHousehold } from '@/lib/HouseholdProvider'
import { useAuth } from '@/lib/auth'

export type HouseholdMemberWithProfile = {
    id: string
    household_id: string
    user_id: string
    role: string | null
    share_ratio: number
    joined_at: string | null
    profile: {
        id: string
        name: string | null
        avatar_url: string | null
        income: number | null
    } | null
}

/**
 * Financial configuration for a single household member.
 */
export type MemberFinancialConfig = {
    memberId: string
    userId: string
    name: string
    /** Share ratio (0 to 1) representing the portion of expenses this member is responsible for */
    share: number
    /** Monthly income of the member */
    income: number
    /** Whether this member is the currently authenticated user */
    isCurrentUser: boolean
}

export type HouseholdFinancialConfig = {
    /** All members configured in the household */
    members: MemberFinancialConfig[]
    /** The current authenticated user's configuration */
    currentUser: MemberFinancialConfig | null
    /** 
     * The other member in the household (Partner).
     * @note Planify currently supports a maximum of 2 members per household.
     * This field represents the single other member alongside the current user.
     */
    partner: MemberFinancialConfig | null
    /** Combined share ratio of all members */
    totalShares: number
    /** Combined monthly income of all members */
    totalIncome: number
    isLoading: boolean
    isError: boolean
}

/**
 * Hook to fetch raw household members data from Supabase.
 */
export const useHouseholdMembers = () => {
    const { activeHouseholdId } = useHousehold()

    return useQuery({
        queryKey: ['household_members', activeHouseholdId],
        enabled: Boolean(activeHouseholdId),
        queryFn: async (): Promise<HouseholdMemberWithProfile[]> => {
            if (!activeHouseholdId) return []

            const { data, error } = await supabase
                .from('household_members')
                .select(`
                    id,
                    household_id,
                    user_id,
                    role,
                    share_ratio,
                    joined_at,
                    profile:profiles!household_members_user_id_fkey (
                        id,
                        name,
                        avatar_url,
                        income
                    )
                `)
                .eq('household_id', activeHouseholdId)

            if (error) {
                throw new Error(error.message)
            }

            // Transform the data to match our type (Supabase returns profile as object, not array)
            return (data ?? []).map((row) => ({
                id: row.id,
                household_id: row.household_id ?? '',
                user_id: row.user_id ?? '',
                role: row.role,
                share_ratio: row.share_ratio,
                joined_at: row.joined_at,
                profile: Array.isArray(row.profile) ? row.profile[0] ?? null : row.profile,
            })) as HouseholdMemberWithProfile[]
        },
    })
}

/**
 * Hook to fetch and compute financial configuration for the active household.
 * @note Designed strictly for 2-member households (User + Partner).
 */
export const useHouseholdFinancialConfig = (): HouseholdFinancialConfig => {
    const { user } = useAuth()
    const { data: members = [], isLoading, isError } = useHouseholdMembers()

    const memberConfigs: MemberFinancialConfig[] = members.map((member) => ({
        memberId: member.id,
        userId: member.user_id,
        name: member.profile?.name ?? 'Membro',
        share: member.share_ratio,
        income: member.profile?.income ?? 0,
        isCurrentUser: member.user_id === user?.id,
    }))

    const currentUser = memberConfigs.find((m) => m.isCurrentUser) ?? null
    // In a 2-member household, the partner is simply the one who is not the current user
    const partner = memberConfigs.find((m) => !m.isCurrentUser) ?? null

    const totalShares = memberConfigs.reduce((acc, m) => acc + m.share, 0)
    const totalIncome = memberConfigs.reduce((acc, m) => acc + m.income, 0)

    return {
        members: memberConfigs,
        currentUser,
        partner,
        totalShares,
        totalIncome,
        isLoading,
        isError,
    }
}
