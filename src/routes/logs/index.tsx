import { useMemo, useState } from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeroCard } from '@/components/planify/HeroCard'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { useDeleteTransaction } from '@/hooks/useTransactionMutations'
import { useTransactions } from '@/hooks/useTransactions'
import type { Transaction } from '@/types/database'

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
]

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const formatDisplayDate = (isoDate: string) => {
  if (!isoDate) return '-'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

const LogsPage = () => {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [currentYear - 1, currentYear, currentYear + 1]
  }, [])

  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTransactions({ month, year })
  const deleteMutation = useDeleteTransaction()

  const openCreateModal = () => {
    setEditingTransaction(null)
    setIsModalOpen(true)
  }

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
  }

  const handleDelete = async () => {
    if (!transactionToDelete) return

    try {
      setDeleteError(null)
      setDeletingId(transactionToDelete.id)
      await deleteMutation.mutateAsync(transactionToDelete.id)
      setTransactionToDelete(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir transação.'
      setDeleteError(message)
      return
    } finally {
      setDeletingId(null)
    }
  }

  const closeDeleteAlert = () => {
    if (!deleteMutation.isPending) {
      setTransactionToDelete(null)
      setDeleteError(null)
    }
  }

  return (
    <section className="space-y-6 ">
      <HeroCard className="gap-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground/80">Planify</p>
          <h1 className="text-2xl font-semibold">Transações</h1>
          <p className="text-sm text-muted-foreground">
            Controle os lançamentos mensais.
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 text-sm md:flex-row md:items-end">
          <div className="grid w-full grid-cols-2 gap-4 md:flex md:w-auto">
            <div className="space-y-1 md:w-48">
              <Label htmlFor="month-select" className="text-xs uppercase text-muted-foreground">
                Mês
              </Label>
              <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger id="month-select">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:w-32">
              <Label htmlFor="year-select" className="text-xs uppercase text-muted-foreground">
                Ano
              </Label>
              <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger id="year-select">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex w-full items-end justify-end md:w-auto md:flex-1">
            <Button type="button" size="lg" className="w-full px-6 md:w-auto" onClick={openCreateModal}>
              Nova transação
            </Button>
          </div>
        </div>
      </HeroCard>

      <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm shadow-planify-soft transition duration-200 hover:bg-card/90">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 rounded-2xl bg-planify-soft/60 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-destructive">
            <p>Erro ao carregar transações.</p>
            {error?.message && <p className="text-xs text-muted-foreground">{error.message}</p>}
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <p>Nenhuma transação encontrada para este período.</p>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={openCreateModal}>
              Criar agora
            </Button>
          </div>
        )}

        {!isLoading && !isError && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/30 text-[0.75rem] uppercase tracking-wide text-muted-foreground">
                <TableRow className="border-border/60">
                  <TableHead className="min-w-[120px] px-4 py-3 text-left">Data</TableHead>
                  <TableHead className="min-w-[200px] px-4 py-3">Descrição</TableHead>
                  <TableHead className="px-4 py-3">Categoria</TableHead>
                  <TableHead className="px-4 py-3">Forma de pagamento</TableHead>
                  <TableHead className="px-4 py-3">Criado por</TableHead>
                  <TableHead className="px-4 py-3 text-right">Valor total</TableHead>
                  <TableHead className="px-4 py-3 text-center">Compartilhada?</TableHead>
                  <TableHead className="px-4 py-3 text-center">Parcelado?</TableHead>
                  <TableHead className="px-4 py-3 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-foreground">
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="border-border/50 text-sm transition hover:bg-secondary/20"
                  >
                    <TableCell className="px-4 py-3 font-medium text-muted-foreground">
                      {formatDisplayDate(transaction.date)}
                    </TableCell>
                    <TableCell className="px-4 py-3">{transaction.description ?? '-'}</TableCell>
                    <TableCell className="px-4 py-3 capitalize">
                      {transaction.category ?? '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 capitalize">
                      {transaction.payment_method ?? '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 capitalize">
                      {transaction.owner_name ?? '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold">
                      {currencyFormatter.format(transaction.total_amount)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-medium">
                      {transaction.is_shared ? 'Sim' : 'Não'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-medium">
                      {transaction.is_installment
                        ? `Sim (${transaction.installment_count ?? 0}x)`
                        : 'Não'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-card/40 text-muted-foreground transition-transform duration-150 hover:text-foreground"
                          onClick={() => openEditModal(transaction)}
                          aria-label="Editar transação"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-card/40 text-destructive transition-transform duration-150 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setTransactionToDelete(transaction)}
                          disabled={deletingId === transaction.id}
                          aria-label="Excluir transação"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {deleteMutation.error && (
        <p className="text-sm font-medium text-destructive">
          {deleteMutation.error.message ?? 'Erro ao deletar.'}
        </p>
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModal()
          }
        }}
      >
        <DialogContent className="h-full max-h-full w-full overflow-y-auto rounded-none border-0 bg-card/95 p-6 shadow-none md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl md:border md:border-border/80 md:shadow-planify-soft">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {editingTransaction ? 'Editar transação' : 'Nova transação'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes da compra e deixe o Planify dividir automaticamente entre os membros.
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            key={isModalOpen ? (editingTransaction?.id ?? 'new') : 'closed'}
            mode={editingTransaction ? 'edit' : 'create'}
            initialData={editingTransaction ?? undefined}
            selectedMonth={month}
            selectedYear={year}
            onSubmitSuccess={closeModal}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>
      <Alert
        open={Boolean(transactionToDelete)}
        title="Excluir transação"
        description={
          transactionToDelete
            ? `Tem certeza que deseja remover "${transactionToDelete.description ?? 'esta transação'}"?`
            : undefined
        }
        confirmLabel="Excluir"
        confirmVariant="destructive"
        errorMessage={deleteError}
        loading={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={closeDeleteAlert}
      />
    </section>
  )
}

export default LogsPage
