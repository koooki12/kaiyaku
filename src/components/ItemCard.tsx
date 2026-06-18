import Link from "next/link";
import type { CancelItem } from "@/lib/supabase";
import { daysUntil, formatDateJa, relativeDueLabel } from "@/lib/date";

export function ItemCard({ item }: { item: CancelItem }) {
  const isCancelled = item.status === "cancelled";
  const days = daysUntil(item.cancel_due_date);
  const urgent = !isCancelled && days <= 1;
  const soon = !isCancelled && days > 1 && days <= 3;

  return (
    <Link
      href={`/items/${item.id}`}
      className={[
        "flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 transition active:scale-[0.99]",
        isCancelled
          ? "border-gray-100 bg-gray-50 opacity-70"
          : urgent
            ? "border-red-200 bg-red-50"
            : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={[
              "truncate text-base font-bold",
              isCancelled ? "text-gray-500 line-through" : "text-gray-900",
            ].join(" ")}
          >
            {item.service_name}
          </p>
          {item.category && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {item.category}
            </span>
          )}
        </div>
        {/* 通知ステータス */}
        {item.notification_status === "failed" ? (
          <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
            ⚠️ 通知失敗
          </span>
        ) : item.notified_at ? (
          <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            ✓ 通知済み
          </span>
        ) : null}
        <p className="mt-1 text-sm text-gray-500">
          {formatDateJa(item.cancel_due_date)}まで
          {item.price != null && (
            <span className="ml-2 text-gray-400">
              ¥{item.price.toLocaleString()}/月
            </span>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {isCancelled ? (
          <span className="text-sm font-medium text-gray-400">解約済み</span>
        ) : (
          <span
            className={[
              "inline-block rounded-full px-3 py-1 text-sm font-bold",
              urgent
                ? "bg-brand text-white"
                : soon
                  ? "bg-orange-100 text-brand"
                  : "bg-gray-100 text-gray-600",
            ].join(" ")}
          >
            {relativeDueLabel(item.cancel_due_date)}
          </span>
        )}
      </div>
    </Link>
  );
}
