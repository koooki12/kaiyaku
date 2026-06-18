import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/user";
import { getSupabaseAdmin, type CancelItem } from "@/lib/supabase";
import { todayStr, formatDateJa } from "@/lib/date";
import {
  updateSettingsAction,
  signOutAction,
  sendTestEmailAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; notice?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { saved, notice } = await searchParams;

  // これから通知予定のアイテムを集計（active / notify_date が今日以降 / 未送信）
  const supabase = getSupabaseAdmin();
  const today = todayStr();
  const { data: upcomingData } = await supabase
    .from("cancel_items")
    .select("notify_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .neq("notification_status", "sent")
    .not("notify_date", "is", null)
    .gte("notify_date", today)
    .order("notify_date", { ascending: true });

  const upcoming = (upcomingData ?? []) as Pick<CancelItem, "notify_date">[];
  const upcomingCount = upcoming.length;
  const nextNotifyDate = upcoming[0]?.notify_date ?? null;

  return (
    <>
      <AppHeader title="設定" back={{ href: "/items" }} />

      <main className="flex-1 px-4 pb-10 pt-4">
        {saved && (
          <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            設定を保存しました。
          </p>
        )}
        {notice && (
          <p className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {notice}
          </p>
        )}

        {/* 現在の通知設定状態 */}
        <section className="mb-6 rounded-2xl border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-bold text-gray-700">通知の状態</h2>
          <dl className="divide-y divide-gray-100 text-sm">
            <StatusRow label="メール通知">
              {user.notify_enabled ? (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                  ON
                </span>
              ) : (
                <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-500">
                  OFF
                </span>
              )}
            </StatusRow>
            <StatusRow label="通知先メール">
              <span className={user.email ? "text-gray-900" : "text-gray-400"}>
                {user.email ?? "未登録"}
              </span>
            </StatusRow>
            <StatusRow label="通知予定">
              <span className="text-gray-900">{upcomingCount}件</span>
            </StatusRow>
            <StatusRow label="次の通知日">
              <span className={nextNotifyDate ? "text-gray-900" : "text-gray-400"}>
                {nextNotifyDate ? formatDateJa(nextNotifyDate) : "なし"}
              </span>
            </StatusRow>
          </dl>

          {!user.notify_enabled && upcomingCount > 0 && (
            <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs text-brand">
              通知がOFFのため、通知予定のアイテムがあってもメールは送信されません。
            </p>
          )}

          {/* テスト通知 */}
          <form action={sendTestEmailAction} className="mt-4">
            <button
              type="submit"
              disabled={!user.email}
              className="w-full rounded-xl border-2 border-brand py-3 text-base font-bold text-brand transition active:scale-[0.99] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
            >
              ✉️ テスト通知を送る
            </button>
            <p className="mt-1.5 text-xs text-gray-400">
              登録メールアドレス宛にテストメールを送り、通知設定が正しいか確認できます。
            </p>
          </form>
        </section>

        {/* 設定変更フォーム */}
        <form action={updateSettingsAction} className="space-y-6">
          <div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                通知メールアドレス
              </span>
              <input
                type="email"
                name="email"
                defaultValue={user.email ?? ""}
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="form-input"
              />
            </label>
            <p className="mt-1.5 text-xs text-gray-400">
              解約日が近づいたときの通知先メールアドレスです。
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">メール通知</p>
              <p className="text-xs text-gray-400">解約日が近づいたら知らせる</p>
            </div>
            {/* シンプルなトグル（チェックボックス） */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="notify_enabled"
                defaultChecked={user.notify_enabled}
                className="peer sr-only"
              />
              <div className="h-7 w-12 rounded-full bg-gray-300 transition peer-checked:bg-brand" />
              <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] active:bg-brand-dark"
          >
            保存する
          </button>
        </form>

        <div className="mt-10 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-400">
          ※ メール通知は Vercel Cron により毎日自動で送信されます（解約予定日ではなく
          「通知日」が当日のもの）。送信には Resend の設定が必要です。
        </div>

        <form action={signOutAction} className="mt-8">
          <button
            type="submit"
            className="w-full py-3 text-sm font-medium text-gray-400 underline"
          >
            ログアウト
          </button>
        </form>
      </main>
    </>
  );
}

function StatusRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
