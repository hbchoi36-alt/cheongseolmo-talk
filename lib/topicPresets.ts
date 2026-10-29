// Design Ref: DESIGN.md §4.4 미리 정한 분야 — 설문의 객관식 문항(분야 선택지)과 같은 분류 기준 (2026-10-29)
// AI가 주제를 자동으로 정하면 관련 없는 분야를 억지로 묶는 일이 있어서, 주제는 이 목록으로 고정하고 AI는 분류만 한다.
// 설문 문항이 바뀌면 이 목록을 고친다. 목록 순서는 '기타'로 합칠 때 동률을 가리는 순서이기도 하다(뒤쪽 분야가 먼저 합쳐짐).
import { RULES } from "./types";

export interface TopicPreset {
  /** 도토리에 보일 이름 — 10자 이내 */
  name: string;
  /** 설문에서 쓴 분야 이름 그대로 — AI가 분야의 범위를 알도록 지시문에 넣는다 */
  description: string;
}

export const TOPIC_PRESETS: readonly TopicPreset[] = [
  { name: "소통문화", description: "조직개방성 및 소통문화" },
  { name: "인사제도", description: "인사제도(이동, 평가, 승진)" },
  { name: "업무방식", description: "업무방식" },
  { name: "근태", description: "근태(유연근무, 휴가 등)" },
  { name: "복지·근무환경", description: "복리후생 및 근무환경" },
  { name: "감사·징계", description: "감사 및 징계" },
  { name: "예산·회계", description: "예산 및 회계" },
];

/** AI가 쓸 수 있는 주제 이름 전체: 미리 정한 분야 + '기타' */
export const TOPIC_NAMES: readonly string[] = [...TOPIC_PRESETS.map((preset) => preset.name), RULES.otherTopicName];

/** AI가 돌려줄 수 있는 주제 수의 최대값(7개 분야 + '기타' = 8). 도토리는 이 중 최대 7개만 보인다. */
export const MAX_CANDIDATE_TOPICS = TOPIC_NAMES.length;

/** AI 응답(묶음 분석·병합)을 검사할 때 쓰는 한도 — 도토리 7개 제한은 '기타' 합치기 뒤에 적용한다 */
export const AI_RESPONSE_LIMITS = { maxTopics: MAX_CANDIDATE_TOPICS, allowedTopicNames: TOPIC_NAMES } as const;
