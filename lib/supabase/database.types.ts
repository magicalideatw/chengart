export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];

export type RegistrationRecord = RegistrationRow;

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          title: string;
          category: string;
          description: string;
          session_date: string;
          session_time: string;
          capacity: number;
          fee: number;
          cover_image: string;
          is_open: boolean;
          created_at: string;
          updated_at: string;
          slug?: string;
          subtitle?: string;
          location?: string;
          max_capacity_per_class?: number;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          description: string;
          session_date: string;
          session_time: string;
          capacity?: number;
          fee?: number;
          cover_image: string;
          is_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          description?: string;
          session_date?: string;
          session_time?: string;
          capacity?: number;
          fee?: number;
          cover_image?: string;
          is_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          course_id: string;
          name: string;
          teacher: string;
          weekday: string;
          start_time: string;
          end_time: string;
          capacity: number;
          fee: number | null;
          is_open: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          name: string;
          teacher?: string;
          weekday: string;
          start_time: string;
          end_time: string;
          capacity?: number;
          fee?: number | null;
          is_open?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          name?: string;
          teacher?: string;
          weekday?: string;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          fee?: number | null;
          is_open?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          class_id: string;
          date: string;
          start_time: string;
          end_time: string;
          capacity: number;
          remaining_capacity: number;
          status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          date: string;
          start_time: string;
          end_time: string;
          capacity?: number;
          remaining_capacity?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          remaining_capacity?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          order_id: string;
          student_name: string;
          student_age: string;
          gender: string | null;
          is_first_time: boolean;
          note: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          student_name: string;
          student_age: string;
          gender?: string | null;
          is_first_time?: boolean;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          student_name?: string;
          student_age?: string;
          gender?: string | null;
          is_first_time?: boolean;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      registrations: {
        Row: {
          id: string;
          course_id: string;
          session_id: string | null;
          student_id: string | null;
          order_id: string | null;
          status: "pending" | "paid" | "cancelled";
          name: string;
          phone: string;
          email: string;
          student_name: string;
          student_age: string;
          is_first_time: boolean;
          note: string | null;
          created_at: string;
          course_slug?: string;
          session_date?: string;
          class_id?: string;
          class_name?: string;
          class_time?: string;
        };
        Insert: {
          id?: string;
          course_id?: string;
          session_id?: string | null;
          student_id?: string | null;
          order_id?: string | null;
          status?: "pending" | "paid" | "cancelled";
          course_slug?: string;
          session_date?: string;
          class_id?: string;
          class_name?: string;
          class_time?: string;
          name: string;
          phone: string;
          email: string;
          student_name: string;
          student_age: string;
          is_first_time: boolean;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          session_id?: string | null;
          student_id?: string | null;
          order_id?: string | null;
          status?: "pending" | "paid" | "cancelled";
          course_slug?: string;
          session_date?: string;
          class_id?: string;
          class_name?: string;
          class_time?: string;
          name?: string;
          phone?: string;
          email?: string;
          student_name?: string;
          student_age?: string;
          is_first_time?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          merchant_trade_no: string;
          course_id: string;
          course_title: string;
          status: "pending" | "paid" | "failed" | "cancelled";
          amount: number;
          payment_method: string | null;
          ecpay_trade_no: string | null;
          registration_id: string | null;
          name: string;
          email: string;
          phone: string;
          form_data: Json;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_trade_no: string;
          course_id: string;
          course_title: string;
          status?: "pending" | "paid" | "failed" | "cancelled";
          amount: number;
          payment_method?: string | null;
          ecpay_trade_no?: string | null;
          registration_id?: string | null;
          name: string;
          email: string;
          phone: string;
          form_data: Json;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_trade_no?: string;
          course_id?: string;
          course_title?: string;
          status?: "pending" | "paid" | "failed" | "cancelled";
          amount?: number;
          payment_method?: string | null;
          ecpay_trade_no?: string | null;
          registration_id?: string | null;
          name?: string;
          email?: string;
          phone?: string;
          form_data?: Json;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
        ];
      };
      homepage_announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          is_active: boolean;
          sort_order: number;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          is_active?: boolean;
          sort_order?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          is_active?: boolean;
          sort_order?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_status_overrides: {
        Row: {
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string;
          cover_image: string;
          event_type: string;
          status: string;
          start_date: string;
          end_date: string | null;
          intro: string;
          content: string;
          show_on_homepage: boolean;
          is_featured: boolean;
          sort_order: number;
          registration_button_text: string;
          registration_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string;
          cover_image?: string;
          event_type?: string;
          status?: string;
          start_date: string;
          end_date?: string | null;
          intro?: string;
          content?: string;
          show_on_homepage?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          registration_button_text?: string;
          registration_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          subtitle?: string;
          cover_image?: string;
          event_type?: string;
          status?: string;
          start_date?: string;
          end_date?: string | null;
          intro?: string;
          content?: string;
          show_on_homepage?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          registration_button_text?: string;
          registration_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
