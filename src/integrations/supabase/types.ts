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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      content_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_type: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_type: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      impact_history: {
        Row: {
          id: string
          income_range: Database["public"]["Enums"]["income_range"]
          professional_status: Database["public"]["Enums"]["professional_status"]
          recorded_at: string
          user_id: string
        }
        Insert: {
          id?: string
          income_range: Database["public"]["Enums"]["income_range"]
          professional_status: Database["public"]["Enums"]["professional_status"]
          recorded_at?: string
          user_id: string
        }
        Update: {
          id?: string
          income_range?: Database["public"]["Enums"]["income_range"]
          professional_status?: Database["public"]["Enums"]["professional_status"]
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          city: string
          created_at: string
          id: string
          income_range: Database["public"]["Enums"]["income_range"]
          lgpd_consent: boolean
          lgpd_consent_at: string | null
          name: string
          professional_status: Database["public"]["Enums"]["professional_status"]
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age: number
          city: string
          created_at?: string
          id?: string
          income_range: Database["public"]["Enums"]["income_range"]
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          name: string
          professional_status: Database["public"]["Enums"]["professional_status"]
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number
          city?: string
          created_at?: string
          id?: string
          income_range?: Database["public"]["Enums"]["income_range"]
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          name?: string
          professional_status?: Database["public"]["Enums"]["professional_status"]
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          area: string
          email: string
          how_to_help: string
          id: string
          name: string
          submitted_at: string
        }
        Insert: {
          area: string
          email: string
          how_to_help: string
          id?: string
          name: string
          submitted_at?: string
        }
        Update: {
          area?: string
          email?: string
          how_to_help?: string
          id?: string
          name?: string
          submitted_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_own_profile: { Args: { profile_user_id: string }; Returns: boolean }
    }
    Enums: {
      income_range: "sem_renda" | "ate_1500" | "1500_3000" | "acima_3000"
      professional_status:
        | "desempregado"
        | "estudante"
        | "estagiario"
        | "empregado"
        | "freelancer_pj"
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
    Enums: {
      income_range: ["sem_renda", "ate_1500", "1500_3000", "acima_3000"],
      professional_status: [
        "desempregado",
        "estudante",
        "estagiario",
        "empregado",
        "freelancer_pj",
      ],
    },
  },
} as const
