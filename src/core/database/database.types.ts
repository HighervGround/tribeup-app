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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          play_time_minutes: number | null
          rating: number | null
          review: string | null
          status: 'joined' | 'left' | 'completed' | 'no_show' | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          play_time_minutes?: number | null
          rating?: number | null
          review?: string | null
          status?: 'joined' | 'left' | 'completed' | 'no_show' | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          play_time_minutes?: number | null
          rating?: number | null
          review?: string | null
          status?: 'joined' | 'left' | 'completed' | 'no_show' | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          archived: boolean | null
          cost: string | null
          created_at: string | null
          creator_id: string | null
          current_players: number | null
          date: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          longitude: number | null
          max_players: number
          sport: string
          time: string
          title: string
        }
        Insert: {
          archived?: boolean | null
          cost?: string | null
          created_at?: string | null
          creator_id?: string | null
          current_players?: number | null
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          max_players: number
          sport: string
          time: string
          title: string
        }
        Update: {
          archived?: boolean | null
          cost?: string | null
          created_at?: string | null
          creator_id?: string | null
          current_players?: number | null
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_players?: number
          sport?: string
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          location: string | null
          onboarding_completed: boolean | null
          preferred_sports: string[] | null
          role: 'user' | 'moderator' | 'admin'
          stats: Json | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          preferred_sports?: string[] | null
          role?: 'user' | 'moderator' | 'admin'
          stats?: Json | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          location?: string | null
          onboarding_completed?: boolean | null
          preferred_sports?: string[] | null
          role?: 'user' | 'moderator' | 'admin'
          stats?: Json | null
          username?: string | null
        }
          Relationships: []
      }
      tribes: {
        Row: {
          id: string
          name: string
          description: string | null
          activity: string
          avatar_url: string | null
          cover_image_url: string | null
          creator_id: string
          is_public: boolean
          member_count: number
          game_count: number
          location: string | null
          latitude: number | null
          longitude: number | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          activity: string
          avatar_url?: string | null
          cover_image_url?: string | null
          creator_id: string
          is_public?: boolean
          member_count?: number
          game_count?: number
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          activity?: string
          avatar_url?: string | null
          cover_image_url?: string | null
          creator_id?: string
          is_public?: boolean
          member_count?: number
          game_count?: number
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tribes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_members: {
        Row: {
          id: string
          tribe_id: string
          user_id: string
          role: 'member' | 'moderator' | 'admin'
          status: 'active' | 'left' | 'removed'
          joined_at: string | null
          invited_by: string | null
          invite_token: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tribe_id: string
          user_id: string
          role?: 'member' | 'moderator' | 'admin'
          status?: 'active' | 'left' | 'removed'
          joined_at?: string | null
          invited_by?: string | null
          invite_token?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tribe_id?: string
          user_id?: string
          role?: 'member' | 'moderator' | 'admin'
          status?: 'active' | 'left' | 'removed'
          joined_at?: string | null
          invited_by?: string | null
          invite_token?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tribe_members_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribe_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_games: {
        Row: {
          id: string
          tribe_id: string
          game_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          tribe_id: string
          game_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          tribe_id?: string
          game_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tribe_games_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribe_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_channels: {
        Row: {
          id: string
          tribe_id: string
          name: string
          description: string | null
          type: 'general' | 'announcements' | 'games' | 'custom'
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tribe_id: string
          name: string
          description?: string | null
          type?: 'general' | 'announcements' | 'games' | 'custom'
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tribe_id?: string
          name?: string
          description?: string | null
          type?: 'general' | 'announcements' | 'games' | 'custom'
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tribe_channels_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_chat_messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          message: string
          created_at: string | null
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          message: string
          created_at?: string | null
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          message?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tribe_chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "tribe_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tribe_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tribe_member_details: {
        Row: {
          id: string
          tribe_id: string
          user_id: string
          role: 'member' | 'moderator' | 'admin'
          status: 'active' | 'left' | 'removed'
          joined_at: string | null
          invited_by: string | null
          display_name: string | null
          username: string | null
          avatar_url: string | null
          email: string | null
        }
      }
      tribe_statistics: {
        Row: {
          tribe_id: string
          name: string
          activity: string
          member_count: number
          game_count: number
          actual_game_count: number
          active_member_count: number
          last_game_date: string | null
          next_game_date: string | null
        }
      }
      tribe_chat_messages_with_author: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          message: string
          created_at: string | null
          display_name: string | null
          username: string | null
          avatar_url: string | null
          tribe_id: string
          channel_name: string
        }
      }
    }
    Functions: {
      is_joined_to_game: {
        Args: { game_uuid: string }
        Returns: boolean
      }
      join_game: {
        Args: { game_uuid: string }
        Returns: undefined
      }
      leave_game: {
        Args: { game_uuid: string }
        Returns: undefined
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
