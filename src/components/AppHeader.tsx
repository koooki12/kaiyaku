import Link from "next/link";

export function AppHeader({
  title,
  back,
}: {
  title: string;
  back?: { href: string; label?: string };
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        {back ? (
          <Link
            href={back.href}
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label={back.label ?? "戻る"}
          >
            <span className="text-xl">‹</span>
          </Link>
        ) : (
          <Link href="/items" className="text-lg font-bold text-brand">
            あとで解約
          </Link>
        )}
        {back && <span className="text-base font-semibold">{title}</span>}
      </div>
      <Link
        href="/settings"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        aria-label="設定"
      >
        ⚙️
      </Link>
    </header>
  );
}
