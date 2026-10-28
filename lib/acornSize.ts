// Design Ref: DESIGN.md §3.5 도토리 크기 계산식 — 도토리 면적이 의견 건수에 비례하도록 너비를 정한다.
// 너비는 나무 그림 너비에 대한 비율(0~1)로 돌려준다. 화면 크기가 바뀌어도 그림과 같은 비율로 커지고 작아진다.

/** 도토리가 많을수록 가장 큰 도토리도 작게 해서 나무 위에 겹치지 않게 한다 */
function maxWidthFor(topicCount: number): number {
  if (topicCount <= 4) return 0.26;
  if (topicCount <= 6) return 0.23;
  return 0.2;
}

/** 주제 이름이 읽히도록 가장 작은 도토리도 이 너비보다 작게 만들지 않는다 */
export const MIN_ACORN_WIDTH = 0.155;

/**
 * 주제별 의견 건수 → 도토리 너비(나무 그림 너비 대비 비율)
 * 너비 = 최대 너비 × √(건수 ÷ 가장 많은 건수) — 너비의 제곱인 면적이 건수에 비례한다.
 * 최소 너비 때문에 건수가 아주 적은 도토리는 실제 비율보다 조금 크게 보일 수 있다. 정확한 값은 도토리 안 건수로 보여 준다.
 */
export function acornWidths(counts: readonly number[]): number[] {
  const largest = Math.max(...counts, 1);
  const maxWidth = maxWidthFor(counts.length);
  return counts.map((count) => Math.max(MIN_ACORN_WIDTH, maxWidth * Math.sqrt(count / largest)));
}
