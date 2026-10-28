// Design Ref: DESIGN.md §4.1 ③ 정리 — 고른 열에서 빈칸(공백만 있는 칸 포함)을 빼고, 나머지에 1부터 번호를 매긴다.
// 번호는 전체에서 하나뿐이라, 의견이 많아 묶음으로 나눠 분석해도 겹치지 않는다 (DESIGN.md §4.3).
import type { OpinionInput } from "./types";

export interface ExtractedOpinions {
  opinions: OpinionInput[];
  /** 빈칸으로 빠진 칸 수 — 화면에 "빈칸 N건 제외"로 보여 준다 */
  blankCount: number;
}

export function extractOpinions(rows: readonly string[][], columnIndex: number): ExtractedOpinions {
  const opinions: OpinionInput[] = [];
  let blankCount = 0;
  for (const row of rows) {
    // 앞뒤 공백만 정리하고 글 내용은 그대로 둔다 (PRD 원문 임의 변경 금지)
    const text = (row[columnIndex] ?? "").trim();
    if (text === "") blankCount++;
    else opinions.push({ id: opinions.length + 1, text });
  }
  return { opinions, blankCount };
}
