"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getCurrentUserId,
  getCurrentUser,
  signInWithEmail,
  signOut,
} from "@/lib/user";
import { getResend, getFromAddress, buildTestEmail } from "@/lib/email";

/**
 * ランディングページからの簡易ユーザー作成。
 */
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/?error=" + encodeURIComponent("メールアドレスを入力してください"));
  }
  await signInWithEmail(email);
  redirect("/items");
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}

/**
 * 解約予定アイテムを新規作成する。
 */
export async function createItemAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const serviceName = String(formData.get("service_name") ?? "").trim();
  const cancelDueDate = String(formData.get("cancel_due_date") ?? "").trim();

  if (!serviceName || !cancelDueDate) {
    redirect(
      "/items/new?error=" +
        encodeURIComponent("サービス名と解約予定日は必須です")
    );
  }

  const priceRaw = String(formData.get("price") ?? "").trim();
  const notifyDate = String(formData.get("notify_date") ?? "").trim();
  const cancelUrl = String(formData.get("cancel_url") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("cancel_items").insert({
    user_id: userId,
    service_name: serviceName,
    price: priceRaw ? Number(priceRaw) : null,
    cancel_due_date: cancelDueDate,
    notify_date: notifyDate || null,
    cancel_url: cancelUrl || null,
    memo: memo || null,
    category: category || null,
  });

  if (error) {
    redirect("/items/new?error=" + encodeURIComponent("保存に失敗しました"));
  }

  revalidatePath("/items");
  redirect("/items");
}

/**
 * アイテムを解約済みにする。
 */
export async function markCancelledAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase
    .from("cancel_items")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
}

/**
 * 解約済みを取り消して再びアクティブに戻す。
 */
export async function markActiveAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase
    .from("cancel_items")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
}

/**
 * メモを更新する。
 */
export async function updateMemoAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const id = String(formData.get("id") ?? "");
  const memo = String(formData.get("memo") ?? "").trim();
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase
    .from("cancel_items")
    .update({ memo: memo || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath(`/items/${id}`);
}

/**
 * アイテムを削除する。
 */
export async function deleteItemAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase
    .from("cancel_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/items");
  redirect("/items");
}

/**
 * 通知設定（メールアドレス・通知ON/OFF）を更新する。
 */
export async function updateSettingsAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const notifyEnabled = formData.get("notify_enabled") === "on";

  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = { notify_enabled: notifyEnabled };
  if (email) update.email = email;

  await supabase.from("users").update(update).eq("id", userId);

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

/**
 * ログイン中ユーザーのメールアドレス宛にテスト通知を送る。
 * 本番の Resend 設定が正しいかを確認するための機能。
 */
export async function sendTestEmailAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  if (!user.email) {
    redirect(
      "/settings?notice=" +
        encodeURIComponent("メールアドレスを登録してから送信してください")
    );
  }

  let failed = false;
  try {
    const resend = getResend();
    const { subject, html, text } = buildTestEmail();
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject,
      html,
      text,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    failed = true;
    // 詳細はサーバーログにのみ出力（画面には出さない）
    console.error("[sendTestEmail] failed:", e instanceof Error ? e.message : e);
  }

  if (failed) {
    redirect(
      "/settings?notice=" +
        encodeURIComponent("テスト送信に失敗しました。Resend の設定を確認してください")
    );
  }

  redirect(
    "/settings?notice=" +
      encodeURIComponent(`${user.email} 宛にテスト通知を送信しました`)
  );
}
