// Design Ref: DESIGN.md §4.1 ① 파일 읽기, §12 시트 선택 결정 — 엑셀(.xlsx)의 모든 시트를 읽어 CSV와 같은 표 모양으로 만든다 (브라우저에서만 처리).
// 시트가 2개 이상이면 의견 열 선택 화면에서 시트를 고른다. 기본은 첫 시트.
import { toSurveyTable, type SurveyTable, type TableReadResult } from "./table";

export interface XlsxSheetTable extends SurveyTable {
  sheetName: string;
}

/** read-excel-file이 돌려주는 시트 모양 */
type CellValue = string | number | boolean | Date | null;
export interface RawSheet {
  sheet: string;
  data: CellValue[][];
}

/** 칸 값을 글자로 바꾼다 — 숫자·날짜도 화면과 AI에 글자로 보내기 위해 */
function cellToText(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  return String(value);
}

/** 시트들을 표로 바꾼다. 내용이 없는 시트는 뺀다. */
export function sheetsToTables(sheets: readonly RawSheet[]): TableReadResult<{ sheets: XlsxSheetTable[] } & SurveyTable> {
  const tables: XlsxSheetTable[] = [];
  for (const { sheet, data } of sheets) {
    const read = toSurveyTable(data.map((row) => row.map(cellToText)));
    if (read.ok) tables.push({ ...read.table, sheetName: sheet });
  }
  if (tables.length === 0) {
    return { ok: false, reason: "엑셀 파일 안에 응답이 들어 있는 시트가 없어요." };
  }
  // 첫 시트를 기본 표로, 전체 시트 목록을 함께 돌려준다
  return { ok: true, table: { ...tables[0], sheets: tables } };
}

export async function readXlsxFile(file: Blob): Promise<TableReadResult<{ sheets: XlsxSheetTable[] } & SurveyTable>> {
  // 엑셀 읽기 도구는 엑셀 파일을 올릴 때만 내려받는다 (CSV만 쓰는 경우 화면을 가볍게)
  const { default: readExcelFile } = await import("read-excel-file/browser");
  try {
    return sheetsToTables((await readExcelFile(file)) as RawSheet[]);
  } catch {
    return { ok: false, reason: "엑셀 파일이 손상됐거나 암호가 걸려 있어 읽을 수 없어요." };
  }
}
