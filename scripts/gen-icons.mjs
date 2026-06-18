// PWA / favicon 用アイコンを生成するワンショットスクリプト。
// 生成物（PNG）はリポジトリにコミットするため、通常のビルドでは sharp は不要。
//   実行: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BRAND = "#f54a00";

// 角丸（通常アイコン用）: ブランド色の角丸正方形＋白いチェック
const rounded = (size) => Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="${BRAND}"/>
  <path d="M150 266 L226 342 L368 184" fill="none" stroke="#ffffff"
        stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

// マスカブル用: OS側でマスクされるので全面ブランド色＋中央寄せ（セーフゾーン内）
const maskable = (size) => Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${BRAND}"/>
  <path d="M176 268 L242 334 L350 206" fill="none" stroke="#ffffff"
        stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

mkdirSync("public", { recursive: true });
mkdirSync("src/app", { recursive: true });

const tasks = [
  // Next.js の app/ アイコン規約（src/app 配下。自動で <link> 付与）
  [rounded(512), "src/app/icon.png", 512],
  [rounded(180), "src/app/apple-icon.png", 180],
  // manifest から参照する PWA アイコン
  [rounded(192), "public/icon-192.png", 192],
  [rounded(512), "public/icon-512.png", 512],
  [maskable(512), "public/icon-maskable-512.png", 512],
];

for (const [svg, out, size] of tasks) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("generated", out);
}
