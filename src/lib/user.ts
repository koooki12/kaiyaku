import { cookies } from "next/headers";
import { getSupabaseAdmin, type AppUser } from "./supabase";

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
 * メールアドレスからユーザーを作成（or 取得）し、cookie に保存する。
 * MVP の簡易ユーザー作成。
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

  // 無ければ作成
  if (!user) {
    const { data: created, error } = await supabase
      .from("users")
      .insert({ email: normalized })
      .select("*")
      .single();

    if (error || !created) {
      throw new Error("ユーザーの作成に失敗しました: " + (error?.message ?? ""));
    }
    user = created as AppUser;
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
 * cookie を削除してログアウトする。
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
