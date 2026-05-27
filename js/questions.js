/**
 * 設問データ定義
 * survey_questions.yaml v6.16 を JavaScript オブジェクトに変換したもの
 */

const SURVEY_METADATA = {
  version: '6.16',
  title: '鍼灸院 予約管理に関するアンケート',
  spreadsheetId: '17ybVxuJ61nLwdpwvtQuKrgQmZW85B21CT1-S3pBe3IA',
  sheetName: 'survey_responses',
};

// セクション定義
const SECTIONS = [
  { id: 'A', title: '基本情報' },
  { id: 'B', title: '現在の予約台帳と集客' },
  { id: 'C', title: '課題・ニーズ把握' },
  { id: 'D', title: '利用シーン把握' },
  { id: 'E', title: '今後への関心' },
  { id: 'F', title: 'ご意見・ご要望' },
];

// 設問データ
const QUESTIONS = [
  // ─── Section A ───────────────────────────────────────────────
  {
    id: 'Q1',
    section: 'A',
    type: 'text',
    label: '院名',
    required: true,
    validation: { min_length: 1, max_length: 100 },
    placeholder: '例：やまと鍼灸院',
    column_name: 'q1_clinic_name',
  },
  {
    id: 'Q2',
    section: 'A',
    type: 'email',
    label: 'メールアドレス',
    required: true,
    validation: { format: 'email', max_length: 200 },
    placeholder: 'example@clinic.jp',
    column_name: 'q2_email',
  },

  // ─── Section B ───────────────────────────────────────────────
  {
    id: 'Q3',
    section: 'B',
    type: 'single_choice',
    label: '現在、どんなふうに予約管理をしていますか？',
    sub_label: '予約情報を集約している場所',
    required: true,
    is_branching_source: true,
    options: [
      { value: 'paper', label: '紙で管理' },
      { value: 'excel', label: 'Excel・Googleスプレッドシートで管理' },
      { value: 'google_calendar', label: 'Googleカレンダーで管理' },
      { value: 'reservation_tool', label: '予約管理ツール（オンラインの予約システム）' },
      {
        value: 'other',
        label: 'その他',
        has_text_input: true,
        text_input_placeholder: '具体的にお書きください',
      },
    ],
    column_name: 'q3_management_type',
    other_text_column: 'q3_other_text',
    // 分岐ロジック：reservation_tool → Q4表示、それ以外 → Q4スキップ
  },
  {
    id: 'Q4',
    section: 'B',
    type: 'single_choice',
    label: '使っている予約管理ツールを教えてください',
    required: true,
    display_condition: "Q3 == 'reservation_tool'",
    options: [
      { value: 'stores', label: 'STORES 予約' },
      { value: 'airreserve', label: 'Airリザーブ' },
      { value: 'reserva', label: 'RESERVA' },
      { value: 'onemorehand', label: 'ワンモアハンド' },
      { value: 'hpb', label: 'ホットペッパービューティー(サロンボード)' },
      { value: 'epark', label: 'EPARK' },
      { value: 'ekiten', label: 'エキテン' },
      { value: 'kenkonihari', label: '健康にはり' },
      { value: 'line_tool', label: 'LINE連携ツール(リピッテ等)' },
      { value: 'ripikuru', label: 'リピくる' },
      { value: 'shinkyu', label: 'しんきゅう予約' },
      { value: 'receipt_machine', label: 'レセコンに付属する予約機能' },
      { value: 'hp_form', label: 'ホームページの予約フォーム' },
      {
        value: 'other',
        label: 'その他',
        has_text_input: true,
        text_input_placeholder: '具体的にお書きください',
      },
    ],
    column_name: 'q4_reservation_tool',
    other_text_column: 'q4_other_text',
  },
  {
    id: 'Q4_2',
    section: 'B',
    type: 'multiple_choice',
    label: '予約を受付けしている経路を教えてください',
    required: true,
    options: [
      { value: 'phone', label: '電話' },
      { value: 'in_store', label: '店頭（その場で口頭）' },
      { value: 'hpb', label: 'ホットペッパービューティー(サロンボード)' },
      { value: 'epark', label: 'EPARK' },
      { value: 'ekiten', label: 'エキテン' },
      { value: 'kenkonihari', label: '健康にはり' },
      { value: 'shinkyu_compass', label: 'しんきゅう予約・しんきゅうコンパス' },
      { value: 'line_official', label: 'LINE公式アカウント' },
      { value: 'own_website', label: '自院のホームページ' },
      { value: 'instagram_sns', label: 'Instagram・SNS' },
      {
        value: 'other',
        label: 'その他',
        has_text_input: true,
      },
      {
        value: 'not_using',
        label: 'ネット集客は活用していない', // Q3=reservation_tool のとき動的に変更
        exclusive: true,
        dynamic_label: {
          when: "Q3 == 'reservation_tool'",
          label: 'Q4で選んだサービス以外には活用していない',
        },
      },
    ],
    column_name: 'q4_2_marketing_channels',
    other_text_column: 'q4_2_other_text',
    // Q4-2 の動的フィルタリングルール（branching.js で処理）
    dynamic_filtering: {
      rules: [
        { when: "Q4 == 'hpb'", exclude_options: ['hpb'] },
        { when: "Q4 == 'epark'", exclude_options: ['epark'] },
        { when: "Q4 == 'ekiten'", exclude_options: ['ekiten'] },
        { when: "Q4 == 'kenkonihari'", exclude_options: ['kenkonihari'] },
        { when: "Q4 == 'shinkyu'", exclude_options: ['shinkyu_compass'] },
        { when: "Q4 == 'line_tool'", exclude_options: ['line_official'] },
        { when: "Q4 == 'hp_form'", exclude_options: ['own_website'] },
      ],
      exception: "Q4 == 'other'", // その他なら除外なし
    },
  },

  // ─── Section C ───────────────────────────────────────────────
  {
    id: 'Q5',
    section: 'C',
    type: 'multiple_choice',
    label: '予約管理で困っていることは？',
    required: false,
    options: [
      {
        value: 'double_booking',
        label: 'ダブルブッキングが起こる',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'input_mistakes',
        label: '記入・入力ミスが起こる',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'hard_to_read',
        label: '字が読みづらい',
        visible_when: { Q3: ['paper', 'other'] },
      },
      {
        value: 'no_remote_access',
        label: '外出先から予約状況を確認できない',
        visible_when: { Q3: ['paper', 'other'] },
      },
      {
        value: 'hard_to_search_history',
        label: '過去の予約履歴を探すのが大変',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'staff_share_failure',
        label: 'スタッフ間の情報共有が漏れる',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'double_writing',
        label: '予約を別の場所に書き直す二度手間',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'aggregation_difficult',
        label: '集計・売上分析に手間がかかる',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'manual_reminder',
        label: 'リマインド連絡が手動で大変',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'other'] },
      },
      {
        value: 'no_free_memo',
        label: '自由なメモが書き込めない',
        visible_when: { Q3: ['reservation_tool', 'other'] },
      },
      {
        value: 'no_karte_integration',
        label: '電子カルテ等との連携ができない',
        visible_when: { Q3: ['reservation_tool', 'other'] },
      },
      {
        value: 'complex_operation',
        label: '操作が複雑で習得が大変',
        visible_when: { Q3: ['reservation_tool', 'other'] },
      },
      {
        value: 'no_problem',
        label: '特に困っていない',
        exclusive: true,
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'other',
        label: 'その他',
        has_text_input: true,
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
    ],
    column_name: 'q5_difficulties',
    other_text_column: 'q5_other_text',
  },
  {
    id: 'Q6',
    section: 'C',
    type: 'multiple_choice',
    label: '今の方法で気に入っている点は？',
    required: false,
    options: [
      {
        value: 'familiar',
        label: '操作に慣れている',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'free_writing',
        label: '自由に書き込める',
        visible_when: { Q3: ['paper', 'excel', 'other'] },
      },
      {
        value: 'easy_overview',
        label: '一覧で見やすい',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'no_cost',
        label: 'コストがかからない',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'other'] },
      },
      {
        value: 'easy_share',
        label: 'スタッフと共有しやすい',
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'paper_safety',
        label: '紙で残るので安心',
        visible_when: { Q3: ['paper', 'other'] },
      },
      {
        value: 'no_power_needed',
        label: '電源・ネット接続が不要で安心',
        visible_when: { Q3: ['paper', 'other'] },
      },
      {
        value: 'automated',
        label: '予約管理が自動化されている',
        visible_when: { Q3: ['reservation_tool', 'other'] },
      },
      {
        value: 'access_anywhere',
        label: 'どこからでもアクセスできる',
        visible_when: { Q3: ['excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'nothing',
        label: '特になし',
        exclusive: true,
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
      {
        value: 'other',
        label: 'その他',
        has_text_input: true,
        visible_when: { Q3: ['paper', 'excel', 'google_calendar', 'reservation_tool', 'other'] },
      },
    ],
    column_name: 'q6_likes',
    other_text_column: 'q6_other_text',
  },
  {
    id: 'Q7',
    section: 'C',
    type: 'multiple_choice',
    label: '今の予約管理方法をオンライン化する場合、不安に感じることはありますか？',
    required: false,
    options: [
      { value: 'data_migration', label: '既存データの移行が大変そう' },
      { value: 'learn_operation', label: '操作を覚えるのが大変' },
      { value: 'staff_training', label: 'スタッフへの教育・浸透' },
      { value: 'incompatible_features', label: '運用に合わない機能の押し付け' },
      { value: 'no_free_writing', label: '自由に書き込めなくなる' },
      { value: 'monthly_cost', label: '月額費用の継続負担' },
      { value: 'system_failure', label: '通信障害・システム障害' },
      { value: 'elderly_patients', label: '高齢患者がネット予約を使えない' },
      { value: 'enough_now', label: '今のままで十分回っている' },
      { value: 'uncertain_effect', label: '効果が出るか分からない' },
      { value: 'past_failure', label: '過去のデジタル化失敗の経験' },
      { value: 'no_concern', label: '特に不安はない', exclusive: true },
      {
        value: 'other',
        label: 'その他',
        has_text_input: true,
      },
    ],
    column_name: 'q7_concerns',
    other_text_column: 'q7_other_text',
  },

  // ─── Section D ───────────────────────────────────────────────
  {
    id: 'Q8',
    section: 'D',
    type: 'multiple_choice',
    label: '予約を予約台帳に記録するタイミングは？',
    required: false,
    options: [
      { value: 'immediately', label: '予約を受けた瞬間' },
      { value: 'between_treatments', label: '施術の合間' },
      { value: 'end_of_day', label: '営業終了時などにまとめて' },
      { value: 'auto_recorded', label: '予約ツールが自動的に記録するため、意識していない' },
      { value: 'not_decided', label: '特に決まっていない' },
      { value: 'other', label: 'その他', has_text_input: true },
    ],
    column_name: 'q8_recording_timing',
    other_text_column: 'q8_other_text',
  },

  // ─── Section E ───────────────────────────────────────────────
  // Q9（改善への興味）は削除済み
  {
    id: 'Q10',
    section: 'E',
    type: 'text_area',
    label: 'どんな条件・機能・サポートがあれば予約管理ツールを使いますか？',
    required: false,
    validation: { max_length: 500 },
    placeholder: '例：月額3,000円以内なら、LINEと連携できるなら、使い方を教えてくれるなら...',
    column_name: 'q10_required_conditions',
  },

  // ─── Section F ───────────────────────────────────────────────
  {
    id: 'Q11',
    section: 'F',
    type: 'text_area',
    label: '予約管理に関するご意見・要望をご自由にお書きください',
    required: false,
    validation: { max_length: 1000 },
    placeholder: 'ご自由にお書きください（任意）',
    column_name: 'q11_free_comment',
  },
];

