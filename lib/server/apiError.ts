import "server-only";

// Design Ref: DESIGN.md §6.3 — 오류 응답 형식과 상태 코드. 메시지에는 의견 원문이나 키 값을 절대 넣지 않는다.
import type { ApiErrorCode, ApiErrorResponse } from "@/lib/types";

const STATUS: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  AI_RULE_VIOLATION: 502,
  AI_UNAVAILABLE: 503,
  SERVER_CONFIG: 500,
};

export function errorResponse(code: ApiErrorCode, message: string): Response {
  const body: ApiErrorResponse = { error: { code, message } };
  return Response.json(body, { status: STATUS[code], headers: { "Cache-Control": "no-store" } });
}
