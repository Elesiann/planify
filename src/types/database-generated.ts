export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      fixed_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string
          household_id: string
          id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          household_id: string
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          household_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          created_at: string | null
          expires_at: string | null
          household_id: string
          id: string
          invited_by: string
          role: string | null
          status: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          household_id: string
          id?: string
          invited_by: string
          role?: string | null
          status?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          household_id?: string
          id?: string
          invited_by?: string
          role?: string | null
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          share_ratio: number
          user_id: string | null
        }
        Insert: {
          household_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          share_ratio: number
          user_id?: string | null
        }
        Update: {
          household_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          share_ratio?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          currency: string | null
          fixed_due_day: number | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          fixed_due_day?: number | null
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          fixed_due_day?: number | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "households_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_list_items: {
        Row: {
          checked: boolean
          created_at: string
          created_by: string
          household_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          checked?: boolean
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          checked?: boolean
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_list_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_list_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_household_id: string | null
          avatar_url: string | null
          email: string | null
          id: string
          income: number | null
          name: string | null
        }
        Insert: {
          active_household_id?: string | null
          avatar_url?: string | null
          email?: string | null
          id: string
          income?: number | null
          name?: string | null
        }
        Update: {
          active_household_id?: string | null
          avatar_url?: string | null
          email?: string | null
          id?: string
          income?: number | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_household_id_fkey"
            columns: ["active_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          created_by: string
          household_id: string
          id: string
          name: string
          notes: string | null
          priority: string
          purchased_at: string | null
          sort_order: number
          status: string
          url: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          name: string
          notes?: string | null
          priority?: string
          purchased_at?: string | null
          sort_order?: number
          status?: string
          url?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          name?: string
          notes?: string | null
          priority?: string
          purchased_at?: string | null
          sort_order?: number
          status?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          category: string | null
          created_by: string
          date: string
          description: string | null
          first_installment_date: string | null
          household_id: string
          id: string
          inserted_at: string | null
          installment_count: number | null
          installment_value: number | null
          is_installment: boolean | null
          is_shared: boolean | null
          last_installment_date: string | null
          owner_id: string | null
          paid_by: string
          payment_method: string | null
          total_amount: number
        }
        Insert: {
          category?: string | null
          created_by: string
          date: string
          description?: string | null
          first_installment_date?: string | null
          household_id: string
          id?: string
          inserted_at?: string | null
          installment_count?: number | null
          installment_value?: number | null
          is_installment?: boolean | null
          is_shared?: boolean | null
          last_installment_date?: string | null
          owner_id?: string | null
          paid_by: string
          payment_method?: string | null
          total_amount: number
        }
        Update: {
          category?: string | null
          created_by?: string
          date?: string
          description?: string | null
          first_installment_date?: string | null
          household_id?: string
          id?: string
          inserted_at?: string | null
          installment_count?: number | null
          installment_value?: number | null
          is_installment?: boolean | null
          is_shared?: boolean | null
          last_installment_date?: string | null
          owner_id?: string | null
          paid_by?: string
          payment_method?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite_by_token: { Args: { p_token: string }; Returns: Json }
      create_household_for_user: {
        Args: { p_currency?: string; p_fixed_due_day?: number; p_name: string }
        Returns: string
      }
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          household_id: string
          household_name: string
          id: string
          inviter_name: string
          role: string
          status: string
        }[]
      }
      get_invite_details: { Args: { invite_token: string }; Returns: Json }
      get_user_household_ids: { Args: { user_uuid: string }; Returns: string[] }
      is_household_admin: {
        Args: { lookup_household_id: string }
        Returns: boolean
      }
      is_household_member: {
        Args: { lookup_household_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
