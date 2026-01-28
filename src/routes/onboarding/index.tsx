import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Home, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RequireAuth } from '@/lib/auth'
import { useHousehold } from '@/lib/HouseholdProvider'
import { useCreateHousehold } from '@/hooks/useHouseholdMutations'

function OnboardingContent() {
    const navigate = useNavigate()
    const createHousehold = useCreateHousehold()
    const { switchHousehold, refetch } = useHousehold()
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        document.title = 'Planify | Bem-vindo'
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name.trim()) {
            setError('Nome é obrigatório')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await createHousehold.mutateAsync({ name: name.trim() })
            // Wait for household data to refresh
            await refetch()
            // Switch to the newly created household
            if (!result.id && result.id !== 0) {
                throw new Error('Household criada mas ID não retornado')
            }
            await switchHousehold(result.id)
            navigate({ to: '/' })
        } catch (err) {
            setIsSubmitting(false)
            setError(err instanceof Error ? err.message : 'Erro ao criar household')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Home className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao Planify!</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Para começar, crie sua primeira household (casa/família)
                    </p>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Household</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Ex: Casa, Família Silva, Apartamento..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                Este é o nome que aparecerá no app. Você pode criar até 3 households.
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                'Criar Household'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-muted-foreground">
                    Depois, você pode convidar outras pessoas para sua household
                </p>
            </div>
        </div>
    )
}

export default function OnboardingPage() {
    return (
        <RequireAuth>
            <OnboardingContent />
        </RequireAuth>
    )
}
