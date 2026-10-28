// 예시 파일 생성 스크립트들이 함께 쓰는 CSV 도구 (앱 코드에서는 쓰지 않는다)

/** 따옴표 안의 쉼표·줄바꿈·"" 를 처리하는 작은 CSV 해석기 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** 구글폼처럼 모든 칸을 따옴표로 감싸고 CRLF로 줄을 나눈다 */
export function toCsv(rows) {
  return rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
}
