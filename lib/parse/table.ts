// CSV·엑셀을 읽은 결과를 같은 모양으로 맞춘다 — 의견 열 선택 화면(PLAN 작업 13)은 파일 종류와 상관없이 이 표만 본다.

export interface SurveyTable {
  /** 열 이름 (첫 줄). 비어 있거나 겹치는 이름은 구별할 수 있게 바꿔 둔다 */
  headers: string[];
  /** 응답 줄. 모든 줄의 칸 수는 headers와 같다 */
  rows: string[][];
}

export type TableReadResult<T extends SurveyTable = SurveyTable> = { ok: true; table: T } | { ok: false; reason: string };

/** 첫 줄을 열 이름으로, 나머지를 응답으로 정리한다 (칸 수 맞추기, 빈 열 이름 채우기) */
export function toSurveyTable(cells: string[][]): TableReadResult {
  const nonEmpty = cells.filter((row) => row.some((cell) => cell.trim() !== ""));
  if (nonEmpty.length === 0) return { ok: false, reason: "파일 안에 내용이 없어요." };

  const [headerRow, ...answerRows] = nonEmpty;
  if (answerRows.length === 0) return { ok: false, reason: "열 이름만 있고 응답이 없어요." };

  const width = Math.max(headerRow.length, ...answerRows.map((row) => row.length));
  const seen = new Map<string, number>();
  const headers = Array.from({ length: width }, (_, i) => {
    const base = (headerRow[i] ?? "").trim() || `이름 없는 열 ${i + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
  const rows = answerRows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ""));

  return { ok: true, table: { headers, rows } };
}
