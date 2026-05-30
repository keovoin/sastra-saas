// ============================================================================
// Auto-generated types matching the Supabase schema
// In production, regenerate with: supabase gen types typescript --local > src/types/database.ts
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string
          role: 'admin' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          avatar_url?: string
          role?: 'admin' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string
          role?: 'admin' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          owner_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string
          owner_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          owner_id?: string
        }
      }
      risks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          project_id: string
          description: string
          probability: number
          impact: number
          severity: number
          owner_name: string
          status: 'Active' | 'Mitigated' | 'Watch'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id: string
          description: string
          probability?: number
          impact?: number
          owner_name?: string
          status?: 'Active' | 'Mitigated' | 'Watch'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id?: string
          description?: string
          probability?: number
          impact?: number
          owner_name?: string
          status?: 'Active' | 'Mitigated' | 'Watch'
        }
      }
      swot_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          project_id: string
          type: 'strength' | 'weakness' | 'opportunity' | 'threat'
          content: string
          priority: 'Low' | 'Medium' | 'High'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id: string
          type: 'strength' | 'weakness' | 'opportunity' | 'threat'
          content: string
          priority?: 'Low' | 'Medium' | 'High'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id?: string
          type?: 'strength' | 'weakness' | 'opportunity' | 'threat'
          content?: string
          priority?: 'Low' | 'Medium' | 'High'
        }
      }
      charters: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          project_id: string
          name: string
          sponsor: string
          start_date: string | null
          in_scope: string[]
          out_of_scope: string[]
          team_members: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id: string
          name: string
          sponsor?: string
          start_date?: string | null
          in_scope?: string[]
          out_of_scope?: string[]
          team_members?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id?: string
          name?: string
          sponsor?: string
          start_date?: string | null
          in_scope?: string[]
          out_of_scope?: string[]
          team_members?: string[]
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// Convenience type aliases used throughout the application
// ============================================================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Risk = Database['public']['Tables']['risks']['Row']
export type RiskInsert = Database['public']['Tables']['risks']['Insert']
export type RiskUpdate = Database['public']['Tables']['risks']['Update']
export type SwotItem = Database['public']['Tables']['swot_items']['Row']
export type SwotItemInsert = Database['public']['Tables']['swot_items']['Insert']
export type SwotItemUpdate = Database['public']['Tables']['swot_items']['Update']
export type Charter = Database['public']['Tables']['charters']['Row']
export type CharterInsert = Database['public']['Tables']['charters']['Insert']
export type CharterUpdate = Database['public']['Tables']['charters']['Update']

export type SwotType = SwotItem['type']
export type Priority = SwotItem['priority']
export type RiskStatus = Risk['status']
export type UserRole = Profile['role']
