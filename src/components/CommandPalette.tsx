import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  ArrowRight,
  Home,
  LayoutDashboard,
  ListChecks,
  Moon,
  Plus,
  Receipt,
  Sun,
  User,
  Wallet,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useTheme } from '@/lib/ThemeProvider'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navigate = (to: string) => {
    setOpen(false)
    router.navigate({ to })
  }

  const runAction = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="O que você quer fazer?" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => navigate('/')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Ir para Resumo
          </CommandItem>
          <CommandItem onSelect={() => navigate('/logs')}>
            <Receipt className="mr-2 h-4 w-4" />
            Ir para Transações
          </CommandItem>
          <CommandItem onSelect={() => navigate('/fixed')}>
            <Wallet className="mr-2 h-4 w-4" />
            Ir para Despesas Fixas
          </CommandItem>
          <CommandItem onSelect={() => navigate('/list')}>
            <ListChecks className="mr-2 h-4 w-4" />
            Ir para Lista de Compras
          </CommandItem>
          <CommandItem onSelect={() => navigate('/households')}>
            <Home className="mr-2 h-4 w-4" />
            Ir para Households
          </CommandItem>
          <CommandItem onSelect={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            Ir para Perfil
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => navigate('/logs')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova transação
            <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => navigate('/fixed')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova despesa fixa
            <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => runAction(toggleTheme)}>
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
