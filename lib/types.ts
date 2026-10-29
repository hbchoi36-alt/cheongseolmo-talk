// Design Ref: DESIGN.md §5 데이터 모델 — 브라우저와 서버가 함께 쓰는 분석 결과 형식
// 개수·글자 수 제한은 일부러 스키마에 넣지 않는다. 형식이 맞으면 일단 읽어 들이고,
// 규칙 위반은 결과 검증 함수(PLAN 작업 3)가 어떤 규칙을 어겼는지 구체적으로 알려준다.
import { z } from "zod";

/** PRD §5의 AI 규칙 수치. 검증 함수와 분석 지시문이 같은 값을 쓰도록 한 곳에 모아 둔다. */
export const RULES = {
  maxTopics: 7, // '기타' 포함. 넘으면 의견 수가 적은 주제부터 '기타'로 합친다 (PRD §5)
  maxSummaryLength: 100,
  maxQuestionsPerTopic: 3,
  maxTopicNameLength: 10, // 도토리 안에 큰 글자로 들어가도록 (DESIGN.md §3.5)
  maxOpinionsPerRequest: 300, // 분석 요청 1번에 보내는 최대 의견 수 (DESIGN.md §4.3)
  maxConcurrentBatches: 3, // 묶음 분석을 동시에 보내는 최대 개수 (DESIGN.md §4.3)
  maxMergeInputTopics: 200, // 병합 요청 1번에 보내는 최대 주제 수 (묶음별 주제를 모두 합친 개수)
  mergeSampleTextCount: 5, // 병합 때 주제마다 함께 보내는 대표 의견 수 (DESIGN.md §4.3)
  otherTopicName: "기타",
  nameMask: "●●",
} as const;

/** 결과 파일 형식 버전. 형식이 바뀌면 올리고, 불러오기에서 버전별로 처리한다. */
export const RESULT_FILE_VERSION = 1;

// ③ 서버로 보내는 의견 (번호 + 원문)

const opinionId = z.number().int();

export const opinionInputSchema = z.object({
  id: opinionId, // 1부터 시작하는 번호
  text: z.string().min(1), // 원문 (빈칸은 보내기 전에 제외)
});

export const analyzeRequestSchema = z.object({
  opinions: z.array(opinionInputSchema).min(1),
});

// ④ AI가 돌려주는 분석 결과 — 원문은 들어 있지 않음

export const topicSchema = z.object({
  name: z.string().min(1), // 주제 이름, 10자 이내 (예: "인사제도", "기타")
  summary: z.string(), // 주제마다 1개, 100자 이내
  discussionQuestions: z.array(z.string()), // 토론 질문, 최대 3개
  opinionIds: z.array(opinionId), // 이 주제에 속한 의견 번호 (여러 주제 중복 허용)
});

export const opinionFlagSchema = z.object({
  id: opinionId,
  names: z.array(z.string()), // 원문에서 ●●로 가릴 사람 이름
  softenedText: z.string().nullable(), // 욕설·공격 표현이 있으면 순화문, 없으면 null
});

export const aiAnalysisSchema = z.object({
  topics: z.array(topicSchema), // 기타 포함 최대 7개
  flags: z.array(opinionFlagSchema), // 이름·욕설이 있는 의견만
});

// ⑥·⑧ 화면용 결과 = 결과 파일 형식
// 원문 대신 화면용 문장만 담아, 이름이나 욕설 원문이 파일로 퍼지지 않게 한다.

export const displayOpinionSchema = z.object({
  id: opinionId,
  displayText: z.string(), // 화면에 보일 문장 (이름 ●●, 순화 반영)
  softened: z.boolean(), // 순화되었는지 — 화면에 "(순화됨)" 표시
});

export const resultFileSchema = z.object({
  version: z.literal(RESULT_FILE_VERSION),
  createdAt: z.iso.datetime({ offset: true }), // 분석 시각 (ISO 형식, "Z"와 "+09:00" 모두 허용)
  sourceFileName: z.string(), // 원본 설문 파일 이름
  opinions: z.array(displayOpinionSchema),
  topics: z.array(topicSchema),
});

// 주제 병합 (DESIGN.md §4.3, §6.2) — 묶음별 주제를 7개 이내로 합칠 때 서버와 주고받는 형식

export const mergeTopicInputSchema = z.object({
  id: z.string().min(1), // 묶음을 가로질러 하나뿐인 임시 번호 ("t1", "t2", …)
  name: z.string().min(1),
  summary: z.string(),
  count: z.number().int().min(0), // 그 주제에 속한 의견 수
  sampleTexts: z.array(z.string()), // 대표 의견 (최대 mergeSampleTextCount건)
});

export const mergeRequestSchema = z.object({
  topics: z.array(mergeTopicInputSchema).min(2),
});

export const mergedTopicSchema = z.object({
  name: z.string().min(1),
  summary: z.string(),
  discussionQuestions: z.array(z.string()),
  sourceTopicIds: z.array(z.string()), // 어떤 임시 주제들을 합쳤는지 — 원래 주제는 정확히 한 번씩 쓰여야 한다
});

export const mergeResponseSchema = z.object({
  topics: z.array(mergedTopicSchema),
});

export type MergeTopicInput = z.infer<typeof mergeTopicInputSchema>;
export type MergeRequest = z.infer<typeof mergeRequestSchema>;
export type MergedTopic = z.infer<typeof mergedTopicSchema>;
export type MergeResponse = z.infer<typeof mergeResponseSchema>;

export type OpinionInput = z.infer<typeof opinionInputSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type OpinionFlag = z.infer<typeof opinionFlagSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type DisplayOpinion = z.infer<typeof displayOpinionSchema>;
export type ResultFile = z.infer<typeof resultFileSchema>;

// Design Ref: DESIGN.md §6 서버 API 오류 형식

export const API_ERROR_CODES = [
  "INVALID_INPUT", // 의견이 비었거나 형식이 틀림 (400)
  "AI_RULE_VIOLATION", // AI 결과가 검증 규칙에 맞지 않음 (502) — 재요청은 브라우저가 함
  "AI_UNAVAILABLE", // AI 응답 없음·시간 초과·요청 한도 (503)
  "SERVER_CONFIG", // API 키 미설정 (500)
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** 오류 응답. message에는 의견 원문이나 키 값을 절대 넣지 않는다. */
export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}
