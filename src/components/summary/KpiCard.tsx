import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type KpiCardProps = {
  label: string
  value: string
  description: string
}

export const KpiCard = ({ label, value, description }: KpiCardProps) => (
  <Card className="rounded-2xl border-border/60 bg-card/80 shadow-planify-soft transition duration-200 hover:-translate-y-0.5 hover:bg-card/95">
    <CardHeader className="space-y-1">
      <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground/80">
        {label}
      </CardDescription>
      <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
  </Card>
)
