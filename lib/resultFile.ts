// Design Ref: DESIGN.md §4 데이터 흐름(결과 파일 → 형식·규칙 검증 → 생각나무, AI 호출 없음), §9 오류 처리
// 저장해 둔 결과 파일(.json)의 글자를 읽어 앱에서 쓸 수 있는 결과인지 확인한다. 브라우저에서만 처리하고 서버로 보내지 않는다.
import { RESULT_FILE_VERSION, resultFileSchema, type ResultFile } from "./types";
import { validateResultFile } from "./validate";

/** 결과 파일 크기 상한 — 의견 수천 건도 수 MB를 넘지 않으므로, 잘못 고른 큰 파일을 일찍 걸러 낸다 */
export const MAX_RESULT_FILE_BYTES = 10 * 1024 * 1024;

export type ResultFileReadResult =
  | { ok: true; result: ResultFile }
  | { ok: false; reason: string };

/** 내려받을 파일 이름 — 언제 만든 결과인지 알 수 있게 내려받은 날짜·시각을 붙인다 (예: 청설모Talk-결과-20261028-2130.json) */
export function resultFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `청설모Talk-결과-${stamp}.json`;
}

/** 결과를 파일에 쓸 글자로 바꾼다 — 메모장으로 열어도 읽기 쉽게 줄을 나눈다 */
export function serializeResultFile(result: ResultFile): string {
  return JSON.stringify(result, null, 2) + "\n";
}

/** 화면에 보여줄 이유는 운영자가 무엇을 해야 할지 알 수 있게 짧게 쓴다 */
export function readResultFile(text: string): ResultFileReadResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "결과 파일(.json) 형식이 아니에요. 앱에서 내려받은 파일을 골라 주세요." };
  }

  if (typeof data === "object" && data !== null && "version" in data && data.version !== RESULT_FILE_VERSION) {
    return { ok: false, reason: `이 앱과 다른 버전의 결과 파일이에요 (파일 버전 ${String(data.version)}).` };
  }

  const parsed = resultFileSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, reason: "결과 파일의 내용이 일부 빠졌거나 바뀌었어요. 앱에서 내려받은 파일을 그대로 골라 주세요." };
  }

  // 메모장 등으로 직접 고친 파일도 PRD 규칙(주제 7개, 요약 100자 등)을 지키는지 확인한다
  const check = validateResultFile(parsed.data);
  if (!check.ok) {
    return { ok: false, reason: check.violations[0].message };
  }

  return { ok: true, result: parsed.data };
}
