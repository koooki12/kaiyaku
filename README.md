# あとで解約

無料体験・初月無料・一時的に契約したサービスの**解約忘れを防ぐ**ためのシンプルな管理アプリ（スマホ特化 / 日本語UI）。

サービス名・解約予定日・通知日・解約URL・メモを登録しておくと、「明日まで」「今週」「今月」「解約済み」でグループ表示され、解約日が近いものが一目でわかります。

## 主な機能

- メールアドレスだけの簡易ユーザー作成（パスワード不要）
- 解約予定の登録（サービス名 / 月額 / 解約予定日 / 通知日 / 解約URL / メモ / カテゴリ）
- 一覧を「明日まで・今週・今月・それ以降・解約済み」でグループ表示
- 詳細ページで「解約済みにする」「解約URLを開く」「メモ編集」
- 設定で通知メールアドレスと通知ON/OFF
- **解約日が近づいたらメール通知**（Vercel Cron + Resend、毎日自動実行）

## 技術スタック

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Server Actions
- Resend（メール送信）
- Vercel Cron Jobs（毎日の通知バッチ）
- Vercel デプロイ前提

---

## セットアップ

### 1. リポジトリの取得と依存インストール

```bash
npm install
```

### 2. Supabase の準備

1. [Supabase](https://supabase.com/) でプロジェクトを作成します。
2. ダッシュボードの **SQL Editor** を開き、`supabase/schema.sql` の内容を貼り付けて実行します（`users` と `cancel_items` テーブルが作成されます）。
   - すでに旧バージョンのテーブルを作成済みの場合は、代わりに `supabase/migrations/0001_add_notification_columns.sql` を実行して通知用カラム（`notified_at` / `notification_status`）を追加してください。
3. **Project Settings → API** から以下を控えます。
   - `Project URL`
   - `anon public` キー
   - `service_role` キー（**サーバー側専用・絶対に公開しない**）

### 3. Resend（メール送信）の準備

1. [Resend](https://resend.com/) でアカウントを作成します。
2. **API Keys** から API キー（`re_...`）を発行して控えます。
3. 送信元アドレスについて:
   - **動作確認だけ**なら、検証不要のテスト用アドレス `onboarding@resend.dev` がそのまま使えます（`RESEND_FROM` 未設定時の既定値）。
   - **本番運用**では Resend の **Domains** で独自ドメインを検証し、`RESEND_FROM` に `あとで解約 <noreply@your-domain.com>` のように設定してください。

### 4. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、値を埋めます。

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# メール通知 (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=あとで解約 <onboarding@resend.dev>

# 通知バッチ (Vercel Cron)
CRON_SECRET=replace-with-a-long-random-string   # 例: openssl rand -hex 32
NEXT_PUBLIC_APP_URL=http://localhost:3000        # 本番は https://your-app.vercel.app
```

> 本MVPはサーバー側で `service_role` キーを使って DB にアクセスします（RLSはバイパス）。
> `service_role` / `RESEND_API_KEY` / `CRON_SECRET` はいずれも `NEXT_PUBLIC_` を付けない**サーバー専用**の環境変数で、ブラウザには露出しません。

### 5. ローカル起動

```bash
npm run dev
```

`http://localhost:3000` を開きます（スマホ表示で確認するのがおすすめです）。

### 6. 本番ビルドの確認

```bash
npm run build
npm run start
```

---

## メール通知の仕組み

- 毎日 1 回、Vercel Cron が `/api/cron/notify-cancellations` を呼び出します。
- その日（**日本時間**基準）が `notify_date` の、`status = 'active'` かつ未送信（`notification_status = 'pending'`）のアイテムを対象にします。
- 対象アイテムの所有者のうち、`users.notify_enabled = true` かつ `users.email` があるユーザーにだけ、`users.email` 宛に送信します。
- メールにはサービス名・解約予定日・金額・解約URL・メモ・詳細ページURLを含みます（1 ユーザーに複数あれば 1 通にまとめます）。
- **二重送信防止**: 送信に成功したアイテムは `notification_status = 'sent'`・`notified_at = now()` に更新され、以降のバッチでは対象外になります（送信失敗時は `'failed'`）。

### ローカルでの通知APIテスト

`.env.local` に `CRON_SECRET`・`RESEND_API_KEY`・Supabase の各キーを設定したうえで、開発サーバーを起動して `curl` で叩きます。

```bash
npm run dev

# 別ターミナルで（Authorization ヘッダに CRON_SECRET を渡す）
curl -i -H "Authorization: Bearer <CRON_SECRET>" \
  http://localhost:3000/api/cron/notify-cancellations
```

- 認証ヘッダが無い／間違っていると **401 Unauthorized** を返します。
- 正しい場合は処理を実行し、`{ "ok": true, "date": "...", "candidates": n, "targets": n, "sentUsers": n, "sentItems": n, "failedItems": n }` を返します。
- テスト時は、対象アイテムの `notify_date` を**今日（日本時間）**に、`status` を `active`、`notification_status` を `pending` にしておきます。送信後は `sent` に変わるため、再テストするには `pending` に戻してください。

---

## Vercel へのデプロイ

1. このリポジトリを GitHub などに push します。
2. [Vercel](https://vercel.com/) で **New Project** からリポジトリをインポートします（フレームワークは自動で Next.js が選択されます）。
3. **Settings → Environment Variables** に以下を登録します（**Production / Preview** 両方）。

   | 変数名 | 説明 | NEXT_PUBLIC |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | ✅ |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー | ✅ |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role キー（**秘匿**） | ❌ |
   | `RESEND_API_KEY` | Resend API キー（**秘匿**） | ❌ |
   | `RESEND_FROM` | 送信元アドレス（検証済みドメイン推奨） | ❌ |
   | `CRON_SECRET` | Cron 認証用シークレット（**秘匿**） | ❌ |
   | `NEXT_PUBLIC_APP_URL` | 公開URL（例: `https://your-app.vercel.app`） | ✅ |

   > `❌` の変数は `NEXT_PUBLIC_` を**付けない**こと。付けるとクライアントJSにバンドルされ漏洩します。

4. **Deploy** を実行します。
5. デプロイ完了後、発行された URL にアクセスして動作を確認します。

> Supabase 側の SQL（`supabase/schema.sql`）の実行を忘れないでください。

### Vercel Cron の設定

- Cron は `vercel.json` で定義済みです。

  ```json
  {
    "crons": [
      { "path": "/api/cron/notify-cancellations", "schedule": "0 0 * * *" }
    ]
  }
  ```

- `schedule` は **UTC** で解釈されます。`0 0 * * *` は **毎日 09:00（日本時間）** に実行されます。時間を変えたい場合は cron 式を調整してください。
- `CRON_SECRET` を Vercel の環境変数に設定しておくと、Vercel Cron は自動で `Authorization: Bearer <CRON_SECRET>` を付けてエンドポイントを呼び出します（外部からの不正実行を防止）。
- デプロイ後、Vercel ダッシュボードの **Settings → Cron Jobs** で登録状況・実行ログを確認できます。手動実行（Run）でテストも可能です。

---

## 本番での通知テスト手順

デプロイ後、実際にメールが届くか・二重送信されないかを確認する手順です。

### A. 一番簡単な確認 — 「テスト通知を送る」

1. 本番URLにログインし、`/settings` を開きます。
2. 「通知の状態」で **メール通知=ON / 通知先メール** が正しいことを確認します。
3. **「✉️ テスト通知を送る」** を押すと、登録メールアドレス宛にテストメールが届きます。
   - 届けば Resend の設定（APIキー・送信元アドレス）は正常です。
   - 届かない場合は後述の「Resend のログ確認」を参照してください。

### B. Cron 本体（解約予定通知）のテスト

1. **テスト用アイテムを作る**: `/items/new` から登録し、**通知日（notify_date）を「今日（日本時間）」** に設定します（解約予定日は任意の未来日でOK）。
   - 設定 `/settings` の「通知予定」が 1 件以上、「次の通知日」が今日になっていれば対象になっています。
2. **Cron API を手動で叩く**: 本番の `CRON_SECRET` を Bearer に付けて呼び出します。

   ```bash
   curl -i -H "Authorization: Bearer <本番のCRON_SECRET>" \
     https://your-app.vercel.app/api/cron/notify-cancellations
   ```

   - レスポンス例:
     ```json
     { "ok": true, "date": "2026-06-18", "candidates": 1, "targets": 1,
       "sentUsers": 1, "sentItems": 1, "failedItems": 0 }
     ```
   - `sentItems` が増えていれば送信成功です。メールボックスを確認します。
   - 認証ヘッダなし／不正な値の場合は **401** が返ります（外部から実行されないことの確認）。
3. **Vercel ダッシュボードからの手動実行**: **Settings → Cron Jobs → 対象ジョブ → Run** でも実行でき、`Authorization` ヘッダは Vercel が自動付与します。

### C. Resend のログ確認

- [Resend ダッシュボード](https://resend.com/emails) の **Emails / Logs** で、送信ステータス（Delivered / Bounced / Failed）と宛先・件名を確認できます。
- 失敗時はここに理由（ドメイン未検証・無効な宛先など）が表示されます。送信元を独自ドメインにする場合は **Domains** で検証を済ませてください。

### D. 二重送信防止の確認

1. B でメールが届いた直後、**同じ `curl` をもう一度実行**します。
2. 2 回目のレスポンスは `"sentItems": 0`（`candidates` も 0）になり、**メールは再送されません**。
   - 送信成功時にアイテムが `notification_status='sent'` / `notified_at=now()` に更新され、以降のバッチ対象から外れるためです。
3. アプリ上でも、そのアイテムに **「✓ 通知済み」** ラベルと送信日時が表示されます。
4. もう一度テストしたい場合は、Supabase の SQL Editor で対象を pending に戻します。

   ```sql
   update cancel_items
     set notification_status = 'pending', notified_at = null
     where id = '<アイテムのid>';
   ```

- 送信に失敗したアイテムは `notification_status='failed'` となり、一覧と詳細ページに **「⚠️ 通知失敗」** が表示されます（当日の自動再送はされません。原因解消後に上記SQLで pending に戻すと再送対象になります）。

---

## ページ構成

| パス            | 内容                                             |
| --------------- | ------------------------------------------------ |
| `/`             | サービス説明・訴求・メールで簡易登録             |
| `/items`        | 解約予定の一覧（グループ表示）                   |
| `/items/new`    | 解約予定の登録フォーム                           |
| `/items/[id]`   | 詳細・解約済み化・解約URLを開く・メモ編集・削除  |
| `/settings`     | 通知状態の表示・テスト通知送信・通知メールアドレス・通知ON/OFF・ログアウト |

## API

| パス                                  | 内容                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `GET /api/cron/notify-cancellations`  | 通知バッチ。`CRON_SECRET`（Bearer）で認証。Vercel Cron が毎日実行 |

## データベース

`supabase/schema.sql` を参照してください。

- `users` … 簡易ユーザー（`email`, `notify_enabled`）
- `cancel_items` … 解約予定アイテム（`service_name`, `cancel_due_date`, `status`, `notified_at`, `notification_status` など）

## セキュリティ

- `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY` / `CRON_SECRET` はいずれも `NEXT_PUBLIC_` を付けないサーバー専用変数で、クライアントJSには含まれません（`use client` コンポーネントは未使用）。
- 全ての参照・更新・削除は cookie の `user_id` を使って `cancel_items` を `id` + `user_id` の両方で絞り込むため、他人のデータは閲覧・編集・削除できません。
- Cron エンドポイントは `CRON_SECRET` による Bearer 認証で保護しています（未設定時は実行されません）。

## MVPに含まれないもの

決済 / 自動銀行連携 / Gmail読み取り / App Store課金連携 / 複雑な認証 / AI機能 / ネイティブ通知。

## 補足・既知の制限

- 認証は cookie ベースの簡易ユーザーです。本番運用では Supabase Auth + RLS への移行を推奨します。
- メール通知は実装済みです（Vercel Cron + Resend）。本番では `RESEND_FROM` に独自ドメインの検証済みアドレスを設定してください。
