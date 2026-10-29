// Design Ref: DESIGN.md §4.3 대량 의견 처리 — 묶음 나누기, 병합 요청 만들기, 병합 결과를 의견 번호로 되돌리기 (PLAN 작업 19)
// 모두 브라우저에서 도는 순수 함수다. 서버에는 묶음 하나씩, 그리고 주제 요약만 보낸다.
import { RULES, type AiAnalysis, type MergeRequest, type MergeResponse, type OpinionInput } from "./types";

/** 의견을 size건씩 나눈다. 번호는 전체에서 한 번만 매겨져 있으므로 묶음 사이에 겹치지 않는다. */
export function splitIntoBatches(opinions: readonly OpinionInput[], size: number = RULES.maxOpinionsPerRequest): OpinionInput[][] {
  const batches: OpinionInput[][] = [];
  for (let start = 0; start < opinions.length; start += size) batches.push(opinions.slice(start, start + size));
  return batches;
}

/** 목록에서 count개를 고르게 뽑는다 (앞쪽만 뽑으면 한쪽 얘기만 대표하게 되므로) */
function pickEvenly<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];
  return Array.from({ length: count }, (_, i) => items[Math.floor((i * items.length) / count)]);
}

export interface BatchAnalysis {
  opinions: readonly OpinionInput[];
  analysis: AiAnalysis;
}

export interface MergePlan {
  request: MergeRequest;
  /** 임시 번호 → 그 주제에 속한 의견 번호 */
  opinionIdsByTopicId: Map<string, number[]>;
}

/** 묶음별 주제에 전체에서 하나뿐인 임시 번호(t1, t2, …)를 붙이고, 주제마다 이름·요약·건수·대표 의견을 모은다. */
export function buildMergePlan(batches: readonly BatchAnalysis[]): MergePlan {
  const topics: MergeRequest["topics"] = [];
  const opinionIdsByTopicId = new Map<string, number[]>();

  for (const { opinions, analysis } of batches) {
    const textById = new Map(opinions.map((opinion) => [opinion.id, opinion.text]));
    for (const topic of analysis.topics) {
      const id = `t${topics.length + 1}`;
      opinionIdsByTopicId.set(id, topic.opinionIds);
      const texts = topic.opinionIds.map((opinionId) => textById.get(opinionId)).filter((text): text is string => text !== undefined);
      topics.push({
        id,
        name: topic.name,
        summary: topic.summary,
        count: topic.opinionIds.length,
        sampleTexts: pickEvenly(texts, RULES.mergeSampleTextCount),
      });
    }
  }
  return { request: { topics }, opinionIdsByTopicId };
}

/**
 * 병합 결과를 전체 분석 결과로 되돌린다. 합친 주제의 의견 번호는 합친 임시 주제들의 번호를 모아(같은 번호는 하나로) 만들고,
 * 이름 가림·순화 정보(flags)는 묶음마다 나온 것을 이어 붙인다.
 */
export function applyMerge(merged: MergeResponse, plan: MergePlan, batches: readonly BatchAnalysis[]): AiAnalysis {
  return {
    topics: merged.topics.map((topic) => {
      const ids = new Set<number>();
      for (const sourceId of topic.sourceTopicIds) {
        for (const opinionId of plan.opinionIdsByTopicId.get(sourceId) ?? []) ids.add(opinionId);
      }
      return {
        name: topic.name,
        summary: topic.summary,
        discussionQuestions: topic.discussionQuestions,
        opinionIds: [...ids].sort((a, b) => a - b),
      };
    }),
    flags: batches.flatMap(({ analysis }) => analysis.flags),
  };
}
