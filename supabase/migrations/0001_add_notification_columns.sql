-- =====================================================================
-- 既存DBに通知用カラムを追加するマイグレーション
-- すでに cancel_items テーブルを作成済みの場合はこちらを実行してください。
-- （新規に schema.sql を実行する場合は不要です）
-- =====================================================================

alter table cancel_items
  add column if not exists notified_at timestamp with time zone;

alter table cancel_items
  add column if not exists notification_status text default 'pending';

create index if not exists idx_cancel_items_notify
  on cancel_items(notify_date, status, notification_status);
