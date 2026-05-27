/**
 * アンケートメインコントローラー
 * 設問のレンダリング・ナビゲーション・状態管理を担当
 */

// ─── セクションテーマ ──────────────────────────────────────────────

/**
 * セクション別カラーテーマ
 * accent: メインアクセント / mid: グラデーション用中間色 / light: 背景薄色
 */
const SECTION_THEMES = {
  A: { accent: '#A07828', mid: '#C89A40', light: '#FFF8EC' }, // ゴールデンアンバー（Q1/Q2）
  B: { accent: '#B85830', mid: '#D87850', light: '#FFF1EA' }, // テラコッタ（Q3/Q4/Q4_2）
  C: { accent: '#4A7840', mid: '#6A9860', light: '#F0F6EE' }, // セージグリーン（Q5/Q6/Q7）
  D: { accent: '#3A5E98', mid: '#5A7EB8', light: '#EEF3FA' }, // スレートブルー（Q8）
  E: { accent: '#6848A0', mid: '#8868C0', light: '#F3EFF8' }, // ソフトパープル（Q10）
  F: { accent: '#288878', mid: '#48A898', light: '#EDF8F5' }, // カームティール（Q11）
};

/** 設問ID → セクション */
const QUESTION_SECTION_MAP = {
  Q1_Q2: 'A',
  Q3: 'B', Q4: 'B', Q4_2: 'B',
  Q5: 'C', Q6: 'C', Q7: 'C',
  Q8: 'D',
  Q11: 'E',
};

/**
 * 設問IDに対応するセクションテーマをCSS変数に適用する
 * @param {string} qId
 */
function applyTheme(qId) {
  const theme = SECTION_THEMES[QUESTION_SECTION_MAP[qId]] || SECTION_THEMES.A;
  const root = document.documentElement;
  root.style.setProperty('--section-accent',       theme.accent);
  root.style.setProperty('--section-accent-mid',   theme.mid);
  root.style.setProperty('--section-accent-light', theme.light);
}

// ─── アプリ状態 ────────────────────────────────────────────────────
const state = {
  currentIndex: 0,        // visibleQuestions 配列内の現在インデックス
  answers: {},            // { Q1: 'value', Q2: 'email@example.com', Q4_2: ['hpb', 'epark'], ... }
  formState: {},          // other_text 等の補助データ { q3_other_text: '...', ... }
  visibleQuestions: [],   // 現在表示すべき設問ID配列（動的に再計算）
  startTime: null,        // アンケート開始時刻（Date.now()）
  lastPayload: null,      // エラー時のリトライ用
};

// ─── 初期化 ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 開始ボタン
  document.getElementById('btn-start').addEventListener('click', () => startSurvey(false));

  // ナビゲーションボタン
  document.getElementById('btn-back').addEventListener('click', navigateBack);
  document.getElementById('btn-next').addEventListener('click', navigateNext);
  document.getElementById('btn-submit').addEventListener('click', handleSubmitBtn);

  // リトライボタン
  document.getElementById('btn-retry').addEventListener('click', retrySend);

  // 保存済み進捗があれば復元確認
  const saved = loadProgress();
  if (saved && saved.answers && Object.keys(saved.answers).length > 0) {
    showResumePrompt(saved);
  }
});

/**
 * 前回の途中回答を復元するか確認
 */
function showResumePrompt(saved) {
  const confirmed = window.confirm(
    '前回の途中まで入力した内容が残っています。\n続きから回答しますか？\n\n「OK」→ 続きから\n「キャンセル」→ 最初から'
  );
  if (confirmed) {
    state.answers = saved.answers || {};
    state.formState = saved.formState || {};
    state.currentIndex = saved.currentIndex || 0;
    state.startTime = saved.startTime || Date.now();
    startSurvey(true);
  }
}

/**
 * アンケートを開始する
 * @param {boolean} isResume - true のとき途中から再開（state は設定済み前提）
 */
function startSurvey(isResume) {
  if (isResume !== true) {
    // 新規開始：状態をリセット
    state.answers = {};
    state.formState = {};
    state.currentIndex = 0;
    state.startTime = Date.now();
  }
  // isResume === true のときは showResumePrompt で state を設定済み

  state.visibleQuestions = getVisibleQuestions(state.answers);
  showScreen('screen-survey');
  renderCurrentQuestion();
}

