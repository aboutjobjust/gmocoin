# GMO Coin API Wrapper

`fetch` / `URL` / `Web Crypto` / `WebSocket` といった Web 標準の API だけで実装した、GMO コイン暗号資産 API 向けの TypeScript ラッパーです。

Node.js、エッジランタイム、ブラウザ系ランタイムで、できるだけ同じ書き方で扱えるようにしています。

配布物にはビルド済みの ESM / CommonJS / `.d.ts` を含めているため、GitHub 依存として導入しても利用側で TypeScript ソースを直接解釈する必要はありません。

公式ドキュメント:

- https://api.coin.z.com/docs/

実装時点では、ドキュメントの更新履歴上で `2026-04-18` が最新であることを確認しています。

## 含まれているもの

- Public REST
- Private REST
- Public WebSocket
- Private WebSocket
- 将来の API 追加に備えた低レベル API
  - `requestPublic`
  - `requestPublicData`
  - `requestPrivate`
  - `requestPrivateData`

## インストール

GitHub 依存として導入する場合:

```bash
npm install github:aboutjobjust/gmocoin
```

```ts
import { GmoCoinClient } from "gmocoin-api-wrapper";
```

```js
const { GmoCoinClient } = require("gmocoin-api-wrapper");
```

## 注意点

- Private API を信頼できないブラウザクライアントから直接呼び出さないでください。API シークレットが露出します。
- `PUT /private/v1/ws-auth` と `DELETE /private/v1/ws-auth` は、GMO コイン公式サンプルに合わせて request body を署名対象に含めていません。
- Node.js 環境でグローバル `WebSocket` が無い場合、WebSocket 機能を使うときだけ `webSocketFactory` を渡してください。REST のみなら不要です。

## 基本的な使い方

```ts
import { GmoCoinClient } from "gmocoin-api-wrapper";

const client = new GmoCoinClient({
  apiKey: process.env.GMO_API_KEY,
  secretKey: process.env.GMO_SECRET_KEY
});

const ticker = await client.getTicker({ symbol: "BTC" });
console.log(ticker[0]);

const margin = await client.getMargin();
console.log(margin.availableAmount);
```

## 注文の作成

```ts
import { GmoCoinClient } from "gmocoin-api-wrapper";

const client = new GmoCoinClient({
  apiKey: process.env.GMO_API_KEY,
  secretKey: process.env.GMO_SECRET_KEY
});

const response = await client.createOrder({
  symbol: "BTC_JPY",
  side: "BUY",
  executionType: "LIMIT",
  timeInForce: "FAS",
  price: "430001",
  size: "0.02"
});

console.log(response);
```

## 低レベル API の利用

高レベルの endpoint メソッドは `data` を展開した値を返します。`status` / `responsetime` を含む生レスポンスが必要な場合は、低レベル API を使ってください。

- `requestPublic` / `requestPrivate`: 生レスポンスを返す
- `requestPublicData` / `requestPrivateData`: `data` だけを返す

```ts
import { GmoCoinClient } from "gmocoin-api-wrapper";

const client = new GmoCoinClient({
  apiKey: process.env.GMO_API_KEY,
  secretKey: process.env.GMO_SECRET_KEY
});

const response = await client.requestPrivate<{ list: unknown[] }>(
  "/v1/latestExecutions",
  "GET",
  {
    query: {
      symbol: "BTC_JPY",
      page: 1,
      count: 10
    }
  }
);

console.log(response.data.list);
```

## Public WebSocket

```ts
import {
  GmoCoinClient,
  parseWebSocketMessage,
  type PublicTickerMessage
} from "gmocoin-api-wrapper";

const client = new GmoCoinClient();
const ws = client.connectPublicWebSocket();

ws.socket.addEventListener("message", (event) => {
  const message = parseWebSocketMessage<PublicTickerMessage>(event as MessageEvent<string>);
  console.log(message.last);
});

await ws.subscribeTicker("BTC");
```

## Private WebSocket

```ts
import {
  GmoCoinClient,
  parseWebSocketMessage,
  type ExecutionEvent
} from "gmocoin-api-wrapper";

const client = new GmoCoinClient({
  apiKey: process.env.GMO_API_KEY,
  secretKey: process.env.GMO_SECRET_KEY
});

const token = await client.createWebSocketToken();
const ws = client.connectPrivateWebSocket(token);

ws.socket.addEventListener("message", (event) => {
  const message = parseWebSocketMessage<ExecutionEvent>(event as MessageEvent<string>);
  console.log(message.executionId);
});

await ws.subscribeExecutionEvents();
```

## ファイル構成

- `src/client.ts`: REST クライアント、署名処理、エラーハンドリング、各 API メソッド
- `src/types.ts`: リクエスト / レスポンスの型定義
- `src/websocket.ts`: WebSocket 用の補助実装
- `src/index.ts`: 公開エントリーポイント
- `TESTING.md`: 安全なテスト戦略

## 軽い動作確認

```bash
npm run build
npm run smoke
```
