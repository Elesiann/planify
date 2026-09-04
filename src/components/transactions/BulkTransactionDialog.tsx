import { useMemo, useState } from 'react'
import {
  Check,
  FileText,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Table as TableIcon,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { useCreateTransactionsBatch } from '@/hooks/useTransactionMutations'
import {
  CATEGORIES,
  type Category,
  getDaysInMonth,
  parseBulkText,
  type ParsedTransactionItem,
} from '@/lib/bulkTransactions'

const MONTH_OPTIONS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type BulkTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMonth?: number
  defaultYear?: number
}

export function BulkTransactionDialog({
  open,
  onOpenChange,
  defaultMonth,
  defaultYear,
}: BulkTransactionDialogProps) {
  const now = new Date()
  const { user } = useAuth()
  const { data: members = [] } = useHouseholdMembers()
  const createBatch = useCreateTransactionsBatch()

  const [month, setMonth] = useState(defaultMonth || now.getMonth() + 1)
  const [year, setYear] = useState(defaultYear || now.getFullYear())
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<'crédito' | 'débito'>('crédito')
  const [selectedPayer, setSelectedPayer] = useState<string>('')
  const [rawText, setRawText] = useState('')
  const [items, setItems] = useState<ParsedTransactionItem[]>([])
  const [invalidRowIds, setInvalidRowIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'text' | 'table'>('text')

  const resolvedPayerId = selectedPayer || user?.id || members[0]?.user_id || ''

  const membersList = useMemo(
    () =>
      members.map((m) => ({
        userId: m.user_id,
        name: m.profile?.name || 'Membro',
      })),
    [members]
  )

  const parseContext = useMemo(
    () => ({
      defaultMonth: month,
      defaultYear: year,
      defaultPaidBy: resolvedPayerId,
      defaultPaidByName:
        membersList.find((m) => m.userId === resolvedPayerId)?.name || 'Eu',
      defaultPaymentMethod,
      members: membersList,
    }),
    [month, year, resolvedPayerId, defaultPaymentMethod, membersList]
  )

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth)
    setItems((prev) =>
      prev.map((item) => {
        const maxDays = getDaysInMonth(year, newMonth)
        const d = Math.min(item.day, maxDays)
        return {
          ...item,
          day: d,
          date: `${year}-${String(newMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        }
      })
    )
  }

  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    setItems((prev) =>
      prev.map((item) => {
        const maxDays = getDaysInMonth(newYear, month)
        const d = Math.min(item.day, maxDays)
        return {
          ...item,
          day: d,
          date: `${newYear}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        }
      })
    )
  }

  const handleParseText = () => {
    if (!rawText.trim()) {
      toast.error('Cole ou digite ao menos uma linha de transação.')
      return
    }

    const parsed = parseBulkText(rawText, parseContext)
    if (parsed.length === 0) {
      toast.error('Nenhuma linha pôde ser interpretada. Verifique o formato.')
      return
    }

    setItems(parsed)
    setInvalidRowIds(new Set())
    setActiveTab('table')
    toast.success(`${parsed.length} ${parsed.length === 1 ? 'transação interpretada' : 'transações interpretadas'}!`)
  }

  const handleAddNewRow = () => {
    const maxDays = getDaysInMonth(year, month)
    const defaultDay = Math.min(new Date().getDate(), maxDays)
    const dateIso = `${year}-${String(month).padStart(2, '0')}-${String(defaultDay).padStart(2, '0')}`
    const newItem: ParsedTransactionItem = {
      id: Math.random().toString(36).substring(2, 9),
      date: dateIso,
      day: defaultDay,
      description: '',
      total_amount: 0,
      category: 'alimentação',
      paid_by: resolvedPayerId,
      paid_by_name:
        membersList.find((m) => m.userId === resolvedPayerId)?.name || 'Eu',
      payment_method: defaultPaymentMethod,
      is_shared: true,
    }
    setItems((prev) => [...prev, newItem])
    setActiveTab('table')
  }

  const handleUpdateItem = (id: string, patch: Partial<ParsedTransactionItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, ...patch }
        if (patch.day !== undefined) {
          const rawD = Number(patch.day) || 1
          const maxDays = getDaysInMonth(year, month)
          const d = Math.max(1, Math.min(maxDays, rawD))
          updated.day = d
          updated.date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        }
        if (patch.paid_by !== undefined) {
          updated.paid_by_name =
            membersList.find((m) => m.userId === patch.paid_by)?.name || 'Membro'
        }
        return updated
      })
    )
    setInvalidRowIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setInvalidRowIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0),
    [items]
  )

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Nenhuma transação para salvar.')
      return
    }

    const invalidList: Array<{ index: number; reason: string }> = []
    const newInvalidIds = new Set<string>()

    items.forEach((item, idx) => {
      const lineNum = idx + 1
      if (!item.description.trim()) {
        invalidList.push({ index: lineNum, reason: `Linha ${lineNum}: informe a descrição.` })
        newInvalidIds.add(item.id)
      } else if (!item.total_amount || item.total_amount <= 0) {
        invalidList.push({ index: lineNum, reason: `Linha ${lineNum}: informe um valor positivo.` })
        newInvalidIds.add(item.id)
      }
    })

    setInvalidRowIds(newInvalidIds)

    if (invalidList.length > 0) {
      toast.error(invalidList[0].reason)
      return
    }

    try {
      const payload = items.map((item) => ({
        date: item.date,
        description: item.description.trim(),
        total_amount: Math.round(Number(item.total_amount) * 100) / 100,
        category: item.category,
        paid_by: item.paid_by,
        payment_method: item.payment_method,
        is_shared: item.is_shared,
        is_installment: false,
      }))

      await createBatch.mutateAsync(payload)
      toast.success(`🎉 ${items.length} ${items.length === 1 ? 'transação registrada' : 'transações registradas'} com sucesso!`)
      setItems([])
      setRawText('')
      setInvalidRowIds(new Set())
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar transações.'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Lançar Transações em Lote</DialogTitle>
              <DialogDescription>
                Adicione múltiplas transações de uma só vez colando texto ou preenchendo a tabela rápida.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Top Controls / Defaults */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mês</Label>
            <Select value={String(month)} onValueChange={(v) => handleMonthChange(Number(v))}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ano</Label>
            <Input
              type="number"
              className="h-9 bg-background"
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Pagador Padrão</Label>
            <Select value={resolvedPayerId} onValueChange={setSelectedPayer}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {membersList.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
            <Select
              value={defaultPaymentMethod}
              onValueChange={(v: 'crédito' | 'débito') => setDefaultPaymentMethod(v)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crédito">Crédito</SelectItem>
                <SelectItem value="débito">Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs: Text vs Table */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'table')}>
          <div className="flex items-center justify-between border-b pb-2">
            <TabsList>
              <TabsTrigger value="text" className="gap-1.5">
                <FileText className="h-4 w-4" />
                Colar Texto Rápido
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5">
                <TableIcon className="h-4 w-4" />
                Tabela de Conferência
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {items.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={handleAddNewRow}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Linha
              </Button>
            )}
          </div>

          {/* TAB 1: Fast Shorthand Text Entry */}
          <TabsContent value="text" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-text" className="text-sm font-medium">
                  Cole ou digite suas despesas (uma por linha):
                </Label>
                <span className="text-xs text-muted-foreground">
                  Formato: <code className="rounded bg-muted px-1 text-foreground">[dia] [valor] [categoria] [descrição]</code>
                </span>
              </div>
              <textarea
                id="bulk-text"
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`05 150 mercado Supermercado\n10 45 farmacia Medicamentos\n15 80 restaurante Almoço de domingo\n20 60 transporte Combustível\n25 35 lazer Cinema @parceiro [debito]\n\n(Também aceita pipes: 12 | Supermercado | 180,00 | alimentação)`}
                className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs leading-relaxed tracking-tight shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-950 sm:text-sm"
              />
            </div>

            <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
                <span>
                  O parser infere automaticamente categorias como <b>alimentação</b>, <b>lanche</b>, <b>saúde</b>, <b>item pra casa</b>, etc.
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-1.5 self-end sm:self-auto"
                onClick={handleParseText}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Interpretar e Ver Tabela
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: Editable Table / Confirmation */}
          <TabsContent value="table" className="space-y-3 pt-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
                <TableIcon className="mb-2 h-10 w-10 stroke-1 opacity-40" />
                <p className="text-sm font-medium">Nenhuma transação pronta na tabela.</p>
                <p className="text-xs">
                  Cole seu texto na aba anterior ou adicione linhas manualmente.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={handleAddNewRow}
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeira Linha
                </Button>
              </div>
            ) : (
              <div className="max-h-[46vh] overflow-x-auto overflow-y-auto rounded-xl border border-border/80">
                <Table className="min-w-[700px]">
                  <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur">
                    <TableRow>
                      <TableHead className="w-16">Dia</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-36">Categoria</TableHead>
                      <TableHead className="w-32">Valor (R$)</TableHead>
                      <TableHead className="w-36">Pagador</TableHead>
                      <TableHead className="w-28">Método</TableHead>
                      <TableHead className="w-12 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min={1}
                            max={getDaysInMonth(year, month)}
                            className="h-8 w-14 px-2 text-center text-xs"
                            value={item.day}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { day: Number(e.target.value) })
                            }
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            className={cn(
                              'h-8 text-xs',
                              invalidRowIds.has(item.id) &&
                                !item.description.trim() &&
                                'border-destructive focus-visible:ring-destructive'
                            )}
                            placeholder="Ex: Supermercado"
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { description: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Select
                            value={item.category}
                            onValueChange={(v: Category) =>
                              handleUpdateItem(item.id, { category: v })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-xs">
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            className={cn(
                              'h-8 text-xs',
                              invalidRowIds.has(item.id) &&
                                (!item.total_amount || item.total_amount <= 0) &&
                                'border-destructive focus-visible:ring-destructive'
                            )}
                            placeholder="0,00"
                            value={item.total_amount || ''}
                            onChange={(e) =>
                              handleUpdateItem(item.id, {
                                total_amount: Number(e.target.value),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Select
                            value={item.paid_by}
                            onValueChange={(v) =>
                              handleUpdateItem(item.id, { paid_by: v })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {membersList.map((m) => (
                                <SelectItem key={m.userId} value={m.userId} className="text-xs">
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <Select
                            value={item.payment_method}
                            onValueChange={(v: 'crédito' | 'débito') =>
                              handleUpdateItem(item.id, { payment_method: v })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="crédito" className="text-xs">
                                Crédito
                              </SelectItem>
                              <SelectItem value="débito" className="text-xs">
                                Débito
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remover linha"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Summary & Save */}
        <DialogFooter className="flex flex-col-reverse items-center justify-between gap-3 border-t pt-4 sm:flex-row">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              Total ({items.length} {items.length === 1 ? 'item' : 'itens'}):
            </span>
            <span className="text-lg font-bold text-foreground">
              {currencyFormatter.format(totalAmount)}
            </span>
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={items.length === 0 || createBatch.isPending}
              onClick={handleSave}
              className="gap-2"
            >
              {createBatch.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar {items.length} {items.length === 1 ? 'Transação' : 'Transações'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
