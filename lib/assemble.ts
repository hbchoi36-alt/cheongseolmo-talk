// Design Ref: DESIGN.md §4.1 ⑥ 조립, §5 — AI 결과 + 원문 → 화면용 결과(결과 파일 형식) (PLAN 작업 18)
// 원문 임의 변경 금지(PRD §5)의 예외는 두 가지뿐이다: ① 사람 이름은 ●●로 가림 ② 욕설·공격 표현은 순화문으로 대체.
// 이름 가림은 두 겹이다: AI에게 문장에 이름을 쓰지 말라고 요구하고(지시문), 여기서 AI가 쓴 주제명·요약·질문·순화문에서도 한 번 더 가린다.
import { RULES, RESULT_FILE_VERSION, type AiAnalysis, type OpinionInput, type ResultFile, type Topic } from "./types";
import { validateResultFile, type RuleViolation } from "./validate";

// 한 글자 이름은 가리지 않는다 — "김" 같은 글자를 모두 가리면 "김치", "김포" 같은 멀쩡한 글까지 지워진다
const MIN_NAME_LENGTH = 2;

/** 전체 의견의 이름 표시(flags)에서 가릴 이름을 모은다. 긴 이름부터 가려야 "김민수"가 "김민"에 먼저 걸려 남지 않는다. */
export function collectNames(analysis: AiAnalysis): string[] {
  const names = new Set<string>();
  for (const flag of analysis.flags) {
    for (const raw of flag.names) {
      const name = raw.trim();
      if ([...name].length >= MIN_NAME_LENGTH) names.add(name);
    }
  }
  return [...names].sort((a, b) => b.length - a.length);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 글 속의 이름을 ●●로 바꾸는 함수를 만든다. 이름이 하나도 없으면 글을 그대로 돌려준다. */
export function createMasker(names: readonly string[]): (text: string) => string {
  if (names.length === 0) return (text) => text;
  const pattern = new RegExp(names.map(escapeRegExp).join("|"), "g");
  return (text) => text.replace(pattern, RULES.nameMask);
}

export interface AssembleInput {
  /** 서버로 보낸 의견 (번호 + 원문) — 원문은 여기서만 쓰고 결과 파일에는 화면용 문장만 담는다 */
  opinions: readonly OpinionInput[];
  analysis: AiAnalysis;
  sourceFileName: string;
  now?: Date;
}

export type AssembleResult = { ok: true; result: ResultFile } | { ok: false; violations: RuleViolation[] };

/** 화면용 결과를 조립하고 규칙을 다시 검사한다. 규칙을 어기면 결과 대신 위반 목록을 돌려준다. */
export function assembleResult({ opinions, analysis, sourceFileName, now = new Date() }: AssembleInput): AssembleResult {
  const mask = createMasker(collectNames(analysis));

  // 같은 번호의 표시가 여러 개면 순화문이 있는 첫 번째를 쓴다
  const softenedById = new Map<number, string>();
  for (const flag of analysis.flags) {
    const softened = flag.softenedText?.trim();
    if (softened && !softenedById.has(flag.id)) softenedById.set(flag.id, softened);
  }

  const displayOpinions = opinions.map(({ id, text }) => {
    const softened = softenedById.get(id);
    // 순화문이 있으면 원문은 숨기고 순화문만 보여 준다. 이름은 두 경우 모두 가린다.
    return softened === undefined
      ? { id, displayText: mask(text), softened: false }
      : { id, displayText: mask(softened), softened: true };
  });

  const topics: Topic[] = analysis.topics.map((topic) => ({
    name: mask(topic.name.trim()),
    summary: mask(topic.summary.trim()),
    // 빈 질문은 화면과 고치기 규칙(빈 질문 불가)에 맞춰 뺀다
    discussionQuestions: topic.discussionQuestions.map((q) => mask(q.trim())).filter((q) => q !== ""),
    opinionIds: topic.opinionIds,
  }));

  const result: ResultFile = {
    version: RESULT_FILE_VERSION,
    createdAt: now.toISOString(),
    sourceFileName,
    opinions: displayOpinions,
    topics,
  };

  const check = validateResultFile(result);
  return check.ok ? { ok: true, result } : { ok: false, violations: check.violations };
}
