import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー | あとで解約",
};

const UPDATED = "2026年6月18日";

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8">
      <Link href="/" className="text-sm text-brand">
        ‹ トップへ
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
        プライバシーポリシー
      </h1>
      <p className="mt-1 text-xs text-gray-400">最終更新日: {UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          「あとで解約」（以下「本サービス」）は、利用者のプライバシーを尊重し、
          個人情報を適切に取り扱います。本ポリシーは、本サービスが取得する情報と
          その利用方法について説明します。
        </p>

        <Section title="1. 取得する情報">
          <ul className="list-disc space-y-1 pl-5">
            <li>メールアドレス（通知の送信と本人確認のため）</li>
            <li>
              利用者が登録した解約予定の情報（サービス名・金額・解約予定日・通知日・
              解約URL・メモ・カテゴリ）
            </li>
            <li>通知設定（通知のON/OFF、本人確認の状態）</li>
          </ul>
          <p className="mt-2">
            本サービスはパスワードを取得せず、メールアドレスによる簡易的な利用者識別を行います。
          </p>
        </Section>

        <Section title="2. 利用目的">
          <ul className="list-disc space-y-1 pl-5">
            <li>解約予定日が近づいた際のメール通知の送信</li>
            <li>メールアドレスの本人確認（同意のない送信を防ぐため）</li>
            <li>本サービスの提供・維持・改善</li>
          </ul>
        </Section>

        <Section title="3. 第三者サービスの利用">
          <p>
            本サービスは、提供のために以下の外部サービスを利用します。各サービスの
            プライバシーポリシーが適用されます。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Vercel（アプリケーションのホスティング）</li>
            <li>Supabase（データベース）</li>
            <li>Resend（メール送信）</li>
          </ul>
          <p className="mt-2">
            これらの目的以外で、利用者の個人情報を第三者に販売・提供することはありません。
          </p>
        </Section>

        <Section title="4. メール通知と配信停止">
          <p>
            メール通知は、本人確認が完了し、かつ通知設定がONの場合にのみ送信されます。
            通知メールに記載された「通知を停止」リンク、または設定ページからいつでも
            配信を停止できます。
          </p>
        </Section>

        <Section title="5. データの保存期間と削除">
          <p>
            利用者のデータは、利用者が削除するまで保存されます。設定ページの
            「アカウントとデータを削除」から、登録情報と解約予定をすべて完全に削除できます。
            削除されたデータは復元できません。
          </p>
        </Section>

        <Section title="6. お問い合わせ">
          <p>
            本ポリシーに関するお問い合わせは、運営者までご連絡ください。
            <br />
            連絡先: <span className="text-gray-400">（運営者の連絡先メールアドレスを記載）</span>
          </p>
        </Section>

        <Section title="7. 改定">
          <p>
            本ポリシーは、必要に応じて改定されることがあります。重要な変更がある場合は、
            本サービス上でお知らせします。
          </p>
        </Section>
      </div>

      <div className="mt-10 flex justify-center gap-4 text-xs text-gray-400">
        <Link href="/terms" className="underline">
          利用規約
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
