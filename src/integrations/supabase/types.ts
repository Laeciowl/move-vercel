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
      achievements: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["achievement_category"]
          created_at: string
          criteria_type: Database["public"]["Enums"]["achievement_criteria_type"]
          criteria_value: number
          description: string
          icon: string
          id: string
          name: string
          sort_order: number
          user_type: Database["public"]["Enums"]["achievement_user_type"]
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          criteria_type: Database["public"]["Enums"]["achievement_criteria_type"]
          criteria_value: number
          description: string
          icon: string
          id?: string
          name: string
          sort_order?: number
          user_type: Database["public"]["Enums"]["achievement_user_type"]
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          criteria_type?: Database["public"]["Enums"]["achievement_criteria_type"]
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          user_type?: Database["public"]["Enums"]["achievement_user_type"]
        }
        Relationships: []
      }
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
      content_access_log: {
        Row: {
          accessed_at: string
          content_id: string
          id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          content_id: string
          id?: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          content_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_access_log_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          area: string
          category: string
          created_at: string
          description: string | null
          id: string
          item_type: string
          title: string
          url: string
        }
        Insert: {
          area?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          item_type: string
          title: string
          url: string
        }
        Update: {
          area?: string
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
      content_saves: {
        Row: {
          content_id: string
          id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          id?: string
          saved_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_saves_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
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
      mentee_interests: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentee_interests_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
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
      mentor_featured_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          display_order: number
          id: string
          mentor_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          display_order?: number
          id?: string
          mentor_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          display_order?: number
          id?: string
          mentor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_featured_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_featured_achievements_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_featured_achievements_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_sessions: {
        Row: {
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by_mentor: boolean | null
          created_at: string
          duration: number | null
          id: string
          mentee_formation: string | null
          mentee_objective: string | null
          mentor_id: string
          mentor_notes: string | null
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by_mentor?: boolean | null
          created_at?: string
          duration?: number | null
          id?: string
          mentee_formation?: string | null
          mentee_objective?: string | null
          mentor_id: string
          mentor_notes?: string | null
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by_mentor?: boolean | null
          created_at?: string
          duration?: number | null
          id?: string
          mentee_formation?: string | null
          mentee_objective?: string | null
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
      mentor_tags: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_tags_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_tags_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
          linkedin_url: string | null
          min_advance_hours: number
          name: string
          photo_url: string | null
          sessions_completed_count: number
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
          linkedin_url?: string | null
          min_advance_hours?: number
          name: string
          photo_url?: string | null
          sessions_completed_count?: number
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
          linkedin_url?: string | null
          min_advance_hours?: number
          name?: string
          photo_url?: string | null
          sessions_completed_count?: number
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
          first_mentorship_booked: boolean
          id: string
          income_range: Database["public"]["Enums"]["income_range"]
          lgpd_consent: boolean
          lgpd_consent_at: string | null
          name: string
          onboarding_completed: boolean
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
          first_mentorship_booked?: boolean
          id?: string
          income_range: Database["public"]["Enums"]["income_range"]
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          name: string
          onboarding_completed?: boolean
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
          first_mentorship_booked?: boolean
          id?: string
          income_range?: Database["public"]["Enums"]["income_range"]
          lgpd_consent?: boolean
          lgpd_consent_at?: string | null
          name?: string
          onboarding_completed?: boolean
          phone?: string | null
          photo_url?: string | null
          professional_status?: Database["public"]["Enums"]["professional_status"]
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      session_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          mentor_id: string
          rating: number
          session_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          mentor_id: string
          rating: number
          session_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          mentor_id?: string
          rating?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "mentor_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "mentor_sessions_with_names"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
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
          area: string | null
          category: Database["public"]["Enums"]["volunteer_category"]
          content_type: string
          content_url: string
          created_at: string
          description: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tema: string | null
          title: string
          volunteer_email: string
          volunteer_id: string | null
          volunteer_name: string
        }
        Insert: {
          admin_notes?: string | null
          area?: string | null
          category: Database["public"]["Enums"]["volunteer_category"]
          content_type: string
          content_url: string
          created_at?: string
          description: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tema?: string | null
          title: string
          volunteer_email: string
          volunteer_id?: string | null
          volunteer_name: string
        }
        Update: {
          admin_notes?: string | null
          area?: string | null
          category?: Database["public"]["Enums"]["volunteer_category"]
          content_type?: string
          content_url?: string
          created_at?: string
          description?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tema?: string | null
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
      mentor_sessions_with_names: {
        Row: {
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by_mentor: boolean | null
          created_at: string | null
          duration: number | null
          id: string | null
          mentee_formation: string | null
          mentee_name: string | null
          mentee_objective: string | null
          mentor_id: string | null
          mentor_name: string | null
          mentor_notes: string | null
          notes: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          user_id: string | null
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
          linkedin_url: string | null
          min_advance_hours: number | null
          name: string | null
          photo_url: string | null
          sessions_completed_count: number | null
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
          linkedin_url?: string | null
          min_advance_hours?: number | null
          name?: string | null
          photo_url?: string | null
          sessions_completed_count?: number | null
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
          linkedin_url?: string | null
          min_advance_hours?: number | null
          name?: string | null
          photo_url?: string | null
          sessions_completed_count?: number | null
          status?: Database["public"]["Enums"]["mentor_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_admin_by_email: { Args: { admin_email: string }; Returns: undefined }
      add_volunteer_role_by_email: {
        Args: { mentor_email: string }
        Returns: boolean
      }
      current_user_email: { Args: never; Returns: string }
      get_future_scheduled_sessions: { Args: never; Returns: number }
      get_lives_impacted: { Args: never; Returns: number }
      get_mentee_contact_profiles: {
        Args: { session_user_ids: string[] }
        Returns: {
          name: string
          phone: string
          photo_url: string
          user_id: string
        }[]
      }
      get_mentee_emails: {
        Args: { session_user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_mentor_booked_slots: {
        Args: { _mentor_id: string }
        Returns: {
          duration: number
          scheduled_at: string
          status: string
        }[]
      }
      get_mentor_featured_achievements: {
        Args: { mentor_ids: string[] }
        Returns: {
          achievement_id: string
          achievement_name: string
          description: string
          display_order: number
          icon: string
          mentor_id: string
        }[]
      }
      get_mentor_sessions_completed_count: {
        Args: { _mentor_id: string }
        Returns: number
      }
      get_mentor_unlocked_achievements: {
        Args: { mentor_ids: string[] }
        Returns: {
          achievement_name: string
          icon: string
          mentor_id: string
        }[]
      }
      get_mentor_user_ids: {
        Args: { mentor_ids: string[] }
        Returns: {
          mentor_id: string
          user_id: string
        }[]
      }
      get_mentors_with_match: {
        Args: { user_id_param?: string }
        Returns: {
          area: string
          availability: Json
          description: string
          education: string
          id: string
          linkedin_url: string
          match_count: number
          matching_tags: Json
          min_advance_hours: number
          name: string
          photo_url: string
          sessions_completed_count: number
          tags: Json
        }[]
      }
      get_public_members_count: { Args: never; Returns: number }
      get_public_mentors: {
        Args: never
        Returns: {
          area: string
          availability: Json
          description: string
          education: string
          id: string
          linkedin_url: string
          min_advance_hours: number
          name: string
          photo_url: string
          sessions_completed_count: number
        }[]
      }
      get_public_mentors_count: { Args: never; Returns: number }
      get_total_completed_sessions: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_profile: { Args: { profile_user_id: string }; Returns: boolean }
      process_referral_on_signup: {
        Args: { new_user_id: string; ref_code: string }
        Returns: undefined
      }
    }
    Enums: {
      achievement_category:
        | "mentorias"
        | "tempo"
        | "impacto"
        | "consistencia"
        | "conteudo"
        | "exploracao"
        | "areas"
        | "preparacao"
        | "engajamento"
        | "especial"
      achievement_criteria_type:
        | "count"
        | "sum"
        | "streak"
        | "unique"
        | "special"
      achievement_user_type: "mentor" | "mentorado" | "ambos"
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
      achievement_category: [
        "mentorias",
        "tempo",
        "impacto",
        "consistencia",
        "conteudo",
        "exploracao",
        "areas",
        "preparacao",
        "engajamento",
        "especial",
      ],
      achievement_criteria_type: [
        "count",
        "sum",
        "streak",
        "unique",
        "special",
      ],
      achievement_user_type: ["mentor", "mentorado", "ambos"],
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
