export const transactionsKeys = {
  all: ['transactions'] as const,
  list: (params: { month: number; year: number }) =>
    [...transactionsKeys.all, 'list', params] as const,
  byId: (id: string) => [...transactionsKeys.all, 'byId', id] as const,
  year: (year: number) => [...transactionsKeys.all, 'year', year] as const,
}

export const fixedExpensesKeys = {
  all: ['fixed-expenses'] as const,
  byId: (id: string) => [...fixedExpensesKeys.all, 'byId', id] as const,
}
