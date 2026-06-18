import { createClient } from "@supabase/supabase-js";

/**
 * サーバー側専用の Supabase クライアント。
 * service_role キーを使うため、RLS をバイパスしてDBにアクセスできる。
 * 必ずサーバー（Server Components / Server Actions）からのみ利用すること。
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase の環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を .env.local に設定してください。"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type CancelItem = {
  id: string;
  user_id: string;
  service_name: string;
  price: number | null;
  cancel_due_date: string; // YYYY-MM-DD
  notify_date: string | null;
  cancel_url: string | null;
  memo: string | null;
  category: string | null;
  status: "active" | "cancelled";
  notified_at: string | null;
  notification_status: "pending" | "sent" | "failed" | null;
  created_at: string;
  updated_at: string;
};

export type AppUser = {
  id: string;
  email: string | null;
  notify_enabled: boolean;
  created_at: string;
};
