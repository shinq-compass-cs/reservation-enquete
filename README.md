# 鍼灸院 予約管理アンケート

しんきゅうコンパス メルマガ会員向けアンケートアプリケーション（v6.16）

## セットアップ手順

### 1. Google Apps Script のデプロイ（初回のみ）

1. スプレッドシートを開く  
   → `https://docs.google.com/spreadsheets/d/17ybVxuJ61nLwdpwvtQuKrgQmZW85B21CT1-S3pBe3IA`

2. **拡張機能 → Apps Script** を開く

3. `gas/Code.gs` の内容を貼り付けて保存

4. **デプロイ → 新しいデプロイ** をクリック
   - 種類：**ウェブアプリ**
   - 実行するユーザー：**自分（自分のアカウント）**
   - アクセスできるユーザー：**全員**
   - → 「デプロイ」ボタンをクリック（権限を承認）

5. 表示された **ウェブアプリの URL** をコピー

### 2. フロントエンドへの URL 設定

`js/storage.js` を開き、以下の行を書き換える：

```javascript
// 変更前
GAS_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

// 変更後（コピーした URL に置き換える）
GAS_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
```

### 3. GitHub Pages への公開

```bash
git add .
git commit -m "初期実装"
git push origin main
```

GitHub リポジトリの Settings → Pages で `main` ブランチのルート（`/`）を指定する。

---

## ファイル構成

```
reservation-enquete/
├── index.html          # メインHTML
├── css/
│   └── style.css       # スタイルシート（ブランドカラー #726135）
├── js/
│   ├── questions.js    # 設問データ定義（v6.16）
│   ├── branching.js    # 分岐・動的フィルタリング
│   ├── validation.js   # バリデーション
│   ├── storage.js      # localStorage + GAS送信
│   └── survey.js       # メインコントローラー
├── gas/
│   └── Code.gs         # Apps Script バックエンド
└── docs/               # 仕様書（変更不要）
```

## 確認テストシナリオ

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | Q3=「紙で管理」を選択 | Q4 が表示されない |
| 2 | Q3=「予約管理ツール」→ Q4=「しんきゅう予約」 | Q4-2 に「しんきゅう予約・しんきゅうコンパス」が表示されない |
| 3 | Q3=「予約管理ツール」→ Q4=「その他」 | Q4-2 に全選択肢が表示される |
| 4 | Q3=「紙」のとき Q4-2 の最後の選択肢 | 「ネット集客は活用していない」 |
| 5 | Q3=「予約管理ツール」のとき Q4-2 の最後の選択肢 | 「Q4で選んだサービス以外には活用していない」 |
| 6 | Q5 で「特に困っていない」を選択 | 他のチェックが自動解除される |
| 7 | Q9=「とても興味あり」を選択 | Q10 が表示される |
| 8 | Q9=「今のままで満足」を選択 | Q10 が表示されない |
| 9 | Q1 を空白で「次へ」 | エラーメッセージが表示される |
| 10 | 正常に全設問回答後「送信する」 | スプレッドシートに行が追加される |
