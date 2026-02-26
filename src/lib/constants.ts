export const CATEGORY_OPTIONS = [
  'alimentação',
  'despesa',
  'eletrodoméstico',
  'móveis',
  'saúde',
  'item pra casa',
  'lanche',
  'serviços',
  'transporte',
  'lazer',
  'outros',
] as const

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number]
