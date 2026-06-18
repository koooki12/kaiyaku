import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/user";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deleteAccountAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { error } = await searchParams;

  // 削除されるデータ件数を表示
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("cancel_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <>
      <AppHeader title="アカウント削除" back={{ href: "/settings" }} />

      <main className="flex-1 px-4 pb-10 pt-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
          <h1 className="text-lg font-bold text-red-700">
            アカウントとデータを削除します
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-red-700">
            この操作は取り消せません。以下のデータがすべて完全に削除されます。
          </p>
          <ul className="mt-3 space-y-1 text-sm text-red-700">
            <li>・登録メールアドレス（{user.email ?? "未登録"}）</li>
            <li>・解約予定アイテム {count ?? 0} 件</li>
            <li>・通知設定</li>
          </ul>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <form action={deleteAccountAction} className="mt-6 space-y-5">
          <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-4">
            <input
              type="checkbox"
              name="confirm"
              value="delete"
              className="mt-0.5 h-5 w-5 accent-red-600"
            />
            <span className="text-sm text-gray-700">
              上記の内容を理解し、アカウントとすべてのデータを削除することに同意します。
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99]"
          >
            完全に削除する
          </button>
        </form>
      </main>
    </>
  );
}
