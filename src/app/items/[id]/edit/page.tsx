import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { updateItemAction } from "@/app/actions";
import { requireVerifiedUser } from "@/lib/user";
import { getSupabaseAdmin, type CancelItem } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CATEGORIES = ["動画", "音楽", "ゲーム", "アプリ", "ジム", "学習", "その他"];

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireVerifiedUser();
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("cancel_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const item = data as CancelItem;

  return (
    <>
      <AppHeader title="予定を編集" back={{ href: `/items/${item.id}` }} />

      <main className="flex-1 px-4 pb-10 pt-4">
        <form action={updateItemAction} className="space-y-5">
          <input type="hidden" name="id" value={item.id} />

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <Field label="サービス名" required>
            <input
              type="text"
              name="service_name"
              required
              defaultValue={item.service_name}
              placeholder="例）Netflix、Amazonプライム"
              className="form-input"
            />
          </Field>

          <Field label="解約予定日" required>
            <input
              type="date"
              name="cancel_due_date"
              required
              defaultValue={item.cancel_due_date}
              className="form-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="月額（円）">
              <input
                type="number"
                name="price"
                inputMode="numeric"
                min={0}
                defaultValue={item.price ?? ""}
                placeholder="990"
                className="form-input"
              />
            </Field>

            <Field label="通知日">
              <input
                type="date"
                name="notify_date"
                defaultValue={item.notify_date ?? ""}
                className="form-input"
              />
            </Field>
          </div>
          <p className="-mt-3 text-xs text-gray-400">
            通知日を変更すると、その日に改めて通知されます。
          </p>

          <Field label="カテゴリ">
            <select
              name="category"
              className="form-input"
              defaultValue={item.category ?? ""}
            >
              <option value="">選択しない</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="解約ページのURL">
            <input
              type="url"
              name="cancel_url"
              inputMode="url"
              defaultValue={item.cancel_url ?? ""}
              placeholder="https://..."
              className="form-input"
            />
          </Field>

          <Field label="メモ">
            <textarea
              name="memo"
              rows={3}
              defaultValue={item.memo ?? ""}
              placeholder="解約方法の手順など"
              className="form-input resize-none"
            />
          </Field>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] active:bg-brand-dark"
          >
            変更を保存
          </button>
        </form>
      </main>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}
