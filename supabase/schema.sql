-- =====================================================================
-- あとで解約 - データベーススキーマ
-- Supabase の SQL Editor にこのファイルの内容を貼り付けて実行してください。
-- =====================================================================

-- ユーザー（MVP: メールアドレスだけの簡易ユーザー）
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  -- 通知設定（/settings で利用）
  notify_enabled boolean not null default true,
  created_at timestamp with time zone default now()
);

-- 解約予定アイテム
create table if not exists cancel_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  service_name text not null,
  price int,
  cancel_due_date date not null,
  notify_date date,
  cancel_url text,
  memo text,
  category text,
  status text not null default 'active',  -- 'active' | 'cancelled'
  -- 通知関連（二重送信防止に利用）
  notified_at timestamp with time zone,
  notification_status text default 'pending',  -- 'pending' | 'sent' | 'failed'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- よく使うクエリ用のインデックス
create index if not exists idx_cancel_items_user_id on cancel_items(user_id);
create index if not exists idx_cancel_items_due_date on cancel_items(cancel_due_date);
-- 通知バッチ（notify_date が今日 / status=active / 未送信）用
create index if not exists idx_cancel_items_notify
  on cancel_items(notify_date, status, notification_status);

-- =====================================================================
-- 行レベルセキュリティ(RLS)について
-- ---------------------------------------------------------------------
-- 本MVPはサーバー側で service_role キーを使ってアクセスするため、
-- RLS は有効化していません（service_role は RLS をバイパスします）。
-- 将来 Supabase Auth を導入する場合は、RLS を有効化し
-- auth.uid() ベースのポリシーを追加してください。
-- =====================================================================