// ─── ナビゲーション ────────────────────────────────────────────────

/**
 * 「次へ」ボタン押下時の処理
 */
function navigateNext() {
  const qId = state.visibleQuestions[state.currentIndex];
  if (!qId) return;

  // ── Q1_Q2 グループ画面の処理 ──────────────────────────────
  if (qId === 'Q1_Q2') {
    for (const id of ['Q1', 'Q2']) {
      const { value, formStateUpdate } = collectCurrentInput(id);
      const result = validateQuestion(id, value, state.answers, {
        ...state.formState,
        ...formStateUpdate,
      });
      if (!result.valid) {
        showError(id, result.error);
        return;
      }
      state.answers[id] = value;
      if (formStateUpdate) Object.assign(state.formState, formStateUpdate);
    }
    state.visibleQuestions = getVisibleQuestions(state.answers);
    state.currentIndex++;
    saveProgress({ answers: state.answers, formState: state.formState,
                   currentIndex: state.currentIndex, startTime: state.startTime });
    renderCurrentQuestion();
    return;
  }

  // ── 通常設問の処理 ────────────────────────────────────────
  const { value, formStateUpdate } = collectCurrentInput(qId);

  const result = validateQuestion(qId, value, state.answers, {
    ...state.formState,
    ...formStateUpdate,
  });

  if (!result.valid) {
    showError(qId, result.error);
    return;
  }

  state.answers[qId] = value;
  if (formStateUpdate) Object.assign(state.formState, formStateUpdate);

  state.visibleQuestions = getVisibleQuestions(state.answers);
  state.currentIndex++;
  saveProgress({
    answers: state.answers,
    formState: state.formState,
    currentIndex: state.currentIndex,
    startTime: state.startTime,
  });

  renderCurrentQuestion();
}

/**
 * 「戻る」ボタン押下時の処理
 */
function navigateBack() {
  if (state.currentIndex <= 0) return;

  // 現在の入力を（バリデーションなしで）暫定保存
  const qId = state.visibleQuestions[state.currentIndex];
  if (qId === 'Q1_Q2') {
    ['Q1', 'Q2'].forEach((id) => {
      const { value, formStateUpdate } = collectCurrentInput(id);
      state.answers[id] = value;
      if (formStateUpdate) Object.assign(state.formState, formStateUpdate);
    });
  } else if (qId) {
    const { value, formStateUpdate } = collectCurrentInput(qId);
    state.answers[qId] = value;
    if (formStateUpdate) Object.assign(state.formState, formStateUpdate);
  }

  state.currentIndex--;
  renderCurrentQuestion();
}

/**
 * 「送信する」ボタン押下時の処理
 * ※ storage.js の submitSurvey() と区別するため handleSubmitBtn と命名
 */
async function handleSubmitBtn() {
  const qId = state.visibleQuestions[state.currentIndex];
  if (!qId) return;

  // 最終設問のバリデーション
  const { value, formStateUpdate } = collectCurrentInput(qId);
  const result = validateQuestion(qId, value, state.answers, {
    ...state.formState,
    ...formStateUpdate,
  });

  if (!result.valid) {
    showError(qId, result.error);
    return;
  }

  state.answers[qId] = value;
  if (formStateUpdate) Object.assign(state.formState, formStateUpdate);

  // 送信ボタンを無効化（二重送信防止）
  const btnSubmit = document.getElementById('btn-submit');
  btnSubmit.disabled = true;

  const elapsedSec = Math.round((Date.now() - state.startTime) / 1000);

  showScreen('screen-loading');

  // storage.js の submitSurvey() を呼ぶ
  const sendResult = await submitSurvey(state.answers, state.formState, elapsedSec);

  if (sendResult.success) {
    showScreen('screen-complete');
  } else {
    state.lastPayload = { answers: state.answers, formState: state.formState, elapsedSec };
    document.getElementById('error-message').textContent =
      sendResult.error
        ? `送信に失敗しました（${sendResult.error}）。再度お試しください。`
        : '通信エラーが発生しました。再度お試しください。';
    showScreen('screen-error');
    btnSubmit.disabled = false;
  }
}

/**
 * エラー時の再送信
 */
