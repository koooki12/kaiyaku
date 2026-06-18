import type { CancelItem } from "./supabase";

/**
 * ローカルタイム基準で「今日」の 00:00 を返す。
 */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 指定タイムゾーン（既定: Asia/Tokyo）の「今日」を YYYY-MM-DD で返す。
 * Vercel Cron は UTC で動くため、日本時間基準で日付を判定するのに使う。
 */
export function todayStr(timeZone = "Asia/Tokyo"): string {
  // en-CA ロケールは YYYY-MM-DD 形式で返す
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * YYYY-MM-DD 文字列をローカルの Date(00:00) に変換する。
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * 2つの日付の差（日数）。due - today。
 */
export function daysUntil(dateStr: string): number {
  const today = startOfToday();
  const due = parseDate(dateStr);
  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * タイムスタンプ(ISO文字列)を「6月20日(金) 9:00」形式（日本時間）で表示する。
 */
export function formatDateTimeJa(iso: string, timeZone = "Asia/Tokyo"): string {
  const d = new Date(iso);
  const datePart = new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${datePart} ${timePart}`;
}

/**
 * 日付を「6月20日(金)」形式で表示する。
 */
export function formatDateJa(dateStr: string): string {
  const d = parseDate(dateStr);
  const week = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日(${week})`;
}

/**
 * 解約日までの残り日数を人が読める形にする。
 */
export function relativeDueLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}日超過`;
  if (days === 0) return "今日まで";
  if (days === 1) return "明日まで";
  return `あと${days}日`;
}

export type ItemGroupKey = "tomorrow" | "thisWeek" | "thisMonth" | "later" | "cancelled";

export type ItemGroup = {
  key: ItemGroupKey;
  title: string;
  items: CancelItem[];
};

/**
 * アイテムを「明日まで・今週・今月・それ以降・解約済み」に分類する。
 * active のものは解約予定日の昇順、解約済みは更新日の降順。
 */
export function groupItems(items: CancelItem[]): ItemGroup[] {
  const today = startOfToday();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const tomorrow: CancelItem[] = [];
  const thisWeek: CancelItem[] = [];
  const thisMonth: CancelItem[] = [];
  const later: CancelItem[] = [];
  const cancelled: CancelItem[] = [];

  for (const item of items) {
    if (item.status === "cancelled") {
      cancelled.push(item);
      continue;
    }

    const days = daysUntil(item.cancel_due_date);
    const due = parseDate(item.cancel_due_date);

    if (days <= 1) {
      // 今日・明日・超過分
      tomorrow.push(item);
    } else if (due <= endOfWeek) {
      thisWeek.push(item);
    } else if (due <= endOfMonth) {
      thisMonth.push(item);
    } else {
      later.push(item);
    }
  }

  const byDueAsc = (a: CancelItem, b: CancelItem) =>
    a.cancel_due_date.localeCompare(b.cancel_due_date);

  tomorrow.sort(byDueAsc);
  thisWeek.sort(byDueAsc);
  thisMonth.sort(byDueAsc);
  later.sort(byDueAsc);
  cancelled.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return [
    { key: "tomorrow", title: "⚠️ 明日まで", items: tomorrow },
    { key: "thisWeek", title: "今週", items: thisWeek },
    { key: "thisMonth", title: "今月", items: thisMonth },
    { key: "later", title: "それ以降", items: later },
    { key: "cancelled", title: "解約済み", items: cancelled },
  ];
}
