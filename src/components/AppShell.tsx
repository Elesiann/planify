import { Link } from '@tanstack/react-router'
import { Check, ChevronDown, Home, ListChecks, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react'
import { useState, type PropsWithChildren } from 'react'
import toast from 'react-hot-toast'
import { QuickShoppingList } from '@/components/planify/QuickShoppingList'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/useProfile'
import { useHousehold } from '@/lib/HouseholdProvider'
import { InviteManager } from '@/components/InviteManager'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/ThemeProvider'

type AppShellProps = PropsWithChildren<{
  activeTab: 'resumo' | 'logs' | 'fixos' | 'lista'
}>

const navigation = [
  { label: 'Resumo', to: '/', tab: 'resumo' as const },
  { label: 'Transações', to: '/logs', tab: 'logs' as const },
  { label: 'Fixos', to: '/fixed', tab: 'fixos' as const },
  { label: 'Lista', to: '/list', tab: 'lista' as const },
]

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const AppShell = ({ children, activeTab }: AppShellProps) => {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { theme, toggleTheme } = useTheme()
  const { activeHousehold, households, switchHousehold } = useHousehold()
  const [quickListOpen, setQuickListOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Left side: Logo + Mobile Nav */}
          <div className="flex items-center gap-2">
            {/* Mobile Navigation Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-sm hover:bg-primary/15"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu de navegação</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-2">
                  {/* Household section */}
                  {households.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Household
                      </DropdownMenuLabel>
                      {households.map((h) => (
                        <DropdownMenuItem
                          key={h.id}
                          className={cn(
                            'cursor-pointer flex items-center justify-between',
                            households.length === 1 && 'pointer-events-none',
                          )}
                          onClick={() => {
                            if (h.id === activeHousehold?.id) return
                            switchHousehold(h.id).catch((error) => {
                              console.error('Failed to switch household:', error)
                              toast.error(
                                `Erro ao trocar para a household "${h.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                              )
                            })
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{h.name}</span>
                          </div>
                          {h.id === activeHousehold?.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {/* Navigation section */}
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Navegação
                  </DropdownMenuLabel>
                  {navigation.map((item) => (
                    <DropdownMenuItem key={item.to} asChild className="cursor-pointer">
                      <Link
                        to={item.to}
                        className={cn(
                          "flex w-full items-center gap-2",
                          activeTab === item.tab && "bg-primary/15 text-foreground font-medium"
                        )}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-lg font-semibold tracking-[0.2em] text-muted-foreground md:text-xl">
              Planify
            </div>

            {/* Household Switcher — desktop only */}
            {households.length > 0 && (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={households.length === 1}
                      className="ml-1 gap-1 rounded-lg border border-border/50 bg-card/50 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/15 md:px-3 md:text-sm"
                    >
                      <Home className="h-3.5 w-3.5" />
                      <span className="max-w-[80px] truncate md:max-w-[120px]">
                        {activeHousehold?.name ?? 'Selecionar'}
                      </span>
                      {households.length > 1 && <ChevronDown className="h-3 w-3 opacity-50" />}
                    </Button>
                  </DropdownMenuTrigger>
                  {households.length > 1 && (
                    <DropdownMenuContent align="start" className="w-56 p-2">
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Suas Households
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {households.map((h) => (
                        <DropdownMenuItem
                          key={h.id}
                          className="cursor-pointer flex items-center justify-between"
                          onClick={() => {
                            switchHousehold(h.id).catch((error) => {
                              console.error('Failed to switch household:', error)
                              toast.error(
                                `Erro ao trocar para a household "${h.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                              )
                            })
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{h.name}</span>
                          </div>
                          {h.id === activeHousehold?.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </div>
            )}

            {/* Invite Manager - only visible to owners/admins */}
            <div className="hidden md:block">
              <InviteManager />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-planify-soft/40 px-1 py-1 shadow-planify-inner">
              {navigation.map((item) => {
                const isActive = activeTab === item.tab
                return (
                  <Button
                    key={item.to}
                    asChild
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'rounded-full border border-transparent px-4 text-sm font-medium text-muted-foreground/90 transition duration-200 hover:bg-primary hover:text-foreground',
                      isActive && 'border-primary/60 bg-primary/15 text-foreground shadow-planify-inner',
                    )}
                    data-state={isActive ? 'active' : undefined}
                  >
                    <Link to={item.to} preload="intent">
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </nav>

          {/* Right side: Lista + Theme + User */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setQuickListOpen(true)}
              className={cn(
                "rounded-full border border-transparent text-muted-foreground transition duration-150 hover:-translate-y-0.5 hover:border-border/80 hover:bg-primary hover:text-foreground",
                quickListOpen && "border-primary/60 bg-primary/15 text-foreground"
              )}
              aria-label="Lista rápida de compras"
            >
              <ListChecks className="h-4 w-4" />
            </Button>
            <QuickShoppingList open={quickListOpen} onOpenChange={setQuickListOpen} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex rounded-full border border-transparent text-muted-foreground transition duration-150 hover:-translate-y-0.5 hover:border-border/80 hover:bg-primary hover:text-foreground"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Desktop User Menu */}
            <div className="hidden items-center md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 gap-2 rounded-full px-2 hover:bg-primary"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.name ?? 'Avatar'} />
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(profile?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[150px] truncate text-sm font-medium lg:inline">
                      {profile?.name ?? user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.name ?? 'Sem nome'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex w-full items-center gap-2">
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/households" className="flex w-full items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Gerenciar Households
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                    onClick={() => void signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Profile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/15">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.name ?? 'Avatar'} />
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(profile?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Menu do usuário</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-fit p-2">
                  {/* User Info */}
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.name ?? 'Avatar'} />
                        <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                          {getInitials(profile?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.name ?? 'Sem nome'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Profile */}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex w-full items-center gap-2">
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/households" className="flex w-full items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Gerenciar Households
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Sign Out */}
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                    onClick={() => void signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  )
}


