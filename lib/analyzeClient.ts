// Design Ref: DESIGN.md §4.3 시간 예산, §6.3 오류와 화면 처리 — 브라우저가 /api/analyze·/api/merge를 부르고, 실패하면 1번 자동 재요청한다 (PLAN 작업 17·19)
// 서버는 요청 1번에 AI 호출 1번만 하므로 재요청은 여기서 맡는다. 시도당 최대 120초, 총 2번.
import {
  API_ERROR_CODES,
  aiAnalysisSchema,
  mergeResponseSchema,
  type AiAnalysis,
  type ApiErrorCode,
  type MergeRequest,
  type MergeResponse,
  type OpinionInput,
} from "./types";
import { validateAiAnalysis, validateMerge } from "./validate";

/** 실패 원인 — 서버가 준 코드이거나, 서버 응답을 받지 못한 경우(NETWORK: 120초 초과·연결 끊김·형식이 아닌 응답) */
export type AnalyzeFailureKind = ApiErrorCode | "NETWORK";

export class AnalyzeError extends Error {
  constructor(
    readonly kind: AnalyzeFailureKind,
    message: string,
  ) {
    super(message);
    this.name = "AnalyzeError";
  }
}

/** 다시 해 보면 달라질 수 있는 실패만 재요청한다. 입력·설정 문제는 다시 보내도 같으므로 바로 실패로 보여 준다. */
const RETRYABLE: ReadonlySet<AnalyzeFailureKind> = new Set(["AI_RULE_VIOLATION", "AI_UNAVAILABLE", "NETWORK"]);

export interface AnalyzeOptions {
  /** 운영자가 [← 열 다시 고르기] 등으로 분석을 그만둘 때 쓴다. 이때는 재요청하지 않고 AbortError를 던진다. */
  signal?: AbortSignal;
  /** 시도당 최대 대기 시간 */
  timeoutMs?: number;
  /** 총 시도 횟수 (처음 1번 + 재요청) */
  maxAttempts?: number;
  endpoint?: string;
  /** 재요청 직전에 불린다 — 화면에 "다시 시도하는 중"을 보여 주는 데 쓴다 */
  onRetry?: (failure: AnalyzeError, nextAttempt: number) => void;
}

/** 의견 한 묶음(최대 300건)을 분석한다. 모든 시도가 실패하면 마지막 실패를 AnalyzeError로 던진다. */
export function analyzeOpinions(opinions: readonly OpinionInput[], options: AnalyzeOptions = {}): Promise<AiAnalysis> {
  return postWithRetry(
    options.endpoint ?? "/api/analyze",
    { opinions },
    (body) => {
      // 서버가 이미 검증했지만 AI 결과를 그대로 믿지 않는다는 원칙대로 브라우저에서도 한 번 더 확인한다
      const analysis = aiAnalysisSchema.safeParse(body);
      return analysis.success && validateAiAnalysis(analysis.data, opinions).ok ? analysis.data : null;
    },
    options,
  );
}

/** 묶음별 주제를 7개 이내로 합친다. 원래 주제가 정확히 한 번씩 쓰였는지까지 확인하고, 아니면 재요청한다. */
export function mergeTopics(request: MergeRequest, options: AnalyzeOptions = {}): Promise<MergeResponse> {
  const inputIds = request.topics.map((topic) => topic.id);
  return postWithRetry(
    options.endpoint ?? "/api/merge",
    request,
    (body) => {
      const merged = mergeResponseSchema.safeParse(body);
      return merged.success && validateMerge(merged.data, inputIds).length === 0 ? merged.data : null;
    },
    options,
  );
}

async function postWithRetry<T>(
  endpoint: string,
  payload: unknown,
  verify: (body: unknown) => T | null,
  options: AnalyzeOptions,
): Promise<T> {
  const { signal, timeoutMs = 120_000, maxAttempts = 2, onRetry } = options;

  let lastFailure: AnalyzeError | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    signal?.throwIfAborted();
    try {
      return await requestOnce(endpoint, payload, verify, timeoutMs, signal);
    } catch (error) {
      // 운영자가 그만둔 경우는 실패가 아니므로 그대로 올려 보낸다
      if (signal?.aborted) throw error;
      const failure = error instanceof AnalyzeError ? error : new AnalyzeError("NETWORK", "분석 요청이 실패했어요.");
      lastFailure = failure;
      if (!RETRYABLE.has(failure.kind) || attempt === maxAttempts) throw failure;
      onRetry?.(failure, attempt + 1);
    }
  }
  // maxAttempts가 1 미만일 때만 여기까지 온다
  throw lastFailure ?? new AnalyzeError("NETWORK", "분석 요청이 실패했어요.");
}

async function requestOnce<T>(
  endpoint: string,
  payload: unknown,
  verify: (body: unknown) => T | null,
  timeoutMs: number,
  userSignal: AbortSignal | undefined,
): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = userSignal ? AbortSignal.any([userSignal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (userSignal?.aborted) throw error;
    throw new AnalyzeError("NETWORK", timeout.aborted ? "응답이 너무 늦어요." : "연결이 끊겼어요.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // 서버가 약속한 형식이 아닌 응답(예: 시간 초과로 배포 환경이 보낸 504 안내 페이지)
    throw new AnalyzeError("NETWORK", "서버 응답을 읽지 못했어요.");
  }

  if (!response.ok) throw new AnalyzeError(readErrorKind(body), "분석에 실패했어요.");

  const verified = verify(body);
  if (verified === null) throw new AnalyzeError("AI_RULE_VIOLATION", "AI 결과가 규칙에 맞지 않아요.");
  return verified;
}

function readErrorKind(body: unknown): AnalyzeFailureKind {
  const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
  return (API_ERROR_CODES as readonly unknown[]).includes(code) ? (code as ApiErrorCode) : "NETWORK";
}