// スプレッドシートの列順（GAS と一致させる）
const COLUMN_ORDER = [
  'timestamp',
  'q1_clinic_name',
  'q2_email',
  'q3_management_type',
  'q3_other_text',
  'q4_reservation_tool',
  'q4_other_text',
  'q4_2_marketing_channels',
  'q4_2_other_text',
  'q5_difficulties',
  'q5_other_text',
  'q6_likes',
  'q6_other_text',
  'q7_concerns',
  'q7_other_text',
  'q8_recording_timing',
  'q8_other_text',
  'q9_interest_level',
  'q10_required_conditions',
  'q11_free_comment',
  'user_agent',
  'completion_time_seconds',
];

/**
 * 英語ID → 日本語ラベルのマッピング
 * スプレッドシートへの保存値を日本語化するために使用
 */
const VALUE_LABELS = {
  // Q3
  paper:              '紙で管理',
  excel:              'Excel・Googleスプレッドシートで管理',
  google_calendar:    'Googleカレンダーで管理',
  reservation_tool:   '予約管理ツール',
  // Q4
  stores:             'STORES予約',
  airreserve:         'Airリザーブ',
  reserva:            'RESERVA',
  onemorehand:        'ワンモアハンド',
  hpb:                'ホットペッパービューティー(サロンボード)',
  epark:              'EPARK',
  ekiten:             'エキテン',
  kenkonihari:        '健康にはり',
  line_tool:          'LINE連携ツール(リピッテ等)',
  ripikuru:           'リピくる',
  shinkyu:            'しんきゅう予約',
  receipt_machine:    'レセコンに付属する予約機能',
  hp_form:            'ホームページの予約フォーム',
  // Q4_2
  phone:              '電話',
  in_store:           '店頭（その場で口頭）',
  shinkyu_compass:    'しんきゅう予約・しんきゅうコンパス',
  line_official:      'LINE公式アカウント',
  own_website:        '自院のホームページ',
  instagram_sns:      'Instagram・SNS',
  not_using:          'ネット集客は活用していない',
  // Q5
  double_booking:           'ダブルブッキングが起こる',
  input_mistakes:           '記入・入力ミスが起こる',
  hard_to_read:             '字が読みづらい',
  no_remote_access:         '外出先から予約状況を確認できない',
  hard_to_search_history:   '過去の予約履歴を探すのが大変',
  staff_share_failure:      'スタッフ間の情報共有が漏れる',
  double_writing:           '予約を別の場所に書き直す二度手間',
  aggregation_difficult:    '集計・売上分析に手間がかかる',
  manual_reminder:          'リマインド連絡が手動で大変',
  no_free_memo:             '自由なメモが書き込めない',
  no_karte_integration:     '電子カルテ等との連携ができない',
  complex_operation:        '操作が複雑で習得が大変',
  no_problem:               '特に困っていない',
  // Q6
  familiar:         '操作に慣れている',
  free_writing:     '自由に書き込める',
  easy_overview:    '一覧で見やすい',
  no_cost:          'コストがかからない',
  easy_share:       'スタッフと共有しやすい',
  paper_safety:     '紙で残るので安心',
  no_power_needed:  '電源・ネット接続が不要で安心',
  automated:        '予約管理が自動化されている',
  access_anywhere:  'どこからでもアクセスできる',
  nothing:          '特になし',
  // Q7
  data_migration:         '既存データの移行が大変そう',
  learn_operation:        '操作を覚えるのが大変',
  staff_training:         'スタッフへの教育・浸透',
  incompatible_features:  '運用に合わない機能の押し付け',
  no_free_writing:        '自由に書き込めなくなる',
  monthly_cost:           '月額費用の継続負担',
  system_failure:         '通信障害・システム障害',
  elderly_patients:       '高齢患者がネット予約を使えない',
  enough_now:             '今のままで十分回っている',
  uncertain_effect:       '効果が出るか分からない',
  past_failure:           '過去のデジタル化失敗の経験',
  no_concern:             '特に不安はない',
  // Q8
  immediately:          '予約を受けた瞬間',
  between_treatments:   '施術の合間',
  end_of_day:           '営業終了時などにまとめて',
  auto_recorded:        '予約ツールが自動記録するため意識していない',
  not_decided:          '特に決まっていない',
  // Q9（削除済み・後方互換用）
  very_interested:  'とても興味あり',
  conditional:      '条件次第で興味あり',
  satisfied:        '今のままで満足',
  not_interested:   '興味なし',
  // 共通
  other: 'その他',
};

// 設問IDから設問定義を取得
function getQuestion(id) {
  return QUESTIONS.find((q) => q.id === id) || null;
}

// セクションIDからセクション定義を取得
function getSection(id) {
  return SECTIONS.find((s) => s.id === id) || null;
}
