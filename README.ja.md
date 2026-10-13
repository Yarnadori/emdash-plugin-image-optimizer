# emdash-plugin-image-optimizer

[English](./README.md) | 日本語

[EmDash](https://github.com/emdash-cms/emdash) 用のプラグインです。アップロードした JPEG / PNG 画像を **WebP** または **AVIF** に変換し、**元の画像はそのまま残して**、変換後の画像を新しいメディアとして保存します。

## 機能

- **アップロード時の自動変換**：JPEG / PNG をアップロードすると、レスポンスを待たせずにバックグラウンドで変換します。
- **アップロード済み画像の一括変換**：管理画面のボタンから、メディアライブラリ全体をバッチ単位で変換します。サーバーで cron が動いていれば 1 分ごとに自動で進み、手動で「次のバッチを実行」することもできます。
- **WebP / AVIF を選択可能**：管理画面または設定画面で切り替えます。形式ごとに変換を記録するので、WebP と AVIF の両方を作ることもできます。
- **元画像は変更しない**：変換後の画像は `photo.jpg` → `photo.webp` のように別メディアとして追加されます。代替テキスト・キャプション・フォーカルポイントも引き継ぎます。
- **重複しない**：同じ画像を同じ形式で二度変換しません。失敗した画像は次回の一括変換で再試行します。
- **元より大きくなる場合は保存しない**（設定で変更可）。
- 変換履歴（サイズの削減率つき）を管理画面で確認できます。

GIF はアニメーションが失われるため対象外です。16 MB を超える画像はスキップします（EmDash のプラグイン API の上限）。

## 動作要件

- EmDash 1.2.0 以降
- 以下のどちらかのエンコーダー
  - **Cloudflare Workers**：[Cloudflare Images バインディング](https://developers.cloudflare.com/images/transform-images/bindings/)
  - **Node.js**：[sharp](https://sharp.pixelplumbing.com/)

## インストール

```bash
pnpm add emdash-plugin-image-optimizer
# Node.js で動かす場合
pnpm add sharp
```

`astro.config.mjs` に登録します。

```js
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { imageOptimizerPlugin } from "emdash-plugin-image-optimizer";

export default defineConfig({
  integrations: [
    emdash({
      // ...
      plugins: [imageOptimizerPlugin()],
    }),
  ],
});
```

### Cloudflare Workers の場合

`wrangler.jsonc` に Images バインディングを追加します。

```jsonc
{
  "images": { "binding": "IMAGES" },
}
```

バインディング名を変える場合は `imageOptimizerPlugin({ imagesBinding: "MY_IMAGES" })` のように指定します。Cloudflare Images の変換は[料金体系](https://developers.cloudflare.com/images/pricing/)に従って課金されます（無料枠あり）。

## 使い方

管理画面のサイドバーに **Image Optimizer** ページが追加されます。

| 項目                             | 説明                             | 既定値 |
| -------------------------------- | -------------------------------- | ------ |
| 変換形式                         | WebP または AVIF                 | WebP   |
| アップロード時に自動変換         | オフにすると一括変換のみ         | オン   |
| 品質                             | 1〜100                           | 80     |
| 元より大きくなる場合は保存しない |                                  | オン   |
| 一括変換のバッチサイズ           | 1 バッチで確認するメディア数     | 5      |
| エンコーダー                     | 自動 / Cloudflare Images / sharp | 自動   |

バッチサイズ・エンコーダーなどの詳細設定は、**プラグイン** 画面のプラグインカードにある設定ボタンからも変更できます。

一括変換は「一括変換を開始」を押すと最初のバッチをすぐ処理し、残りはバックグラウンド（プラグイン cron）で進みます。進捗は「進捗を更新」で確認でき、「停止」でいつでも止められます。リクエストがタイムアウトする場合はバッチサイズを小さくしてください（特に AVIF は変換に時間がかかります）。

### 対応言語

管理ページは emdash 管理画面の表示言語に合わせて切り替わります。

English / 日本語 / 简体中文 / 繁體中文 / 한국어 / Español / Français / Deutsch / Português (Brasil) / Italiano

それ以外の言語では英語で表示します。サイドバーのページ名と、プラグインカードから開く設定フォームの項目名は、emdash の仕様上翻訳できないため英語で固定です。

### API

単一メディアを変換するルートもあります（`plugins:manage` 権限が必要）。

```http
POST /_emdash/api/plugins/image-convert/convert
Content-Type: application/json
X-EmDash-Request: 1

{ "mediaId": "01ABC...", "format": "avif" }
```

`format` を省略すると設定の形式を使います。

## 権限（capabilities）

| Capability             | 用途                                                   |
| ---------------------- | ------------------------------------------------------ |
| `media:read`           | メディア一覧・情報の取得                               |
| `media:bytes:read`     | 元画像のバイト列の読み込み                             |
| `media:write`          | 変換後の画像のアップロード                             |
| `media:metadata:write` | 代替テキスト・キャプション・フォーカルポイントのコピー |

元画像の変更・削除は行いません。外部ネットワークにはアクセスしません。

### ネイティブプラグインである理由

EmDash のサンドボックスプラグイン（レジストリ配布形式）は、CPU 時間の上限が短く、WebAssembly やネイティブモジュールを読み込めないため、画像のエンコードができません。そのため本プラグインは npm で配布する**ネイティブプラグイン**として実装しています。ネイティブプラグインはサイトと同じ権限で動作します。capabilities の宣言は `ctx` API の範囲を示すもので、隔離境界ではありません。

## データ

- 変換記録：プラグインストレージ `conversions`（キー：`<元メディアID>:<形式>`）
- 一括変換の進捗：プラグイン KV `bulk:state`

プラグインをアンインストールしても、変換後のメディアはメディアライブラリに残ります。

## 開発

```bash
pnpm install
pnpm test        # vitest（sharp で実際に変換します）
pnpm typecheck
pnpm build
```

## ライセンス

MIT
