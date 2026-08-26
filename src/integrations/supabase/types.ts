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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          atribuido_a_id: string | null
          created_at: string
          documento_versao_id: string
          estado: string
          id: string
          prazo: string | null
          tarefa: string
        }
        Insert: {
          atribuido_a_id?: string | null
          created_at?: string
          documento_versao_id: string
          estado?: string
          id?: string
          prazo?: string | null
          tarefa: string
        }
        Update: {
          atribuido_a_id?: string | null
          created_at?: string
          documento_versao_id?: string
          estado?: string
          id?: string
          prazo?: string | null
          tarefa?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_atribuido_a_id_fkey"
            columns: ["atribuido_a_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_documento_versao_id_fkey"
            columns: ["documento_versao_id"]
            isOneToOne: false
            referencedRelation: "documento_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      documento_versoes: {
        Row: {
          aprovado_por_id: string | null
          created_at: string
          data_aprovacao: string | null
          data_envio_validacao: string | null
          data_inicio: string | null
          data_validacao_dono: string | null
          data_validacao_gestor: string | null
          descricao_aprovacao: string | null
          descricao_validacao_dono: string | null
          descricao_validacao_gestor: string | null
          elaborado_por_id: string | null
          estado: string
          forma_aprovacao: string | null
          forma_validacao_dono: string | null
          forma_validacao_gestor: string | null
          id: string
          imutavel: boolean
          processo_id: string
          tipo_documento: string
          updated_at: string
          validado_dono_id: string | null
          validado_gestor_id: string | null
          versao: string
        }
        Insert: {
          aprovado_por_id?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_envio_validacao?: string | null
          data_inicio?: string | null
          data_validacao_dono?: string | null
          data_validacao_gestor?: string | null
          descricao_aprovacao?: string | null
          descricao_validacao_dono?: string | null
          descricao_validacao_gestor?: string | null
          elaborado_por_id?: string | null
          estado?: string
          forma_aprovacao?: string | null
          forma_validacao_dono?: string | null
          forma_validacao_gestor?: string | null
          id?: string
          imutavel?: boolean
          processo_id: string
          tipo_documento: string
          updated_at?: string
          validado_dono_id?: string | null
          validado_gestor_id?: string | null
          versao?: string
        }
        Update: {
          aprovado_por_id?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_envio_validacao?: string | null
          data_inicio?: string | null
          data_validacao_dono?: string | null
          data_validacao_gestor?: string | null
          descricao_aprovacao?: string | null
          descricao_validacao_dono?: string | null
          descricao_validacao_gestor?: string | null
          elaborado_por_id?: string | null
          estado?: string
          forma_aprovacao?: string | null
          forma_validacao_dono?: string | null
          forma_validacao_gestor?: string | null
          id?: string
          imutavel?: boolean
          processo_id?: string
          tipo_documento?: string
          updated_at?: string
          validado_dono_id?: string | null
          validado_gestor_id?: string | null
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_versoes_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_elaborado_por_id_fkey"
            columns: ["elaborado_por_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_validado_dono_id_fkey"
            columns: ["validado_dono_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_validado_gestor_id_fkey"
            columns: ["validado_gestor_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          area: string | null
          categoria_id: string | null
          codigo: string
          created_at: string
          descricao: string | null
          dono_cargo: string | null
          dono_id: string | null
          estado: string
          gestor_cargo: string | null
          gestor_id: string | null
          id: string
          macroprocesso: string
          nome: string
          palavras_chave: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          categoria_id?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          dono_cargo?: string | null
          dono_id?: string | null
          estado?: string
          gestor_cargo?: string | null
          gestor_id?: string | null
          id?: string
          macroprocesso: string
          nome: string
          palavras_chave?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          categoria_id?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          dono_cargo?: string | null
          dono_id?: string | null
          estado?: string
          gestor_cargo?: string | null
          gestor_id?: string | null
          id?: string
          macroprocesso?: string
          nome?: string
          palavras_chave?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_dono_id_fkey"
            columns: ["dono_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
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
      utilizadores: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: string
        }
        Relationships: []
      }
      workflow_log: {
        Row: {
          comentario: string | null
          data: string
          de_estado: string | null
          documento_versao_id: string
          id: string
          para_estado: string | null
          utilizador_id: string | null
        }
        Insert: {
          comentario?: string | null
          data?: string
          de_estado?: string | null
          documento_versao_id: string
          id?: string
          para_estado?: string | null
          utilizador_id?: string | null
        }
        Update: {
          comentario?: string | null
          data?: string
          de_estado?: string | null
          documento_versao_id?: string
          id?: string
          para_estado?: string | null
          utilizador_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_log_documento_versao_id_fkey"
            columns: ["documento_versao_id"]
            isOneToOne: false
            referencedRelation: "documento_versoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_log_utilizador_id_fkey"
            columns: ["utilizador_id"]
            isOneToOne: false
            referencedRelation: "utilizadores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
