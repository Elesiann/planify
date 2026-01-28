import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { Household } from '@/lib/HouseholdProvider'

type HouseholdFormData = {
    name: string
    currency: string
    fixed_due_day: number
}

type HouseholdFormProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    household?: Household | null
    onSubmit: (data: HouseholdFormData) => Promise<void>
    isLoading?: boolean
}

const CURRENCY_OPTIONS = [
    { value: 'BRL', label: 'BRL - Real Brasileiro' },
    { value: 'USD', label: 'USD - Dolar Americano' },
    { value: 'EUR', label: 'EUR - Euro' },
]

const DUE_DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
}))

export function HouseholdForm({
    open,
    onOpenChange,
    household,
    onSubmit,
    isLoading = false,
}: HouseholdFormProps) {
    const [name, setName] = useState('')
    const [currency, setCurrency] = useState('BRL')
    const [fixedDueDay, setFixedDueDay] = useState(5)

    const isEditing = Boolean(household)
    const title = isEditing ? 'Editar Household' : 'Criar Household'
    const description = isEditing
        ? 'Atualize as configuracoes da sua household.'
        : 'Configure sua nova household para gerenciar gastos.'

    useEffect(() => {
        if (household) {
            setName(household.name)
            setCurrency(household.currency ?? 'BRL')
            setFixedDueDay(household.fixed_due_day ?? 5)
        } else {
            setName('')
            setCurrency('BRL')
            setFixedDueDay(5)
        }
    }, [household, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            name,
            currency,
            fixed_due_day: fixedDueDay,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="household-name">Nome</Label>
                        <Input
                            id="household-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Casa Principal"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="household-currency">Moeda</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger id="household-currency">
                                <SelectValue placeholder="Selecione a moeda" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCY_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="household-due-day">Dia de Vencimento</Label>
                        <Select
                            value={String(fixedDueDay)}
                            onValueChange={(v) => setFixedDueDay(Number(v))}
                        >
                            <SelectTrigger id="household-due-day">
                                <SelectValue placeholder="Selecione o dia" />
                            </SelectTrigger>
                            <SelectContent>
                                {DUE_DAY_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={String(option.value)}>
                                        Dia {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Dia do mes em que as despesas fixas vencem.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : isEditing ? (
                                'Salvar'
                            ) : (
                                'Criar'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
