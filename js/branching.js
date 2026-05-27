/**
 * 分岐・動的フィルタリング処理
 * - 表示設問の順序決定
 * - Q4_2 の動的選択肢フィルタリング
 * - Q5/Q6 の動的選択肢出し分け
 * - Q4_2 の動的文言切り替え
 */

/**
 * 現在の回答状態をもとに表示する設問IDの配列を返す
 * - Q1・Q2は 'Q1_Q2' として1画面にグループ化
 * - Q9は削除済み、Q10は常時表示
 * @param {Object} answers - { Q1: 'value', Q2: 'email', ... }
 * @returns {string[]} - 表示順の設問ID配列
 */
function getVisibleQuestions(answers) {
  const q3 = answers['Q3'];

  // Q1+Q2 を1画面にまとめた仮想ID 'Q1_Q2' を使用
  const list = ['Q1_Q2', 'Q3'];

  // Q3=reservation_tool のときだけ Q4 を表示
  if (q3 === 'reservation_tool') {
    list.push('Q4');
  }

  // Q9 削除済み・Q10 は常時表示
  list.push('Q4_2', 'Q5', 'Q6', 'Q7', 'Q8', 'Q10', 'Q11');
  return list;
}

/**
 * Q4_2 の表示選択肢を返す
 * ※ 動的フィルタリング・動的文言切り替えは廃止
 *    Q4で選んだサービスも含む全選択肢をそのまま返す
 * @param {Object} answers
 * @returns {Array}
 */
function getQ4_2Options(answers) {
  return getQuestion('Q4_2').options;
}

/**
 * Q5 の表示選択肢を返す（Q3 による動的出し分け）
 * @param {Object} answers
 * @returns {Array}
 */
function getQ5Options(answers) {
  return _filterByQ3(getQuestion('Q5').options, answers['Q3']);
}

/**
 * Q6 の表示選択肢を返す（Q3 による動的出し分け）
 * @param {Object} answers
 * @returns {Array}
 */
function getQ6Options(answers) {
  return _filterByQ3(getQuestion('Q6').options, answers['Q3']);
}

/**
 * 設問の表示選択肢を返す（動的出し分けを考慮）
 * @param {string} questionId
 * @param {Object} answers
 * @returns {Array}
 */
function getOptionsForQuestion(questionId, answers) {
  switch (questionId) {
    case 'Q4_2':
      return getQ4_2Options(answers);
    case 'Q5':
      return getQ5Options(answers);
    case 'Q6':
      return getQ6Options(answers);
    default: {
      const q = getQuestion(questionId);
      return q ? q.options || [] : [];
    }
  }
}

/**
 * visible_when.Q3 に基づいてオプションをフィルタリング
 * @param {Array} options
 * @param {string} q3Value
 * @returns {Array}
 */
function _filterByQ3(options, q3Value) {
  if (!q3Value) return options;
  return options.filter((opt) => {
    if (!opt.visible_when || !opt.visible_when.Q3) return true;
    return opt.visible_when.Q3.includes(q3Value);
  });
}

/**
 * 現在の設問インデックスが「最後の設問」かどうか
 * @param {number} currentIndex - visibleQuestions 内のインデックス
 * @param {Object} answers
 * @returns {boolean}
 */
function isLastQuestion(currentIndex, answers) {
  const visible = getVisibleQuestions(answers);
  return currentIndex >= visible.length - 1;
}

/**
 * 進捗率（0〜100）を返す
 * @param {number} currentIndex
 * @param {Object} answers
 * @returns {number}
 */
function getProgressPercent(currentIndex, answers) {
  const visible = getVisibleQuestions(answers);
  if (visible.length === 0) return 0;
  return Math.round(((currentIndex) / visible.length) * 100);
}
