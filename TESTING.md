# テスト方針

このリポジトリのテストは `node:test` や `node:assert` に依存しません。  
テストコード自体は `fetch` / `Response` / `crypto.subtle` / `globalThis` などの Web 標準 API だけで書かれており、軽量な自前ハーネスで実行します。

実行例では Node.js を使っていますが、テストコードそのものは Node 固有 API を前提にしていません。

## レベル 1: 単体テスト

通常はこれだけ実行してください。署名、クエリ構築、エラー処理、WebSocket 補助処理を確認します。

```bash
npm run test
```

Windows PowerShell で `npm` が解決されない場合は `npm.cmd run test` を使ってください。

## レベル 2: Public API の live smoke test

公開 API の読み取り系エンドポイントだけを軽く疎通確認します。

```bash
npm run test:live:public
```

利用可能な設定:

- `GMO_TEST_PUBLIC_SYMBOL`
  - 既定値: `BTC`

Node.js では通常の環境変数で渡せます。Node 以外のランタイムでは、必要なら先に `globalThis.GMO_TEST_CONFIG` を設定してください。

ローカルで固定値を使いたい場合は、[test/local-config.local.ts](/C:/Users/about/workspace/gmocoin/test/local-config.local.ts) に記述できます。雛形は [test/local-config.example.ts](/C:/Users/about/workspace/gmocoin/test/local-config.example.ts) です。

## レベル 3: Private API の read-only live smoke test

本番 API を叩くため、専用の read-only API キーだけを使ってください。発注・取消・振替のような更新系 API はこの自動テストには含めません。

```bash
set GMO_TEST_PRIVATE_READONLY=1
set GMO_TEST_API_KEY=...
set GMO_TEST_SECRET_KEY=...
npm run test:live:private:readonly
```

必要な設定:

- `GMO_TEST_PRIVATE_READONLY=1`
- `GMO_TEST_API_KEY`
- `GMO_TEST_SECRET_KEY`

入力先として [test/local-config.local.ts](/C:/Users/about/workspace/gmocoin/test/local-config.local.ts) を用意しています。これは `.gitignore` 済みなので、そのまま API キーを書いて構いません。

```ts
const config = {
  GMO_TEST_PUBLIC_SYMBOL: "BTC",
  GMO_TEST_PRIVATE_READONLY: "1",
  GMO_TEST_API_KEY: "ここにAPIキー",
  GMO_TEST_SECRET_KEY: "ここにシークレット"
};

export default config;
```

テスト設定の読み取り順は次の通りです。

1. `globalThis.GMO_TEST_CONFIG`
2. `process.env`

つまり Node.js では従来通り環境変数で動きますが、Edge 互換ランタイムやブラウザ寄りの実行環境では `globalThis.GMO_TEST_CONFIG` を使って同じテストコードを流用できます。

## 安全運用

更新系 API の自動テストは、次の理由で既定では実施しません。

- 発注
- 発注の変更
- 発注の取消
- 資金移動やロスカット関連の操作

本番環境を対象にする以上、次を守る前提です。

- テスト専用の API キーを分離する
- 可能なら read-only 権限だけに絞る
- 可能なら IP 制限を有効にする
- まずは unit test と public live smoke test だけを CI に入れる
- private live test は手動または限定ジョブで実行する

## 実行確認の目安

日常運用では次の順で十分です。

1. `npm run check`
2. `npm run test`
3. 必要なときだけ `npm run test:live:public`
4. private は read-only キーで `npm run test:live:private:readonly`
