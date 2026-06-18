import { randomBytes } from "node:crypto";

/**
 * 推測困難なランダムトークンを生成する（64桁の16進数 = 256bit）。
 * メール確認・通知停止リンクに利用する。
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * メール確認トークンの有効期限（24時間後）を ISO 文字列で返す。
 */
export function verifyTokenExpiry(): string {
  return new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
}