async function retrySend() {
  if (!state.lastPayload) return;
  const btn = document.getElementById('btn-retry');
  btn.disabled = true;
  showScreen('screen-loading');

  const { answers, formState, elapsedSec } = state.lastPayload;
  const result = await submitSurvey(answers, formState, elapsedSec);

  if (result.success) {
    showScreen('screen-complete');
  } else {
    document.getElementById('error-message').textContent =
      '再送信にも失敗しました。時間をおいて再度お試しください。';
    showScreen('screen-error');
    btn.disabled = false;
  }
}

// ─── レンダリング ──────────────────────────────────────────────────

/**
 * 現在インデックスの設問を描画する
 */
function renderCurrentQuestion() {
  // 設問リストを最新化
  state.visibleQuestions = getVisibleQuestions(state.answers);

  if (state.currentIndex >= state.visibleQuestions.length) {
    // すべての設問を回答済み → 送信確認（通常ここには来ないが安全弁）
    return;
  }

  const qId = state.visibleQuestions[state.currentIndex];

  // セクションテーマを適用
  applyTheme(qId);

  // セクションラベル（Q1_Q2 のみ見出しを表示、それ以外は非表示）
  const sectionLabelEl = document.getElementById('section-label');
  if (qId === 'Q1_Q2') {
    sectionLabelEl.textContent = '基本情報を教えてください';
    sectionLabelEl.style.display = 'block';
  } else {
    sectionLabelEl.textContent = '';
    sectionLabelEl.style.display = 'none';
  }

  // Q1+Q2 グループ画面
  if (qId === 'Q1_Q2') {
    renderGroupScreen(['Q1', 'Q2']);
    return;
  }

  const q = getQuestion(qId);
  if (!q) return;

  // 設問 HTML を生成して描画
  const area = document.getElementById('question-area');
  area.innerHTML = renderQuestion(q);

  // 既存の回答を復元
  restoreAnswer(q);

  // イベントリスナーを設定
  attachEventListeners(q);

  // 進捗バーを更新
  updateProgress();

  // ナビゲーションボタンの表示制御
  updateNavButtons();

  // エラー表示をクリア
  clearError();

  // スクロールを先頭に戻す
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 複数の設問を1画面にまとめて描画する（Q1+Q2 専用）
 * @param {string[]} qIds - 描画する設問IDの配列
 */
function renderGroupScreen(qIds) {
  const area = document.getElementById('question-area');
  area.innerHTML = qIds.map((id) => renderQuestion(getQuestion(id))).join('');

  qIds.forEach((id) => {
    const q = getQuestion(id);
    restoreAnswer(q);
    attachEventListeners(q);
  });

  updateProgress();
  updateNavButtons();
  clearError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 設問の HTML 文字列を生成する
 * @param {Object} q - 設問定義
 * @returns {string} HTML
 */
function renderQuestion(q) {
  const requiredBadge = q.required ? '<span class="required-badge">※必須</span>' : '';
  const subLabel = q.sub_label ? `<div class="question-sub-label">${escHtml(q.sub_label)}</div>` : '';
  const note = q.note ? `<div class="question-note">${escHtml(q.note)}</div>` : '';

  // 選択方式バッジ
  let choiceTypeBadge = '';
  if (q.type === 'single_choice') {
    choiceTypeBadge = '<span class="choice-type-badge choice-type-single">1つ選択</span>';
  } else if (q.type === 'multiple_choice') {
    choiceTypeBadge = '<span class="choice-type-badge choice-type-multi">複数選択可</span>';
  }

  let inputHtml = '';
  switch (q.type) {
    case 'text':
      inputHtml = renderTextInput(q);
      break;
    case 'email':
      inputHtml = renderEmailInput(q);
      break;
    case 'text_area':
      inputHtml = renderTextArea(q);
      break;
    case 'single_choice':
      inputHtml = renderSingleChoice(q);
      break;
    case 'multiple_choice':
      inputHtml = renderMultipleChoice(q);
      break;
  }

  return `
    <div class="question-card" data-qid="${q.id}">
      <div class="question-header">
        <div class="question-label">
          ${escHtml(q.label)}${requiredBadge}
        </div>
        ${subLabel}
        ${choiceTypeBadge}
        ${note}
      </div>
      <div class="question-body">
        ${inputHtml}
      </div>
      <div class="error-message" id="error-${q.id}" role="alert" aria-live="polite"></div>
    </div>
  `;
}

function renderTextInput(q) {
  return `<input
    type="text"
    id="input-${q.id}"
    class="text-input"
    placeholder="${escHtml(q.placeholder || '')}"
    maxlength="${q.validation?.max_length || 100}"
    autocomplete="organization"
    aria-required="${q.required}"
  >`;
}

function renderEmailInput(q) {
  return `
    <input
      type="email"
      id="input-${q.id}"
      class="text-input"
      placeholder="${escHtml(q.placeholder || '')}"
      maxlength="${q.validation?.max_length || 200}"
      autocomplete="email"
      inputmode="email"
      aria-required="${q.required}"
    >
    <div class="email-hint" id="email-hint-${q.id}"></div>
  `;
}

function renderTextArea(q) {
  const maxLen = q.validation?.max_length || 1000;
  return `
    <textarea
      id="input-${q.id}"
      class="text-area"
      placeholder="${escHtml(q.placeholder || '')}"
      maxlength="${maxLen}"
      rows="5"
      aria-required="${q.required}"
    ></textarea>
    <div class="char-count" id="char-count-${q.id}">残り${maxLen}文字</div>
  `;
}

function renderSingleChoice(q) {
  const options = getOptionsForQuestion(q.id, state.answers);
  const items = options.map((opt) => {
    const textInput = opt.has_text_input
      ? `<div class="other-text-wrap" id="other-wrap-${q.id}-${opt.value}" style="display:none">
           <input type="text" class="other-text-input" id="other-text-${q.id}"
             placeholder="${escHtml(opt.text_input_placeholder || '具体的にお書きください')}"
             maxlength="200"
             aria-label="その他の内容"
           >
         </div>`
      : '';
    return `
      <label class="choice-label" for="radio-${q.id}-${opt.value}">
        <input
          type="radio"
          id="radio-${q.id}-${opt.value}"
          name="q-${q.id}"
          value="${opt.value}"
          class="choice-input"
          aria-label="${escHtml(opt.label)}"
        >
        <span class="choice-text">${escHtml(opt.label)}</span>
      </label>
      ${textInput}
    `;
  });
  return `<div class="choice-list" role="radiogroup" aria-label="${escHtml(q.label)}">${items.join('')}</div>`;
}

function renderMultipleChoice(q) {
  const options = getOptionsForQuestion(q.id, state.answers);
  const items = options.map((opt) => {
    const exclusiveAttr = opt.exclusive ? 'data-exclusive="true"' : '';
    const textInput = opt.has_text_input
      ? `<div class="other-text-wrap" id="other-wrap-${q.id}-${opt.value}" style="display:none">
           <input type="text" class="other-text-input" id="other-text-${q.id}"
             placeholder="具体的にお書きください"
             maxlength="200"
             aria-label="その他の内容"
           >
         </div>`
      : '';
    return `
      <label class="choice-label" for="check-${q.id}-${opt.value}">
        <input
          type="checkbox"
          id="check-${q.id}-${opt.value}"
          name="q-${q.id}"
          value="${opt.value}"
          class="choice-input"
          ${exclusiveAttr}
          aria-label="${escHtml(opt.label)}"
        >
        <span class="choice-text">${escHtml(opt.label)}</span>
      </label>
      ${textInput}
    `;
  });
  return `<div class="choice-list">${items.join('')}</div>`;
}

// ─── 回答の復元 ────────────────────────────────────────────────────

/**
 * 既存の回答値をフォームに復元する
 */
function restoreAnswer(q) {
  const saved = state.answers[q.id];
  if (saved === undefined || saved === null) return;

  if (q.type === 'text' || q.type === 'email' || q.type === 'text_area') {
    const el = document.getElementById(`input-${q.id}`);
    if (el) {
      el.value = saved;
      // 文字数カウンター更新
      if (q.type === 'text_area') {
        updateCharCount(q.id, saved, q.validation?.max_length);
      }
    }
  } else if (q.type === 'single_choice') {
    const radio = document.querySelector(`input[name="q-${q.id}"][value="${saved}"]`);
    if (radio) {
      radio.checked = true;
      toggleOtherTextVisibility(q.id, saved);
    }
    // other_text の復元
    restoreOtherText(q);
  } else if (q.type === 'multiple_choice') {
    if (Array.isArray(saved)) {
      saved.forEach((val) => {
        const cb = document.querySelector(`input[name="q-${q.id}"][value="${val}"]`);
        if (cb) cb.checked = true;
      });
      // other が含まれていれば other text フィールドを表示
      if (saved.includes('other')) {
        const wrap = document.getElementById(`other-wrap-${q.id}-other`);
        if (wrap) wrap.style.display = 'block';
      }
    }
    restoreOtherText(q);
  }
}

/**
 * other_text フィールドの値を復元する
 */
function restoreOtherText(q) {
  if (!q.other_text_column) return;
  const saved = state.formState[q.other_text_column];
  if (!saved) return;
  const el = document.getElementById(`other-text-${q.id}`);
  if (el) el.value = saved;
}

// ─── イベントリスナー ──────────────────────────────────────────────

/**
 * 現在の設問にイベントリスナーを設定する
 */
function attachEventListeners(q) {
  if (q.type === 'email') {
    const el = document.getElementById(`input-${q.id}`);
    if (el) {
      el.addEventListener('blur', () => {
        const result = validateEmailRealtime(el.value);
        const hint = document.getElementById(`email-hint-${q.id}`);
        if (hint) {
          hint.textContent = result.error;
          hint.className = result.error ? 'email-hint error' : 'email-hint';
        }
      });
    }
  }

  if (q.type === 'text_area') {
    const el = document.getElementById(`input-${q.id}`);
    if (el) {
      el.addEventListener('input', () => {
        updateCharCount(q.id, el.value, q.validation?.max_length);
      });
    }
  }

  if (q.type === 'single_choice') {
    const radios = document.querySelectorAll(`input[name="q-${q.id}"]`);
    radios.forEach((radio) => {
      radio.addEventListener('change', () => {
        toggleOtherTextVisibility(q.id, radio.value);
        clearError(q.id);
      });
    });
  }

  if (q.type === 'multiple_choice') {
    const checkboxes = document.querySelectorAll(`input[name="q-${q.id}"]`);
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        handleExclusiveChoice(q.id, cb);
        toggleOtherTextVisibility(q.id, cb.value, cb.checked);
        clearError(q.id);
      });
    });
  }
}

