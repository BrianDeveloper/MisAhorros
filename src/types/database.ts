export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ThemePalette = 'morado-pro' | 'morado-nocturno'
export type CurrencyPreference = 'USD' | 'VES'
export type TransactionType = 'ingreso' | 'egreso'
export type SavingsGoalStatus = 'en_progreso' | 'completado'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          balance_actual: number
          currency_preference: CurrencyPreference
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance_actual?: number
          currency_preference?: CurrencyPreference
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance_actual?: number
          currency_preference?: CurrencyPreference
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: TransactionType
          icon: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: TransactionType
          icon?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: TransactionType
          icon?: string | null
          color?: string | null
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: TransactionType
          amount: number
          category_id: string | null
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: TransactionType
          amount: number
          category_id?: string | null
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: TransactionType
          amount?: number
          category_id?: string | null
          description?: string | null
          date?: string
          created_at?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          target_amount: number
          current_amount: number
          icon: string | null
          deadline: string | null
          status: SavingsGoalStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_amount: number
          current_amount?: number
          icon?: string | null
          deadline?: string | null
          status?: SavingsGoalStatus
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_amount?: number
          current_amount?: number
          icon?: string | null
          deadline?: string | null
          status?: SavingsGoalStatus
          created_at?: string
        }
        Relationships: []
      }
      savings_contributions: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          amount?: number
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          month: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          month: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          month?: string
          amount?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      create_default_categories: { Args: { p_user_id: string }; Returns: undefined }
      handle_new_user: { Args: Record<string, never>; Returns: unknown }
      create_savings_goal: {
        Args: { p_icon: string; p_target_amount: number; p_title: string }
        Returns: string
      }
      create_transaction: {
        Args: {
          p_amount: number
          p_category_id: string | null
          p_date: string
          p_description: string | null
          p_type: TransactionType
        }
        Returns: string
      }
      delete_transaction: { Args: { p_transaction_id: string }; Returns: undefined }
      save_goal_contribution: {
        Args: {
          p_amount: number
          p_goal_id: string
          p_is_withdrawal: boolean
          p_note: string | null
        }
        Returns: string
      }
      update_profile_preferences: {
        Args: { p_currency_preference: CurrencyPreference }
        Returns: undefined
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
