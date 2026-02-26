import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  useCreateTransaction,
  useUpdateTransaction,
} from '@/hooks/useTransactionMutations'
import type { Transaction } from '@/types/database'
import { CATEGORY_OPTIONS, type CategoryOption } from '@/lib/constants'

const PAYMENT_METHOD_OPTIONS = ['crédito', 'débito'] as const

type PaymentOption = (typeof PAYMENT_METHOD_OPTIONS)[number]

const parseCategory = (value?: string | null): CategoryOption => {
  if (!value) return CATEGORY_OPTIONS[0]
  return CATEGORY_OPTIONS.includes(value as CategoryOption) ? (value as CategoryOption) : 'outros'
}

const parsePaymentMethod = (value?: string | null): PaymentOption => {
  if (!value) return PAYMENT_METHOD_OPTIONS[0]
  return PAYMENT_METHOD_OPTIONS.includes(value as PaymentOption)
    ? (value as PaymentOption)
    : PAYMENT_METHOD_OPTIONS[0]
}

const transactionSchema = z
  .object({
    date: z.date(),
    description: z.string().min(1, 'Descrição obrigatória'),
    category: z.enum(CATEGORY_OPTIONS),
    payment_method: z.enum(PAYMENT_METHOD_OPTIONS),
    total_amount: z.number().positive('Valor deve ser positivo'),
    is_shared: z.boolean(),
    is_installment: z.boolean(),
    installment_count: z
      .number()
      .int('Use apenas números inteiros')
      .positive('Quantidade deve ser maior que zero')
      .nullable()
      .optional(),
    first_installment_date: z.date().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.is_installment) {
      if (!data.installment_count) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe a quantidade de parcelas',
          path: ['installment_count'],
        })
      }
      if (!data.first_installment_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe a data da primeira parcela',
          path: ['first_installment_date'],
        })
      }
    }
  })

type TransactionFormValues = z.infer<typeof transactionSchema>

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addMonths = (date: Date, monthsToAdd: number) => {
  const base = new Date(date)
  base.setMonth(base.getMonth() + monthsToAdd)
  return formatDate(base)
}

type TransactionFormProps = {
  mode: 'create' | 'edit'
  initialData?: Transaction
  selectedMonth?: number
  selectedYear?: number
  onSubmitSuccess?: () => void
  onCancel: () => void
}