/**
 * 「その他」のテキスト入力フィールドを表示・非表示にする
 * @param {string} qId - 設問ID
 * @param {string} selectedValue - 変化したオプションの value
 * @param {boolean|undefined} isChecked
 *   - undefined: single_choice（ラジオ）
 *   - true/false: multiple_choice（チェックボックス）の checked 状態
 */
function toggleOtherTextVisibility(qId, selectedValue, isChecked) {
  const otherWrap = document.getElementById(`other-wrap-${qId}-other`);
  if (!otherWrap) return;

  if (selectedValue === 'other') {
    // single_choice: isChecked は undefined → 常に表示（other を選択したということ）
    // multiple_choice: isChecked が true なら表示、false なら非表示
    const shouldShow = isChecked === undefined ? true : isChecked;
    otherWrap.style.display = shouldShow ? 'block' : 'none';
    if (shouldShow) {
      const input = otherWrap.querySelector('.other-text-input');
      if (input) setTimeout(() => input.focus(), 100);
    }
  } else if (isChecked === undefined) {
    // single_choice で other 以外が選択された → other テキストを非表示
    otherWrap.style.display = 'none';
  }
  // multiple_choice で other 以外のオプションが変化しても other wrap には影響しない
}

/**
 * 排他選択の処理（exclusive: true なオプション）
 */
