import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ItemCard } from "@/components/ItemCard";
import { getSupabaseAdmin, type CancelItem } from "@/lib/supabase";
import { requireVerifiedUser } from "@/lib/user";
import { groupItems } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const user = await requireVerifiedUser();
  const userId = user.id;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("cancel_items")
    .select("*")
    .eq("user_id", userId)
    .order("cancel_due_date", { ascending: true });

  const items = (data ?? []) as CancelItem[];
  const groups = groupItems(items).filter((g) => g.items.length > 0);

  const activeCount = items.filter((i) => i.status === "active").length;

  return (
    <>
      <AppHeader title="一覧" />

      <main className="flex-1 px-4 pb-28 pt-4">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="text-xl font-bold">解約予定</h1>
          <span className="text-sm text-gray-400">
            未解約 {activeCount}件
          </span>
        </div>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.key}>
                <h2
                  className={[
                    "mb-2 px-1 text-sm font-bold",
                    group.key === "tomorrow"
                      ? "text-brand"
                      : "text-gray-500",
                  ].join(" ")}
                >
                  {group.title}
                  <span className="ml-2 font-normal text-gray-400">
                    {group.items.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* 固定の追加ボタン */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-6">
        <Link
          href="/items/new"
          className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-bold text-white shadow-lg shadow-orange-200 transition active:scale-[0.99] active:bg-brand-dark"
        >
          <span className="text-2xl leading-none">＋</span>
          解約予定を登録
        </Link>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="mb-4 text-5xl">🗓</div>
      <p className="text-base font-semibold text-gray-700">
        まだ登録がありません
      </p>
      <p className="mt-2 max-w-xs text-sm text-gray-500">
        無料体験やお試し契約の解約予定日を登録して、
        解約忘れを防ぎましょう。
      </p>
    </div>
  );
}
