import Link from "next/link";
import { unsubscribeAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
}) {
  const { token, done, error } = await searchParams;

  // 停止完了
  if (done) {
    return (
      <Centered emoji="🔕" title="通知を停止しました">
        今後、解約予定日のメール通知は送信されません。
        <br />
        再開したい場合は、設定ページで通知をONに戻せます。
        <div className="mt-8">
          <Link
            href="/settings"
            className="inline-block rounded-xl border border-gray-300 px-6 py-3 text-base font-bold text-gray-700"
          >
            設定ページへ
          </Link>
        </div>
      </Centered>
    );
  }

  // トークン無効
  if (error || !token) {
    return (
      <Centered emoji="⚠️" title="処理できませんでした">
        リンクが無効です。
        <br />
        通知の停止は、設定ページからも行えます。
        <div className="mt-8">
          <Link
            href="/settings"
            className="inline-block rounded-xl border border-gray-300 px-6 py-3 text-base font-bold text-gray-700"
          >
            設定ページへ
          </Link>
        </div>
      </Centered>
    );
  }

  // 確認画面（ボタン押下=POSTで確定。メールの自動プリフェッチ誤作動を防ぐ）
  return (
    <Centered emoji="🔕" title="通知を停止しますか？">
      このメールアドレス宛の、解約予定日のメール通知を停止します。
      <form action={unsubscribeAction} className="mt-8 w-full max-w-xs">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99]"
        >
          通知を停止する
        </button>
      </form>
      <Link href="/items" className="mt-4 text-sm text-gray-400 underline">
        やめる
      </Link>
    </Centered>
  );
}

function Centered({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="text-5xl">{emoji}</div>
      <h1 className="mt-5 text-2xl font-extrabold text-gray-900">{title}</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
        {children}
      </p>
    </main>
  );
}
