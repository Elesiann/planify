import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArchiveX, Check, ChevronDown, ChevronUp, Copy, ExternalLink, MoreVertical, Package, Pencil, Plus, RotateCcw, ShoppingCart, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import {
  useBatchUpdateShoppingListItems,
  useCreateShoppingListItem,
  useDeleteShoppingListItem,
  useShoppingListItems,
  useUpdateShoppingListItem,
} from '@/hooks/useShoppingList'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { ShoppingListItemForm } from '@/components/planify/ShoppingListItemForm'
import type { ShoppingListItem } from '@/types/database'

// ─── constants ────────────────────────────────────────────────────────────────

type ColumnId = 'pending' | 'ordered' | 'purchased'
type Columns = Record<ColumnId, ShoppingListItem[]>

const COLUMN_IDS: ColumnId[] = ['pending', 'ordered', 'purchased']

const COLUMN_CONFIG: Record<ColumnId, { title: string; empty: string }> = {
  pending:   { title: 'A comprar', empty: 'Nenhum item pendente' },
  ordered:   { title: 'Pedido',    empty: 'Nenhum item pedido' },
  purchased: { title: 'Finalizado', empty: 'Nenhum item finalizado' },
}

const PRIORITY_CONFIG = {
  low:    { label: 'Baixa', className: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  medium: { label: 'Média', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400' },
  high:   { label: 'Alta',  className: 'bg-red-500/15 text-red-700 dark:text-red-400' },
} as const

const NEXT_STATUS: Record<ColumnId, ColumnId> = {
  pending:   'ordered',
  ordered:   'purchased',
  purchased: 'pending',
}

const ADVANCE_LABEL: Record<ColumnId, string> = {
  pending:   'Marcar como pedido',
  ordered:   'Marcar como finalizado',
  purchased: 'Reverter para A comprar',
}

const ADVANCE_ICON: Record<ColumnId, React.ElementType> = {
  pending:   Package,
  ordered:   ShoppingCart,
  purchased: RotateCcw,
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null | undefined) => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const toColumns = (items: ShoppingListItem[]): Columns => ({
  pending:   items.filter((i) => i.status === 'pending'),
  ordered:   items.filter((i) => i.status === 'ordered'),
  purchased: items.filter((i) => i.status === 'purchased'),
})

const findColumnOfItem = (columns: Columns, itemId: string): ColumnId | null => {
  for (const col of COLUMN_IDS) {
    if (columns[col].some((i) => i.id === itemId)) return col
  }
  return null
}

// ─── IconButton with tooltip ───────────────────────────────────────────────────

const TipButton = ({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: React.ReactNode
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-7 w-7 text-muted-foreground', className)}
        onClick={onClick}
        aria-label={label}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
)

// ─── card ──────────────────────────────────────────────────────────────────────

type CardProps = {
  item: ShoppingListItem
  members: ReturnType<typeof useHouseholdMembers>['data']
  onEdit: (item: ShoppingListItem) => void
  onAdvanceStatus: (item: ShoppingListItem) => void
  onArchive: (item: ShoppingListItem) => void
  onDelete: (item: ShoppingListItem) => void
  isDragging?: boolean
  isGlobalDragging?: boolean
}

const ItemCardInner = ({ item, members, onEdit, onAdvanceStatus, onArchive, onDelete, isDragging, isGlobalDragging }: CardProps) => {
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const assignee = item.assigned_to ? members?.find((m) => m.user_id === item.assigned_to) : null

  const handleCopyUrl = () => {
    if (!item.url) return
    void navigator.clipboard.writeText(item.url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  const priority = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
  const status = item.status as ColumnId
  const AdvanceIcon = ADVANCE_ICON[status] ?? ShoppingCart
  const hasLongNotes = (item.notes?.length ?? 0) > 80

  return (
    <div className={cn(
      'group/card rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-planify-soft',
      isDragging && 'opacity-0',
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn(
          'flex-1 text-sm font-medium leading-snug',
          item.status === 'purchased' && 'line-through text-muted-foreground',
        )}>
          {item.name}
        </p>

        {/* Desktop action buttons — hover-reveal */}
        <div className={cn('hidden md:flex shrink-0 items-center gap-1', isGlobalDragging && 'invisible')}>
          <TipButton label="Editar" onClick={() => onEdit(item)} className="opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </TipButton>
          {item.status !== 'archived' && (
            <TipButton label={ADVANCE_LABEL[status] ?? ''} onClick={() => onAdvanceStatus(item)} className="opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-foreground">
              <AdvanceIcon className="h-3.5 w-3.5" />
            </TipButton>
          )}
          {item.url && (
            <>
              <TipButton label="Abrir link" onClick={() => window.open(item.url!, '_blank', 'noopener,noreferrer')} className="opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
              </TipButton>
              <TipButton label={copied ? 'Copiado!' : 'Copiar link'} onClick={handleCopyUrl} className="opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-foreground">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </TipButton>
            </>
          )}
          <TipButton
            label={item.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
            onClick={() => onArchive(item)}
            className="opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-foreground"
          >
            <ArchiveX className="h-3.5 w-3.5" />
          </TipButton>
          <TipButton label="Excluir" onClick={() => onDelete(item)} className="opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </TipButton>
        </div>

        {/* Mobile action dropdown — always visible */}
        <div className={cn('flex md:hidden shrink-0', isGlobalDragging && 'invisible')}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="min-w-[160px]">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {item.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onAdvanceStatus(item)}>
                  <AdvanceIcon className="mr-2 h-4 w-4" />
                  {ADVANCE_LABEL[status]}
                </DropdownMenuItem>
              )}
              {item.url && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir link
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyUrl}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? 'Copiado!' : 'Copiar link'}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive(item)}>
                <ArchiveX className="mr-2 h-4 w-4" />
                {item.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className={cn('h-5 px-1.5 text-[10px] font-medium', priority.className)}>
          {priority.label}
        </Badge>
        {item.category && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium capitalize bg-planify-chip">
            {item.category}
          </Badge>
        )}
        {assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee.profile?.avatar_url ?? undefined} alt={assignee.profile?.name ?? ''} />
            <AvatarFallback className="bg-primary/10 text-[9px] font-medium text-primary">
              {getInitials(assignee.profile?.name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {item.notes && (
        <div className="mt-1.5">
          <p className={cn('text-xs text-muted-foreground break-all', !notesExpanded && 'line-clamp-2')}>
            {item.notes}
          </p>
          {hasLongNotes && (
            <button
              type="button"
              className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setNotesExpanded((v) => !v) }}
            >
              {notesExpanded
                ? <><ChevronUp className="h-3 w-3" />ver menos</>
                : <><ChevronDown className="h-3 w-3" />ver mais</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const SortableCard = (props: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <ItemCardInner {...props} isDragging={isDragging} />
    </div>
  )
}

// ─── column ────────────────────────────────────────────────────────────────────

const KanbanColumn = ({
  id,
  items,
  members,
  isGlobalDragging,
  onEdit,
  onAdvanceStatus,
  onArchive,
  onDelete,
}: {
  id: ColumnId
  items: ShoppingListItem[]
  members: ReturnType<typeof useHouseholdMembers>['data']
  isGlobalDragging: boolean
  onEdit: (item: ShoppingListItem) => void
  onAdvanceStatus: (item: ShoppingListItem) => void
  onArchive: (item: ShoppingListItem) => void
  onDelete: (item: ShoppingListItem) => void
}) => {
  const { setNodeRef, isOver } = useDroppable({ id })
  const config = COLUMN_CONFIG[id]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {config.title}
        </h2>
        <span className="rounded-full bg-planify-chip px-2 py-0.5 text-xs font-medium">
          {items.length}
        </span>
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'min-h-[80px] space-y-2 rounded-lg border-2 p-2 transition-colors duration-200',
            isOver
              ? 'border-primary/50 bg-primary/5'
              : isGlobalDragging
                ? 'border-dashed border-border/60'
                : 'border-transparent',
          )}
        >
          {items.length === 0 ? (
            <p className={cn(
              'rounded-lg py-8 text-center text-sm text-muted-foreground',
              !isGlobalDragging && 'border border-dashed border-border/60',
            )}>
              {isGlobalDragging ? 'Solte aqui' : config.empty}
            </p>
          ) : (
            items.map((item) => (
              <SortableCard
                key={item.id}
                item={item}
                members={members}
                isGlobalDragging={isGlobalDragging}
                onEdit={onEdit}
                onAdvanceStatus={onAdvanceStatus}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function ListaPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingItem, setDeletingItem] = useState<ShoppingListItem | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [activeItem, setActiveItem] = useState<ShoppingListItem | null>(null)
  const [dragColumns, setDragColumns] = useState<Columns | null>(null)

  const { data: items = [], isLoading, isError, error } = useShoppingListItems()
  const { data: members } = useHouseholdMembers()
  const createMutation = useCreateShoppingListItem()
  const updateMutation = useUpdateShoppingListItem()
  const deleteMutation = useDeleteShoppingListItem()
  const batchMutation = useBatchUpdateShoppingListItems()

  const archived = items.filter((i) => i.status === 'archived')
  const baseColumns = toColumns(items)
  const columns = dragColumns ?? baseColumns


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const openCreate = () => { setEditingItem(null); setIsFormOpen(true) }
  const openEdit = (item: ShoppingListItem) => { setEditingItem(item); setIsFormOpen(true) }

  const handleFormSubmit = async (values: {
    name: string
    category?: string | null
    priority: 'low' | 'medium' | 'high'
    notes?: string | null
    assigned_to?: string | null
    url?: string | null
  }) => {
    setFormError(null)
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar item.')
    }
  }

  const handleAdvanceStatus = (item: ShoppingListItem) => {
    const status = item.status as ColumnId
    void updateMutation.mutateAsync({ id: item.id, data: { status: NEXT_STATUS[status] } })
  }

  const handleArchive = (item: ShoppingListItem) => {
    const newStatus = item.status === 'archived' ? 'pending' : 'archived'
    void updateMutation.mutateAsync({ id: item.id, data: { status: newStatus } })
  }

  const handleDelete = (item: ShoppingListItem) => {
    setDeletingItem(item)
  }

  const handleConfirmDelete = () => {
    if (!deletingItem) return
    void deleteMutation.mutateAsync(deletingItem.id).finally(() => setDeletingItem(null))
  }

  // ── DnD handlers ─────────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    const item = COLUMN_IDS.flatMap((c) => columns[c]).find((i) => i.id === active.id)
    setActiveItem(item ?? null)
    setDragColumns(columns)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const activeCol = findColumnOfItem(columns, activeId)
    const overCol = (COLUMN_IDS.includes(overId as ColumnId)
      ? overId
      : findColumnOfItem(columns, overId)) as ColumnId | null

    if (!activeCol || !overCol || activeCol === overCol) return

    setDragColumns((prev) => {
      const base = prev ?? baseColumns
      const activeItems = base[activeCol]
      const overItems = base[overCol]
      const activeIdx = activeItems.findIndex((i) => i.id === activeId)
      const overIdx = overItems.findIndex((i) => i.id === overId)

      const movedItem = { ...activeItems[activeIdx], status: overCol }
      const insertAt = overIdx >= 0 ? overIdx : overItems.length

      return {
        ...base,
        [activeCol]: activeItems.filter((i) => i.id !== activeId),
        [overCol]: [...overItems.slice(0, insertAt), movedItem, ...overItems.slice(insertAt)],
      }
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItem(null)

    if (!over) {
      setDragColumns(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string
    const activeCol = findColumnOfItem(columns, activeId)

    if (!activeCol) {
      setDragColumns(null)
      return
    }

    const overCol = (COLUMN_IDS.includes(overId as ColumnId)
      ? overId
      : findColumnOfItem(columns, overId)) as ColumnId | null

    let finalColumns = columns

    // Within-column reorder
    if (overCol && activeCol === overCol) {
      const col = columns[activeCol]
      const activeIdx = col.findIndex((i) => i.id === activeId)
      const overIdx = col.findIndex((i) => i.id === overId)
      if (activeIdx !== overIdx) {
        finalColumns = { ...columns, [activeCol]: arrayMove(col, activeIdx, overIdx) }
      }
    }

    // Keep optimistic state visible until mutation settles
    setDragColumns(finalColumns)

    const targetCol = overCol ?? activeCol
    const colItems = finalColumns[targetCol]
    const updates = colItems.map((item, idx) => ({
      id: item.id,
      sort_order: idx * 10,
      status: item.status !== items.find((i) => i.id === item.id)?.status
        ? (item.status as ColumnId)
        : undefined,
    }))

    batchMutation.mutateAsync(updates)
      .catch((err) => {
        console.error('[DnD] mutation failed', err)
        toast.error('Erro ao salvar reordenação.')
      })
      .finally(() => setDragColumns(null))
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const isGlobalDragging = activeItem !== null
  const cardProps = { members, onEdit: openEdit, onAdvanceStatus: handleAdvanceStatus, onArchive: handleArchive, onDelete: handleDelete }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Lista de Compras</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {items.filter((i) => i.status !== 'archived').length} itens ativos
              </p>
              {archived.length > 0 && (
                <>
                  <span className="h-3 w-px bg-border" aria-hidden />
                  <button
                    type="button"
                    className="text-sm text-muted-foreground/70 underline-offset-2 transition-colors duration-150 hover:text-muted-foreground hover:underline"
                    onClick={() => setShowArchived((v) => !v)}
                  >
                    {showArchived
                      ? 'Ocultar arquivados'
                      : `${archived.length} arquivado${archived.length !== 1 ? 's' : ''}`}
                  </button>
                </>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="w-full gap-1.5 font-semibold transition-transform duration-150 hover:-translate-y-0.5 sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Adicionar item
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-destructive">
            <p>Erro ao carregar a lista de compras.</p>
            {error?.message && <p className="text-xs text-muted-foreground">{error.message}</p>}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {COLUMN_IDS.map((colId) => (
                <KanbanColumn
                  key={colId}
                  id={colId}
                  items={columns[colId]}
                  isGlobalDragging={isGlobalDragging}
                  {...cardProps}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
              {activeItem && (
                <div className="shadow-planify-soft">
                  <ItemCardInner item={activeItem} isGlobalDragging {...cardProps} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {showArchived && archived.length > 0 && (
          <div className="space-y-3 border-t border-border/50 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Arquivados ({archived.length})
            </h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {archived.map((item) => (
                <ItemCardInner key={item.id} item={item} {...cardProps} />
              ))}
            </div>
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); setEditingItem(null); setFormError(null) } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar item' : 'Novo item'}</DialogTitle>
            </DialogHeader>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <ShoppingListItemForm
              initialData={editingItem ?? undefined}
              onSubmitSuccess={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingItem(null) }}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deletingItem !== null} onOpenChange={(open) => { if (!open) setDeletingItem(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir item</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{deletingItem?.name}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleConfirmDelete}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
