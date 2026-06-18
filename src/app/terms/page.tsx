import Link from "next/link";

export const metadata = {
  title: "利用規約 | あとで解約",
};

const UPDATED = "2026年6月18日";

export default function TermsPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8">
      <Link href="/" className="text-sm text-brand">
        ‹ トップへ
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold text-gray-900">利用規約</h1>
      <p className="mt-1 text-xs text-gray-400">最終更新日: {UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          本利用規約（以下「本規約」）は、「あとで解約」（以下「本サービス」）の
          利用条件を定めるものです。利用者は、本サービスを利用することで本規約に
          同意したものとみなされます。
        </p>

        <Section title="1. サービス内容">
          <p>
            本サービスは、利用者が登録した解約予定日などをもとに、解約忘れを防ぐための
            リマインドメールを送信する管理ツールです。
          </p>
        </Section>

        <Section title="2. 利用者の責任">
          <ul className="list-disc space-y-1 pl-5">
            <li>登録する情報は、利用者自身が正確に入力するものとします。</li>
            <li>
              自分が管理権限を持たない第三者のメールアドレスを登録してはいけません。
            </li>
            <li>
              実際の解約手続きは利用者自身が行う必要があります。通知はあくまで
              リマインドであり、解約を代行するものではありません。
            </li>
          </ul>
        </Section>

        <Section title="3. 免責事項">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              本サービスは、通知の到達やタイミングを保証しません。メールの遅延・不達、
              システム障害などにより通知が届かない場合があります。
            </li>
            <li>
              解約忘れや、それに伴う課金・損害について、本サービスは一切の責任を
              負いません。最終的な解約管理は利用者の責任で行ってください。
            </li>
            <li>
              本サービスは予告なく内容の変更・中断・終了をすることがあります。
            </li>
          </ul>
        </Section>

        <Section title="4. 禁止事項">
          <p>利用者は、以下の行為を行ってはいけません。</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>他者へのなりすまし、迷惑メールの送信を目的とした利用</li>
            <li>本サービスへの不正アクセスや、運営を妨害する行為</li>
            <li>法令または公序良俗に反する行為</li>
          </ul>
        </Section>

        <Section title="5. データの削除">
          <p>
            利用者は、設定ページからいつでもアカウントと登録データを削除できます。
          </p>
        </Section>

        <Section title="6. 規約の変更">
          <p>
            本規約は、必要に応じて変更されることがあります。変更後に本サービスを
            利用した場合、変更後の規約に同意したものとみなされます。
          </p>
        </Section>

        <Section title="7. お問い合わせ">
          <p>
            本規約に関するお問い合わせは、運営者までご連絡ください。
            <br />
            連絡先: <span className="text-gray-400">（運営者の連絡先メールアドレスを記載）</span>
          </p>
        </Section>
      </div>

      <div className="mt-10 flex justify-center gap-4 text-xs text-gray-400">
        <Link href="/privacy" className="underline">
          プライバシーポリシー
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
