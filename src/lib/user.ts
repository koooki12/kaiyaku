import { cookies } from "next/headers";
import { getSupabaseAdmin, type AppUser } from "./supabase";
import { generateToken, verifyTokenExpiry } from "./tokens";
import {
  getResend,
  getFromAddress,
  getAppUrl,
  buildVerificationEmail,
} from "./email";

const COOKIE_NAME = "atode_user_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

/**
 * 現在のユーザーIDを cookie から取得する（未ログインなら null）。
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * cookie のユーザーIDを元に users テーブルからユーザーを取得する。
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as AppUser;
}

/**
 * 確認メールを生成・送信する。
 * verify_token と有効期限を発行し、unsubscribe_token が無ければ併せて発行する。
 * 送信に失敗した場合は false を返す（トークンはDBに保存済み）。
 */
export async function sendVerificationEmail(user: AppUser): Promise<boolean> {
  if (!user.email) return false;

  const supabase = getSupabaseAdmin();
  const token = generateToken();
  const expiresAt = verifyTokenExpiry();
  const unsubscribeToken = user.unsubscribe_token ?? generateToken();

  await supabase
    .from("users")
    .update({
      verify_token: token,
      verify_token_expires_at: expiresAt,
      unsubscribe_token: unsubscribeToken,
    })
    .eq("id", user.id);

  const verifyUrl = `${getAppUrl()}/verify?token=${token}`;

  try {
    const resend = getResend();
    const { subject, html, text } = buildVerificationEmail(verifyUrl);
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject,
      html,
      text,
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (e) {
    console.error(
      "[sendVerificationEmail] failed:",
      e instanceof Error ? e.message : e
    );
    return false;
  }
}

/**
 * メールアドレスからユーザーを作成（or 取得）し、cookie に保存する。
 * 新規ユーザー、または未確認ユーザーには確認メールを送信する。
 */
export async function signInWithEmail(email: string): Promise<AppUser> {
  const supabase = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();

  // 既存ユーザーを探す
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  let user = existing as AppUser | null;

  // 無ければ作成（通知停止トークンも同時に発行）
  if (!user) {
    const { data: created, error } = await supabase
      .from("users")
      .insert({ email: normalized, unsubscribe_token: generateToken() })
      .select("*")
      .single();

    if (error || !created) {
      throw new Error("ユーザーの作成に失敗しました: " + (error?.message ?? ""));
    }
    user = created as AppUser;
  }

  // 未確認なら確認メールを送る（確認済みなら送らない）
  if (!user.email_verified) {
    await sendVerificationEmail(user);
  }

  // cookie に保存
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return user;
}

/**
 * 確認トークンを検証してメールアドレスを確認済みにする。
 * 成功なら確認済みユーザーを、失敗（無効・期限切れ）なら null を返す。
 */
export async function verifyEmailByToken(
  token: string
): Promise<AppUser | null> {
  if (!token) return null;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("verify_token", token)
    .maybeSingle();

  const user = data as AppUser | null;
  if (!user) return null;

  // 有効期限チェック
  if (
    !user.verify_token_expires_at ||
    new Date(user.verify_token_expires_at).getTime() < Date.now()
  ) {
    return null;
  }

  const { data: updated } = await supabase
    .from("users")
    .update({
      email_verified: true,
      verify_token: null,
      verify_token_expires_at: null,
    })
    .eq("id", user.id)
    .select("*")
    .single();

  return (updated as AppUser) ?? null;
}

/**
 * 通知停止トークンで通知をOFFにする。
 * 成功ならそのユーザーのメールアドレスを返す。
 */
export async function unsubscribeByToken(
  token: string
): Promise<{ email: string | null } | null> {
  if (!token) return null;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  const user = data as AppUser | null;
  if (!user) return null;

  await supabase
    .from("users")
    .update({ notify_enabled: false })
    .eq("id", user.id);

  return { email: user.email };
}

/**
 * ユーザーと、それに紐づく全データを削除する（cancel_items は ON DELETE CASCADE）。
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("users").delete().eq("id", userId);
  await signOut();
}

/**
 * cookie を削除してログアウトする。
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
