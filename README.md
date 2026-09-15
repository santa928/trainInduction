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
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm ci
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

置いたレールは、電車が通る前ならタップして候補欄に戻し、置き直せます。通過後のレールは固定されます。使用済み候補の場所には「おいたよ」が残り、ほかの候補の位置が変わらないようにしています。クリア済みコースには「クリア！」を表示します。

画面下の案内は「レールをえらんでね」から、選択後に「あなをタップしてね」へ変わります。横長の画面では盤面と操作欄を左右に配置します。画面が小さい場合はスクロールして操作でき、結果画面も全ボタンに移動できます。

## 再構築の記録

[要件・現状分析・受け入れ条件](docs/rebuild-assessment.md)に、維持する体験と修正範囲を記載しています。E2Eには、実時間のクリアと保存、進捗fixtureで開いた後半コースの寸法・候補位置、横向きの結果画面を含みます。fixtureによる表示確認は、全コースの実プレイ完走とは区別します。

## GitHub Pages 向け静的ビルド

このプロジェクトは Vite の `base` を `/trainInduction/` に設定しているため、GitHub Pages のプロジェクトページ配下で配信する前提の静的ビルドになります。

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm run build
```

ビルド成果物は `dist/` に出力されます。GitHub Pages では、この `dist/` の中身を配布物として公開します。
