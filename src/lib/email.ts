import { Resend } from "resend";
import type { CancelItem } from "./supabase";
import { formatDateJa } from "./date";

/**
 * Resend クライアント（サーバー専用）。
 */
export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY が設定されていません。.env.local もしくは Vercel の環境変数に設定してください。"
    );
  }
  return new Resend(apiKey);
}

/**
 * 送信元アドレス。Resend で検証済みのドメインを使う。
 * 未設定時は Resend のテスト用アドレス onboarding@resend.dev を使用。
 */
export function getFromAddress(): string {
  return process.env.RESEND_FROM || "あとで解約 <onboarding@resend.dev>";
}

/**
 * アプリのベースURL（メール内の詳細ページリンク用）。
 */
export function getAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemBlockHtml(item: CancelItem, appUrl: string): string {
  const detailUrl = `${appUrl}/items/${item.id}`;
  const rows: string[] = [];

  rows.push(
    `<tr><td style="padding:4px 0;color:#6b7280;width:96px;">解約予定日</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(
      formatDateJa(item.cancel_due_date)
    )}</td></tr>`
  );
  if (item.price != null) {
    rows.push(
      `<tr><td style="padding:4px 0;color:#6b7280;">金額</td><td style="padding:4px 0;">¥${item.price.toLocaleString()}/月</td></tr>`
    );
  }
  if (item.cancel_url) {
    const safeUrl = escapeHtml(item.cancel_url);
    rows.push(
      `<tr><td style="padding:4px 0;color:#6b7280;">解約URL</td><td style="padding:4px 0;"><a href="${safeUrl}" style="color:#f54a00;">${safeUrl}</a></td></tr>`
    );
  }
  if (item.memo) {
    rows.push(
      `<tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">メモ</td><td style="padding:4px 0;white-space:pre-wrap;">${escapeHtml(
        item.memo
      )}</td></tr>`
    );
  }

  return `
    <div style="border:1px solid #fde0d0;border-radius:12px;padding:16px;margin:16px 0;background:#fff7f3;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">${escapeHtml(
        item.service_name
      )}</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">${rows.join(
        ""
      )}</table>
      <a href="${detailUrl}" style="display:inline-block;margin-top:12px;background:#f54a00;color:#ffffff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:10px;font-size:14px;">詳細・解約手続きへ</a>
    </div>`;
}

/**
 * Resend 設定が正しいか確認するためのテストメール本文を作る。
 */
export function buildTestEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const appUrl = getAppUrl();
  const subject = "【あとで解約】テスト通知メールです";
  const html = `
  <div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;padding:24px 16px;">
    <p style="font-size:20px;font-weight:800;color:#f54a00;margin:0 0 8px;">あとで解約</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      これはテスト通知メールです。<br/>
      このメールが届いていれば、メール通知の設定（Resend）は正しく動作しています ✅
    </p>
    <a href="${appUrl}/settings" style="display:inline-block;margin-top:12px;background:#f54a00;color:#ffffff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:10px;font-size:14px;">設定ページを開く</a>
    <p style="font-size:12px;color:#9ca3af;margin-top:24px;">あとで解約の「テスト通知を送る」から送信されました。</p>
  </div>`;
  const text =
    `あとで解約 - テスト通知メール\n\n` +
    `これはテスト通知メールです。\n` +
    `このメールが届いていれば、メール通知の設定（Resend）は正しく動作しています。\n\n` +
    `設定ページ: ${appUrl}/settings`;
  return { subject, html, text };
}

/**
 * 1ユーザー分（複数アイテム）の通知メール本文を作る。
 */
export function buildNotificationEmail(items: CancelItem[]): {
  subject: string;
  html: string;
  text: string;
} {
  const appUrl = getAppUrl();
  const count = items.length;
  const firstName = items[0]?.service_name ?? "";

  const subject =
    count === 1
      ? `【あとで解約】「${firstName}」の解約予定日が近づいています`
      : `【あとで解約】${count}件の解約予定日が近づいています`;

  const blocks = items.map((i) => itemBlockHtml(i, appUrl)).join("");

  const html = `
  <div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;padding:24px 16px;">
    <p style="font-size:20px;font-weight:800;color:#f54a00;margin:0 0 4px;">あとで解約</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      解約予定日が近づいているサービスがあります。<br/>
      解約忘れによる課金を防ぐため、内容をご確認ください。
    </p>
    ${blocks}
    <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.6;">
      このメールは「あとで解約」の通知設定がONのため送信されています。<br/>
      通知を停止するには <a href="${appUrl}/settings" style="color:#9ca3af;">設定ページ</a> から通知をOFFにしてください。
    </p>
  </div>`;

  const text =
    `あとで解約\n\n解約予定日が近づいているサービスがあります。\n\n` +
    items
      .map((i) => {
        const lines = [
          `■ ${i.service_name}`,
          `  解約予定日: ${formatDateJa(i.cancel_due_date)}`,
        ];
        if (i.price != null) lines.push(`  金額: ¥${i.price.toLocaleString()}/月`);
        if (i.cancel_url) lines.push(`  解約URL: ${i.cancel_url}`);
        if (i.memo) lines.push(`  メモ: ${i.memo}`);
        lines.push(`  詳細: ${appUrl}/items/${i.id}`);
        return lines.join("\n");
      })
      .join("\n\n") +
    `\n\n通知の停止は ${appUrl}/settings から。`;

  return { subject, html, text };
}
