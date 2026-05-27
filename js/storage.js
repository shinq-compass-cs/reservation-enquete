/**
 * データ保存処理
 * - localStorage への回答自動保存・読み込み
 * - Google Apps Script Web App 経由でスプレッドシートへ送信
 */

// ─── 設定 ────────────────────────────────────────────────────────
const CONFIG = {
  // ★ GAS Web App をデプロイした後、この URL を書き換えてください
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxYtvyHzaGI3joOiIRB-chMgYOrf3yjFEiVMuFwNw_Q4kx6FpD0LE0y7MA8exurInPR0w/exec',

  // localStorage のキープレフィックス（バージョン管理用）
  LOCAL_STORAGE_KEY: 'survey_v6_16_progress',

  // 送信リトライ設定
  MAX_RETRY: 3,
  RETRY_DELAY_MS: 2000,
};

// ─── localStorage 操作 ────────────────────────────────────────────

/**
 * 回答進捗を localStorage に保存
 * @param {Object} state - { answers, currentIndex, startTime }
 */
function saveProgress(state) {
  try {
    localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage が使えない環境では無視（プライベートブラウジング等）
    console.warn('localStorage への保存に失敗しました:', e);
  }
}

/**
 * localStorage から回答進捗を読み込む
 * @returns {Object|null} - 保存済みの state、なければ null
 */
function loadProgress() {
  try {
    const raw = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage の読み込みに失敗しました:', e);
    return null;
  }
}

/**
 * localStorage の進捗データを削除
 */
function clearProgress() {
  try {
    localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('localStorage の削除に失敗しました:', e);
  }
}

// ─── Google Sheets 送信 ────────────────────────────────────────────

/**
 * 回答データをスプレッドシートへ送信
 * @param {Object} answers - 回答オブジェクト
 * @param {Object} [formState] - other_text 等の補助データ
 * @param {number} [completionTimeSec] - 所要時間（秒）
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function submitSurvey(answers, formState, completionTimeSec) {
  const payload = buildPayload(answers, formState, completionTimeSec);

  let lastError = '';
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRY; attempt++) {
    try {
      const result = await _postToGAS(payload);
      if (result.status === 'success') {
        clearProgress(); // 送信成功後に進捗データを削除
        return { success: true };
      }
      lastError = result.message || '不明なエラー';
    } catch (e) {
      lastError = e.message || '通信エラー';
      console.warn(`送信試行 ${attempt}/${CONFIG.MAX_RETRY} 失敗:`, e);
    }

    // 最終試行でなければ待ってからリトライ
    if (attempt < CONFIG.MAX_RETRY) {
      await _sleep(CONFIG.RETRY_DELAY_MS * attempt);
    }
  }

  return { success: false, error: lastError };
}

/**
 * GAS Web App に POST する
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
async function _postToGAS(payload) {
  const response = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // GAS がリダイレクト後のレスポンスを返す場合、text が空のことがある
    return { status: 'success' };
  }
}

// ─── データ整形 ─────────────────────────────────────────────────────

/**
 * answers と formState から送信用ペイロードを組み立てる
 * @param {Object} answers
 * @param {Object} formState - { q3_other_text, q4_other_text, ... }
 * @param {number} completionTimeSec
 * @returns {Object} - COLUMN_ORDER に対応したフラットなオブジェクト
 */
function buildPayload(answers, formState, completionTimeSec) {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jst = new Date(now.getTime() + jstOffset);
  const timestamp = jst.toISOString().replace('Z', '+09:00');

  // 英語ID → 日本語ラベルに変換（questions.js の VALUE_LABELS を参照）
  function toJP(val) {
    if (!val) return '';
    return (typeof VALUE_LABELS !== 'undefined' && VALUE_LABELS[val]) || val;
  }

  // 複数選択：日本語ラベルのカンマ区切り文字列に変換
  function toCSV(val) {
    if (Array.isArray(val)) return val.map(toJP).join(',');
    return toJP(val);
  }

  const fs = formState || {};

  return {
    timestamp,
    q1_clinic_name: String(answers['Q1'] || '').trim(),
    q2_email: String(answers['Q2'] || '').trim(),
    q3_management_type: toJP(answers['Q3']),
    q3_other_text: fs.q3_other_text || '',
    q4_reservation_tool: toJP(answers['Q4']),
    q4_other_text: fs.q4_other_text || '',
    q4_2_marketing_channels: toCSV(answers['Q4_2']),
    q4_2_other_text: fs.q4_2_other_text || '',
    q5_difficulties: toCSV(answers['Q5']),
    q5_other_text: fs.q5_other_text || '',
    q6_likes: toCSV(answers['Q6']),
    q6_other_text: fs.q6_other_text || '',
    q7_concerns: toCSV(answers['Q7']),
    q7_other_text: fs.q7_other_text || '',
    q8_recording_timing: toCSV(answers['Q8']),
    q8_other_text: fs.q8_other_text || '',
    q9_interest_level: '',   // Q9削除済み
    q10_required_conditions: String(answers['Q10'] || '').trim(),
    q11_free_comment: String(answers['Q11'] || '').trim(),
    user_agent: navigator.userAgent,
    completion_time_seconds: completionTimeSec || 0,
  };
}

// ─── ユーティリティ ────────────────────────────────────────────────

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
