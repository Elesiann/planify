import { useState } from 'react'
import { Copy, Link, Loader2, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useInvites, useCreateInvite, useRevokeInvite } from '@/hooks/useInvites'
import { useHousehold } from '@/lib/HouseholdProvider'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

export function InviteManager() {
    const { activeHousehold, canManageMembers } = useHousehold()
    const { data: members } = useHouseholdMembers()
    const { data: invites, isLoading } = useInvites()
    const createInvite = useCreateInvite()
    const revokeInvite = useRevokeInvite()
    const [isOpen, setIsOpen] = useState(false)
    const [role, setRole] = useState<'member' | 'admin'>('member')

    const isHouseholdFull = (members?.length ?? 0) >= 2
    const fullHouseholdMessage = "Por enquanto o Planify só suporta households com 2 membros."
    const [copiedId, setCopiedId] = useState<string | null>(null)

    if (!canManageMembers) {
        return null
    }

    const handleCreateInvite = async () => {
        try {
            await createInvite.mutateAsync({ role })
        } catch (error) {
            console.error('Failed to create invite:', error)
        }
    }

    const handleCopyLink = async (token: string, id: string) => {
        try {
            const link = `${window.location.origin}/invite/${token}`
            await navigator.clipboard.writeText(link)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
            // Consider showing user feedback here
        }
    }

    const handleRevoke = async (inviteId: string) => {
        try {
            await revokeInvite.mutateAsync(inviteId)
        } catch (error) {
            console.error('Failed to revoke invite:', error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={0} className="inline-flex">
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    disabled={isHouseholdFull}
                                >
                                    <Users className="h-4 w-4" />
                                    Convidar
                                </Button>
                            </DialogTrigger>
                        </span>
                    </TooltipTrigger>
                    {isHouseholdFull && (
                        <TooltipContent>
                            <p>{fullHouseholdMessage}</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Convidar para {activeHousehold?.name}</DialogTitle>
                    <DialogDescription>
                        Crie um link de convite para adicionar pessoas à sua household.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Create new invite */}
                    <div className="space-y-3">
                        <Label>Criar novo convite</Label>
                        <div className="flex gap-2">
                            <Select value={role} onValueChange={(v) => setRole(v as 'member' | 'admin')}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Papel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Membro</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="flex-1 flex" tabIndex={0}>
                                            <Button
                                                onClick={handleCreateInvite}
                                                disabled={createInvite.isPending || isHouseholdFull}
                                                size="lg"
                                                className="flex-1"
                                            >
                                                {createInvite.isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Criando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link className="mr-2 h-4 w-4" />
                                                        Criar Link
                                                    </>
                                                )}
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    {isHouseholdFull && (
                                        <TooltipContent>
                                            <p>{fullHouseholdMessage}</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    {/* Existing invites */}
                    {isLoading ? (
                        <div className="text-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : invites && invites.length > 0 ? (
                        <div className="space-y-3">
                            <Label>Convites ativos</Label>
                            <div className="space-y-2">
                                {invites.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium capitalize">
                                                {invite.role === 'admin' ? 'Administrador' : 'Membro'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                Expira em {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleCopyLink(invite.token, invite.id)}
                                            >
                                                {copiedId === invite.id ? (
                                                    <span className="text-xs text-green-500">✓</span>
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRevoke(invite.id)}
                                                disabled={revokeInvite.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                            Nenhum convite ativo. Crie um para convidar pessoas.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
