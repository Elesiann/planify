import { useState, useRef, useMemo } from 'react'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  useMarketListItems,
  useCreateMarketListItem,
  useToggleMarketListItem,
  useDeleteMarketListItem,
  useClearMarketList,
} from '@/hooks/useMarketList'
import type { MarketListItem } from '@/types/database'

// ─── formatDate ────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

// ─── item row ──────────────────────────────────────────────────────────────

type ItemRowProps = {
  item: MarketListItem
  onToggle: () => void
  onRemove: () => void
}

const ItemRow = ({ item, onToggle, onRemove }: ItemRowProps) => (
  <div className="group flex items-center gap-3 py-2">
    <button
      onClick={onToggle}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150',
        'size-7 sm:size-5',
        item.checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border hover:border-primary/60',
      )}
      aria-label={item.checked ? 'Desmarcar' : 'Marcar como comprado'}
    >
      {item.checked && (
        <svg className="size-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>

    <span
      className={cn(
        'flex-1 text-sm text-pretty',
        item.checked && 'text-muted-foreground line-through',
      )}
    >
      {item.name}
    </span>

    <button
      onClick={onRemove}
      className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/40 transition-colors hover:text-destructive sm:invisible sm:size-6 sm:group-hover:visible"
      aria-label="Remover item"
    >
      <Trash2 className="size-3.5" />
    </button>
  </div>
)

// ─── add item form ─────────────────────────────────────────────────────────

const AddItemForm = ({ onAdd, disabled }: { onAdd: (name: string) => void; disabled?: boolean }) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!value.trim() || disabled) return
    onAdd(value.trim())
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex gap-2 border-t border-border/60 px-5 py-3">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Adicionar item…"
        className="h-10 text-sm sm:h-8"
        autoComplete="off"
      />
      <Button
        size="sm"
        onClick={submit}
        disabled={!value.trim() || disabled}
        className="h-10 w-10 shrink-0 p-0 sm:h-8 sm:w-auto sm:px-3"
        aria-label="Adicionar item"
      >
        +
      </Button>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

type QuickShoppingListProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const QuickShoppingList = ({ open, onOpenChange }: QuickShoppingListProps) => {
  const { data: items = [], isLoading, isError } = useMarketListItems(open)
  const createItem = useCreateMarketListItem()
  const toggleItem = useToggleMarketListItem()
  const deleteItem = useDeleteMarketListItem()
  const clearList = useClearMarketList()

  const oldestCreatedAt = useMemo(() => {
    if (items.length === 0) return null
    return items.reduce(
      (min, it) => (it.created_at < min ? it.created_at : min),
      items[0].created_at,
    )
  }, [items])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        {/* header — pr-12 deixa espaço pro X nativo do Sheet */}
        <SheetHeader className="border-b border-border/60 pl-5 pr-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-muted-foreground" />
              <SheetTitle className="text-base">Lista do mercado</SheetTitle>
            </div>
            {oldestCreatedAt && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatDate(oldestCreatedAt)}
              </span>
            )}
          </div>
        </SheetHeader>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading && (
            <div className="flex flex-col gap-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-muted/50" />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-destructive">Erro ao carregar a lista</p>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ShoppingCart className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Lista vazia</p>
            </div>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <div className="divide-y divide-border/40">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem.mutate({ id: item.id, checked: !item.checked })}
                  onRemove={() => deleteItem.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* add */}
        <AddItemForm
          onAdd={(name) => createItem.mutate(name)}
          disabled={createItem.isPending}
        />

        {/* footer */}
        <div className="border-t border-border/60 px-5 py-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={items.length === 0}
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Limpar lista
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar lista?</AlertDialogTitle>
                <AlertDialogDescription>
                  {items.length === 1
                    ? 'O item será removido.'
                    : `Todos os ${items.length} itens serão removidos.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => clearList.mutate()}
                  disabled={clearList.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {clearList.isPending ? 'Limpando…' : 'Limpar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}
