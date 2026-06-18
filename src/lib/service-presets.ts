// 人気サービスのプリセット。/items/new の入力補助に使う。
// cancelUrl は各サービスの解約・契約管理ページの目安です（変わることがあります）。
// trialDays は無料体験の代表的な日数。null は「無料体験なし／不定」を表します。

export type ServicePreset = {
  name: string;
  category: string;
  cancelUrl: string;
  trialDays: number | null;
  memo: string;
};

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    name: "U-NEXT",
    category: "動画",
    cancelUrl: "https://video.unext.jp/account/cancel",
    trialDays: 31,
    memo: "31日間無料トライアル",
  },
  {
    name: "Amazon Prime",
    category: "動画",
    cancelUrl: "https://www.amazon.co.jp/gp/primecentral",
    trialDays: 30,
    memo: "30日間無料体験",
  },
  {
    name: "YouTube Premium",
    category: "動画",
    cancelUrl: "https://www.youtube.com/paid_memberships",
    trialDays: 30,
    memo: "初回1か月無料",
  },
  {
    name: "Netflix",
    category: "動画",
    cancelUrl: "https://www.netflix.com/cancelplan",
    trialDays: null,
    memo: "",
  },
  {
    name: "Spotify",
    category: "音楽",
    cancelUrl: "https://www.spotify.com/jp/account/subscription/",
    trialDays: 30,
    memo: "Premium 無料体験",
  },
  {
    name: "Apple Music",
    category: "音楽",
    cancelUrl: "https://music.apple.com/jp/settings",
    trialDays: 30,
    memo: "1か月無料",
  },
  {
    name: "DAZN",
    category: "動画",
    cancelUrl: "https://www.dazn.com/account",
    trialDays: null,
    memo: "",
  },
  {
    name: "DMM TV",
    category: "動画",
    cancelUrl: "https://www.dmm.com/my/-/subscription/",
    trialDays: 30,
    memo: "初回30日間無料",
  },
  {
    name: "Hulu",
    category: "動画",
    cancelUrl: "https://www.hulu.jp/account",
    trialDays: null,
    memo: "",
  },
  {
    name: "Disney+",
    category: "動画",
    cancelUrl: "https://www.disneyplus.com/account/subscription",
    trialDays: null,
    memo: "",
  },
  {
    name: "ChatGPT",
    category: "アプリ",
    cancelUrl: "https://chatgpt.com/#settings/Subscription",
    trialDays: null,
    memo: "ChatGPT Plus",
  },
  {
    name: "Claude",
    category: "アプリ",
    cancelUrl: "https://claude.ai/settings/billing",
    trialDays: null,
    memo: "Claude Pro",
  },
  {
    name: "Gemini",
    category: "アプリ",
    cancelUrl: "https://one.google.com/u/0/explore-plan",
    trialDays: 30,
    memo: "Google One AI プレミアム（Gemini Advanced）",
  },
  {
    name: "Canva",
    category: "アプリ",
    cancelUrl: "https://www.canva.com/settings/billing-and-teams",
    trialDays: 30,
    memo: "Canva Pro 30日間無料",
  },
  {
    name: "Adobe",
    category: "アプリ",
    cancelUrl: "https://account.adobe.com/plans",
    trialDays: 7,
    memo: "7日間無料体験",
  },
  {
    name: "Notion",
    category: "アプリ",
    cancelUrl: "https://www.notion.so/my-account",
    trialDays: null,
    memo: "",
  },
  {
    name: "Duolingo",
    category: "学習",
    cancelUrl: "https://www.duolingo.com/settings/super",
    trialDays: 14,
    memo: "Super Duolingo 14日間無料",
  },
];
