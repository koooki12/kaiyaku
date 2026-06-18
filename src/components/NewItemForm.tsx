"use client";

import { useMemo, useState } from "react";
import { createItemAction } from "@/app/actions";
import { SERVICE_PRESETS, type ServicePreset } from "@/lib/service-presets";

const CATEGORIES = ["動画", "音楽", "ゲーム", "アプリ", "ジム", "学習", "その他"];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function NewItemForm({ error }: { error?: string }) {
  const [serviceName, setServiceName] = useState("");
  const [cancelDueDate, setCancelDueDate] = useState("");
  const [notifyDate, setNotifyDate] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [cancelUrl, setCancelUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  // 入力中の文字でプリセットを絞り込む（空なら全件）
  const suggestions = useMemo(() => {
    const q = serviceName.trim().toLowerCase();
    if (!q) return SERVICE_PRESETS;
    // 完全一致（＝選択済み）のときは候補を出さない
    if (SERVICE_PRESETS.some((p) => p.name.toLowerCase() === q)) return [];
    return SERVICE_PRESETS.filter((p) => p.name.toLowerCase().includes(q));
  }, [serviceName]);

  function applyPreset(p: ServicePreset) {
    setServiceName(p.name);
    setCategory(p.category);
    setCancelUrl(p.cancelUrl);
    setMemo(p.memo);
    setDetailsOpen(true);

    // 無料体験日数があれば、今日から解約予定日・通知日の候補を入れる
    if (p.trialDays != null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(today);
      due.setDate(due.getDate() + p.trialDays);
      setCancelDueDate(ymd(due));

      // 通知は解約日の2日前（今日より前にならないように）
      const notify = new Date(due);
      notify.setDate(notify.getDate() - 2);
      setNotifyDate(ymd(notify < today ? today : notify));
    }
  }

  return (
    <>
      <main className="flex-1 px-4 pb-28 pt-4">
        <form
          id="new-item-form"
          action={createItemAction}
          className="space-y-5"
        >
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* サービス名（必須）＋プリセット候補 */}
          <div className="min-w-0">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              サービス名<span className="ml-1 text-brand">*</span>
            </span>
            <input
              type="text"
              name="service_name"
              required
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="例）Netflix"
              autoComplete="off"
              className="form-input"
            />

            {suggestions.length > 0 && (
              <div className="mt-2.5">
                <p className="mb-1.5 text-xs text-gray-400">
                  人気サービスから選ぶ
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition active:scale-95 hover:border-brand hover:text-brand"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Field label="解約予定日" required hint="無料期間が終わる日">
            <input
              type="date"
              name="cancel_due_date"
              required
              value={cancelDueDate}
              onChange={(e) => setCancelDueDate(e.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="通知日" required hint="この日にメールでお知らせします">
            <input
              type="date"
              name="notify_date"
              required
              value={notifyDate}
              onChange={(e) => setNotifyDate(e.target.value)}
              className="form-input"
            />
          </Field>

          {/* 任意項目 */}
          <details
            className="group rounded-xl border border-gray-200"
            open={detailsOpen}
            onToggle={(e) =>
              setDetailsOpen((e.target as HTMLDetailsElement).open)
            }
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
              ＋ 詳細を追加（任意）
              <span className="text-base text-gray-400 transition-transform group-open:rotate-180">
                ⌄
              </span>
            </summary>

            <div className="space-y-5 px-4 pb-5 pt-1">
              <Field label="月額（円）">
                <input
                  type="number"
                  name="price"
                  inputMode="numeric"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="990"
                  className="form-input"
                />
              </Field>

              <Field label="カテゴリ">
                <select
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                >
                  <option value="">選択しない</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="解約ページのURL" hint="あとで解約手続きをすぐ開けます">
                <input
                  type="url"
                  name="cancel_url"
                  inputMode="url"
                  value={cancelUrl}
                  onChange={(e) => setCancelUrl(e.target.value)}
                  placeholder="https://..."
                  className="form-input"
                />
              </Field>

              <Field label="メモ">
                <textarea
                  name="memo"
                  rows={3}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="解約方法の手順など"
                  className="form-input resize-none"
                />
              </Field>
            </div>
          </details>
        </form>
      </main>

      {/* 下部固定の保存ボタン */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          form="new-item-form"
          className="w-full rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] active:bg-brand-dark"
        >
          保存する
        </button>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </span>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
