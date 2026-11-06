/**
 * バリデーション処理
 * 各設問の入力値を検証し、エラーメッセージを返す
 */

/**
 * 設問の回答を検証する
 * @param {string} questionId
 * @param {*} value - 回答値（テキスト or 選択値 or 配列）
 * @param {Object} answers - 全回答（他設問の値参照用）
 * @param {Object} [formState] - フォームの追加状態（other_text等）
 * @returns {{ valid: boolean, error: string }}
 */
function validateQuestion(questionId, value, answers, formState) {
  const q = getQuestion(questionId);
  if (!q) return { valid: true, error: '' };

  // ─── 必須チェック ───────────────────────────────────────────
  if (q.required) {
    if (q.type === 'text' || q.type === 'email' || q.type === 'text_area') {
      if (!value || String(value).trim() === '') {
        return { valid: false, error: _requiredMessage(q) };
      }
    } else if (q.type === 'single_choice') {
      if (!value) {
        return { valid: false, error: 'いずれかを選択してください' };
      }
    } else if (q.type === 'multiple_choice') {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) {
        return { valid: false, error: 'いずれかを選択してください' };
      }
    }
  }

  // ─── メールアドレス形式チェック ─────────────────────────────
  if (q.type === 'email' && value && String(value).trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value).trim())) {
      return { valid: false, error: '正しいメールアドレスを入力してください' };
    }
  }

  // ─── 文字数チェック ─────────────────────────────────────────
  if (q.validation) {
    const v = q.validation;
    const str = String(value || '');
    if (v.max_length && str.length > v.max_length) {
      return { valid: false, error: `${v.max_length}文字以内で入力してください（現在${str.length}文字）` };
    }
    if (v.min_length && str.length < v.min_length && q.required) {
      return { valid: false, error: _requiredMessage(q) };
    }
  }

  // ─── 「その他」自由記述の必須チェック ───────────────────────
  // single_choice / multiple_choice で other を選んだ場合、対応するテキストが必須
  if ((q.type === 'single_choice' || q.type === 'multiple_choice') && formState) {
    const otherTextKey = q.other_text_column;
    if (otherTextKey) {
      const isOtherSelected = q.type === 'single_choice'
        ? value === 'other'
        : Array.isArray(value) && value.includes('other');

      if (isOtherSelected) {
        const otherText = formState[otherTextKey] || '';
        if (otherText.trim() === '') {
          return { valid: false, error: '「その他」の内容を入力してください' };
        }
        // その他テキストの文字数チェック（最大200文字）
        if (otherText.length > 200) {
          return { valid: false, error: 'その他の記述は200文字以内で入力してください' };
        }
      }
    }
  }

  return { valid: true, error: '' };
}

/**
 * メールアドレスのリアルタイム形式チェック
 * @param {string} email
 * @returns {{ valid: boolean, error: string }}
 */
function validateEmailRealtime(email) {
  if (!email || email.trim() === '') return { valid: true, error: '' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: '正しいメールアドレスを入力してください' };
  }
  return { valid: true, error: '' };
}

/**
 * テキストエリアの文字数チェック
 * @param {string} text
 * @param {number} maxLength
 * @returns {{ valid: boolean, remaining: number, error: string }}
 */
function validateTextLength(text, maxLength) {
  const len = (text || '').length;
  const remaining = maxLength - len;
  if (remaining < 0) {
    return {
      valid: false,
      remaining,
      error: `${maxLength}文字以内で入力してください（あと${Math.abs(remaining)}文字オーバー）`,
    };
  }
  return { valid: true, remaining, error: '' };
}

// ─── ヘルパー ────────────────────────────────────────────────────

function _requiredMessage(q) {
  if (q.type === 'text' || q.type === 'email') {
    return `${q.label}を入力してください`;
  }
  return 'この項目は必須です';
}
