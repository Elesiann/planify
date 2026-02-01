import { useState } from 'react'
import { Check, Crown, Edit2, Home, Loader2, Plus, Shield, Trash2, User, Users } from 'lucide-react'
import { HeroCard } from '@/components/planify/HeroCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { HouseholdForm } from '@/components/household/HouseholdForm'
import { InviteManager } from '@/components/InviteManager'
import { useHousehold, type Household } from '@/lib/HouseholdProvider'
import { useHouseholdMembers, type HouseholdMemberWithProfile } from '@/hooks/useHouseholdMembers'
import {
    useCreateHousehold,
    useUpdateHousehold,
    useDeleteHousehold,
    useUpdateMemberShare,
    useRemoveMember,
} from '@/hooks/useHouseholdMutations'
import { cn } from '@/lib/utils'

const getRoleBadge = (role: string | null) => {
    switch (role) {
        case 'owner':
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-500">
                    <Crown className="h-3 w-3" />
                    Proprietário
                </span>
            )
        case 'admin':
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-500">
                    <Shield className="h-3 w-3" />
                    Administrador
                </span>
            )
        default:
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <User className="h-3 w-3" />
                    Membro
                </span>
            )
    }
}

const HouseholdsPage = () => {
    const {
        activeHousehold,
        households,
        switchHousehold,
        isLoading: householdsLoading,
        isOwner,
        isAdmin,
    } = useHousehold()

    const { data: members = [], isLoading: membersLoading } = useHouseholdMembers()
    const createHousehold = useCreateHousehold()
    const updateHousehold = useUpdateHousehold()
    const deleteHousehold = useDeleteHousehold()
    const updateMemberShare = useUpdateMemberShare()
    const removeMember = useRemoveMember()

    const [formOpen, setFormOpen] = useState(false)
    const [editingHousehold, setEditingHousehold] = useState<Household | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [householdToDelete, setHouseholdToDelete] = useState<Household | null>(null)
    const [editingMember, setEditingMember] = useState<HouseholdMemberWithProfile | null>(null)
    const [memberShareValue, setMemberShareValue] = useState('')
    const [removingMember, setRemovingMember] = useState<HouseholdMemberWithProfile | null>(null)
    const [switchingId, setSwitchingId] = useState<string | null>(null)

    const canManage = isOwner || isAdmin

    const handleCreateOrUpdate = async (data: { name: string; currency: string; fixed_due_day: number }) => {
        try {
            if (editingHousehold) {
                await updateHousehold.mutateAsync({
                    id: editingHousehold.id,
                    name: data.name,
                    currency: data.currency,
                    fixed_due_day: data.fixed_due_day,
                })
            } else {
                await createHousehold.mutateAsync({
                    name: data.name,
                    currency: data.currency,
                    fixed_due_day: data.fixed_due_day,
                })
            }
            setFormOpen(false)
            setEditingHousehold(null)
        } catch (error) {
            console.error('Failed to save household:', error)
        }
    }

    const handleDelete = async () => {
        if (!householdToDelete) return
        try {
            await deleteHousehold.mutateAsync(householdToDelete.id)
            setDeleteDialogOpen(false)
            setHouseholdToDelete(null)
        } catch (error) {
            console.error('Failed to delete household:', error)
        }
    }

    const handleUpdateMemberShare = async () => {
        if (!editingMember) return
        const shareValue = parseFloat(memberShareValue)
        if (isNaN(shareValue) || shareValue < 0 || shareValue > 1) return

        try {
            await updateMemberShare.mutateAsync({
                memberId: editingMember.id,
                shareRatio: shareValue,
            })
            setEditingMember(null)
            setMemberShareValue('')
        } catch (error) {
            console.error('Failed to update member share:', error)
        }
    }

    const handleRemoveMember = async () => {
        if (!removingMember) return
        try {
            await removeMember.mutateAsync(removingMember.id)
            setRemovingMember(null)
        } catch (error) {
            console.error('Failed to remove member:', error)
        }
    }

    const openEdit = (household: Household) => {
        setEditingHousehold(household)
        setFormOpen(true)
    }

    const openDelete = (household: Household) => {
        setHouseholdToDelete(household)
        setDeleteDialogOpen(true)
    }

    const openMemberEdit = (member: HouseholdMemberWithProfile) => {
        setEditingMember(member)
        setMemberShareValue(String(member.share_ratio))
    }

    const getHouseholdRole = (householdId: string) => {
        return households.find((h) => h.id === householdId)?.role ?? null
    }

    const isLoading = householdsLoading || membersLoading

    return (
        <section className="space-y-6">
            <HeroCard className="gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold">Households</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie suas households, membros e configurações financeiras.
                        </p>
                    </div>
                    <Button onClick={() => setFormOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nova Household
                    </Button>
                </div>
            </HeroCard>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : households.length === 0 ? (
                <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
                    <CardHeader className="text-center">
                        <CardTitle>Nenhuma household encontrada</CardTitle>
                        <CardDescription>
                            Crie sua primeira household para começar a gerenciar seus gastos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-6">
                        <Button onClick={() => setFormOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Criar Household
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Households List */}
                    <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                Suas Households
                            </CardTitle>
                            <CardDescription>
                                {households.length} household{households.length !== 1 ? 's' : ''} {households.length !== 1 ? 'disponíveis' : 'disponível'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {households.map((household) => {
                                const isActive = household.id === activeHousehold?.id
                                const role = getHouseholdRole(household.id)
                                const isHouseholdOwner = role === 'owner'
                                const isSwitching = switchingId === household.id

                                const handleSwitch = async () => {
                                    if (!isActive && !switchingId) {
                                        try {
                                            setSwitchingId(household.id)
                                            await switchHousehold(household.id)
                                        } finally {
                                            setSwitchingId(null)
                                        }
                                    }
                                }

                                return (
                                    <div
                                        key={household.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={handleSwitch}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                handleSwitch()
                                            }
                                        }}
                                        className={cn(
                                            'flex items-center justify-between rounded-xl border p-4 transition-colors',
                                            isActive
                                                ? 'border-primary/50 bg-primary/5'
                                                : 'border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer',
                                            isSwitching && 'opacity-70 cursor-wait'
                                        )}
                                    >
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            {/* Radio Indicator or Loading Spinner */}
                                            <div className={cn(
                                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                                isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground",
                                                isSwitching && "border-transparent"
                                            )}>
                                                {isSwitching ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                ) : isActive && (
                                                    <Check className="h-3 w-3" />
                                                )}
                                            </div>

                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("font-medium truncate", isActive && "text-primary")}>
                                                        {household.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{household.currency ?? 'BRL'}</span>
                                                    <span>-</span>
                                                    <span>Venc. dia {household.fixed_due_day ?? 5}</span>
                                                </div>
                                                <div className="pt-1">{getRoleBadge(role)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isHouseholdOwner && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        disabled={isSwitching}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openEdit(household)
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        disabled={isSwitching}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openDelete(household)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Members Section (only for active household) */}
                    {activeHousehold && (
                        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Membros de {activeHousehold.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {members.length} membro{members.length !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </div>
                                    {canManage && <InviteManager />}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {members.map((member) => {
                                    const isOwnerMember = member.role === 'owner'

                                    return (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-4"
                                        >
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate">
                                                        {member.profile?.name ?? 'Sem nome'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Share: {(member.share_ratio * 100).toFixed(0)}%</span>
                                                    {member.profile?.income && (
                                                        <>
                                                            <span>-</span>
                                                            <span>
                                                                Renda: {new Intl.NumberFormat('pt-BR', {
                                                                    style: 'currency',
                                                                    currency: activeHousehold.currency ?? 'BRL',
                                                                }).format(member.profile.income)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="pt-1">{getRoleBadge(member.role)}</div>
                                            </div>
                                            {canManage && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openMemberEdit(member)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    {isOwner && !isOwnerMember && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => setRemovingMember(member)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Household Form Dialog */}
            <HouseholdForm
                key={formOpen ? (editingHousehold?.id ?? 'new') : 'closed'}
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open)
                    if (!open) setEditingHousehold(null)
                }}
                household={editingHousehold}
                onSubmit={handleCreateOrUpdate}
                isLoading={createHousehold.isPending || updateHousehold.isPending}
            />

            {/* Delete Household Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Household</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir a household "{householdToDelete?.name}"?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteHousehold.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteHousehold.isPending}
                        >
                            {deleteHousehold.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                'Excluir'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Member Share Dialog */}
            <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Share Ratio</DialogTitle>
                        <DialogDescription>
                            Atualize a proporcao de gastos de {editingMember?.profile?.name ?? 'este membro'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="share-ratio">Share Ratio (0 a 1)</Label>
                            <Input
                                id="share-ratio"
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={memberShareValue}
                                onChange={(e) => setMemberShareValue(e.target.value)}
                                placeholder="Ex: 0.5 para 50%"
                            />
                            <p className="text-xs text-muted-foreground">
                                Valor entre 0 e 1 representando a porcentagem dos gastos.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingMember(null)}
                            disabled={updateMemberShare.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdateMemberShare}
                            disabled={updateMemberShare.isPending}
                        >
                            {updateMemberShare.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Member Confirmation Dialog */}
            <Dialog open={Boolean(removingMember)} onOpenChange={(open) => !open && setRemovingMember(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover Membro</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja remover {removingMember?.profile?.name ?? 'este membro'} da household?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRemovingMember(null)}
                            disabled={removeMember.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemoveMember}
                            disabled={removeMember.isPending}
                        >
                            {removeMember.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removendo...
                                </>
                            ) : (
                                'Remover'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

export default HouseholdsPage
