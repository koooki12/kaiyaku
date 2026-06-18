import Link from "next/link";
import { verifyEmailByToken } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = token ? await verifyEmailByToken(token) : null;
  const ok = !!user;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="text-5xl">{ok ? "✅" : "⚠️"}</div>
      <h1 className="mt-5 text-2xl font-extrabold text-gray-900">
        {ok ? "確認が完了しました" : "確認できませんでした"}
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
        {ok ? (
          <>
            メールアドレスの確認が完了しました。
            <br />
            これで解約予定日のメール通知を受け取れます。
          </>
        ) : (
          <>
            リンクが無効か、有効期限（24時間）が切れています。
            <br />
            設定ページから確認メールを再送してください。
          </>
        )}
      </p>

      <Link
        href={ok ? "/items" : "/settings"}
        className="mt-8 w-full max-w-xs rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99]"
      >
        {ok ? "一覧を見る" : "設定ページへ"}
      </Link>
    </main>
  );
}
