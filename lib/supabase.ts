import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          loyalty_points: number;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          loyalty_points?: number;
        };
      };
      categories: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          description_ar: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {};
        Update: {};
      };
      products: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          description_ar: string | null;
          description_en: string | null;
          price: number;
          sale_price: number | null;
          category_id: string | null;
          image_urls: string[];
          stock_quantity: number;
          is_featured: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {};
        Update: {};
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          product_id: string;
          quantity: number;
        };
        Update: {
          quantity?: number;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          product_id: string;
        };
        Update: {};
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          status: string;
          shipping_address: Json | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          total_amount: number;
          status?: string;
          shipping_address?: Json | null;
        };
        Update: {
          status?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
        };
        Update: {};
      };
      user_product_views: {
        Row: {
            id: number;
            user_id: string;
            product_id: string;
            viewed_at: string;
        };
        Insert: {
            user_id: string;
            product_id: string;
        };
        Update: {};
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          review_images: string[] | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          review_images?: string[] | null;
        };
        Update: {};
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          created_at: string;
        };
        Insert: {};
        Update: {};
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
        };
        Update: {};
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          image_url: string;
          caption?: string | null;
        };
        Update: {};
      };
      post_products: {
        Row: {
          id: string;
          post_id: string;
          product_id: string;
        };
        Insert: {
          post_id: string;
          product_id: string;
        };
        Update: {};
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
        };
        Update: {};
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          comment: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          comment: string;
        };
        Update: {};
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
        };
        Update: {};
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender: 'user' | 'ai';
          content: string;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender: 'user' | 'ai';
          content: string;
        };
        Update: {};
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'daily' | 'weekly';
          points_reward: number;
          created_at: string;
        };
        Insert: {};
        Update: {};
      };
      user_challenges: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          challenge_id: string;
        };
        Update: {};
      };
      product_qna: {
        Row: {
          id: string
          product_id: string
          user_id: string
          question: string
          answer: string | null
          answered_by: string | null
          created_at: string
          answered_at: string | null
        }
        Insert: {
          product_id: string
          user_id: string
          question: string
        }
        Update: {
          answer?: string | null
          answered_by?: string | null
          answered_at?: string | null
        }
      }
      qna_likes: {
        Row: {
          id: string
          qna_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          qna_id: string
          user_id: string
        }
        Update: {}
      }
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      get_recommended_products: {
        Args: { p_user_id: string };
        Returns: {
            id: string,
            name_ar: string,
            name_en: string,
            description_ar: string,
            description_en: string,
            price: number,
            sale_price: number,
            category_id: string,
            image_urls: string[],
            stock_quantity: number,
            is_featured: boolean,
            is_active: boolean,
            created_at: string,
            updated_at: string
        }[];
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};
