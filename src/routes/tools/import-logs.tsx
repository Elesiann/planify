import { type ChangeEvent, useMemo, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { parseTransactionsCsv } from '@/lib/importLogs'
import { supabase } from '@/lib/supabaseClient'
import { useHousehold } from '@/lib/HouseholdProvider'
import { useAuth } from '@/lib/auth'
import type { TransactionInsert } from '@/types/database'

const BATCH_SIZE = 100

type ImportStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error'

const ImportLogsTool = () => {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [message, setMessage] = useState('Selecione um CSV exportado da planilha.')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState({ total: 0, imported: 0 })
  const [isImporting, setIsImporting] = useState(false)

  const { activeHouseholdId } = useHousehold()
  const { user } = useAuth()

  const progressPercent = useMemo(() => {
    if (!progress.total) return 0
    return Math.round((progress.imported / progress.total) * 100)
  }, [progress])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setStatus('idle')
    setErrorMessage(null)
    setProgress({ total: 0, imported: 0 })
    setMessage(nextFile ? `Arquivo selecionado: ${nextFile.name}` : 'Selecione um CSV exportado da planilha.')
  }

  const handleImport = async () => {
    if (!file) {
      setErrorMessage('Selecione um arquivo CSV antes de importar.')
      setStatus('error')
      return
    }

    if (!activeHouseholdId || !user?.id) {
      setErrorMessage('Você precisa estar logado e ter uma household ativa.')
      setStatus('error')
      return
    }

    setIsImporting(true)
    setErrorMessage(null)
    setStatus('parsing')
    setMessage(`Lendo ${file.name}...`)

    try {
      const csvText = await file.text()
      const transactions = parseTransactionsCsv(csvText, {
        householdId: activeHouseholdId,
        userId: user.id,
      })

      if (transactions.length === 0) {
        throw new Error('O arquivo não contém linhas válidas para importação.')
      }

      setProgress({ total: transactions.length, imported: 0 })
      setStatus('uploading')
      setMessage(`Importando ${transactions.length} lançamentos em lotes de ${BATCH_SIZE}...`)

      const inserted = await insertInBatches(transactions)

      setStatus('success')
      setMessage(`Import concluído: ${inserted} transações inseridas.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao importar o arquivo.'
      setStatus('error')
      setErrorMessage(message)
      setMessage('Algo deu errado durante a importação.')
    } finally {
      setIsImporting(false)
    }
  }

  const insertInBatches = async (transactions: TransactionInsert[]) => {
    let inserted = 0
    for (let index = 0; index < transactions.length; index += BATCH_SIZE) {
      const chunk = transactions.slice(index, index + BATCH_SIZE)
      const { error } = await supabase.from('transactions').insert(chunk)
      if (error) {
        throw new Error(error.message)
      }
      inserted += chunk.length
      setProgress((current) => ({
        total: transactions.length,
        imported: current.imported + chunk.length,
      }))
    }
    return inserted
  }

  const statusTone = (() => {
    if (status === 'error') return 'text-destructive'
    if (status === 'success') return 'text-emerald-500'
    if (status === 'uploading' || status === 'parsing') return 'text-amber-500'
    return 'text-muted-foreground'
  })()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Importar lançamentos (CSV)</h1>
        <p className="text-muted-foreground">
          Ferramenta interna para subir os registros da planilha direto na tabela <code>transactions</code>.
        </p>
      </div>

      <Card className="border border-dashed border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Upload do arquivo</CardTitle>
          <CardDescription>
            Use o CSV exportado da planilha com as colunas esperadas (Tipo, Forma de pagamento, Data, Descrição...).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/80 bg-background/60 px-6 py-10 text-center transition hover:border-primary hover:bg-primary/5"
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">
                {file ? `Arquivo selecionado: ${file.name}` : 'Clique para escolher seu CSV'}
              </p>
              <p className="text-sm text-muted-foreground">
                Apenas arquivos .csv gerados a partir da planilha oficial.
              </p>
            </div>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-4 text-sm">
            <p className={`font-medium ${statusTone}`}>{message}</p>
            {errorMessage && <p className="text-destructive">{errorMessage}</p>}
            {progress.total > 0 && (
              <p className="text-muted-foreground">
                Progresso: {progress.imported}/{progress.total} ({progressPercent}%)
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? 'Importando...' : 'Importar lançamentos'}
            </Button>
            {progress.total > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProgress({ total: 0, imported: 0 })
                  setStatus('idle')
                  setMessage('Selecione um CSV exportado da planilha.')
                  setErrorMessage(null)
                  setFile(null)
                }}
                disabled={isImporting}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras aplicadas durante a importação</CardTitle>
          <CardDescription>
            Estes valores são calculados automaticamente para cada linha do CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>IDs de household e usuário obtidos do contexto de autenticação.</li>
            <li>Datas convertidas de DD/MM/AAAA para AAAA-MM-DD, com inserted_at no formato ISO completo.</li>
            <li>Valores em BRL normalizados (&quot;R$ 3.017,00&quot; =&gt; 3017.00).</li>
            <li>
              Parcelas detectadas via coluna &quot;Parcelado?.1&quot;, incluindo cálculo das datas da primeira e última
              parcela.
            </li>
            <li>Inserções feitas em lotes de {BATCH_SIZE} registros usando o Supabase client do frontend.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImportLogsTool
