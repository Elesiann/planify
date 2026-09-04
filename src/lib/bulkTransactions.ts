import { CATEGORY_OPTIONS, type CategoryOption } from './constants'

export const CATEGORIES = CATEGORY_OPTIONS
export type Category = CategoryOption

export const CATEGORY_ALIASES: Record<string, Category> = {
  // alimentação
  alim: 'alimentação',
  alimentacao: 'alimentação',
  comida: 'alimentação',
  mercado: 'alimentação',
  supermercado: 'alimentação',
  feira: 'alimentação',
  acougue: 'alimentação',
  padaria: 'alimentação',
  hortifruti: 'alimentação',
  // lanche
  lanche: 'lanche',
  lanches: 'lanche',
  ifood: 'lanche',
  restaurante: 'lanche',
  pizza: 'lanche',
  pizzaria: 'lanche',
  burger: 'lanche',
  bar: 'lanche',
  cafe: 'lanche',
  café: 'lanche',
  churrasco: 'lanche',
  // despesa
  desp: 'despesa',
  despesa: 'despesa',
  despesas: 'despesa',
  conta: 'despesa',
  contas: 'despesa',
  boleto: 'despesa',
  luz: 'despesa',
  energia: 'despesa',
  agua: 'despesa',
  água: 'despesa',
  gas: 'despesa',
  gás: 'despesa',
  internet: 'despesa',
  condominio: 'despesa',
  condomínio: 'despesa',
  aluguel: 'despesa',
  iptu: 'despesa',
  // eletrodoméstico
  eletro: 'eletrodoméstico',
  eletrodomestico: 'eletrodoméstico',
  geladeira: 'eletrodoméstico',
  fogao: 'eletrodoméstico',
  fogão: 'eletrodoméstico',
  microondas: 'eletrodoméstico',
  tv: 'eletrodoméstico',
  airfryer: 'eletrodoméstico',
  // móveis
  movel: 'móveis',
  móvel: 'móveis',
  moveis: 'móveis',
  móveis: 'móveis',
  cama: 'móveis',
  sofa: 'móveis',
  sofá: 'móveis',
  mesa: 'móveis',
  cadeira: 'móveis',
  armario: 'móveis',
  armário: 'móveis',
  // saúde
  saude: 'saúde',
  saúde: 'saúde',
  farmacia: 'saúde',
  farmácia: 'saúde',
  drogaria: 'saúde',
  remedio: 'saúde',
  remédio: 'saúde',
  medico: 'saúde',
  médico: 'saúde',
  dentista: 'saúde',
  exame: 'saúde',
  hospital: 'saúde',
  psicologo: 'saúde',
  // item pra casa
  casa: 'item pra casa',
  item: 'item pra casa',
  'item pra casa': 'item pra casa',
  limpeza: 'item pra casa',
  utensilios: 'item pra casa',
  decoracao: 'item pra casa',
  decoração: 'item pra casa',
  plantas: 'item pra casa',
  planta: 'item pra casa',
  'cama-mesa-banho': 'item pra casa',
  // serviços
  serv: 'serviços',
  servico: 'serviços',
  servicos: 'serviços',
  serviço: 'serviços',
  serviços: 'serviços',
  faxina: 'serviços',
  diarista: 'serviços',
  manutencao: 'serviços',
  manutenção: 'serviços',
  reforma: 'serviços',
  pedreiro: 'serviços',
  mecanico: 'serviços',
  mecânico: 'serviços',
  // transporte
  transp: 'transporte',
  transporte: 'transporte',
  uber: 'transporte',
  '99': 'transporte',
  taxi: 'transporte',
  táxi: 'transporte',
  gasolina: 'transporte',
  combustivel: 'transporte',
  combustível: 'transporte',
  pedagio: 'transporte',
  pedágio: 'transporte',
  estacionamento: 'transporte',
  onibus: 'transporte',
  ônibus: 'transporte',
  metro: 'transporte',
  metrô: 'transporte',
  // lazer
  lazer: 'lazer',
  cinema: 'lazer',
  filme: 'lazer',
  show: 'lazer',
  teatro: 'lazer',
  viagem: 'lazer',
  hotel: 'lazer',
  passeio: 'lazer',
  jogo: 'lazer',
  streaming: 'lazer',
  // outros
  outros: 'outros',
  outro: 'outros',
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function matchCategory(input: string): Category {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (!normalized) return 'outros'

  // 1. Direct alias match
  if (CATEGORY_ALIASES[normalized]) {
    return CATEGORY_ALIASES[normalized]
  }

  // 2. Direct canonical match
  for (const cat of CATEGORIES) {
    const normCat = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normCat === normalized) {
      return cat
    }
  }

  // 3. Multi-word phrase matching (e.g. "item pra casa", "cama-mesa-banho")
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (alias.includes(' ') && normalized.includes(alias)) {
      return cat
    }
  }

  // 4. Word-by-word token matching
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean)
  for (const word of words) {
    if (CATEGORY_ALIASES[word]) {
      return CATEGORY_ALIASES[word]
    }
    for (const cat of CATEGORIES) {
      const normCat = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normCat === word) return cat
    }
  }

  // 5. Prefix matching on words with length >= 3
  for (const word of words) {
    if (word.length >= 3) {
      for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
        if (alias.length >= 3 && (alias.startsWith(word) || word.startsWith(alias))) {
          return cat
        }
      }
    }
  }

  return 'outros'
}

export function isExactOrAliasCategory(input: string): boolean {
  const norm = input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (CATEGORIES.some((c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm)) return true
  if (CATEGORY_ALIASES[norm]) return true
  return false
}

export function parseNumber(val: string): number | null {
  if (!val) return null
  let cleaned = val.trim().replace(/^R\$\s?/i, '').trim()
  if (!cleaned) return null

  // Has both dot and comma? (e.g. 1.234,56 or 1,234.56)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length === 2 && (parts[1].length === 1 || parts[1].length === 2)) {
      // Standard decimal point like 89.90 -> keep
    } else if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) < 1000) {
      cleaned = cleaned.replace(/\./g, '')
    }
  }

  const num = parseFloat(cleaned)
  return isNaN(num) || num <= 0 ? null : num
}

export type ParseContext = {
  defaultMonth: number
  defaultYear: number
  defaultPaidBy: string
  defaultPaidByName?: string
  defaultPaymentMethod: 'crédito' | 'débito'
  members?: Array<{ userId: string; name: string }>
}

export type ParsedTransactionItem = {
  id: string // Client-side temporary ID
  date: string // YYYY-MM-DD
  day: number
  description: string
  total_amount: number
  category: Category
  paid_by: string
  paid_by_name: string
  payment_method: 'crédito' | 'débito'
  is_shared: boolean
}

