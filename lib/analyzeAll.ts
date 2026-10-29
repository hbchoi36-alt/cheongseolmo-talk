// Design Ref: DESIGN.md §4.3 대량 의견 처리 — 의견 전체를 한 번에 분석한다 (PLAN 작업 19)
// 300건 이하면 분석 요청 1번, 넘으면 300건씩 나눠 묶음마다 따로 분석(동시에 최대 3개)한 뒤 주제를 합친다.
// 묶음 하나가 실패하면 그 묶음만 자동 재요청하고(analyzeClient), 그래도 실패하면 전체를 멈추고 실패로 알린다.
import { AnalyzeError, analyzeOpinions, mergeTopics } from "./analyzeClient";
import { applyMerge, buildMergePlan, splitIntoBatches } from "./merge";
import { RULES, type AiAnalysis, type OpinionInput } from "./types";
import { validateAiAnalysis } from "./validate";

/** 화면에 보여 줄 진행 상황 — "묶음 N / M" 표시와 재시도 안내에 쓴다 */
export interface AnalysisProgress {
  totalBatches: number;
  doneBatches: number;
  /** 묶음 분석을 마치고 주제를 합치는 중 */
  merging: boolean;
  /** 어느 요청이 첫 시도에 실패해 다시 시도하는 중 */
  retrying: boolean;
}

export interface AnalyzeAllOptions {
  signal?: AbortSignal;
  onProgress?: (progress: AnalysisProgress) => void;
  /** 시도당 최대 대기 시간 (기본 120초) */
  timeoutMs?: number;
  /** 아래는 테스트에서 작게 바꾸려고 열어 둔 값이다 */
  batchSize?: number;
  concurrency?: number;
  analyzeEndpoint?: string;
  mergeEndpoint?: string;
}

/** 의견 전체를 분석해 하나의 분석 결과로 돌려준다. 실패하면 AnalyzeError, 운영자가 그만두면 AbortError를 던진다. */
export async function analyzeAll(opinions: readonly OpinionInput[], options: AnalyzeAllOptions = {}): Promise<AiAnalysis> {
  const {
    signal,
    onProgress,
    timeoutMs,
    batchSize = RULES.maxOpinionsPerRequest,
    concurrency = RULES.maxConcurrentBatches,
    analyzeEndpoint,
    mergeEndpoint,
  } = options;

  const batches = splitIntoBatches(opinions, batchSize);
  const progress: AnalysisProgress = { totalBatches: batches.length, doneBatches: 0, merging: false, retrying: false };
  const emit = () => onProgress?.({ ...progress });
  emit();

  // 한 묶음이 끝내 실패하면 아직 도는 묶음도 멈춘다 (어차피 전체가 실패하므로 AI 호출을 아낀다)
  const stopAll = new AbortController();
  const batchSignal = signal ? AbortSignal.any([signal, stopAll.signal]) : stopAll.signal;

  const analyses: AiAnalysis[] = new Array(batches.length);
  const retryingBatches = new Set<number>();
  let nextBatch = 0;

  async function worker() {
    while (nextBatch < batches.length) {
      const index = nextBatch++;
      try {
        analyses[index] = await analyzeOpinions(batches[index], {
          signal: batchSignal,
          timeoutMs,
          endpoint: analyzeEndpoint,
          onRetry: () => {
            retryingBatches.add(index);
            progress.retrying = true;
            emit();
          },
        });
      } catch (error) {
        stopAll.abort();
        throw error;
      }
      retryingBatches.delete(index);
      progress.retrying = retryingBatches.size > 0;
      progress.doneBatches++;
      emit();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker));

  // 묶음이 하나면 합칠 것이 없다
  if (batches.length === 1) return analyses[0];

  const batchResults = batches.map((batchOpinions, i) => ({ opinions: batchOpinions, analysis: analyses[i] }));
  const plan = buildMergePlan(batchResults);
  progress.merging = true;
  progress.retrying = false;
  emit();

  const merged = await mergeTopics(plan.request, {
    signal,
    timeoutMs,
    endpoint: mergeEndpoint,
    onRetry: () => {
      progress.retrying = true;
      emit();
    },
  });
  const analysis = applyMerge(merged, plan, batchResults);

  // 합친 결과를 전체 의견 기준으로 다시 검사한다 (DESIGN 4.3-4)
  if (!validateAiAnalysis(analysis, opinions).ok) {
    throw new AnalyzeError("AI_RULE_VIOLATION", "합친 결과가 규칙에 맞지 않아요.");
  }
  return analysis;
}
