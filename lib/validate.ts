// Design Ref: DESIGN.md §4.1 ⑤·⑥ — AI 결과를 그대로 믿지 않고 앱 코드가 PRD 규칙 준수를 최종 확인한다.
// 서버(AI 응답 직후), 브라우저(화면용 결과 조립 후), 결과 파일 불러오기에서 같은 함수를 쓴다.
// 위반 메시지는 로그에 남을 수 있으므로 의견 원문은 넣지 않고 번호와 주제 이름만 쓴다.
import { RULES, type AiAnalysis, type OpinionInput, type ResultFile, type Topic } from "./types";

export type RuleCode =
  // PRD §5 AI 규칙
  | "MISSING_OPINIONS" // 어느 주제에도 속하지 않은 의견이 있음 (누락 0건 위반)
  | "TOO_MANY_TOPICS" // 주제가 기타 포함 7개를 넘음
  | "SUMMARY_TOO_LONG" // 요약이 100자를 넘음
  | "TOO_MANY_QUESTIONS" // 토론 질문이 3개를 넘음
  // 도토리 건수·크기가 틀리게 나오는 것을 막는 기본 검사 (DESIGN.md §4.2)
  | "TOPIC_NAME_TOO_LONG" // 주제 이름이 10자를 넘어 도토리 안에 들어가지 않음
  | "UNKNOWN_OPINION_ID" // 보내지 않은 의견 번호가 들어 있음
  | "DUPLICATE_IN_TOPIC" // 한 주제 안에 같은 번호가 두 번 이상 들어 있음 (건수 부풀림)
  | "EMPTY_TOPIC" // 의견이 0건인 주제 (크기 0 도토리)
  | "DUPLICATE_TOPIC_NAME" // 이름이 같은 주제가 둘 이상
  | "EMPTY_SUMMARY" // 요약이 비어 있음
  | "UNKNOWN_FLAG_ID"; // 이름 가림·순화 정보가 없는 번호를 가리킴

export interface RuleViolation {
  rule: RuleCode;
  message: string;
  topicName?: string;
  opinionIds?: number[];
}

export interface ValidationResult {
  ok: boolean;
  violations: RuleViolation[];
}

/** 글자 수는 화면에 보이는 글자 단위로 센다 (이모지 등이 2글자로 세지지 않게) */
export function charLength(text: string): number {
  return [...text].length;
}

/** 주제 목록이 PRD 규칙을 지키는지, 모든 의견이 빠짐없이 들어갔는지 검사한다. */
export function validateTopics(topics: readonly Topic[], allOpinionIds: readonly number[]): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const known = new Set(allOpinionIds);
  const covered = new Set<number>();
  const seenNames = new Set<string>();

  if (topics.length > RULES.maxTopics) {
    violations.push({
      rule: "TOO_MANY_TOPICS",
      message: `주제가 ${topics.length}개예요. '${RULES.otherTopicName}' 포함 최대 ${RULES.maxTopics}개까지만 만들 수 있어요.`,
    });
  }

  for (const topic of topics) {
    const name = topic.name.trim();

    if (seenNames.has(name)) {
      violations.push({ rule: "DUPLICATE_TOPIC_NAME", topicName: name, message: `'${name}' 주제가 두 번 이상 있어요.` });
    }
    seenNames.add(name);

    const nameLength = charLength(name);
    if (nameLength > RULES.maxTopicNameLength) {
      violations.push({
        rule: "TOPIC_NAME_TOO_LONG",
        topicName: name,
        message: `'${name}' 주제 이름이 ${nameLength}자예요. ${RULES.maxTopicNameLength}자 이내여야 해요.`,
      });
    }

    if (topic.summary.trim() === "") {
      violations.push({ rule: "EMPTY_SUMMARY", topicName: name, message: `'${name}' 주제의 요약이 비어 있어요.` });
    }

    const summaryLength = charLength(topic.summary);
    if (summaryLength > RULES.maxSummaryLength) {
      violations.push({
        rule: "SUMMARY_TOO_LONG",
        topicName: name,
        message: `'${name}' 주제의 요약이 ${summaryLength}자예요. ${RULES.maxSummaryLength}자 이내여야 해요.`,
      });
    }

    if (topic.discussionQuestions.length > RULES.maxQuestionsPerTopic) {
      violations.push({
        rule: "TOO_MANY_QUESTIONS",
        topicName: name,
        message: `'${name}' 주제의 토론 질문이 ${topic.discussionQuestions.length}개예요. 최대 ${RULES.maxQuestionsPerTopic}개까지예요.`,
      });
    }

    if (topic.opinionIds.length === 0) {
      violations.push({ rule: "EMPTY_TOPIC", topicName: name, message: `'${name}' 주제에 속한 의견이 없어요.` });
    }

    const inTopic = new Set<number>();
    const duplicated = new Set<number>();
    const unknown = new Set<number>();
    for (const id of topic.opinionIds) {
      if (inTopic.has(id)) duplicated.add(id);
      inTopic.add(id);
      if (known.has(id)) covered.add(id);
      else unknown.add(id);
    }

    if (duplicated.size > 0) {
      violations.push({
        rule: "DUPLICATE_IN_TOPIC",
        topicName: name,
        opinionIds: [...duplicated],
        message: `'${name}' 주제에 같은 의견이 두 번 이상 들어 있어요 (번호 ${[...duplicated].join(", ")}).`,
      });
    }
    if (unknown.size > 0) {
      violations.push({
        rule: "UNKNOWN_OPINION_ID",
        topicName: name,
        opinionIds: [...unknown],
        message: `'${name}' 주제에 없는 의견 번호가 있어요 (번호 ${[...unknown].join(", ")}).`,
      });
    }
  }

  // Plan SC-2: 누락 0건 — 모든 유효 의견이 적어도 한 주제에 속해야 한다
  const missing = allOpinionIds.filter((id) => !covered.has(id));
  if (missing.length > 0) {
    violations.push({
      rule: "MISSING_OPINIONS",
      opinionIds: missing,
      message: `어느 주제에도 들어가지 않은 의견이 ${missing.length}건 있어요 (번호 ${missing.join(", ")}).`,
    });
  }

  return violations;
}

function toResult(violations: RuleViolation[]): ValidationResult {
  return { ok: violations.length === 0, violations };
}

/** ⑤ 서버: AI 응답을 보낸 의견 목록과 비교해 검사한다. */
export function validateAiAnalysis(analysis: AiAnalysis, inputs: readonly OpinionInput[]): ValidationResult {
  const ids = inputs.map((opinion) => opinion.id);
  const violations = validateTopics(analysis.topics, ids);

  const known = new Set(ids);
  const unknownFlags = analysis.flags.map((flag) => flag.id).filter((id) => !known.has(id));
  if (unknownFlags.length > 0) {
    violations.push({
      rule: "UNKNOWN_FLAG_ID",
      opinionIds: unknownFlags,
      message: `이름 가림·순화 정보가 보내지 않은 의견 번호를 가리켜요 (번호 ${unknownFlags.join(", ")}).`,
    });
  }

  return toResult(violations);
}

/** ⑥·결과 파일 불러오기: 화면용 결과가 규칙을 지키는지 검사한다. */
export function validateResultFile(file: ResultFile): ValidationResult {
  const ids = file.opinions.map((opinion) => opinion.id);
  return toResult(validateTopics(file.topics, ids));
}
