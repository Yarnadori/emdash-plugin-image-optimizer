# emdash-plugin-image-optimizer

English | [日本語](./README.ja.md)

A plugin for [EmDash](https://github.com/emdash-cms/emdash) that converts uploaded JPEG / PNG images to **WebP** or **AVIF**. It **keeps the original image** and saves the converted image as a new media item.

## Features

- **Convert on upload**: when a JPEG / PNG is uploaded, it is converted in the background without slowing down the upload response.
- **Bulk-convert existing images**: a button on the admin page converts the whole media library in batches. If your server runs plugin cron, the job advances every minute on its own; you can also click “Run next batch”.
- **Choose WebP or AVIF**: switch on the admin page or in the settings form. Conversions are tracked per format, so you can produce both WebP and AVIF copies.
- **Originals are never modified**: the converted image is added as a separate media item, e.g. `photo.jpg` → `photo.webp`. Alt text, caption, and focal point are copied over.
- **No duplicates**: the same image is never converted twice to the same format. Failed images are retried on the next bulk run.
- **Skips conversions that are larger than the original** (configurable).
- A conversion history with size savings is shown on the admin page.
- The admin page is available in 10 languages (see [Languages](#languages)).

GIFs are not converted because their animation would be lost. Images larger than 16 MB are skipped (a limit of the EmDash plugin API).

## Requirements

- EmDash 1.2.0 or later
- One of these encoders:
  - **Cloudflare Workers**: the [Cloudflare Images binding](https://developers.cloudflare.com/images/transform-images/bindings/)
  - **Node.js**: [sharp](https://sharp.pixelplumbing.com/)

## Installation

```bash
pnpm add emdash-plugin-image-optimizer
# On Node.js
pnpm add sharp
```

Register it in `astro.config.mjs`:

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

### On Cloudflare Workers

Add an Images binding to `wrangler.jsonc`:

```jsonc
{
  "images": { "binding": "IMAGES" },
}
```

To use a different binding name, pass it as `imageOptimizerPlugin({ imagesBinding: "MY_IMAGES" })`. Cloudflare Images transformations are billed according to its [pricing](https://developers.cloudflare.com/images/pricing/) (a free tier is included).

## Usage

An **Image Optimizer** page is added to the admin sidebar.

| Setting                                   | Description                                 | Default |
| ----------------------------------------- | ------------------------------------------- | ------- |
| Output format                             | WebP or AVIF                                | WebP    |
| Convert on upload                         | When off, only bulk conversion runs         | On      |
| Quality                                   | 1–100                                       | 80      |
| Skip conversions larger than the original |                                             | On      |
| Bulk batch size                           | Media items checked per batch               | 5       |
| Encoder                                   | Auto / Cloudflare Images / sharp            | Auto    |

Advanced settings such as batch size and encoder can also be changed from the settings button on the plugin's card in **Plugins**.

Clicking “Start converting to …” processes the first batch right away; the rest continues in the background through plugin cron. Use “Refresh progress” to check progress and “Stop” to stop at any time. If requests time out, lower the batch size (AVIF in particular takes longer to encode).

### Languages

The admin page follows the language of the EmDash admin:

English / 日本語 / 简体中文 / 繁體中文 / 한국어 / Español / Français / Deutsch / Português (Brasil) / Italiano

Other languages fall back to English. The sidebar label and the field labels in the settings form opened from the plugin card are always English, because EmDash does not support translating them.

### API

A route converts a single media item (requires the `plugins:manage` permission):

```http
POST /_emdash/api/plugins/image-convert/convert
Content-Type: application/json
X-EmDash-Request: 1

{ "mediaId": "01ABC...", "format": "avif" }
```

When `format` is omitted, the configured format is used.

## Capabilities

| Capability             | Used for                                      |
| ---------------------- | --------------------------------------------- |
| `media:read`           | Listing media and reading media info          |
| `media:bytes:read`     | Reading the original image bytes             |
| `media:write`          | Uploading the converted image                 |
| `media:metadata:write` | Copying alt text, caption, and focal point    |

The plugin never modifies or deletes original images, and makes no external network requests.

### Why a native plugin

EmDash sandboxed plugins (the registry format) have a short CPU time limit and cannot load WebAssembly or native modules, so they cannot encode images. This plugin is therefore a **native plugin** distributed through npm. Native plugins run with the same authority as your site; capability declarations describe the scope of the `ctx` API and are not an isolation boundary.

## Data

- Conversion records: plugin storage `conversions` (key: `<source media ID>:<format>`)
- Bulk job progress: plugin KV `bulk:state`

Converted media stays in the media library after the plugin is uninstalled.

## Development

```bash
pnpm install
pnpm test        # vitest (runs real conversions with sharp)
pnpm typecheck
pnpm build
```

## License

MIT
