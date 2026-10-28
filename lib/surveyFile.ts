// Design Ref: DESIGN.md §3.2 ① 시작 화면, §9 오류 처리 — 올린 설문 파일이 CSV·엑셀(.xlsx)인지 먼저 확인한다.
// 파일 내용을 읽는 일은 PLAN 작업 11(CSV)·12(xlsx)에서 한다.

export type SurveyFileKind = "csv" | "xlsx";

/** 설문 파일 크기 상한 — 의견 수만 건도 수 MB 안쪽이므로, 잘못 고른 큰 파일(동영상 등)을 일찍 걸러 낸다 */
export const MAX_SURVEY_FILE_BYTES = 20 * 1024 * 1024;

export type SurveyFileCheck = { ok: true; kind: SurveyFileKind } | { ok: false; reason: string };

/** 파일 이름(확장자)과 크기로 올릴 수 있는 파일인지 확인한다. 이유는 운영자가 무엇을 해야 할지 알 수 있게 쓴다. */
export function checkSurveyFile(file: { name: string; size: number }): SurveyFileCheck {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";

  if (extension === "csv" || extension === "xlsx") {
    if (file.size === 0) return { ok: false, reason: "빈 파일이에요. 설문 결과가 들어 있는 파일을 골라 주세요." };
    if (file.size > MAX_SURVEY_FILE_BYTES) return { ok: false, reason: "파일이 너무 커요 (20MB까지). 설문 결과 파일이 맞는지 확인해 주세요." };
    return { ok: true, kind: extension };
  }

  if (extension === "zip") {
    return { ok: false, reason: "압축 파일(.zip)이에요. 구글폼에서 받은 .zip 파일은 압축을 풀고 안에 있는 CSV 파일을 올려 주세요." };
  }
  if (extension === "xls") {
    return { ok: false, reason: "예전 엑셀 형식(.xls)은 읽을 수 없어요. 엑셀에서 [다른 이름으로 저장] → 'Excel 통합 문서(.xlsx)'로 저장해 올려 주세요." };
  }
  if (extension === "json") {
    return { ok: false, reason: "결과 파일(.json)이에요. 오른쪽 [저장한 결과 파일 불러오기]로 올려 주세요." };
  }
  return { ok: false, reason: "CSV 또는 엑셀(.xlsx) 파일만 올릴 수 있어요." };
}
