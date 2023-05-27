## Symbol アプリのベースアプリ　　

#### Symbol のアプリを作る上でベースになる最低限の構成となります。

## デモ URL

https://blockchain-writing-project-base.vercel.app/

## 開発環境構築手順

git clone でダウンロード後トップディレクトリで

```
npm i
```

管理者アカウントの作成

```
node setup_tool/createdminAddress.js test
```

出力された内容をもとに、作成したアカウントに xym を入金する

.env の作成

```
cp .env.sample .env
```

上記.env の「PRIVATE_KEY」に setup_tool で作成した PrivateKey を入力する

開発環境の実行

```
npm run dev
```

## デプロイ手順

#### 1.vercel でサインアップ後「Create a New Project」をクリック

<img width="600" alt="スクリーンショット 2023-05-08 14 48 49" src="https://user-images.githubusercontent.com/47712051/236747213-e3bc27f1-f6ae-4964-8667-55175026703b.png">

#### 2.作成したレポジトリを選択し「Import」をクリック

<img width="600" alt="スクリーンショット 2023-05-08 14 49 12" src="https://user-images.githubusercontent.com/47712051/236747225-3238cf6a-9bfc-4091-944a-3f431cf0cae7.png">

#### 3.環境変数部分だけ設定し「Deploy」をクリック

<img width="600" alt="スクリーンショット 2023-05-08 14 54 15" src="https://user-images.githubusercontent.com/47712051/236747240-f8096b17-502c-4171-8f92-d9b5325d31b9.png">

#### 4.デプロイ完了（まだ続きます）

<img width="600" alt="スクリーンショット 2023-05-08 14 55 55" src="https://user-images.githubusercontent.com/47712051/236747257-1384e36a-99b3-4bbe-a650-a2e5f984d7e6.png">

#### 5.一度 TOP ページに移動し上のメニュから「Settings」を選択

<img width="600" alt="スクリーンショット 2023-05-09 16 29 32" src="https://user-images.githubusercontent.com/47712051/237027328-bfdf23c2-9303-48d2-bb90-7bbf5dad8e69.png">

#### 6.デプロイするリージョンを TOKYO にする

<img width="600" alt="スクリーンショット 2023-05-09 16 30 43" src="https://user-images.githubusercontent.com/47712051/237028476-f665d35f-80eb-4765-9527-2fd76d752c27.png">

※この設定をしないとデフォルトが US になります。US だとノードによってレスポンスタイムが１秒を超えてしまうため  
例えばサーバー側でアナウンス後の未承認 Tx を検知しようとしても、既に未承認 Tx イベントが終了しているため検知がうまくできないという事象が発生します。

## 技術スタック

### Next.js フロントエンドフレームワーク

version 13.4.0

#### ①symbol-sdk との相性

symbol-sdk が react-scripts を相性が悪く、React や他のフレームワークで構築しようとすると設定変更やバージョンの調整などが必要  
Next.js では react-scripts を使っていないため特に追加の設定や調整なく symbol-sdk が利用できる

#### ② デプロイ環境との相性

vercel にデプロイする場合、Next.js のデフォルトで実装されているサーバレス環境（API）以外だと手順が複雑になり  
読者に余計な混乱が発生する可能性がある。

### Next.js バックエンドフレームワーク

管理者側のトランザクションなどは Next.js の標準機能でついているサーバレス機能の API ROUTE を用いる

### MUI UI フレームワーク

version 5.12.3

### recoil グローバル状態管理

version 0.7.7

### axios API 呼び出し

version 1.4.0

### jest テスト

version 29.5.0

### eslint リント

version 8.39.0

### prettier フォーマット

version 2.8.8

## ディレクトリ構成

```
├── public
│   ├── favicon.ico
│   └── logo.jpeg
├── src
       ├── components(コンポーネント置き場)
       │   ├── AlertsDialog.tsx
       │   ├── AlertsSnackbar.tsx
       │   ├── Header.tsx
       │   └── LeftDrawer.tsx
       ├── consts(共通で使う定数)
       │   ├── blockchainProperty.ts
       │   └── nodeList.ts
       ├── globalState(共通で使うグローバルステート)
       │   └── atoms.ts
       ├── hooks(共通で使うhooks)
       ├── pages(ページのコンポーネント)
       │   ├── _app.tsx
       │   ├── _document.tsx
       │   ├── api(バックエンド側API)
       │   │   ├── fetch-address.ts
       │   │   └── send-client.ts
       │   ├── index.tsx
       │   ├── page1
       │   │   └── index.tsx
       │   ├── page2
       │   │   └── index.tsx
       │   ├── page3
       │   │   └── index.tsx
       │   └── page4
       │       └── index.tsx
       ├── styles(共通で使うスタイル)
       │   └── globals.css
       ├── test(テスト用ファイル置き場※とりあえず置いてるだけ)
       ├── types(共通で使う型)
       └── utils(関数置き場)
           ├── connectNode.ts
           ├── createAccount.ts
           └── sendMessage.ts
```

## 開発内容解説

フロントエンド側、バックエンド側でそれぞれトランザクションのアナウンス及び監視の動作が行えるようにしています。

### components

最低限必要なコンポーネントをのせています。

#### AlertsDialog

確認時などに表示するためのダイアログです。  
タイトルとメッセージ、OK を押した場合の関数を変更することができます。

#### AlertsSnackbar

処理の成功やエラーを通知するスナックバー。  
success or error メッセージなど変更することができます。

#### Header

すべてのページに表示されるヘッダー。  
ロゴとサイドメニューを開くメニューアイコン。

#### LeftDrawer

各ページにアクセスするためのメニュードロアー。  
ページを追加したらこちらにも追加する。

### consts

共通の定数、ノードリストやネットワークタイプなどを定義している。

### globalState

共通のグローバルステート、ユーザ情報や管理者情報を定義している。  
定義した State を利用する場合は各コンポーネントで以下のように使う

#### useRecoilState

値及び値の更新が必要なときに利用

#### useRecoilValue

値の参照が必要なときに利用

### hooks

共通の hook。サンプルアプリでは使っていないが、必要に応じて

### pages

ページコンポーネントやバックエンド側の処理をかく

#### api

バックエンド側の処理、ファイル名がエンドポイントになる

#### index.tsx

ホーム用のページコンポーネント（/にアクセスしたときに表示）

#### xxx/index.tsx

ホーム用以外のページコンポーネント（/xxx にアクセスしたときに表示）

### styles

共通の styles。サンプルアプリでは使っていないが、必要に応じて

### test

テスト用ファイル置き場。サンプルアプリでは使っていないが、必要に応じて

### types

共通の型定義。サンプルアプリでは使っていないが、必要に応じて

### utils

共通の関数。コンポーネント独自の関数は別に管理してもよさそう