function handleExclusiveChoice(qId, changedCb) {
  const checkboxes = document.querySelectorAll(`input[name="q-${qId}"]`);

  if (changedCb.checked && changedCb.dataset.exclusive === 'true') {
    // 排他オプションが選択された → 他をすべて解除
    checkboxes.forEach((cb) => {
      if (cb !== changedCb) {
        cb.checked = false;
        // other text を非表示に
        const wrap = document.getElementById(`other-wrap-${qId}-${cb.value}`);
        if (wrap) wrap.style.display = 'none';
      }
    });
  } else if (changedCb.checked && changedCb.dataset.exclusive !== 'true') {
    // 通常オプションが選択された → 排他オプションを解除
    checkboxes.forEach((cb) => {
      if (cb.dataset.exclusive === 'true') {
        cb.checked = false;
      }
    });
  }
}

// ─── 入力値の収集 ─────────────────────────────────────────────────

/**
 * 現在表示中の設問の入力値を収集する
 * @param {string} qId
 * @returns {{ value: *, formStateUpdate: Object }}
 */
function collectCurrentInput(qId) {
  const q = getQuestion(qId);
  if (!q) return { value: null, formStateUpdate: {} };

  let value = null;
  const formStateUpdate = {};

  if (q.type === 'text' || q.type === 'email' || q.type === 'text_area') {
    const el = document.getElementById(`input-${qId}`);
    value = el ? el.value.trim() : '';
  } else if (q.type === 'single_choice') {
    const selected = document.querySelector(`input[name="q-${qId}"]:checked`);
    value = selected ? selected.value : null;

    // other_text を収集（other 以外が選択された場合はクリア）
    if (q.other_text_column) {
      if (value === 'other') {
        const otherEl = document.getElementById(`other-text-${qId}`);
        formStateUpdate[q.other_text_column] = otherEl ? otherEl.value.trim() : '';
      } else {
        formStateUpdate[q.other_text_column] = '';
      }
    }
  } else if (q.type === 'multiple_choice') {
    const checked = document.querySelectorAll(`input[name="q-${qId}"]:checked`);
    value = Array.from(checked).map((cb) => cb.value);

    // other_text を収集（other が含まれない場合はクリア）
    if (q.other_text_column) {
      if (value.includes('other')) {
        const otherEl = document.getElementById(`other-text-${qId}`);
        formStateUpdate[q.other_text_column] = otherEl ? otherEl.value.trim() : '';
      } else {
        formStateUpdate[q.other_text_column] = '';
      }
    }
  }

  return { value, formStateUpdate };
}

