-- =====================================================================
-- メール本人確認（ダブルオプトイン）と通知停止トークンの追加
-- すでに users テーブルを作成済みの場合はこちらを実行してください。
-- =====================================================================

alter table users
  add column if not exists email_verified boolean not null default false;

alter table users
  add column if not exists verify_token text;

alter table users
  add column if not exists verify_token_expires_at timestamp with time zone;

alter table users
  add column if not exists unsubscribe_token text;

create index if not exists idx_users_verify_token on users(verify_token);
create index if not exists idx_users_unsubscribe_token on users(unsubscribe_token);

-- 注意:
-- 既存ユーザーは email_verified=false になります。
-- 本人確認を必須にするため、既存ユーザーには再度確認メールが送られます
-- （次回ログイン時、または設定画面の「確認メールを再送」から）。
-- 通知停止トークンは初回の確認メール送信時に自動付与されます。
