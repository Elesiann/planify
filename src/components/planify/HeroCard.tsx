import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type HeroCardProps = PropsWithChildren<{
  className?: string
}>

export const HeroCard = ({ className, children }: HeroCardProps) => {
  return (
    <div
      className={cn(
        'flex min-h-[220px] flex-col justify-normal gap-4 rounded-2xl border border-border/60 bg-card/90 p-6 shadow-planify-soft ring-1 ring-transparent transition duration-200 hover:bg-card/95 hover:ring-primary/30',
        className,
      )}
    >
      {children}
    </div>
  )
}
