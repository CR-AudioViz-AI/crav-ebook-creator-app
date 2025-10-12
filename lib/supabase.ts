import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          plan: 'free' | 'pro' | 'scale';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          paypal_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: 'user' | 'admin';
          org_id: string;
          created_at: string;
          last_login_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      credit_balances: {
        Row: {
          org_id: string;
          balance: number;
          last_grant_at: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['credit_balances']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['credit_balances']['Insert']>;
      };
      credit_ledger: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          type: 'GRANT' | 'TOPUP' | 'SPEND' | 'REFUND';
          amount: number;
          reason: string;
          meta: any;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['credit_ledger']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      manuscripts: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          title: string;
          subtitle: string | null;
          author: string;
          description: string;
          brief: any;
          outline: string | null;
          chapters: any;
          status: 'draft' | 'complete';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['manuscripts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['manuscripts']['Insert']>;
      };
      audit_log: {
        Row: {
          id: string;
          org_id: string | null;
          user_id: string | null;
          action: string;
          ip: string | null;
          user_agent: string | null;
          meta: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};
