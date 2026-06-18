"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin, type AppUser } from "@/lib/supabase";
import {
  getCurrentUserId,
  getCurrentUser,
  signInWithEmail,
  signOut,
  sendVerificationEmail,
  unsubscribeByToken,
  deleteUserAccount,
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
  const user = await signInWithEmail(email);
  // 未確認なら「確認待ち」ページへ。確認済み（再ログイン）なら一覧へ。
  redirect(user.email_verified ? "/items" : "/check-email");
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
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const notifyEnabled = formData.get("notify_enabled") === "on";

  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = { notify_enabled: notifyEnabled };

  // メールアドレスが変更された場合は、本人確認をやり直す
  const emailChanged = !!email && email !== user.email;
  if (email) update.email = email;
  if (emailChanged) {
    update.email_verified = false;
    update.verify_token = null;
    update.verify_token_expires_at = null;
  }

  await supabase.from("users").update(update).eq("id", user.id);

  // 新しいメールアドレス宛に確認メールを送る
  if (emailChanged) {
    const { data: refreshed } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (refreshed) {
      await sendVerificationEmail(refreshed as AppUser);
    }
    redirect(
      "/settings?notice=" +
        encodeURIComponent(
          `${email} に確認メールを送信しました。リンクを開くと通知が有効になります`
        )
    );
  }

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

  // 本人確認を回避した迷惑メール送信を防ぐため、確認済みのみ送信可
  if (!user.email_verified) {
    redirect(
      "/settings?notice=" +
        encodeURIComponent(
          "テスト送信にはメールアドレスの確認が必要です。確認メールのリンクを開いてください"
        )
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

/**
 * 確認メールを再送する。
 * redirect_to で戻り先を切り替える（/check-email または /settings）。
 */
export async function resendVerificationAction(formData: FormData) {
  const requested = String(formData.get("redirect_to") ?? "/settings");
  const base = requested === "/check-email" ? "/check-email" : "/settings";

  const user = await getCurrentUser();
  if (!user) redirect("/");

  if (!user.email) {
    redirect(base + "?notice=" + encodeURIComponent("メールアドレスを登録してください"));
  }
  if (user.email_verified) {
    redirect(base + "?notice=" + encodeURIComponent("すでに確認済みです"));
  }

  const ok = await sendVerificationEmail(user);
  redirect(
    base +
      "?notice=" +
      encodeURIComponent(
        ok
          ? `${user.email} に確認メールを再送しました。メール内のリンクを開いてください`
          : "確認メールの送信に失敗しました。メールアドレスを確認してください"
      )
  );
}

/**
 * 通知停止トークンで通知をOFFにする（メール内リンクからのPOST）。
 */
export async function unsubscribeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const result = await unsubscribeByToken(token);
  if (!result) {
    redirect("/unsubscribe?error=1");
  }
  redirect("/unsubscribe?done=1");
}

/**
 * ログイン中ユーザーのアカウントと全データを削除する。
 */
export async function deleteAccountAction(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  // 誤操作防止: 確認チェックを必須にする
  if (formData.get("confirm") !== "delete") {
    redirect(
      "/settings/delete?error=" +
        encodeURIComponent("確認のチェックを入れてください")
    );
  }

  await deleteUserAccount(userId);
  redirect("/?deleted=1");
}
