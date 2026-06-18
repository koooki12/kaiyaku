import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { resendVerificationAction, signOutAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await getCurrentUser();
  // 未ログインはトップへ。確認済みなら本サービス（一覧）へ。
  if (!user) redirect("/");
  if (user.email_verified) redirect("/items");

  const { notice } = await searchParams;

  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="text-5xl">📩</div>
        <h1 className="mt-5 text-2xl font-extrabold text-gray-900">
          確認メールを送りました
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
          <span className="font-semibold text-gray-900">{user.email}</span>
          <br />
          宛にメールを送信しました。
          <br />
          メール内の「メールアドレスを確認する」ボタンを開くと、利用を開始できます。
        </p>

        {notice && (
          <p className="mt-5 w-full max-w-xs rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {notice}
          </p>
        )}

        {/* 迷惑メール対策の案内 */}
        <div className="mt-6 w-full max-w-xs rounded-xl bg-orange-50 px-4 py-3 text-left text-xs leading-relaxed text-brand">
          📥 メールが見つからないときは、<strong>迷惑メール / プロモーション</strong>
          フォルダもご確認ください。
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {/* 再送 */}
        <form action={resendVerificationAction}>
          <input type="hidden" name="redirect_to" value="/check-email" />
          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] active:bg-brand-dark"
          >
            確認メールを再送する
          </button>
        </form>

        <p className="text-center text-xs leading-relaxed text-gray-400">
          メールアドレスを間違えた場合は{" "}
          <Link href="/settings" className="underline">
            設定
          </Link>{" "}
          から変更できます。
        </p>

        {/* 別アカウントでやり直す */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full py-2 text-sm font-medium text-gray-400 underline"
          >
            別のメールアドレスで登録し直す
          </button>
        </form>
      </div>
    </main>
  );
}
