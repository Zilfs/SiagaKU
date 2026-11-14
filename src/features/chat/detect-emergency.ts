const EXPLAIN_AT_START =
  /^(tolong\s+)?(jelaskan|sebutkan|carikan|uraikan|beri tahu)\b/;

const INFO_QUESTION =
  /\b(apa|bagaimana|gimana|cara|mengapa|kenapa|kapan|berapa|di mana|dimana|siapa)\b/;

const CONDITIONAL = /\b(jika|kalau|saat|bila|ketika|sebelum|supaya|agar)\b/;

const FIRST_PERSON = /\b(saya|aku|kami|kita)\b/;

const POLA = [
  /air (sudah |udah )?masuk/,
  /terjebak/,
  /hanyut/,
  /tenggelam/,
  /kesetrum|tersengat listrik/,
  /tidak bisa keluar|gak bisa keluar|nggak bisa keluar/,
  /naik ke (atap|genteng)/,
  /dalam (keadaan )?darurat|situasi darurat|posisi darurat|ini darurat/,
  /butuh bantuan|minta bantuan/,
  /tolong (saya|kami|sekarang|cepat)/,
];

/**
 * Rule-based emergency check (docs/05 Desain AI §3.6). A request that starts
 * with "jelaskan/sebutkan/carikan" is informational. A "how to" question with
 * a condition ("apa yang harus dilakukan saat air masuk rumah") is also
 * informational, unless it talks about the user's own situation.
 */
export function detectEmergency(text: string): boolean {
  const value = text.trim().toLowerCase();
  if (!value) return false;

  if (EXPLAIN_AT_START.test(value)) return false;
  if (!POLA.some((pattern) => pattern.test(value))) return false;
  if (
    INFO_QUESTION.test(value) &&
    CONDITIONAL.test(value) &&
    !FIRST_PERSON.test(value)
  ) {
    return false;
  }

  return true;
}
