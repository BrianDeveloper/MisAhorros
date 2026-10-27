export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ThemePalette = 'vainilla-melocoton' | 'matcha-crema' | 'boba-milk-tea'
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
          preferred_theme: string
          currency_preference: CurrencyPreference
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance_actual?: number
          preferred_theme?: string
          currency_preference?: CurrencyPreference
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance_actual?: number
          preferred_theme?: string
          currency_preference?: CurrencyPreference
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: TransactionType
          icon: string
          color_tag: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: TransactionType
          icon?: string
          color_tag?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: TransactionType
          icon?: string
          color_tag?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          icon: string
          status: SavingsGoalStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_amount: number
          current_amount?: number
          icon?: string
          status?: SavingsGoalStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_amount?: number
          current_amount?: number
          icon?: string
          status?: SavingsGoalStatus
          created_at?: string
          updated_at?: string
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
    }
    Views: {}
    Functions: {
      create_default_categories: { Args: { p_user_id: string }; Returns: undefined }
      handle_new_user: { Args: Record<string, never>; Returns: unknown }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
