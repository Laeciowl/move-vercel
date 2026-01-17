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
      bug_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          page_url: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          item_type: string
          title: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          item_type: string
          title: string
          url: string
        }
        Update: {
          category?: string
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
      mentor_blocked_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          mentor_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          mentor_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          mentor_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_blocked_periods_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_blocked_periods_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_sessions: {
        Row: {
          confirmed_at: string | null
          confirmed_by_mentor: boolean | null
          created_at: string
          id: string
          mentor_id: string
          mentor_notes: string | null
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by_mentor?: boolean | null
          created_at?: string
          id?: string
          mentor_id: string
          mentor_notes?: string | null
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by_mentor?: boolean | null
          created_at?: string
          id?: string
          mentor_id?: string
          mentor_notes?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          area: string
          availability: Json
          created_at: string
          description: string
          disclaimer_accepted: boolean
          disclaimer_accepted_at: string | null
          education: string | null
          email: string
          id: string
          name: string
          photo_url: string | null
          status: Database["public"]["Enums"]["mentor_status"]
          updated_at: string
        }
        Insert: {
          area: string
          availability?: Json
          created_at?: string
          description: string
          disclaimer_accepted?: boolean
          disclaimer_accepted_at?: string | null
          education?: string | null
          email: string
          id?: string
          name: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["mentor_status"]
          updated_at?: string
        }
        Update: {
          area?: string
          availability?: Json
          created_at?: string
          description?: string
          disclaimer_accepted?: boolean
          disclaimer_accepted_at?: string | null
          education?: string | null
          email?: string
          id?: string
          name?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["mentor_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          city: string
          created_at: string
          description: string | null
          email_notifications: boolean
          id: string
          income_range: Database["public"]["Enums"]["income_range"]
          lgpd_consent: boolean
          lgpd_consent_at: string | null
          name: string
          phone: string | null
          photo_url: string | null
          professional_status: Database["public"]["Enums"]["professional_status"]
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age: number
          city: string
          created_at?: string
          description?: string | null
          email_notifications?: boolean
          id?: string
          income_range: Database["public"]["Enums"]["income_range"]
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          professional_status: Database["public"]["Enums"]["professional_status"]
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number
          city?: string
          created_at?: string
          description?: string | null
          email_notifications?: boolean
          id?: string
          income_range?: Database["public"]["Enums"]["income_range"]
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          professional_status?: Database["public"]["Enums"]["professional_status"]
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          area: string
          categories: string[] | null
          email: string
          how_to_help: string
          id: string
          name: string
          status: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          area: string
          categories?: string[] | null
          email: string
          how_to_help: string
          id?: string
          name: string
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          area?: string
          categories?: string[] | null
          email?: string
          how_to_help?: string
          id?: string
          name?: string
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      volunteer_submissions: {
        Row: {
          admin_notes: string | null
          category: Database["public"]["Enums"]["volunteer_category"]
          content_type: string
          content_url: string
          created_at: string
          description: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          volunteer_email: string
          volunteer_id: string | null
          volunteer_name: string
        }
        Insert: {
          admin_notes?: string | null
          category: Database["public"]["Enums"]["volunteer_category"]
          content_type: string
          content_url: string
          created_at?: string
          description: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          volunteer_email: string
          volunteer_id?: string | null
          volunteer_name: string
        }
        Update: {
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["volunteer_category"]
          content_type?: string
          content_url?: string
          created_at?: string
          description?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          volunteer_email?: string
          volunteer_id?: string | null
          volunteer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_submissions_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteer_applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mentors_public: {
        Row: {
          area: string | null
          availability: Json | null
          created_at: string | null
          description: string | null
          disclaimer_accepted: boolean | null
          disclaimer_accepted_at: string | null
          education: string | null
          id: string | null
          name: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["mentor_status"] | null
        }
        Insert: {
          area?: string | null
          availability?: Json | null
          created_at?: string | null
          description?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          education?: string | null
          id?: string | null
          name?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["mentor_status"] | null
        }
        Update: {
          area?: string | null
          availability?: Json | null
          created_at?: string | null
          description?: string | null
          disclaimer_accepted?: boolean | null
          disclaimer_accepted_at?: string | null
          education?: string | null
          id?: string | null
          name?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["mentor_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_admin_by_email: { Args: { admin_email: string }; Returns: undefined }
      current_user_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_profile: { Args: { profile_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "voluntario"
      income_range: "sem_renda" | "ate_1500" | "1500_3000" | "acima_3000"
      mentor_status: "pending" | "approved" | "rejected"
      professional_status:
        | "desempregado"
        | "estudante"
        | "estagiario"
        | "empregado"
        | "freelancer_pj"
      session_status: "scheduled" | "completed" | "cancelled"
      volunteer_category: "aulas_lives" | "templates_arquivos" | "mentoria"
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
      app_role: ["admin", "moderator", "user", "voluntario"],
      income_range: ["sem_renda", "ate_1500", "1500_3000", "acima_3000"],
      mentor_status: ["pending", "approved", "rejected"],
      professional_status: [
        "desempregado",
        "estudante",
        "estagiario",
        "empregado",
        "freelancer_pj",
      ],
      session_status: ["scheduled", "completed", "cancelled"],
      volunteer_category: ["aulas_lives", "templates_arquivos", "mentoria"],
    },
  },
} as const
