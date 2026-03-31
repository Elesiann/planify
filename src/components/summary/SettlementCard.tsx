import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SettlementData } from '@/lib/summary'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type SettlementCardProps = {
  settlement: SettlementData
  memberALabel: string
  memberBLabel: string
}

export function SettlementCard({ settlement, memberALabel, memberBLabel }: SettlementCardProps) {
  const { memberAPaid, memberBPaid, memberAShouldPay, memberBShouldPay, balance } = settlement
  const totalPaid = memberAPaid + memberBPaid

  // Who owes whom
  const absBalance = Math.abs(balance)
  const hasBalance = absBalance >= 0.01
  const creditor = balance > 0 ? memberALabel : memberBLabel
  const debtor = balance > 0 ? memberBLabel : memberALabel

  return (
    <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-planify-soft">
      <CardHeader>
        <CardTitle>Balanço do mês</CardTitle>
        <CardDescription>Quem pagou quanto vs. a parte de cada um.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{memberALabel}</p>
            <p className="text-lg font-semibold">{currencyFormatter.format(memberAPaid)}</p>
            <p className="text-xs text-muted-foreground">
              Parte: {currencyFormatter.format(memberAShouldPay)}
              {totalPaid > 0 && ` · ${((memberAShouldPay / totalPaid) * 100).toFixed(0)}% do total`}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{memberBLabel}</p>
            <p className="text-lg font-semibold">{currencyFormatter.format(memberBPaid)}</p>
            <p className="text-xs text-muted-foreground">
              Parte: {currencyFormatter.format(memberBShouldPay)}
              {totalPaid > 0 && ` · ${((memberBShouldPay / totalPaid) * 100).toFixed(0)}% do total`}
            </p>
          </div>
        </div>

        {hasBalance ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center">
            <p className="text-sm font-medium">
              {debtor} deve{' '}
              <span className="text-base font-semibold text-primary">
                {currencyFormatter.format(absBalance)}
              </span>{' '}
              para {creditor}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">Tudo acertado — sem saldo pendente.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
