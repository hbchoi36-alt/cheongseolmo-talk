// PLAN 작업 2 — 비식별 예시 설문 파일을 만든다.
//
// 기준 파일: googleform-export.csv
//   운영자가 구글폼에서 직접 설문을 만들고 가상 응답 30건을 넣은 뒤 내려받은 원본이다. (모두 가상 데이터)
//   실제 업로드 형식 그대로 검증해야 하므로 이 파일은 절대 고치지 않는다. (UTF-8 + BOM, 모든 칸 따옴표, CRLF)
//
// 만드는 파일 (기준 파일과 같은 응답 30건)
//   opinions-utf8.csv   BOM 없는 UTF-8 (다른 프로그램에서 저장한 경우)
//   opinions-cp949.csv  엑셀에서 다시 저장해 한글 인코딩이 CP949로 바뀐 경우
//   opinions.xlsx       엑셀 파일
//
// 확인용 파일
//   edge-cases.csv      이름·욕설·빈칸·줄바꿈·복수선택 등 규칙 확인용 가상 응답 (구글폼 형식을 흉내 냄)
//   운영자가 업로드 전에 이름·욕설을 미리 걸러 내더라도, 앱의 이름 가림·순화 기능은 안전장치로 남으므로 이 파일로 확인한다.
//
// 실행: node samples/make-samples.mjs
import { readFileSync, writeFileSync } from "node:fs";
import iconv from "iconv-lite";
import writeExcelFile from "write-excel-file/node";

const OUT_DIR = new URL("./", import.meta.url);
const SOURCE = new URL("googleform-export.csv", OUT_DIR);

// 따옴표 안의 쉼표·줄바꿈·"" 를 처리하는 작은 CSV 해석기 (예시 파일 생성 전용)
function parseCsv(text) {
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

// 구글폼처럼 모든 칸을 따옴표로 감싸고 CRLF로 줄을 나눈다
function toCsv(rows) {
  return rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
}

const sourceText = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(SOURCE)); // BOM은 자동으로 빠진다
const table = parseCsv(sourceText);
const [headers] = table;

// 1) BOM 없는 UTF-8
const csv = toCsv(table);
writeFileSync(new URL("opinions-utf8.csv", OUT_DIR), csv, "utf8");

// 2) 엑셀 재저장 형식 (CP949)
writeFileSync(new URL("opinions-cp949.csv", OUT_DIR), iconv.encode(csv, "cp949"));

// 3) 엑셀 파일 — 구글 스프레드시트 기본 시트 이름 사용
const xlsxPath = new URL("opinions.xlsx", OUT_DIR).pathname.replace(/^\/([A-Za-z]:)/, "$1");
await writeExcelFile(table, { sheet: "설문지 응답 시트1" }).toFile(decodeURIComponent(xlsxPath));

// 4) 규칙 확인용 가상 응답 — 열 이름은 기준 파일과 같게, 타임스탬프는 구글폼 형식으로
//    2번 문항(구체적 경험·사례)에 확인할 사례를 넣었다. 이름은 모두 가상의 이름이다.
//    빈칸 2건(완전히 빈 칸, 공백만), 사람 이름 3건, 욕설·공격 표현 2건, 줄바꿈 1건, 따옴표 2건, 복수선택 2건
const EDGE_ROWS = [
  ["조직개방성 및 소통문화, 근태(유연근무, 휴가 등)", "김민수 과장님이 매번 퇴근 직전에 업무를 몰아주셔서 야근이 일상이 됐습니다.", "업무 요청은 오후 4시 전까지 하는 규칙이 있으면 좋겠어요.", "급하게 처리하는 업무 방식", ""],
  ["조직개방성 및 소통문화", "이영희 팀장님은 의견을 잘 들어주시는데, 다른 부서는 그런 분위기가 아니라고 들었어요.", "잘 운영되는 부서의 사례를 공유하면 좋겠어요.", "부서마다 다른 문화", ""],
  ["조직개방성 및 소통문화", "박철수 부장님이 \"요즘 애들은\"이라는 말을 자주 하셔서 세대 간 거리감이 커졌어요.", "세대 간 소통 프로그램이 있으면 좋겠습니다.", "세대 차이", ""],
  ["조직개방성 및 소통문화", "회의 때마다 소리 지르는 사람 때문에 진짜 열받아 미치겠습니다. 이게 무슨 회의입니까? 개판이에요.", "회의 예절 가이드를 만들어 주세요.", "문제를 지적하기 어려운 분위기", ""],
  ["업무방식", "윗선은 현장을 하나도 모르면서 지시만 해요. 머리가 있는 건지 의심스럽고 짜증 나 죽겠습니다.", "관리자가 현장을 직접 둘러보는 날을 정해 주세요.", "소통 단절", ""],
  ["업무방식", "새로운 아이디어를 내도 \"전례가 없다\"는 말로 끝납니다.\n그래서 이제는 아무도 제안하지 않아요.", "작은 아이디어라도 시범 운영해 볼 수 있는 제도가 있으면 좋겠습니다.", "폐쇄적 문화", "직원 제안 제도는 어떻게 운영되고 있나요?"],
  ["복리후생 및 근무환경, 인사제도(이동, 평가, 승진)", "", "", "", "다른 부서 사람들과 이야기할 기회가 더 많았으면 좋겠습니다."],
  ["예산 및 회계", "   ", "", "", ""],
];
const edgeTable = [
  headers,
  ...EDGE_ROWS.map((answers, i) => {
    const hour = 9 + i;
    const time = `${hour > 12 ? hour - 12 : hour}:0${i}:00 ${hour >= 12 ? "오후" : "오전"}`;
    return [`2026/10/29 ${time} GMT+9`, ...answers];
  }),
];
writeFileSync(new URL("edge-cases.csv", OUT_DIR), "﻿" + toCsv(edgeTable), "utf8");

console.log(`기준 파일 응답 ${table.length - 1}건으로 파생 파일 3종, 확인용 응답 ${EDGE_ROWS.length}건 생성 완료`);
