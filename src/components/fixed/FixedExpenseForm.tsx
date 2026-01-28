import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateFixedExpense,
  useUpdateFixedExpense,
} from '@/hooks/useFixedExpenseMutations'
import type { FixedExpense } from '@/types/database'

const fixedExpenseSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
})

type FixedExpenseFormValues = z.infer<typeof fixedExpenseSchema>

type FixedExpenseFormProps = {
  mode: 'create' | 'edit'
  initialData?: FixedExpense
  onSubmitSuccess?: () => void
  onCancel: () => void
}

export const FixedExpenseForm = ({
  mode,
  initialData,
  onSubmitSuccess,
  onCancel,
}: FixedExpenseFormProps) => {
  const createMutation = useCreateFixedExpense()
  const updateMutation = useUpdateFixedExpense()
  const isEditMode = mode === 'edit'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FixedExpenseFormValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: {
      description: initialData?.description ?? '',
      amount: initialData?.amount,
    },
  })

  const onSubmit = async (values: FixedExpenseFormValues) => {
    try {
      if (isEditMode && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: values,
        })
      } else {
        await createMutation.mutateAsync(values)
      }
      onSubmitSuccess?.()
    } catch (error) {
      console.error(error)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error ?? updateMutation.error

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" type="text" {...register('description')} />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          {...register('amount', {
            setValueAs: (value) => {
              if (value === '' || value === null || typeof value === 'undefined') {
                return undefined
              }
              const parsed = Number(value)
              return Number.isNaN(parsed) ? undefined : parsed
            },
          })}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      {mutationError && (
        <p className="text-sm font-medium text-destructive">{mutationError.message ?? 'Erro ao salvar.'}</p>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar mudanças' : 'Criar despesa fixa'}
        </Button>
      </DialogFooter>
    </form>
  )
}
