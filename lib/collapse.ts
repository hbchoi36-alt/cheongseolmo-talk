// Design Ref: DESIGN.md §4.4 — 의견이 있는 분야가 8개가 되면 의견 수가 가장 적은 분야를 '기타'에 합쳐 도토리를 7개로 줄인다 (2026-10-29)
// AI가 아니라 앱 코드가 하므로 같은 결과에는 언제나 같은 분야가 합쳐진다. 의견 번호는 그대로 모으고 사라지는 의견은 없다.
import { TOPIC_NAMES } from "./topicPresets";
import { RULES, type AiAnalysis, type Topic } from "./types";
import { charLength } from "./validate";

export interface CollapseResult {
  analysis: AiAnalysis;
  /** '기타'에 합쳐진 분야 (없으면 빈 배열) */
  mergedIntoOther: { name: string; count: number }[];
}

/** 목록에서 뒤쪽일수록 큰 값 — 동률이면 큰 쪽(뒤쪽 분야)이 먼저 합쳐진다. 모르는 이름은 앞쪽으로 보아 마지막까지 남긴다. */
function listOrder(name: string): number {
  return TOPIC_NAMES.indexOf(name);
}

export function collapseToLimit(analysis: AiAnalysis, limit: number = RULES.maxTopics): CollapseResult {
  const other = RULES.otherTopicName;
  let topics: Topic[] = analysis.topics.map((topic) => ({ ...topic, opinionIds: [...topic.opinionIds] }));
  const merged: Topic[] = [];

  while (topics.length > limit) {
    const candidates = topics.filter((topic) => topic.name !== other);
    if (candidates.length === 0) break;

    const smallest = candidates.reduce((best, topic) => {
      if (topic.opinionIds.length !== best.opinionIds.length) return topic.opinionIds.length < best.opinionIds.length ? topic : best;
      return listOrder(topic.name) > listOrder(best.name) ? topic : best;
    });
    topics = topics.filter((topic) => topic !== smallest);
    merged.push(smallest);

    // '기타'가 아직 없으면 만든다 (이때는 주제 수가 줄지 않으므로 다음 바퀴에서 하나 더 합친다)
    let otherTopic = topics.find((topic) => topic.name === other);
    if (!otherTopic) {
      otherTopic = { name: other, summary: "", discussionQuestions: [], opinionIds: [] };
      topics.push(otherTopic);
    }
    otherTopic.opinionIds = [...new Set([...otherTopic.opinionIds, ...smallest.opinionIds])].sort((a, b) => a - b);
  }

  if (merged.length === 0) return { analysis, mergedIntoOther: [] };

  // 합쳐진 '기타'의 요약·질문은 AI가 쓴 것이 아니므로 어떤 분야가 합쳐졌는지 알리는 문장으로 다시 만든다 (운영자가 고칠 수 있다)
  const originalOther = analysis.topics.find((topic) => topic.name === other);
  const mergedList = merged.map((topic) => `${topic.name} ${topic.opinionIds.length}건`).join(", ");
  const withOriginal = originalOther ? `와 어느 분야에도 맞지 않는 의견` : "";
  let summary = `건수가 적은 분야(${mergedList})${withOriginal}을 모았어요.`;
  if (charLength(summary) > RULES.maxSummaryLength) summary = `건수가 적은 분야 ${merged.length}개${withOriginal}를 모았어요.`;

  // 합쳐진 분야에서 하나씩, 그다음 원래 '기타'의 질문 순으로 최대 3개
  const questions = [
    ...merged.flatMap((topic) => topic.discussionQuestions.filter((q) => q.trim() !== "").slice(0, 1)),
    ...(originalOther?.discussionQuestions ?? []),
  ].slice(0, RULES.maxQuestionsPerTopic);

  topics = topics.map((topic) => (topic.name === other ? { ...topic, summary, discussionQuestions: questions } : topic));

  return {
    analysis: { ...analysis, topics },
    mergedIntoOther: merged.map((topic) => ({ name: topic.name, count: topic.opinionIds.length })),
  };
}
