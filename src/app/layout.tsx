import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "あとで解約 | 無料体験の解約忘れを防ぐ",
  description:
    "無料体験・初月無料・一時契約の解約忘れを防ぐシンプルな管理アプリ。解約予定日を登録して、解約忘れによる無駄な課金を防ぎましょう。",
  applicationName: "あとで解約",
  // iOS でホーム画面に追加したときに standalone（アプリらしい）表示にする
  appleWebApp: {
    capable: true,
    title: "あとで解約",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    // iOS Safari の standalone 表示を確実にする（Next は標準名のみ出力するため明示）
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f54a00",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen overflow-x-hidden bg-white text-gray-800">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
