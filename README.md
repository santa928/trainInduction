# レールをつなごう！

3歳児向けの電車誘導ブラウザゲームです。欠けた線路に正しいレールピースを置き、自動で走る電車をゴール駅まで導きます。

## 技術構成

- React
- TypeScript
- Vite
- Vitest
- Playwright
- GitHub Pages 向け静的ビルド

## ローカル開発

ホスト環境を汚さないため、Node.js の実行は Docker コンテナ内で行います。`npm`、`npx`、`pnpm`、`yarn` はホストで実行しないでください。

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm install
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app -p 5173:5173 node:22-bookworm npm run dev
```

開発サーバーは `http://localhost:5173/trainInduction/` で確認できます。

## 検証

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm run build
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm test
docker run --rm -it -e npm_config_cache=/tmp/.npm -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.59.1-noble npm run test:e2e
```

`npm test` は Vitest の単体・コンポーネントテスト用です。`vitest.config.ts` で `tests/e2e/**` を除外しているため、E2E テストは `npm run test:e2e` で実行します。

Playwright の Docker image は、`package-lock.json` で解決されている `@playwright/test` のバージョンと合わせます。現在は `1.59.1` のため、`mcr.microsoft.com/playwright:v1.59.1-noble` を使います。

## 操作

1. 電車を選びます。
2. 解放済みのコースを選びます。
3. 下のレールピースを選び、穴になっている線路へ置きます。
4. 電車が正しい線路を通るとゴールへ進みます。
5. クリアすると次のコースが解放されます。

## GitHub Pages 向け静的ビルド

このプロジェクトは Vite の `base` を `/trainInduction/` に設定しているため、GitHub Pages のプロジェクトページ配下で配信する前提の静的ビルドになります。

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm run build
```

ビルド成果物は `dist/` に出力されます。
