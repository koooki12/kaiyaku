import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "./actions";
import { getCurrentUserId } from "@/lib/user";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  // すでにログイン済みなら一覧へ
  const userId = await getCurrentUserId();
  if (userId) redirect("/items");

  const { error, deleted } = await searchParams;

  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-14">
      <div className="flex flex-1 flex-col items-center text-center">
        {deleted && (
          <p className="mb-6 w-full rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600">
            アカウントとデータを削除しました。ご利用ありがとうございました。
          </p>
        )}
        <span className="mb-6 inline-block rounded-full bg-orange-50 px-4 py-1 text-sm font-medium text-brand">
          解約忘れ、もうしない。
        </span>

        <h1 className="text-3xl font-extrabold leading-snug text-gray-900">
          無料体験、
          <br />
          <span className="text-brand">解約忘れてない？</span>
        </h1>

        <p className="mt-5 max-w-xs text-base leading-relaxed text-gray-600">
          初月無料・お試し契約の解約予定日を登録するだけ。
          「気づいたら課金されてた」を、あとで解約がなくします。
        </p>

        <div className="mt-10 w-full max-w-xs space-y-3 text-left">
          <FeatureRow emoji="🗓" text="解約予定日をまとめて管理" />
          <FeatureRow emoji="⚠️" text="解約日が近いものが一目でわかる" />
          <FeatureRow emoji="⚡️" text="3タップで登録、すぐ終わる" />
        </div>
      </div>

      {/* メールだけの簡易登録 */}
      <div className="mt-10">
        <form action={signInAction} className="space-y-3">
          <input
            type="email"
            name="email"
            required
            inputMode="email"
            autoComplete="email"
            placeholder="メールアドレスを入力"
            className="w-full rounded-xl border border-gray-300 px-4 py-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-orange-100"
          />
          {error && (
            <p className="text-sm font-medium text-red-600">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] active:bg-brand-dark"
          >
            登録する
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-gray-400">
          パスワード不要。確認メールのリンクを開くと通知が有効になります。
        </p>
        <p className="mt-3 text-center text-xs leading-relaxed text-gray-400">
          登録すると
          <Link href="/terms" className="underline">
            利用規約
          </Link>
          ・
          <Link href="/privacy" className="underline">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>
        <p className="mt-4 text-center text-sm">
          <Link href="/items" className="text-gray-400 underline">
            すでに登録済みの方
          </Link>
        </p>
      </div>
    </main>
  );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-xl">{emoji}</span>
      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  );
}
