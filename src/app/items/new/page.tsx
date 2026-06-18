import { AppHeader } from "@/components/AppHeader";
import { createItemAction } from "@/app/actions";
import { requireVerifiedUser } from "@/lib/user";

export const dynamic = "force-dynamic";

const CATEGORIES = ["動画", "音楽", "ゲーム", "アプリ", "ジム", "学習", "その他"];

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireVerifiedUser();

  const { error } = await searchParams;

  return (
    <>
      <AppHeader title="解約予定を登録" back={{ href: "/items" }} />

      <main className="flex-1 px-4 pb-28 pt-4">
        <form id="new-item-form" action={createItemAction} className="space-y-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* 必須項目（最初に見えるのはこの3つだけ） */}
          <Field label="サービス名" required>
            <input
              type="text"
              name="service_name"
              required
              placeholder="例）Netflix"
              className="form-input"
            />
          </Field>

          <Field label="解約予定日" required hint="無料期間が終わる日">
            <input
              type="date"
              name="cancel_due_date"
              required
              className="form-input"
            />
          </Field>

          <Field label="通知日" required hint="この日にメールでお知らせします">
            <input
              type="date"
              name="notify_date"
              required
              className="form-input"
            />
          </Field>

          {/* 任意項目（開いたら入力できる） */}
          <details className="group rounded-xl border border-gray-200">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
              ＋ 詳細を追加（任意）
              <span className="text-base text-gray-400 transition-transform group-open:rotate-180">
                ⌄
              </span>
            </summary>

            <div className="space-y-5 px-4 pb-5 pt-1">
              <Field label="月額（円）">
                <input
                  type="number"
                  name="price"
                  inputMode="numeric"
                  min={0}
                  placeholder="990"
                  className="form-input"
                />
              </Field>

              <Field label="カテゴリ">
                <select name="category" className="form-input" defaultValue="">
                  <option value="">選択しない</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="解約ページのURL" hint="あとで解約手続きをすぐ開けます">
                <input
                  type="url"
                  name="cancel_url"
                  inputMode="url"
                  placeholder="https://..."
                  className="form-input"
                />
              </Field>

              <Field label="メモ">
                <textarea
                  name="memo"
                  rows={3}
                  placeholder="解約方法の手順など"
                  className="form-input resize-none"
                />
              </Field>
            </div>
          </details>
        </form>
      </main>

      {/* 下部固定の保存ボタン */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          form="new-item-form"
          className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] active:bg-brand-dark"
        >
          保存する
        </button>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </span>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
