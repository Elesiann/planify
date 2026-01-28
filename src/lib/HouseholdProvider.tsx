import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren,
} from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import { useAuth } from './auth'

// Types
export type Household = {
    id: string
    name: string
    currency: string | null
    fixed_due_day: number | null
    owner_id: string | null
    created_at: string | null
}

export type HouseholdMember = {
    id: string
    household_id: string | null
    user_id: string | null
    role: string | null
    share_ratio: number
    joined_at: string | null
}

export type HouseholdWithRole = Household & {
    role: string | null
}

type HouseholdContextValue = {
    // Current active household
    activeHousehold: Household | null
    activeHouseholdId: string | null

    // All households user is member of
    households: HouseholdWithRole[]

    // Loading states
    isLoading: boolean
    isInitialized: boolean

    // Actions
    switchHousehold: (householdId: string) => Promise<void>
    refetch: () => void

    // Helpers
    isOwner: boolean
    isAdmin: boolean
    canManageMembers: boolean
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined)

const householdKeys = {
    all: ['households'] as const,
    list: () => [...householdKeys.all, 'list'] as const,
    active: () => [...householdKeys.all, 'active'] as const,
}

export const HouseholdProvider = ({ children }: PropsWithChildren) => {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [isInitialized, setIsInitialized] = useState(false)
    const hasAutoSelectedRef = useRef(false)

    // Fetch all households the user is a member of
    const { data: householdsData, isLoading: householdsLoading, refetch } = useQuery({
        queryKey: householdKeys.list(),
        enabled: Boolean(user?.id),
        queryFn: async (): Promise<HouseholdWithRole[]> => {
            if (!user?.id) return []

            // Get all memberships
            const { data: memberships, error: membershipsError } = await supabase
                .from('household_members')
                .select('household_id, role')
                .eq('user_id', user.id)

            if (membershipsError) {
                throw new Error(membershipsError.message)
            }

            if (!memberships?.length) return []

            // Get household details
            const householdIds = memberships.map(m => m.household_id).filter(Boolean) as string[]

            const { data: households, error: householdsError } = await supabase
                .from('households')
                .select('*')
                .in('id', householdIds)

            if (householdsError) {
                throw new Error(householdsError.message)
            }

            // Combine with roles
            return (households ?? []).map(h => ({
                ...h,
                role: memberships.find(m => m.household_id === h.id)?.role ?? null,
            }))
        },
    })

    // Fetch user's active household from profile
    const { data: activeHouseholdId, isLoading: activeLoading } = useQuery({
        queryKey: householdKeys.active(),
        enabled: Boolean(user?.id),
        queryFn: async (): Promise<string | null> => {
            if (!user?.id) return null

            const { data, error } = await supabase
                .from('profiles')
                .select('active_household_id')
                .eq('id', user.id)
                .single()

            if (error) {
                throw new Error(error.message)
            }

            return data?.active_household_id ?? null
        },
    })

    // Switch household mutation
    const switchMutation = useMutation({
        mutationFn: async (householdId: string) => {
            if (!user?.id) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('profiles')
                .update({ active_household_id: householdId })
                .eq('id', user.id)

            if (error) {
                throw new Error(error.message)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: householdKeys.active() })
            // Invalidate all data that depends on household
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] })
        },
    })

    const switchHousehold = useCallback(async (householdId: string) => {
        await switchMutation.mutateAsync(householdId)
    }, [switchMutation])

    // Find active household from list
    const activeHousehold = useMemo(() => {
        if (!activeHouseholdId || !householdsData?.length) return null
        return householdsData.find(h => h.id === activeHouseholdId) ?? null
    }, [activeHouseholdId, householdsData])

    // Reset auto-select ref when user changes
    useEffect(() => {
        hasAutoSelectedRef.current = false
    }, [user?.id])

    // Handle initialization - only set initialized when user is logged in and queries complete
    useEffect(() => {
        // If no user, we're not initialized (waiting for auth)
        if (!user?.id) {
            setIsInitialized(false)
            return
        }

        // If user exists but queries still loading, keep waiting
        if (householdsLoading || activeLoading) {
            return
        }

        // User exists and queries complete - we're initialized
        setIsInitialized(true)

        // If user has households but none active, select first one (only once)
        if (householdsData?.length && !activeHouseholdId && !hasAutoSelectedRef.current) {
            hasAutoSelectedRef.current = true
            switchHousehold(householdsData[0].id).catch((err) => {
                console.error('Failed to auto-select household:', err)
                hasAutoSelectedRef.current = false // Allow retry
            })
        }
    }, [user?.id, householdsData, activeHouseholdId, householdsLoading, activeLoading, switchHousehold])

    // Permission helpers
    const currentRole = activeHousehold?.role
    const isOwner = currentRole === 'owner'
    const isAdmin = currentRole === 'admin' || isOwner
    const canManageMembers = isAdmin

    const value = useMemo<HouseholdContextValue>(() => ({
        activeHousehold,
        activeHouseholdId: activeHouseholdId ?? null,
        households: householdsData ?? [],
        isLoading: householdsLoading || activeLoading,
        isInitialized,
        switchHousehold,
        refetch,
        isOwner,
        isAdmin,
        canManageMembers,
    }), [
        activeHousehold,
        activeHouseholdId,
        householdsData,
        householdsLoading,
        activeLoading,
        isInitialized,
        switchHousehold,
        refetch,
        isOwner,
        isAdmin,
        canManageMembers,
    ])

    return (
        <HouseholdContext.Provider value={value}>
            {children}
        </HouseholdContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useHousehold = () => {
    const context = useContext(HouseholdContext)
    if (!context) {
        throw new Error('useHousehold must be used within a HouseholdProvider')
    }
    return context
}

// Hook to require an active household (redirects if none)
// eslint-disable-next-line react-refresh/only-export-components
export const useRequireHousehold = () => {
    const household = useHousehold()

    if (household.isInitialized && !household.activeHousehold && household.households.length === 0) {
        // User has no households - they need to create one or accept an invite
        return { ...household, needsHousehold: true }
    }

    return { ...household, needsHousehold: false }
}