export const TransactionForm = ({
  mode,
  initialData,
  selectedMonth,
  selectedYear,
  onSubmitSuccess,
  onCancel,
}: TransactionFormProps) => {
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const isEditMode = mode === 'edit'

  // State for popover control
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isFirstInstallmentCalendarOpen, setIsFirstInstallmentCalendarOpen] = useState(false)

  const defaultValues = useMemo(() => {
    // Generate default date based on selected month/year or current date
    const getDefaultDate = () => {
      if (initialData?.date) {
        return new Date(initialData.date)
      }
      if (selectedMonth && selectedYear) {
        // Use day 15 of the selected month as default to avoid edge cases
        return new Date(selectedYear, selectedMonth - 1, 15)
      }
      return new Date()
    }

    return {
      date: getDefaultDate(),
      description: initialData?.description ?? '',
      category: parseCategory(initialData?.category),
      payment_method: parsePaymentMethod(initialData?.payment_method),
      total_amount: initialData?.total_amount,
      is_shared: initialData?.is_shared ?? true,
      is_installment: initialData?.is_installment ?? false,
      installment_count: initialData?.installment_count ?? null,
      first_installment_date: initialData?.first_installment_date
        ? new Date(initialData.first_installment_date)
        : undefined,
    }
  }, [initialData, selectedMonth, selectedYear])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  })

  // Watchers
  const isInstallment = useWatch({ control, name: 'is_installment' })
  const paymentMethod = useWatch({ control, name: 'payment_method' })
  const isInstallmentDisabled = paymentMethod === 'débito'

  // Effect to reset installment when debit is selected
  useEffect(() => {
    if (paymentMethod === 'débito') {
      setValue('is_installment', false)
    }
  }, [paymentMethod, setValue])

  const buildPayload = (values: TransactionFormValues) => {
    const installmentCount = values.is_installment ? values.installment_count ?? null : null
    const firstInstallmentDate = values.is_installment && values.first_installment_date
      ? formatDate(values.first_installment_date)
      : null

    const installmentValue =
      values.is_installment && installmentCount
        ? Number((values.total_amount / installmentCount).toFixed(2))
        : null

    const lastInstallmentDate =
      values.is_installment && values.first_installment_date && installmentCount
        ? addMonths(values.first_installment_date, installmentCount - 1)
        : null

    return {
      date: formatDate(values.date),
      description: values.description,
      category: values.category,
      payment_method: values.payment_method,
      total_amount: values.total_amount,
      is_shared: values.is_shared,
      is_installment: values.is_installment,
      installment_count: installmentCount,
      first_installment_date: firstInstallmentDate,
      installment_value: installmentValue,
      last_installment_date: lastInstallmentDate,
    }
  }

  const onSubmit = async (formValues: TransactionFormValues) => {
    const payload = buildPayload(formValues)

    try {
      if (isEditMode && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onSubmitSuccess?.()
    } catch (err) {
      console.error(err)
    }
  }

  const mutationError = createMutation.error ?? updateMutation.error
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <style>{`
        /* Chrome, Safari, Edge, Opera */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
      `}</style>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 ">
          <Label htmlFor="date">Data</Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date)
                      setIsCalendarOpen(false)
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="total_amount">Valor total (R$)</Label>
          <Input
            id="total_amount"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register('total_amount', {
              setValueAs: (value) => {
                if (value === '' || value === null || typeof value === 'undefined') {
                  return undefined
                }
                const parsed = Number(value)
                return Number.isNaN(parsed) ? undefined : parsed
              },
            })}
          />
          {errors.total_amount && (
            <p className="text-xs text-destructive">{errors.total_amount.message}</p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            type="text"
            placeholder="Ex: Supermercado do mês"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" className="text-left capitalize">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className=" border border-border/70 bg-card/95 shadow-planify-soft py-0.5">
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_method">Forma de pagamento</Label>
          <Controller
            name="payment_method"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="payment_method" className="text-left capitalize">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border border-border/70 bg-card/95 shadow-planify-soft py-0.5">
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.payment_method && (
            <p className="text-xs text-destructive">{errors.payment_method.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          name="is_shared"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3 rounded-sm border border-border/70 bg-planify-soft/30 px-4 py-3">
              <Checkbox
                id="is_shared"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <Label htmlFor="is_shared" className="text-sm font-medium text-foreground">
                Compartilhada entre o casal
              </Label>
            </div>
          )}
        />
        <Controller
          name="is_installment"
          control={control}
          render={({ field }) => (
            <div
              className={cn(
                'flex items-center gap-3 rounded-sm border border-border/70 bg-planify-soft/30 px-4 py-3',
                isInstallmentDisabled && 'opacity-50',
              )}
            >
              <Checkbox
                id="is_installment"
                checked={field.value}
                disabled={isInstallmentDisabled}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <Label htmlFor="is_installment" className="text-sm font-medium text-foreground">
                Pagamento parcelado
              </Label>
            </div>
          )}
        />
      </div>

      {isInstallment && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="installment_count">Quantidade de parcelas</Label>
            <Input
              id="installment_count"
              type="number"
              min={1}
              {...register('installment_count', {
                setValueAs: (value) => {
                  if (value === '' || value === null || typeof value === 'undefined') {
                    return null
                  }
                  const parsed = Number(value)
                  return Number.isNaN(parsed) ? null : parsed
                },
              })}
            />
            {errors.installment_count && (
              <p className="text-xs text-destructive">{errors.installment_count.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_installment_date">Data da primeira parcela</Label>
            <Controller
              name="first_installment_date"
              control={control}
              render={({ field }) => (
                <Popover open={isFirstInstallmentCalendarOpen} onOpenChange={setIsFirstInstallmentCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => {
                        field.onChange(date)
                        setIsFirstInstallmentCalendarOpen(false)
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.first_installment_date && (
              <p className="text-xs text-destructive">{errors.first_installment_date.message}</p>
            )}
          </div>
        </div>
      )}

      {mutationError && (
        <p className="text-sm font-medium text-destructive">{mutationError.message ?? 'Erro ao salvar'}</p>
      )}

      <DialogFooter className="gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className=" px-6 font-semibold transition-transform duration-150 hover:-translate-y-0.5"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Criar transação'}
        </Button>
      </DialogFooter>
    </form >
  )
}
