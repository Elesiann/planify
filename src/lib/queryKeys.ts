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

export const shoppingListKeys = {
  all: ['shopping-list'] as const,
  byHousehold: (householdId: string) => [...shoppingListKeys.all, householdId] as const,
}

export const marketListKeys = {
  all: ['market-list'] as const,
  byHousehold: (householdId: string) => [...marketListKeys.all, householdId] as const,
}
