// Design Ref: DESIGN.md §3.5 — 도토리 자리, 주제 목록, 상세 화면의 이전/다음이 모두 같은 순서를 쓴다.
import { RULES, type Topic } from "./types";

/**
 * 화면에 보여줄 주제 순서 (결과의 topics 배열 번호 목록)
 * 의견이 많은 주제부터, '기타'는 의견 수와 상관없이 마지막.
 */
export function displayOrder(topics: readonly Topic[]): number[] {
  const indexes = topics.map((_, index) => index);
  const byCount = indexes.sort((a, b) => topics[b].opinionIds.length - topics[a].opinionIds.length);
  const isOther = (index: number) => topics[index].name === RULES.otherTopicName;
  return [...byCount.filter((index) => !isOther(index)), ...byCount.filter(isOther)];
}
