import type { Database as SupabaseDatabase } from './database-generated';

export type Database = SupabaseDatabase;

export type Transaction =
    Database['public']['Tables']['transactions']['Row'];

export type TransactionInsert =
    Database['public']['Tables']['transactions']['Insert'];

export type TransactionUpdate =
    Database['public']['Tables']['transactions']['Update'];

export type FixedExpense =
    Database['public']['Tables']['fixed_expenses']['Row'];

export type FixedExpenseInsert =
    Database['public']['Tables']['fixed_expenses']['Insert'];

export type FixedExpenseUpdate =
    Database['public']['Tables']['fixed_expenses']['Update'];

type ShoppingListPriority = 'low' | 'medium' | 'high'
type ShoppingListStatus = 'pending' | 'ordered' | 'purchased' | 'archived'

type ShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row']

export type ShoppingListItem = Omit<ShoppingListItemRow, 'priority' | 'status'> & {
  priority: ShoppingListPriority
  status: ShoppingListStatus
}

export type ShoppingListItemInsert = Omit<
  Database['public']['Tables']['shopping_list_items']['Insert'],
  'priority' | 'status'
> & {
  priority?: ShoppingListPriority
  status?: ShoppingListStatus
}

export type ShoppingListItemUpdate = Omit<
  Database['public']['Tables']['shopping_list_items']['Update'],
  'priority' | 'status'
> & {
  priority?: ShoppingListPriority
  status?: ShoppingListStatus
}
