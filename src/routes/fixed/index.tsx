import { useMemo, useState } from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeroCard } from '@/components/planify/HeroCard'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FixedExpenseForm } from '@/components/fixed/FixedExpenseForm'
import { useFixedExpenses } from '@/hooks/useFixedExpenses'
import { useDeleteFixedExpense } from '@/hooks/useFixedExpenseMutations'
import type { FixedExpense } from '@/types/database'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const FixedExpensesPage = () => {
  const { data: expenses = [], isLoading, isError, error } = useFixedExpenses()
  const deleteMutation = useDeleteFixedExpense()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<FixedExpense | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const totalAmount = useMemo(
    () => expenses.reduce((acc, expense) => acc + expense.amount, 0),
    [expenses],
  )

  const openCreateModal = () => {
    setEditingExpense(null)
    setIsModalOpen(true)
  }

  const openEditModal = (expense: FixedExpense) => {
    setEditingExpense(expense)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingExpense(null)
  }

  const closeDeleteAlert = () => {
    if (!deleteMutation.isPending) {
      setExpenseToDelete(null)
      setDeleteError(null)
    }
  }

  const handleDelete = async () => {
    if (!expenseToDelete) return
    try {
      setDeleteError(null)
      await deleteMutation.mutateAsync(expenseToDelete.id)
      setExpenseToDelete(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover despesa fixa.'
      setDeleteError(message)
      return
    }
  }

  return (
    <section className="space-y-6">
      <HeroCard className="gap-6 ">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Despesas fixas</p>
            <h1 className="text-2xl font-semibold">Controle os compromissos recorrentes</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre assinaturas, aluguel e outras contas que entram todo mês no resumo do casal.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/90 p-4 text-start shadow-planify-inner">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Total fixo mensal</p>
            <p className="text-2xl font-semibold">{currencyFormatter.format(totalAmount)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={openCreateModal} className="px-6 w-fit">
            Nova despesa fixa
          </Button>
          <p className="text-sm text-muted-foreground">
            Cada item aparece automaticamente no resumo mensal junto aos logs.
          </p>
        </div>
      </HeroCard>

      <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm shadow-planify-soft transition duration-200 hover:bg-card/90">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-planify-soft/60" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-destructive">
            <p>Erro ao carregar despesas fixas.</p>
            {error?.message && <p className="text-xs text-muted-foreground">{error.message}</p>}
          </div>
        )}

        {!isLoading && !isError && expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <p>Nenhuma despesa fixa cadastrada.</p>
            <Button variant="outline" onClick={openCreateModal}>
              Adicionar agora
            </Button>
          </div>
        )}

        {!isLoading && !isError && expenses.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/30 text-[0.75rem] uppercase tracking-wide text-muted-foreground">
                <TableRow className="border-border/60">
                  <TableHead className="px-4 py-3">Descrição</TableHead>
                  <TableHead className="px-4 py-3 text-center">Tipo</TableHead>
                  <TableHead className="px-4 py-3 text-center">Criado em</TableHead>
                  <TableHead className="px-4 py-3 text-right">Valor</TableHead>
                  <TableHead className="px-4 py-3 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className="border-border/50 text-sm transition hover:bg-secondary/20"
                  >
                    <TableCell className="px-4 py-3 font-medium">{expense.description}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-muted-foreground">Despesa fixa</TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-center">{formatDate(expense.created_at)}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold">
                      {currencyFormatter.format(expense.amount)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-card/40 text-muted-foreground transition-transform duration-150 hover:text-foreground"
                          onClick={() => openEditModal(expense)}
                          aria-label="Editar despesa fixa"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-card/40 text-destructive transition-transform duration-150 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setExpenseToDelete(expense)}
                          disabled={deleteMutation.isPending && expenseToDelete?.id === expense.id}
                          aria-label="Excluir despesa fixa"
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

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModal()
          }
        }}
      >
        <DialogContent className="h-full max-h-full w-full overflow-y-auto rounded-none border-0 bg-card/95 p-6 shadow-none flex flex-col justify-center md:grid md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-2xl md:border md:border-border/80 md:shadow-planify-soft">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {editingExpense ? 'Editar despesa fixa' : 'Nova despesa fixa'}
            </DialogTitle>
            <DialogDescription>
              Informe a descrição e o valor mensal. Esse valor será sempre incluído no resumo.
            </DialogDescription>
          </DialogHeader>
          <FixedExpenseForm
            key={editingExpense?.id ?? 'new'}
            mode={editingExpense ? 'edit' : 'create'}
            initialData={editingExpense ?? undefined}
            onSubmitSuccess={closeModal}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>

      <Alert
        open={Boolean(expenseToDelete)}
        title="Excluir despesa fixa"
        description={
          expenseToDelete
            ? `Deseja remover "${expenseToDelete.description}"? Isso afetará os próximos cálculos do resumo.`
            : undefined
        }
        confirmLabel="Excluir"
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={closeDeleteAlert}
        errorMessage={deleteError}
      />
    </section>
  )
}

export default FixedExpensesPage
