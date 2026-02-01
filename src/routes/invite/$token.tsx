import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { CheckCircle, Home, Loader2, XCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useInviteByToken, useAcceptInvite } from '@/hooks/useInvites'

export default function InvitePage() {
    const { token } = useParams({ from: '/invite/$token' })
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const { data: invite, isLoading, error } = useInviteByToken(token)
    const acceptInvite = useAcceptInvite()
    const [acceptError, setAcceptError] = useState<string | null>(null)

    useEffect(() => {
        document.title = 'Planify | Convite'
    }, [])

    const handleAccept = async () => {
        if (!token) return
        setAcceptError(null)

        try {
            await acceptInvite.mutateAsync(token)
            // Small delay to allow cache invalidation to complete
            await new Promise(resolve => setTimeout(resolve, 500))
            // Force reload to ensure HouseholdProvider picks up new data
            window.location.href = '/'
        } catch (err) {
            setAcceptError(err instanceof Error ? err.message : 'Erro ao aceitar convite')
        }
    }

    const handleLogin = () => {
        // Store the invite URL to return after login (using localStorage to persist across OAuth redirect)
        localStorage.setItem('returnTo', `/invite/${token}`)
        navigate({ to: '/login' })
    }

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">Carregando convite...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !invite) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold">Convite Inválido</h1>
                    <p className="text-muted-foreground">
                        Este convite não existe ou já expirou.
                    </p>
                    <Button onClick={() => navigate({ to: user ? '/' : '/login' })} className="w-full">
                        {user ? 'Ir para o Início' : 'Fazer Login'}
                    </Button>
                </div>
            </div>
        )
    }

    // Check invite status
    const expiresAt = invite.expires_at ? new Date(invite.expires_at) : null
    const isExpired =
        invite.status === 'expired' ||
        (expiresAt ? Number.isNaN(expiresAt.getTime()) || expiresAt < new Date() : true)
    const isAccepted = invite.status === 'accepted'
    const isRevoked = invite.status === 'revoked'

    if (isExpired || isAccepted || isRevoked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <XCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">Convite Indisponível</h1>
                    <p className="text-muted-foreground">
                        {isExpired && 'Este convite expirou.'}
                        {isAccepted && 'Este convite já foi utilizado.'}
                        {isRevoked && 'Este convite foi revogado.'}
                    </p>
                    <Button onClick={() => navigate({ to: user ? '/' : '/login' })} className="w-full">
                        {user ? 'Ir para o Início' : 'Fazer Login'}
                    </Button>
                </div>
            </div>
        )
    }

    // Valid invite - show accept UI
    const householdName = invite.households?.name ?? 'Household'
    const invitedByName = invite.profiles?.name ?? 'Alguém'

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Convite para Household</h1>
                    <p className="mt-2 text-muted-foreground">
                        Você foi convidado para participar de uma household
                    </p>
                </div>

                {/* Invite Details Card */}
                <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Home className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold">{householdName}</h2>
                            <p className="text-sm text-muted-foreground">
                                Convidado por {invitedByName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">Seu papel:</span>
                        <span className="text-sm font-medium capitalize">
                            {invite.role === 'admin' ? 'Administrador' : 'Membro'}
                        </span>
                    </div>

                    {!user && (
                        <div className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                            Você precisa fazer login para aceitar o convite.
                        </div>
                    )}

                    {acceptError && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            {acceptError}
                        </div>
                    )}

                    {user ? (
                        <Button
                            onClick={handleAccept}
                            className="w-full"
                            disabled={acceptInvite.isPending}
                        >
                            {acceptInvite.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Aceitando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Aceitar Convite
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleLogin} className="w-full">
                            Fazer Login para Aceitar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
