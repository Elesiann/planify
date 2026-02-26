import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORY_OPTIONS } from '@/lib/constants'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import type { ShoppingListItem } from '@/types/database'

const shoppingItemSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  category: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  url: z.string().refine((v) => !v || z.string().url().safeParse(v).success, 'URL inválida').optional(),
})

type ShoppingItemFormValues = z.infer<typeof shoppingItemSchema>

const NONE = '__none__'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
] as const

type FormOutput = Omit<ShoppingItemFormValues, 'url'> & { url: string | null }

type ShoppingListItemFormProps = {
  initialData?: ShoppingListItem
  onSubmitSuccess: (values: FormOutput) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export const ShoppingListItemForm = ({
  initialData,
  onSubmitSuccess,
  onCancel,
  isSubmitting = false,
}: ShoppingListItemFormProps) => {
  const { data: members = [] } = useHouseholdMembers()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ShoppingItemFormValues>({
    resolver: zodResolver(shoppingItemSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      category: initialData?.category ?? null,
      priority: initialData?.priority ?? 'medium',
      notes: initialData?.notes ?? '',
      assigned_to: initialData?.assigned_to ?? null,
      url: initialData?.url ?? '',
    },
  })

  const handleSubmit_ = handleSubmit((values) => {
    onSubmitSuccess({ ...values, url: values.url || null })
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit_}>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          placeholder="Ex: Detergente"
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria <span className="font-normal text-muted-foreground">(opcional)</span></Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? NONE}
                onValueChange={(v) => field.onChange(v === NONE ? null : v)}
              >
                <SelectTrigger id="category" className="text-left capitalize">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border border-border/70 bg-card/95 shadow-planify-soft py-0.5">
                  <SelectItem value={NONE}>—</SelectItem>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="priority" className="text-left">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border border-border/70 bg-card/95 shadow-planify-soft py-0.5">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.priority && <p className="text-xs text-destructive">{errors.priority.message}</p>}
        </div>
      </div>

      {members.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Responsável <span className="font-normal text-muted-foreground">(opcional)</span></Label>
          <Controller
            name="assigned_to"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? NONE}
                onValueChange={(v) => field.onChange(v === NONE ? null : v)}
              >
                <SelectTrigger id="assigned_to" className="text-left">
                  <SelectValue placeholder="Ninguém (opcional)" />
                </SelectTrigger>
                <SelectContent className="border border-border/70 bg-card/95 shadow-planify-soft py-0.5">
                  <SelectItem value={NONE}>Ninguém</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.name ?? m.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="url">Link <span className="font-normal text-muted-foreground">(opcional)</span></Label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            id="url"
            type="url"
            placeholder="https://..."
            className="pl-8"
            {...register('url')}
          />
        </div>
        {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas <span className="font-normal text-muted-foreground">(opcional)</span></Label>
        <Textarea
          id="notes"
          placeholder="Informações adicionais (opcional)"
          rows={2}
          {...register('notes')}
        />
      </div>

      <DialogFooter className="gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="px-6 font-semibold transition-transform duration-150 hover:-translate-y-0.5"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : initialData ? 'Salvar alterações' : 'Adicionar item'}
        </Button>
      </DialogFooter>
    </form>
  )
}
