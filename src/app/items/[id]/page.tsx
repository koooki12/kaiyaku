import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getSupabaseAdmin, type CancelItem } from "@/lib/supabase";
import { requireVerifiedUser } from "@/lib/user";
import {
  formatDateJa,
  formatDateTimeJa,
  relativeDueLabel,
  daysUntil,
} from "@/lib/date";
import {
  markCancelledAction,
  markActiveAction,
  updateMemoAction,
  deleteItemAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireVerifiedUser();
  const userId = user.id;

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("cancel_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) notFound();
  const item = data as CancelItem;
  const isCancelled = item.status === "cancelled";
  const days = daysUntil(item.cancel_due_date);
  const urgent = !isCancelled && days <= 1;

  return (
    <>
      <AppHeader title="詳細" back={{ href: "/items" }} />

      <main className="flex-1 px-4 pb-10 pt-4">
        {/* ヘッダー部 */}
        <div
          className={[
            "rounded-2xl border px-5 py-5",
            isCancelled
              ? "border-gray-100 bg-gray-50"
              : urgent
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <h1
              className={[
                "text-2xl font-extrabold",
                isCancelled ? "text-gray-500 line-through" : "text-gray-900",
              ].join(" ")}
            >
              {item.service_name}
            </h1>
            {item.category && (
              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                {item.category}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {isCancelled ? (
              <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-bold text-gray-600">
                解約済み
              </span>
            ) : (
              <span
                className={[
                  "rounded-full px-3 py-1 text-sm font-bold",
                  urgent ? "bg-brand text-white" : "bg-orange-100 text-brand",
                ].join(" ")}
              >
                {relativeDueLabel(item.cancel_due_date)}
              </span>
            )}
          </div>
        </div>

        {/* 通知ステータスのバナー */}
        {item.notification_status === "failed" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            ⚠️ 通知メールの送信に失敗しました。
            <span className="font-normal">
              {" "}
              設定ページで通知先メールアドレスを確認してください。
            </span>
          </div>
        )}
        {item.notification_status !== "failed" && item.notified_at && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            ✓ 通知済み
            <span className="font-normal text-green-600">
              {" "}
              （{formatDateTimeJa(item.notified_at)} に送信）
            </span>
          </div>
        )}

        {/* 詳細項目 */}
        <dl className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          <Row label="解約予定日" value={formatDateJa(item.cancel_due_date)} />
          {item.notify_date && (
            <Row label="通知日" value={formatDateJa(item.notify_date)} />
          )}
          {item.price != null && (
            <Row label="月額" value={`¥${item.price.toLocaleString()}`} />
          )}
          {item.cancel_url && (
            <Row
              label="解約URL"
              value={
                <span className="block max-w-[60vw] truncate text-brand">
                  {item.cancel_url}
                </span>
              }
            />
          )}
        </dl>

        {/* アクションボタン */}
        <div className="mt-6 space-y-3">
          <Link
            href={`/items/${item.id}/edit`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-4 text-base font-bold text-gray-700 transition active:scale-[0.99]"
          >
            ✏️ 内容を編集する
          </Link>

          {item.cancel_url && (
            <a
              href={item.cancel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand py-4 text-lg font-bold text-brand transition active:scale-[0.99]"
            >
              🔗 解約URLを開く
            </a>
          )}

          {!isCancelled ? (
            <form action={markCancelledAction}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] active:bg-brand-dark"
              >
                ✓ 解約済みにする
              </button>
            </form>
          ) : (
            <form action={markActiveAction}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="w-full rounded-xl border border-gray-300 py-4 text-base font-bold text-gray-600 transition active:scale-[0.99]"
              >
                未解約に戻す
              </button>
            </form>
          )}
        </div>

        {/* メモ編集 */}
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-bold text-gray-700">メモ</h2>
          <form action={updateMemoAction} className="space-y-2">
            <input type="hidden" name="id" value={item.id} />
            <textarea
              name="memo"
              rows={4}
              defaultValue={item.memo ?? ""}
              placeholder="解約方法の手順など"
              className="form-input resize-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-gray-100 py-3 text-base font-semibold text-gray-700 transition active:scale-[0.99]"
            >
              メモを保存
            </button>
          </form>
        </section>

        {/* 削除 */}
        <section className="mt-10">
          <form action={deleteItemAction}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="w-full py-3 text-sm font-medium text-gray-400 underline"
            >
              この登録を削除する
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
