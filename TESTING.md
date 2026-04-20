# テスト方針

このプロジェクトは本番系 API と通信するため、テストは安全性ごとに分けています。

## レベル 1: 単体テスト

通常はこのテストを実行します。

- ネットワーク不要
- 認証情報不要
- CI でも安全に実行可能
- 署名生成、クエリ構築、エラー処理、WebSocket 補助処理を確認

実行:

```bash
npm run test
```

Windows PowerShell で `npm` 実行がポリシーに引っかかる場合は、`npm.cmd run test` を使ってください。

## レベル 2: Public API の live smoke test

GMO コインの public endpoint のみを実際に呼びます。

- 認証情報不要
- 公開マーケットデータのみを参照
- ネットワーク状態や API 側の稼働状況には依存

実行:

```bash
npm run test:live:public
```

任意の環境変数:

- `GMO_TEST_PUBLIC_SYMBOL`
  - 既定値: `BTC`

## レベル 3: Private API の read-only live smoke test

専用の read-only API キーを使って、最低限の確認だけを行います。

推奨するガードレール:

- テスト専用の API キーを作る
- GMO コイン側で IP 制限を有効化する
- smoke test に必要な最小限の read-only 権限だけを付与する
- 注文権限や振替権限のあるキーを使い回さない
- 認証情報はローカル環境変数だけで管理する

実行:

```bash
set GMO_TEST_PRIVATE_READONLY=1
set GMO_TEST_API_KEY=...
set GMO_TEST_SECRET_KEY=...
npm run test:live:private:readonly
```

必要な環境変数:

- `GMO_TEST_PRIVATE_READONLY=1`
- `GMO_TEST_API_KEY`
- `GMO_TEST_SECRET_KEY`

## 更新系 API のテスト

次のような更新系 API は、既定では自動テストに含めていません。

- 注文
- 注文変更
- 注文取消
- 振替
- ロスカットレート変更

自動化しない理由は、本番系 API への副作用を避けるためです。

どうしても更新系の確認が必要なら、最低でも次の条件を入れてください。

- テスト専用の本番口座、または専用サブ口座を使う
- 口座残高は必要最小限に抑える
- 専用 API キーを使い、権限は最小化する
- IP 制限を有効にする
- スクリプト側でも銘柄を明示的に許可制にする
- `MARKET` よりも副作用の読みやすい `LIMIT` を優先する
- `I_UNDERSTAND_THIS_HITS_PRODUCTION` のような強い opt-in 環境変数を要求する
- すべてのリクエストと返却された order id を記録する
- 実行後に手動で後始末を確認する

このリポジトリの安全な既定運用は次のとおりです。

- 常時実行するのは単体テスト
- 必要に応じて public live smoke test
- private は専用 read-only キーで smoke test のみ
- 更新系の確認は手動運用
