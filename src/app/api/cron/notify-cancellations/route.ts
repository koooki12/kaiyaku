import { NextResponse } from "next/server";
import { getSupabaseAdmin, type CancelItem } from "@/lib/supabase";
import { todayStr } from "@/lib/date";
import {
  getResend,
  getFromAddress,
  getAppUrl,
  buildNotificationEmail,
} from "@/lib/email";

// 動的実行・Node ランタイム（Resend / service_role を使うため）
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ItemWithUser = CancelItem & {
  users: {
    id: string;
    email: string | null;
    notify_enabled: boolean;
    email_verified: boolean;
    unsubscribe_token: string | null;
  } | null;
};

/**
 * CRON_SECRET による認証。
 * Vercel Cron は CRON_SECRET 設定時に Authorization: Bearer <secret> を付与する。
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // 未設定なら実行させない（安全側）
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const today = todayStr(); // Asia/Tokyo 基準の今日

  // 対象: active / notify_date が今日 / 未送信、かつ通知ON・本人確認済みのユーザー
  const { data, error } = await supabase
    .from("cancel_items")
    .select(
      "*, users!inner(id, email, notify_enabled, email_verified, unsubscribe_token)"
    )
    .eq("status", "active")
    .eq("notify_date", today)
    .eq("notification_status", "pending");

  if (error) {
    return NextResponse.json(
      { error: "DB query failed", detail: error.message },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as ItemWithUser[];

  // 通知ON かつ メールアドレスあり かつ 本人確認済みのものだけ対象にする
  const targets = rows.filter(
    (r) =>
      r.users?.notify_enabled === true &&
      r.users?.email_verified === true &&
      !!r.users?.email
  );

  // ユーザーごとにまとめる（1ユーザー1通）
  const byUser = new Map<
    string,
    { email: string; unsubscribeToken: string | null; items: CancelItem[] }
  >();
  for (const row of targets) {
    const email = row.users!.email!;
    const key = row.user_id;
    if (!byUser.has(key)) {
      byUser.set(key, {
        email,
        unsubscribeToken: row.users!.unsubscribe_token,
        items: [],
      });
    }
    // 結合した users はメール本文に不要なので取り除く
    const { users: _users, ...item } = row;
    void _users;
    byUser.get(key)!.items.push(item as CancelItem);
  }

  const resend = getResend();
  const from = getFromAddress();
  const appUrl = getAppUrl();
  const nowIso = new Date().toISOString();

  let sentUsers = 0;
  let sentItems = 0;
  let failedItems = 0;

  for (const { email, unsubscribeToken, items } of byUser.values()) {
    const ids = items.map((i) => i.id);
    const unsubscribeUrl = `${appUrl}/unsubscribe?token=${unsubscribeToken ?? ""}`;
    const { subject, html, text } = buildNotificationEmail(
      items,
      unsubscribeUrl
    );

    try {
      const { error: sendError } = await resend.emails.send({
        from,
        to: email,
        subject,
        html,
        text,
        // 配信停止ヘッダ（迷惑メール判定の低減・メールクライアントの配信停止UI対応）
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        },
      });

      if (sendError) throw new Error(sendError.message);

      // 送信成功 → 二重送信防止のため sent に更新
      await supabase
        .from("cancel_items")
        .update({ notification_status: "sent", notified_at: nowIso })
        .in("id", ids);

      sentUsers += 1;
      sentItems += items.length;
    } catch (e) {
      // 送信失敗 → failed にして当日の再送を防ぐ（ログに残す）
      await supabase
        .from("cancel_items")
        .update({ notification_status: "failed" })
        .in("id", ids);

      failedItems += items.length;
      console.error(
        `[notify-cancellations] send failed for ${email}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    candidates: rows.length,
    targets: targets.length,
    sentUsers,
    sentItems,
    failedItems,
  });
}