// ─── UI 更新 ──────────────────────────────────────────────────────

/**
 * 進捗バーを更新する
 */
function updateProgress() {
  const total = state.visibleQuestions.length;
  const current = state.currentIndex + 1;
  const percent = getProgressPercent(state.currentIndex, state.answers);

  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');

  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${current} / ${total}`;
}

/**
 * ナビゲーションボタンの表示を更新する
 */
function updateNavButtons() {
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const btnSubmit = document.getElementById('btn-submit');
  const isLast = isLastQuestion(state.currentIndex, state.answers);

  // 戻るボタン
  btnBack.style.display = state.currentIndex > 0 ? 'inline-flex' : 'none';

  // 次へ / 送信 の切り替え
  if (isLast) {
    btnNext.style.display = 'none';
    btnSubmit.style.display = 'inline-flex';
  } else {
    btnNext.style.display = 'inline-flex';
    btnSubmit.style.display = 'none';
  }
}

/**
 * エラーメッセージを表示する
 */
function showError(qId, message) {
  const el = document.getElementById(`error-${qId}`);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
    // エラー要素にスクロール
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * エラーメッセージをクリアする
 */
function clearError(qId) {
  if (qId) {
    const el = document.getElementById(`error-${qId}`);
    if (el) {
      el.textContent = '';
      el.classList.remove('visible');
    }
  } else {
    // 全エラーをクリア
    document.querySelectorAll('.error-message').forEach((el) => {
      el.textContent = '';
      el.classList.remove('visible');
    });
  }
}

/**
 * 文字数カウンターを更新する
 */
function updateCharCount(qId, text, maxLen) {
  if (!maxLen) return;
  const el = document.getElementById(`char-count-${qId}`);
  if (!el) return;
  const remaining = maxLen - (text || '').length;
  el.textContent = remaining >= 0 ? `残り${remaining}文字` : `${Math.abs(remaining)}文字オーバー`;
  el.className = remaining < 0 ? 'char-count over' : 'char-count';
}

/**
 * 指定のスクリーンを表示する（他は非表示）
 * @param {string} screenId
 */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((el) => {
    el.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

// ─── ユーティリティ ────────────────────────────────────────────────

/**
 * HTML エスケープ
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ※ storage.js の submitSurvey() は questions.js → branching.js → validation.js →
//    storage.js → survey.js の読み込み順でグローバルスコープに存在する
