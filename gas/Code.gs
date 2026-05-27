/**
 * しんきゅうコンパス 予約管理アンケート
 * Google Apps Script - Web App バックエンド
 *
 * デプロイ手順：
 * 1. スプレッドシートを開く（ID: 17ybVxuJ61nLwdpwvtQuKrgQmZW85B21CT1-S3pBe3IA）
 * 2. 拡張機能 → Apps Script
 * 3. このコードを貼り付けて保存（Ctrl+S）
 * 4. デプロイ → 新しいデプロイ
 * 5. 種類：ウェブアプリ
 *    実行するユーザー：自分
 *    アクセスできるユーザー：全員
 * 6. デプロイ → URL をコピー
 * 7. js/storage.js の CONFIG.GAS_URL に貼り付ける
 */

// ─── 設定 ────────────────────────────────────────────────────────
const SPREADSHEET_ID = '17ybVxuJ61nLwdpwvtQuKrgQmZW85B21CT1-S3pBe3IA';
const SHEET_NAME     = 'survey_responses';

// 列構成（フロントエンドの COLUMN_ORDER と一致させること）
const HEADERS = [
  '送信日時',
  '院名',
  'メールアドレス',
  'Q3_予約管理方法',
  'Q3_その他',
  'Q4_予約管理ツール',
  'Q4_その他',
  'Q4_2_予約受付経路',
  'Q4_2_その他',
  'Q5_困っていること',
  'Q5_その他',
  'Q6_気に入っている点',
  'Q6_その他',
  'Q7_オンライン化への不安',
  'Q7_その他',
  'Q8_記録タイミング',
  'Q8_その他',
  'Q9_改善への興味',
  'Q10_条件・機能・サポート',
  'Q11_自由意見・要望',
  'ブラウザ情報',
  '回答時間（秒）',
];

// ─── Web App エントリーポイント ───────────────────────────────────

/**
 * POST リクエストの受け口
 */
function doPost(e) {
  try {
    // リクエストボディをパース
    const data = JSON.parse(e.postData.contents);

    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = _getOrCreateSheet(ss);

    // 同一メールアドレスの行を検索
    const email      = String(data.q2_email || '').trim();
    const targetRow  = email ? _findRowByEmail(sheet, email) : -1;

    // データ行を組み立て
    const row = HEADERS.map(function(col) {
      const val = data[col];
      return val !== undefined && val !== null ? String(val) : '';
    });

    if (targetRow > 0) {
      // 既存レコードを上書き
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    } else {
      // 新規追加
      sheet.appendRow(row);
    }

    return _jsonResponse({ status: 'success' });

  } catch (err) {
    console.error('doPost エラー:', err);
    return _jsonResponse({ status: 'error', message: err.message });
  }
}

/**
 * GET リクエスト（動作確認用）
 */
function doGet(e) {
  return _jsonResponse({ status: 'ok', message: 'Survey API is running' });
}

// ─── ヘルパー関数 ─────────────────────────────────────────────────

/**
 * シートを取得、なければ作成してヘッダー行を設定
 */
function _getOrCreateSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    _formatHeaderRow(sheet);
    return sheet;
  }

  // ヘッダー行が存在するか確認
  const lastCol  = sheet.getLastColumn();
  const lastRow  = sheet.getLastRow();

  if (lastRow === 0) {
    // シートが空 → ヘッダー新規作成
    sheet.appendRow(HEADERS);
    _formatHeaderRow(sheet);
  } else {
    const firstCell = sheet.getRange(1, 1).getValue();
    if (firstCell === 'timestamp') {
      // 旧英語ヘッダーが残っている → 日本語ヘッダーに上書き
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      _formatHeaderRow(sheet);
    } else if (firstCell !== '送信日時') {
      // ヘッダー行がない → 先頭に挿入
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      _formatHeaderRow(sheet);
    }
    // firstCell === '送信日時' の場合はすでに最新 → 何もしない
  }

  return sheet;
}

/**
 * ヘッダー行のフォーマット（背景色・太字）
 */
function _formatHeaderRow(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setBackground('#726135')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * メールアドレスで既存行を検索し、行番号（1始まり）を返す
 * 見つからなければ -1 を返す
 */
function _findRowByEmail(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const emailColIndex = HEADERS.indexOf('メールアドレス') + 1; // 1始まり
  const emailValues   = sheet
    .getRange(2, emailColIndex, lastRow - 1, 1)
    .getValues();

  for (var i = 0; i < emailValues.length; i++) {
    if (String(emailValues[i][0]).trim() === email) {
      return i + 2; // 2行目始まり（1行目はヘッダー）
    }
  }

  return -1;
}

/**
 * JSON レスポンスを返す
 */
function _jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
