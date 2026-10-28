// Design Ref: DESIGN.md §4.1 ① 파일 읽기 — CSV의 한글 인코딩을 자동으로 판별하고 표로 나눈다 (브라우저에서만 처리).
// - 구글폼에서 바로 받은 CSV: UTF-8 (맨 앞 BOM 포함)
// - 엑셀에서 다시 저장한 CSV: CP949(EUC-KR)인 경우가 많음
import Papa from "papaparse";
import { toSurveyTable, type SurveyTable, type TableReadResult } from "./table";

export type CsvEncoding = "UTF-8" | "CP949";

export interface CsvTable extends SurveyTable {
  /** 판별한 한글 인코딩 — 화면에서 확인용으로 보여 준다 */
  encoding: CsvEncoding;
}

/**
 * UTF-8 엄격 모드로 읽다가 맞지 않는 바이트가 나오면 CP949로 다시 읽는다.
 * UTF-8 엄격 모드는 CP949 한글을 거의 항상 오류로 잡아내므로, 깨진 글자를 그대로 보여 주는 일이 없다.
 * 맨 앞의 BOM은 TextDecoder가 자동으로 떼어 낸다.
 */
export function decodeCsvBytes(bytes: Uint8Array): { text: string; encoding: CsvEncoding } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), encoding: "UTF-8" };
  } catch {
    // 브라우저 표준에서 "euc-kr"은 CP949(엑셀 한국어 저장 형식)를 가리킨다
    return { text: new TextDecoder("euc-kr").decode(bytes), encoding: "CP949" };
  }
}

/** CSV 글자를 표로 나눈다. 따옴표 안의 쉼표·줄바꿈("" 포함)도 한 칸으로 읽는다. */
export function parseCsvText(text: string): TableReadResult {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  // 따옴표가 닫히지 않은 것처럼 칸 경계를 알 수 없는 오류만 실패로 본다 (칸 수가 다른 줄은 표 정리에서 맞춘다)
  const fatal = parsed.errors.find((error) => error.type === "Quotes");
  if (fatal) {
    return { ok: false, reason: `${fatal.row !== undefined ? `${fatal.row + 1}번째 줄 근처에서 ` : ""}따옴표가 닫히지 않았어요.` };
  }
  return toSurveyTable(parsed.data);
}

export async function readCsvFile(file: Blob): Promise<TableReadResult<CsvTable>> {
  const { text, encoding } = decodeCsvBytes(new Uint8Array(await file.arrayBuffer()));
  const read = parseCsvText(text);
  return read.ok ? { ok: true, table: { ...read.table, encoding } } : read;
}
