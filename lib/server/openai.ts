import "server-only";

// Design Ref: DESIGN.md §6.4 OpenAI 호출 방식
// OpenAI 호출은 이 파일 한 곳에만 둔다 (나중에 다른 AI로 바꿔도 여기만 고치면 되게).
// API 키는 여기서만 읽고, 이 파일은 server-only로 브라우저 번들에 들어가지 못한다.
import OpenAI from "openai";
import type { ApiErrorCode } from "@/lib/types";

// 환경변수 OPENAI_MODEL이 없을 때 쓸 모델
const DEFAULT_MODEL = "gpt-6.1-sol";

// 요청 1번의 최대 대기 시간 — 브라우저 재요청 1번을 합쳐도 서버 시간 한도에 걸리지 않도록 (DESIGN 4.3절)
const REQUEST_TIMEOUT_MS = 120_000;

/** AI 호출 실패 — 어떤 오류 응답(ApiErrorCode)으로 돌려줄지를 함께 들고 있다. message에는 키·의견 원문을 넣지 않는다. */
export class AiCallError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AiCallError";
  }
}

export function getModelName(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

// 재요청은 브라우저 담당이라 SDK 자동 재시도는 끈다 (요청 1번에 호출 1번)
function createClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiCallError("SERVER_CONFIG", "OPENAI_API_KEY가 설정되어 있지 않아요.");
  return new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
}

export interface StructuredRequest {
  /** AI에게 줄 규칙(시스템 지시문) */
  instructions: string;
  /** AI에게 줄 내용(번호 붙은 의견 목록 등) */
  input: string;
  /** 응답 형식 이름 (영문·숫자·밑줄) */
  schemaName: string;
  /** JSON Schema — strict 모드라 모든 객체에 additionalProperties:false, 모든 속성을 required에 넣어야 한다 */
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
  /** 생각 깊이 — 낮출수록 빠르다. 모델이 지원하지 않으면 보내지 않는다. */
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
}

export interface StructuredResult {
  /** AI가 돌려준 JSON — 모양은 호출한 쪽이 zod로 다시 검사해야 한다 */
  data: unknown;
  model: string;
  elapsedMs: number;
}

/** 정해진 JSON 형식으로만 답을 받는다. 실패하면 AiCallError를 던진다. */
export async function askStructured(req: StructuredRequest): Promise<StructuredResult> {
  const client = createClient();
  const model = getModelName();
  const startedAt = Date.now();

  let response;
  try {
    response = await client.responses.create({
      model,
      instructions: req.instructions,
      input: req.input,
      max_output_tokens: req.maxOutputTokens,
      ...(req.reasoningEffort ? { reasoning: { effort: req.reasoningEffort } } : {}),
      text: { format: { type: "json_schema", name: req.schemaName, schema: req.schema, strict: true } },
      // 의견 원문을 OpenAI 쪽에 저장해 두지 않게 한다
      store: false,
    });
  } catch (error) {
    throw toAiCallError(error);
  }

  if (response.status === "incomplete") {
    throw new AiCallError("AI_UNAVAILABLE", `AI 응답이 중간에 끊겼어요 (${response.incomplete_details?.reason ?? "알 수 없음"}).`);
  }
  const refused = response.output.some(
    (item) => item.type === "message" && item.content.some((part) => part.type === "refusal"),
  );
  if (refused) throw new AiCallError("AI_UNAVAILABLE", "AI가 이 요청에 답하지 않았어요.");

  try {
    return { data: JSON.parse(response.output_text), model, elapsedMs: Date.now() - startedAt };
  } catch {
    throw new AiCallError("AI_RULE_VIOLATION", "AI가 JSON 형식이 아닌 답을 보냈어요.");
  }
}

// OpenAI SDK 오류를 우리 오류 코드로 바꾼다. 원본 메시지에는 키 조각이 있을 수 있어 그대로 쓰지 않는다.
function toAiCallError(error: unknown): AiCallError {
  if (error instanceof AiCallError) return error;
  if (error instanceof OpenAI.APIError && (error.status === 401 || error.status === 403)) {
    return new AiCallError("SERVER_CONFIG", "OpenAI API 키가 올바르지 않거나 권한이 없어요.");
  }
  if (error instanceof OpenAI.APIError && error.status === 400) {
    return new AiCallError("SERVER_CONFIG", "OpenAI가 요청 형식을 받아들이지 않았어요 (모델 이름이나 옵션을 확인해 주세요).");
  }
  if (error instanceof OpenAI.APIError && error.status === 404) {
    return new AiCallError("SERVER_CONFIG", "OPENAI_MODEL에 적은 모델을 찾을 수 없어요.");
  }
  return new AiCallError("AI_UNAVAILABLE", "OpenAI가 지금 응답하지 않아요 (시간 초과·요청 한도·연결 문제).");
}
