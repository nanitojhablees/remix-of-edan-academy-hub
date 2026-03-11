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
      answer_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          order_index: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          order_index?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string | null
          icon: string
          id: string
          name: string
          points_value: number
        }
        Insert: {
          category?: string
          created_at?: string
          criteria_type: string
          criteria_value?: number
          description?: string | null
          icon?: string
          id?: string
          name: string
          points_value?: number
        }
        Update: {
          category?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points_value?: number
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_code: string
          course_id: string
          course_title: string
          created_at: string
          grade: number | null
          id: string
          issued_at: string
          student_name: string
          user_id: string
        }
        Insert: {
          certificate_code: string
          course_id: string
          course_title: string
          created_at?: string
          grade?: number | null
          id?: string
          issued_at?: string
          student_name: string
          user_id: string
        }
        Update: {
          certificate_code?: string
          course_id?: string
          course_title?: string
          created_at?: string
          grade?: number | null
          id?: string
          issued_at?: string
          student_name?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          course_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          course_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          course_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          image_url: string | null
          instructor_id: string | null
          is_published: boolean | null
          level: string
          price: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_published?: boolean | null
          level: string
          price?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_published?: boolean | null
          level?: string
          price?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string | null
          description: string | null
          email_type: string
          enabled: boolean | null
          id: string
          sender_email: string | null
          sender_name: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email_type: string
          enabled?: boolean | null
          id?: string
          sender_email?: string | null
          sender_name?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email_type?: string
          enabled?: boolean | null
          id?: string
          sender_email?: string | null
          sender_name?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollment_requests: {
        Row: {
          course_id: string
          created_at: string
          id: string
          message: string | null
          payment_method: string
          receipt_url: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          message?: string | null
          payment_method?: string
          receipt_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          message?: string | null
          payment_method?: string
          receipt_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress_percent: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percent?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          exam_id: string
          id: string
          passed: boolean | null
          score: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          exam_id: string
          id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          exam_id?: string
          id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          show_correct_answers: boolean
          shuffle_questions: boolean
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          show_correct_answers?: boolean
          shuffle_questions?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          show_correct_answers?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_instructor_reply: boolean | null
          is_pinned: boolean | null
          lesson_id: string
          likes_count: number | null
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_instructor_reply?: boolean | null
          is_pinned?: boolean | null
          lesson_id: string
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_instructor_reply?: boolean | null
          is_pinned?: boolean | null
          lesson_id?: string
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          module_id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id: string
          order_index?: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_materials: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          module_id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url: string
          id?: string
          module_id: string
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          module_id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean
          level: string | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          level?: string | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          level?: string | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          plan_id: string | null
          promo_code: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id?: string | null
          promo_code?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id?: string | null
          promo_code?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          first_name: string
          id: string
          last_ip_address: string | null
          last_login: string | null
          last_name: string
          membership_status: string | null
          phone: string | null
          profession: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_ip_address?: string | null
          last_login?: string | null
          last_name: string
          membership_status?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_ip_address?: string | null
          last_login?: string | null
          last_name?: string
          membership_status?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          discount_amount: number | null
          discount_percent: number | null
          free_access: boolean | null
          id: string
          is_active: boolean
          max_uses: number | null
          plan_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          free_access?: boolean | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          plan_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          free_access?: boolean | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          plan_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          image_url: string | null
          order_index: number
          points: number
          question_text: string
          question_type: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          image_url?: string | null
          order_index?: number
          points?: number
          question_text: string
          question_type?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          image_url?: string | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_recipients: {
        Row: {
          created_at: string
          expires_at: string
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          revoked_at: string | null
          revoked_reason: string | null
          scholarship_id: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scholarship_id: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scholarship_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_recipients_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          created_at: string
          current_recipients: number
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          duration_months: number
          id: string
          is_active: boolean
          max_recipients: number | null
          name: string
          requirements: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_recipients?: number
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          duration_months?: number
          id?: string
          is_active?: boolean
          max_recipients?: number | null
          name: string
          requirements?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_recipients?: number
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          duration_months?: number
          id?: string
          is_active?: boolean
          max_recipients?: number | null
          name?: string
          requirements?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          expires_at: string | null
          id: string
          payment_id: string | null
          plan_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          current_level: number
          id: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number
          id?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number
          id?: string
          total_points?: number
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_points: {
        Args: {
          _points: number
          _reason: string
          _reference_id?: string
          _reference_type?: string
          _user_id: string
        }
        Returns: undefined
      }
      calculate_level: { Args: { points: number }; Returns: number }
      check_and_award_badges: {
        Args: { _user_id: string }
        Returns: {
          category: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string | null
          icon: string
          id: string
          name: string
          points_value: number
        }[]
        SetofOptions: {
          from: "*"
          to: "badges"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_certificate_code: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_course_instructor: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      issue_certificate: {
        Args: { _course_id: string; _grade?: number; _user_id: string }
        Returns: {
          certificate_code: string
          course_id: string
          course_title: string
          created_at: string
          grade: number | null
          id: string
          issued_at: string
          student_name: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_exam: {
        Args: { _answers: Json; _attempt_id: string }
        Returns: {
          answers: Json | null
          completed_at: string | null
          exam_id: string
          id: string
          passed: boolean | null
          score: number | null
          started_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "exam_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "instructor" | "estudiante"
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
      app_role: ["admin", "instructor", "estudiante"],
    },
  },
} as const
