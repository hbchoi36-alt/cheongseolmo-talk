// PLAN 작업 4 — 구글폼 예시 30건을 사람이 직접 분류한 가짜 분석 결과(result-example.json)를 만든다.
// AI를 연결하기 전에 생각나무 화면(PLAN 작업 6~9)을 개발·확인하는 데 쓴다.
// 형식은 lib/types.ts의 결과 파일 형식(ResultFile)을 따르고, lib/validate.ts 규칙을 지킨다.
//
// 분석 대상: googleform-export.csv의 2번 문항(구체적 경험·사례) 30건, 의견 번호 = 응답 순서(1~30)
// 원본에 이름·욕설이 없으므로 화면용 문장은 원문 그대로이고 순화된 의견도 없다.
// 23·25번은 두 주제에 걸친 의견이라 주제마다 센다 (도토리 건수 합 32건 ≥ 의견 30건).
// 주제는 '기타' 포함 7개다 (PRD §5).
//
// 실행: node samples/make-result-example.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { parseCsv } from "./csv-utils.mjs";

const OUT_DIR = new URL("./", import.meta.url);
const SOURCE_FILE = "googleform-export.csv";
const OPINION_COLUMN = 2; // 0: 타임스탬프, 1: 개선 분야, 2: 구체적 경험·사례

const sourceText = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(new URL(SOURCE_FILE, OUT_DIR)));
const [, ...answers] = parseCsv(sourceText);

// 빈칸을 빼고 1부터 번호를 매긴다 (앱의 ③ 정리 단계와 같은 규칙)
const opinions = answers
  .map((row) => row[OPINION_COLUMN])
  .filter((text) => text.trim() !== "")
  .map((text, index) => ({ id: index + 1, displayText: text, softened: false }));

// 의견이 많은 주제부터 (도토리 자리 배치 순서)
const topics = [
  {
    name: "업무 효율화",
    summary: "업무분장 편중, 반복 보고, 중복 입력, 다단계 결재 등 일하는 방식의 비효율을 줄여 달라는 의견이 많았어요.",
    discussionQuestions: [
      "가장 먼저 줄이고 싶은 반복 업무는 무엇인가요?",
      "업무량을 공정하게 나누려면 어떤 기준이 필요할까요?",
      "보고·결재 단계를 줄일 수 있는 업무는 무엇일까요?",
    ],
    opinionIds: [1, 5, 13, 18, 22, 26],
  },
  {
    name: "근무제도·환경",
    summary: "유연근무와 연차를 눈치 없이 쓰고 싶다는 의견과 집중 공간·회의실 등 근무 공간 개선 요청이 함께 나왔어요.",
    discussionQuestions: [
      "유연근무와 연차를 편하게 쓰려면 팀에서 무엇을 약속하면 좋을까요?",
      "업무 공백 걱정 없이 휴가를 쓰려면 어떤 준비가 필요할까요?",
    ],
    opinionIds: [4, 9, 11, 16, 20, 23],
  },
  {
    name: "소통과 제안",
    summary: "직급과 관계없이 의견을 말하고, 제안의 검토 결과를 확인할 수 있는 소통 구조를 원한다는 의견이 많았어요.",
    discussionQuestions: [
      "직급과 관계없이 의견을 말하려면 회의 방식이 어떻게 바뀌어야 할까요?",
      "제안의 검토 결과를 어떻게 알려 주면 좋을까요?",
      "부서 간 협업이 막힐 때 누가 조정하면 좋을까요?",
    ],
    opinionIds: [3, 8, 14, 19, 30],
  },
  {
    name: "인사 운영",
    summary: "인사이동 일정·기준의 사전 안내, 격지근무 부담 고려, 공정한 업무 기회와 수시 성과 피드백을 요청했어요.",
    discussionQuestions: [
      "인사 일정과 기준은 언제, 어디까지 미리 알려 줄 수 있을까요?",
      "연말 평가 전에 받고 싶은 피드백은 어떤 모습인가요?",
    ],
    opinionIds: [2, 7, 21, 27],
  },
  {
    name: "업무시간 외 연락",
    summary: "퇴근 후·휴가 중·휴게시간의 업무 연락에 대한 기준이 없어 쉬어도 쉬는 것 같지 않다는 의견이 있었어요.",
    discussionQuestions: [
      "어떤 경우를 '긴급 연락'으로 볼지 함께 정해 볼까요?",
      "퇴근 후 연락을 줄이려면 어떤 도구나 규칙이 도움이 될까요?",
    ],
    opinionIds: [6, 23, 28],
  },
  {
    name: "청렴·윤리",
    summary: "부적절한 지시의 경계, 선물·식사 기준, 이해충돌 상황을 사례 중심으로 쉽게 알고 싶다는 의견이 나왔어요.",
    discussionQuestions: [
      "판단이 애매한 지시를 받으면 어디에 먼저 물어보면 좋을까요?",
      "청렴 규정을 쉽게 익히려면 어떤 방식이 효과적일까요?",
    ],
    opinionIds: [10, 15, 25],
  },
  // 주제가 7개를 넘어, 의견 수가 적은 '예산·회계'(2건)와 '교육·성장'(3건)을 '기타'로 합쳤다 (PRD §5)
  {
    name: "기타",
    summary: "직무 교육 기회와 지역 근무자의 교육 접근성, 예산 집행 기준과 증빙 보완처럼 의견 수가 적은 주제를 모았어요.",
    discussionQuestions: [
      "가장 필요한 직무 교육은 무엇이고, 지역 근무자도 같은 기회를 얻으려면 무엇이 필요할까요?",
      "자주 보완하는 예산·회계 증빙 항목을 어떻게 미리 알릴 수 있을까요?",
    ],
    opinionIds: [12, 24, 25, 17, 29],
  },
];

const result = {
  version: 1,
  createdAt: "2026-10-28T10:30:00Z",
  sourceFileName: SOURCE_FILE,
  opinions,
  topics,
};

writeFileSync(new URL("result-example.json", OUT_DIR), JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`가짜 분석 결과 생성 완료: 의견 ${opinions.length}건, 주제 ${topics.length}개`);
