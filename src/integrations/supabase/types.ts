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
      about_page_content: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          section_key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          section_key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          section_key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_leads: {
        Row: {
          agent_id: string
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          id: string
          message: string | null
          property_id: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          property_id?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          property_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      agent_notifications: {
        Row: {
          created_at: string
          from_agent_id: string
          id: string
          message: string
          property_id: string
          read: boolean
          to_agent_id: string
        }
        Insert: {
          created_at?: string
          from_agent_id: string
          id?: string
          message: string
          property_id: string
          read?: boolean
          to_agent_id: string
        }
        Update: {
          created_at?: string
          from_agent_id?: string
          id?: string
          message?: string
          property_id?: string
          read?: boolean
          to_agent_id?: string
        }
        Relationships: []
      }
      agent_performance: {
        Row: {
          agent_id: string
          average_rating: number | null
          franchise_rank: number | null
          global_rank: number | null
          id: string
          last_updated: string | null
          properties_sold_month: number | null
          total_ratings: number | null
        }
        Insert: {
          agent_id: string
          average_rating?: number | null
          franchise_rank?: number | null
          global_rank?: number | null
          id?: string
          last_updated?: string | null
          properties_sold_month?: number | null
          total_ratings?: number | null
        }
        Update: {
          agent_id?: string
          average_rating?: number | null
          franchise_rank?: number | null
          global_rank?: number | null
          id?: string
          last_updated?: string | null
          properties_sold_month?: number | null
          total_ratings?: number | null
        }
        Relationships: []
      }
      agent_ratings: {
        Row: {
          agent_id: string
          asesoramiento_rating: number
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          trato_rating: number
        }
        Insert: {
          agent_id: string
          asesoramiento_rating: number
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          trato_rating: number
        }
        Update: {
          agent_id?: string
          asesoramiento_rating?: number
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          trato_rating?: number
        }
        Relationships: []
      }
      amenities: {
        Row: {
          icon_svg: string | null
          id: string
          name: string
        }
        Insert: {
          icon_svg?: string | null
          id?: string
          name: string
        }
        Update: {
          icon_svg?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      arxis_maintenances: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          project_id: string | null
          scheduled_date: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          scheduled_date: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          scheduled_date?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arxis_maintenances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "arxis_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      arxis_projects: {
        Row: {
          budget: number | null
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_archived: boolean | null
          location: string | null
          project_type: string
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          location?: string | null
          project_type: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          location?: string | null
          project_type?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      arxis_technical_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          document_url: string | null
          id: string
          project_id: string | null
          report_date: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          document_url?: string | null
          id?: string
          project_id?: string | null
          report_date?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          document_url?: string | null
          id?: string
          project_id?: string | null
          report_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "arxis_technical_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "arxis_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reviews: {
        Row: {
          agent_id: string
          agent_rating: number
          client_id: string
          client_name: string
          comment: string | null
          company_rating: number
          created_at: string
          id: string
          is_approved: boolean
          property_id: string | null
          transaction_type: string
        }
        Insert: {
          agent_id: string
          agent_rating: number
          client_id: string
          client_name: string
          comment?: string | null
          company_rating: number
          created_at?: string
          id?: string
          is_approved?: boolean
          property_id?: string | null
          transaction_type: string
        }
        Update: {
          agent_id?: string
          agent_rating?: number
          client_id?: string
          client_name?: string
          comment?: string | null
          company_rating?: number
          created_at?: string
          id?: string
          is_approved?: boolean
          property_id?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_applications: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          cv_url: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          photo_url: string | null
          status: string | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          cv_url?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          cv_url?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      franchises: {
        Row: {
          admin_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_leads: {
        Row: {
          city_country: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          property_location: string | null
          request_type: string
          status: string | null
          whatsapp: string | null
        }
        Insert: {
          city_country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          property_location?: string | null
          request_type: string
          status?: string | null
          whatsapp?: string | null
        }
        Update: {
          city_country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          property_location?: string | null
          request_type?: string
          status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      permisos: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_code: string | null
          archive_reason: string | null
          assigned_corporate_email: string | null
          assigned_corporate_phone: string | null
          assignment_date: string | null
          avatar_url: string | null
          bio: string | null
          corporate_phone: string | null
          created_at: string
          education: string | null
          email: string | null
          experience_summary: string | null
          facebook_url: string | null
          franchise_id: string | null
          full_name: string | null
          id: string
          identity_card: string | null
          instagram_url: string | null
          is_archived: boolean | null
          is_super_admin: boolean | null
          linkedin_url: string | null
          rol_id: string | null
          title: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          agent_code?: string | null
          archive_reason?: string | null
          assigned_corporate_email?: string | null
          assigned_corporate_phone?: string | null
          assignment_date?: string | null
          avatar_url?: string | null
          bio?: string | null
          corporate_phone?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience_summary?: string | null
          facebook_url?: string | null
          franchise_id?: string | null
          full_name?: string | null
          id: string
          identity_card?: string | null
          instagram_url?: string | null
          is_archived?: boolean | null
          is_super_admin?: boolean | null
          linkedin_url?: string | null
          rol_id?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          agent_code?: string | null
          archive_reason?: string | null
          assigned_corporate_email?: string | null
          assigned_corporate_phone?: string | null
          assignment_date?: string | null
          avatar_url?: string | null
          bio?: string | null
          corporate_phone?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience_summary?: string | null
          facebook_url?: string | null
          franchise_id?: string | null
          full_name?: string | null
          id?: string
          identity_card?: string | null
          instagram_url?: string | null
          is_archived?: boolean | null
          is_super_admin?: boolean | null
          linkedin_url?: string | null
          rol_id?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          agent_id: string
          archive_reason: string | null
          area_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          concluded_at: string | null
          concluded_status: string | null
          constructed_area_m2: number | null
          created_at: string | null
          custom_data: Json | null
          description: string | null
          edit_count: number | null
          franchise_id: string | null
          fts_column: unknown
          geolocation: unknown
          has_garage: boolean | null
          has_pool: boolean | null
          id: string
          image_urls: string[] | null
          is_archived: boolean | null
          other_amenities: string | null
          pet_friendly: boolean | null
          plans_url: string[] | null
          price: number
          price_currency: string
          property_code: string | null
          property_type: string | null
          status: string
          tags: string[] | null
          title: string
          transaction_type: string | null
          video_url: string | null
        }
        Insert: {
          address: string
          agent_id: string
          archive_reason?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          concluded_at?: string | null
          concluded_status?: string | null
          constructed_area_m2?: number | null
          created_at?: string | null
          custom_data?: Json | null
          description?: string | null
          edit_count?: number | null
          franchise_id?: string | null
          fts_column?: unknown
          geolocation?: unknown
          has_garage?: boolean | null
          has_pool?: boolean | null
          id?: string
          image_urls?: string[] | null
          is_archived?: boolean | null
          other_amenities?: string | null
          pet_friendly?: boolean | null
          plans_url?: string[] | null
          price: number
          price_currency?: string
          property_code?: string | null
          property_type?: string | null
          status?: string
          tags?: string[] | null
          title: string
          transaction_type?: string | null
          video_url?: string | null
        }
        Update: {
          address?: string
          agent_id?: string
          archive_reason?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          concluded_at?: string | null
          concluded_status?: string | null
          constructed_area_m2?: number | null
          created_at?: string | null
          custom_data?: Json | null
          description?: string | null
          edit_count?: number | null
          franchise_id?: string | null
          fts_column?: unknown
          geolocation?: unknown
          has_garage?: boolean | null
          has_pool?: boolean | null
          id?: string
          image_urls?: string[] | null
          is_archived?: boolean | null
          other_amenities?: string | null
          pet_friendly?: boolean | null
          plans_url?: string[] | null
          price?: number
          price_currency?: string
          property_code?: string | null
          property_type?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          transaction_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      property_amenities: {
        Row: {
          amenity_id: string
          property_id: string
        }
        Insert: {
          amenity_id: string
          property_id: string
        }
        Update: {
          amenity_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_assignments: {
        Row: {
          assignment_date: string
          created_at: string
          from_agent_id: string
          id: string
          property_id: string
          reason: string
          to_agent_id: string
          updated_at: string
        }
        Insert: {
          assignment_date?: string
          created_at?: string
          from_agent_id: string
          id?: string
          property_id: string
          reason: string
          to_agent_id: string
          updated_at?: string
        }
        Update: {
          assignment_date?: string
          created_at?: string
          from_agent_id?: string
          id?: string
          property_id?: string
          reason?: string
          to_agent_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_change_requests: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          property_id: string
          rejection_reason: string | null
          request_data: Json | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          property_id: string
          rejection_reason?: string | null
          request_data?: Json | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          property_id?: string
          rejection_reason?: string | null
          request_data?: Json | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_change_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_change_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reviews: {
        Row: {
          client_email: string
          client_name: string
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          property_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          property_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          property_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      property_visits: {
        Row: {
          agent_id: string
          client_email: string
          client_name: string
          client_phone: string | null
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string
          currency: string | null
          id: string
          message: string | null
          outcome: string | null
          property_id: string
          sale_amount: number | null
          scheduled_at: string
          status: string
          transaction_type: string | null
          updated_at: string
          visit_result: string | null
        }
        Insert: {
          agent_id: string
          client_email: string
          client_name: string
          client_phone?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          message?: string | null
          outcome?: string | null
          property_id: string
          sale_amount?: number | null
          scheduled_at: string
          status?: string
          transaction_type?: string | null
          updated_at?: string
          visit_result?: string | null
        }
        Update: {
          agent_id?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          message?: string | null
          outcome?: string | null
          property_id?: string
          sale_amount?: number | null
          scheduled_at?: string
          status?: string
          transaction_type?: string | null
          updated_at?: string
          visit_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rol_permisos: {
        Row: {
          permiso_id: string
          rol_id: string
        }
        Insert: {
          permiso_id: string
          rol_id: string
        }
        Update: {
          permiso_id?: string
          rol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rol_permisos_permiso_id_fkey"
            columns: ["permiso_id"]
            isOneToOne: false
            referencedRelation: "permisos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rol_permisos_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      sale_closures: {
        Row: {
          agent_captador_id: string
          agent_vendedor_id: string
          captador_amount: number | null
          captador_percentage: number
          closure_date: string
          closure_price: number
          contract_url: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          office_amount: number | null
          office_percentage: number
          property_id: string
          published_price: number
          rejection_reason: string | null
          status: string
          transaction_type: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          vendedor_amount: number | null
          vendedor_percentage: number
          voucher_urls: string[] | null
        }
        Insert: {
          agent_captador_id: string
          agent_vendedor_id: string
          captador_amount?: number | null
          captador_percentage?: number
          closure_date?: string
          closure_price: number
          contract_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          office_amount?: number | null
          office_percentage?: number
          property_id: string
          published_price: number
          rejection_reason?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          vendedor_amount?: number | null
          vendedor_percentage?: number
          voucher_urls?: string[] | null
        }
        Update: {
          agent_captador_id?: string
          agent_vendedor_id?: string
          captador_amount?: number | null
          captador_percentage?: number
          closure_date?: string
          closure_price?: number
          contract_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          office_amount?: number | null
          office_percentage?: number
          property_id?: string
          published_price?: number
          rejection_reason?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          vendedor_amount?: number | null
          vendedor_percentage?: number
          voucher_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_closures_agent_captador_id_fkey"
            columns: ["agent_captador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_closures_agent_vendedor_id_fkey"
            columns: ["agent_vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_closures_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_closures_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_name: string
          comment: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          transaction_type: string
          updated_at: string
        }
        Insert: {
          client_name: string
          comment: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          transaction_type: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      create_user_profile: {
        Args: {
          p_corporate_phone?: string
          p_email?: string
          p_full_name: string
          p_identity_card?: string
          p_user_id: string
        }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_property_code: {
        Args: {
          p_agent_id: string
          p_property_type: string
          p_transaction_type: string
        }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_agent_properties_secure: {
        Args: { _agent_id: string }
        Returns: {
          address: string
          agent_id: string
          archive_reason: string | null
          area_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          concluded_at: string | null
          concluded_status: string | null
          constructed_area_m2: number | null
          created_at: string | null
          custom_data: Json | null
          description: string | null
          edit_count: number | null
          franchise_id: string | null
          fts_column: unknown
          geolocation: unknown
          has_garage: boolean | null
          has_pool: boolean | null
          id: string
          image_urls: string[] | null
          is_archived: boolean | null
          other_amenities: string | null
          pet_friendly: boolean | null
          plans_url: string[] | null
          price: number
          price_currency: string
          property_code: string | null
          property_type: string | null
          status: string
          tags: string[] | null
          title: string
          transaction_type: string | null
          video_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_agent_public_stats: {
        Args: { _agent_id: string }
        Returns: {
          average_rating: number
          total_ratings: number
        }[]
      }
      get_franchise_leaderboard: {
        Args: { franchise_id_param: string }
        Returns: {
          average_rating: number
          name: string
          rank: number
          sales_month: number
        }[]
      }
      get_platform_metrics: {
        Args: never
        Returns: {
          avg_property_price: number
          monthly_sales: number
          total_agents: number
          total_franchises: number
          total_properties: number
        }[]
      }
      get_property_reviews: {
        Args: { property_id_param: string }
        Returns: {
          client_name: string
          comment: string
          created_at: string
          id: string
          rating: number
        }[]
      }
      get_public_agent_directory: {
        Args: never
        Returns: {
          agent_code: string
          avatar_url: string
          bio: string
          experience_summary: string
          facebook_url: string
          full_name: string
          id: string
          instagram_url: string
          linkedin_url: string
          title: string
          twitter_url: string
          website_url: string
        }[]
      }
      get_public_agent_info: {
        Args: { agent_codes?: string[] }
        Returns: {
          agent_code: string
          avatar_url: string
          bio: string
          experience_summary: string
          facebook_url: string
          full_name: string
          id: string
          instagram_url: string
          linkedin_url: string
          title: string
          twitter_url: string
          website_url: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      properties_nearby: {
        Args: { lat: number; lon: number; radius_km: number }
        Returns: {
          address: string
          agent_id: string
          archive_reason: string | null
          area_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          concluded_at: string | null
          concluded_status: string | null
          constructed_area_m2: number | null
          created_at: string | null
          custom_data: Json | null
          description: string | null
          edit_count: number | null
          franchise_id: string | null
          fts_column: unknown
          geolocation: unknown
          has_garage: boolean | null
          has_pool: boolean | null
          id: string
          image_urls: string[] | null
          is_archived: boolean | null
          other_amenities: string | null
          pet_friendly: boolean | null
          plans_url: string[] | null
          price: number
          price_currency: string
          property_code: string | null
          property_type: string | null
          status: string
          tags: string[] | null
          title: string
          transaction_type: string | null
          video_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      sync_profile_with_auth: { Args: never; Returns: undefined }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_has_role_by_name: {
        Args: { _role_name: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "agent"
        | "client"
        | "admin"
        | "super_admin"
        | "franchise_admin"
        | "office_manager"
        | "supervisor"
        | "staff"
        | "accounting"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      app_role: [
        "agent",
        "client",
        "admin",
        "super_admin",
        "franchise_admin",
        "office_manager",
        "supervisor",
        "staff",
        "accounting",
      ],
    },
  },
} as const