export function parseShorthandLine(line: string, ctx: ParseContext): ParsedTransactionItem | null {
  let text = line.trim()
  if (!text || text.startsWith('#')) return null

  let paidBy = ctx.defaultPaidBy
  let paidByName = ctx.defaultPaidByName || 'Eu'
  let paymentMethod = ctx.defaultPaymentMethod
  let isShared = true

  // Check for @member tag
  const memberMatch = text.match(/@(\w+)/)
  if (memberMatch && ctx.members) {
    const search = memberMatch[1].toLowerCase()
    const targetMember = ctx.members.find((m) =>
      m.name.toLowerCase().includes(search)
    )
    if (targetMember) {
      paidBy = targetMember.userId
      paidByName = targetMember.name
    }
    text = text.replace(memberMatch[0], '').trim()
  }

  // Check for [debito] / [credito]
  if (/\[(d[eé]bito|deb)\]/i.test(text)) {
    paymentMethod = 'débito'
    text = text.replace(/\[(d[eé]bito|deb)\]/i, '').trim()
  } else if (/\[(cr[eé]dito|cred)\]/i.test(text)) {
    paymentMethod = 'crédito'
    text = text.replace(/\[(cr[eé]dito|cred)\]/i, '').trim()
  }

  // Check for [ind] / [individual]
  if (/\[(ind|individual|solo)\]/i.test(text)) {
    isShared = false
    text = text.replace(/\[(ind|individual|solo)\]/i, '').trim()
  }

  // Pipe separated?
  if (text.includes('|')) {
    const parts = text.split('|').map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      let dateIso: string | null = null
      let dayVal = 1
      let amount: number | null = null
      const remaining: string[] = []

      for (const part of parts) {
        const dateMatch = part.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/)
        if (dateMatch && !dateIso) {
          const rawD = parseInt(dateMatch[1], 10)
          const m = parseInt(dateMatch[2], 10)
          const y = dateMatch[3] ? parseInt(dateMatch[3], 10) : ctx.defaultYear
          const maxDays = getDaysInMonth(y, m)
          const d = Math.max(1, Math.min(maxDays, rawD))
          dateIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          dayVal = d
          continue
        }

        if (!dateIso && /^\d{1,2}$/.test(part)) {
          const rawD = parseInt(part, 10)
          if (rawD >= 1) {
            const maxDays = getDaysInMonth(ctx.defaultYear, ctx.defaultMonth)
            const d = Math.min(maxDays, rawD)
            dayVal = d
            dateIso = `${ctx.defaultYear}-${String(ctx.defaultMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            continue
          }
        }

        const num = parseNumber(part)
        if (
          num !== null &&
          amount === null &&
          (part.includes(',') || part.includes('.') || part.startsWith('R$') || !/^[a-zA-Z]/.test(part))
        ) {
          amount = num
          continue
        }

        remaining.push(part)
      }

      if (!dateIso) {
        dateIso = `${ctx.defaultYear}-${String(ctx.defaultMonth).padStart(2, '0')}-01`
      }

      if (amount !== null && remaining.length > 0) {
        let category: Category = 'outros'
        let description = ''

        if (remaining.length === 1) {
          description = remaining[0]
          category = matchCategory(description)
        } else if (remaining.length >= 2) {
          const isCat0 = isExactOrAliasCategory(remaining[0])
          const isCat1 = isExactOrAliasCategory(remaining[1])

          if (isCat1 && !isCat0) {
            description = remaining[0]
            category = matchCategory(remaining[1])
          } else if (isCat0 && !isCat1) {
            category = matchCategory(remaining[0])
            description = remaining.slice(1).join(' ')
          } else {
            description = remaining[0]
            category = matchCategory(remaining[1])
          }
        }

        return {
          id: Math.random().toString(36).substring(2, 9),
          date: dateIso,
          day: dayVal,
          description,
          total_amount: Math.round(amount * 100) / 100,
          category,
          paid_by: paidBy,
          paid_by_name: paidByName,
          payment_method: paymentMethod,
          is_shared: isShared,
        }
      }
    }
  }

  // Space separated: [dia/data] [valor] [categoria] [descrição...]
  const tokens = text.split(/\s+/).filter(Boolean)
  if (tokens.length < 3) return null

  let dateIso = ''
  let dayVal = 1
  const fullDateMatch = tokens[0].match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/)
  if (fullDateMatch) {
    const rawD = parseInt(fullDateMatch[1], 10)
    const m = parseInt(fullDateMatch[2], 10)
    const y = fullDateMatch[3] ? parseInt(fullDateMatch[3], 10) : ctx.defaultYear
    const maxDays = getDaysInMonth(y, m)
    const d = Math.max(1, Math.min(maxDays, rawD))
    dateIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    dayVal = d
  } else {
    const rawDay = parseInt(tokens[0], 10)
    if (isNaN(rawDay) || rawDay < 1) return null
    const maxDays = getDaysInMonth(ctx.defaultYear, ctx.defaultMonth)
    const day = Math.min(maxDays, rawDay)
    dayVal = day
    dateIso = `${ctx.defaultYear}-${String(ctx.defaultMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const amount = parseNumber(tokens[1])
  if (amount === null) return null

  // Check if token 2 is an explicit category keyword or part of the freeform description
  const token2IsCategory = isExactOrAliasCategory(tokens[2])
  let category: Category
  let description: string

  if (token2IsCategory) {
    category = matchCategory(tokens[2])
    description = tokens.slice(3).join(' ') || tokens[2]
  } else {
    // Preserve entire description from token 2 onwards and infer category from it
    description = tokens.slice(2).join(' ')
    category = matchCategory(description)
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    date: dateIso,
    day: dayVal,
    description,
    total_amount: Math.round(amount * 100) / 100,
    category,
    paid_by: paidBy,
    paid_by_name: paidByName,
    payment_method: paymentMethod,
    is_shared: isShared,
  }
}

export function parseBulkText(text: string, ctx: ParseContext): ParsedTransactionItem[] {
  const lines = text.split('\n')
  const results: ParsedTransactionItem[] = []
  for (const line of lines) {
    const item = parseShorthandLine(line, ctx)
    if (item) results.push(item)
  }
  return results
}
