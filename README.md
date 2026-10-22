# レールをつなごう！

幼児向けの、時間制限のある電車誘導ゲームです。形と向きの合うレールを選んで穴に置き、自動で走る電車を駅へ導きます。Three.jsによる玩具のジオラマと、タッチ中心の操作へ全面再構築しました。

## 遊び方

1. 好きな電車を選び、「あそぶ」から旅を選びます。3電車で共通の独自12ステージです。
2. 3秒の準備時間のあとに自動発車します。下の候補をタップしてから穴をタップします。ドラッグして置くこともできます。
3. 到達前なら、置いたレールをタップして戻したり、別の候補で上書きできます。
4. 未配置・誤配置の穴へ到達すると、電車が進入する手前で止まって失敗します。配置した時点で正解を教える表示はありません。
5. リトライは配置をすべて戻して最初から。候補の位置はリトライ中も固定です。正解順に並ぶ仕組みはありません。
6. 到着すると次のステージが解放されます。画面を離れると停止し、「つづける」で再開します。

音は右上のスピーカーで切り替えられます。音なしでも遊べます。端末の「動きを減らす」設定では煙・紙吹雪などの装飾を抑えます。WebGL2が使えない場合は再読込の案内を表示し、時計は開始しません。

## 実装

- React / TypeScript / Vite / Three.js。追加の実行時依存はThree.jsのみ。
- `src/railway/model.ts`: 接続、経路、走行、配置、失敗/クリアの純粋ロジック。
- `src/railway/stages.ts`: 独立した12経路と有限ピース。形→向き→連続する穴の読み取りへ進みます。
- `src/scene/`: 同じ経路関数を使うジオラマ描画。物理エンジン・外部3D素材・外部APIは使いません。
- `src/components/RailwayGame.tsx`: タップ/Pointer Events、停止、結果画面。
- `src/railway/progress.ts`: 新形式の保存と旧進捗の非破壊移行。

旧ロジック・画像・CSS・設計資料は比較と復元のため残しています。旧E2Eは `tests/legacy-e2e/` へ移し、現行画面のE2Eは `tests/e2e/rebuild-v2.spec.ts` です。

## 保存データ

旧キー `train-induction-progress` は削除・上書きしません。新キーは `train-induction-progress-v2` です。旧版の最高クリア難易度1〜5に応じて、新ステージ3/5/8/10/12までを解放します。旧クリア実績を別内容の新面のクリア認定には変換しません。保存不能・破損時でもプレイできます。

## ローカル開発

Node/npmはDockerコンテナ内で実行します。ホストでnpm/npx/pnpm/yarnを実行しないでください。Node 22.12以上（検証はNode 22）を使用します。

```bash
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app node:22-bookworm npm ci
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app -p 5173:5173 node:22-bookworm npm run dev
```

`http://localhost:5173/trainInduction/` を開きます。管理クラウド環境では、環境のプロキシとCAをそのまま使い、必要ならCAを読み取り専用でコンテナにマウントして `NODE_EXTRA_CA_CERTS` を指定します。TLS検証は無効にしません。

## 検証

```bash
docker run --rm -v "$PWD":/app -w /app node:22-bookworm npm test
docker run --rm -v "$PWD":/app -w /app node:22-bookworm npm run build
docker run --rm -e LIBGL_ALWAYS_SOFTWARE=1 -e WEBKIT_DISABLE_DMABUF_RENDERER=1 -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.59.1-noble npm run test:e2e
```

Playwrightのコンテナ版はlockfileの `@playwright/test` と合わせます。全12面の実時間クリアはChromiumで検証します。WebKitはタッチ操作相当・失敗/リトライ・保存・画面寸法を検証し、実機Safariと区別します。`lint` は型検査の別名であり、build内の型検査とは別のlintを実行しているわけではありません。

[2026-10-22の設計](docs/superpowers/specs/2026-10-22-threejs-rebuild.md)と[検証結果](docs/rebuild-v2-results.md)を参照してください。[旧版の評価資料](docs/rebuild-assessment.md)は当時の記録として保持しています。

## 公開

Viteのbaseは `/trainInduction/`、成果物は `dist/` です。この再構築ではGitHub Pagesの実行を手動操作に限定し、公開ジョブでも同じcheckoutのテスト/ビルドを通してから配布します。本人確認前のmainマージ・公開版の置換は行いません。
