import "server-only";

// Design Ref: DESIGN.md §9 접근 보호 — 분석·병합 API는 운영자 비밀번호를 아는 사람만 부를 수 있다.
// 배포 주소를 아는 누구나 OpenAI 요금을 쓰지 못하게 하려는 것이다 (2026-10-29 운영자 결정).
import { createHash, timingSafeEqual } from "node:crypto";
import { errorResponse } from "./apiError";

/** 브라우저가 비밀번호를 실어 보내는 헤더 이름 (한글 비밀번호도 되도록 encodeURIComponent로 인코딩해 보낸다) */
export const OPERATOR_HEADER = "x-operator-password";

// 서버리스라 시도 횟수를 기억하지 못하므로, 틀렸을 때 잠깐 늦춰 무차별 대입을 더디게 한다. 비밀번호는 길게 쓰는 게 안전하다.
const WRONG_PASSWORD_DELAY_MS = 1000;

function digest(text: string): Buffer {
  return createHash("sha256").update(text).digest();
}

function readGivenPassword(request: Request): string {
  const raw = request.headers.get(OPERATOR_HEADER) ?? "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * 운영자 비밀번호를 확인한다. 통과하면 null, 아니면 그대로 돌려줄 오류 응답을 만든다.
 * - 서버에 OPERATOR_PASSWORD가 없으면: 배포 환경에서는 막고(실수로 열려 있지 않게), 로컬 개발에서는 통과시킨다.
 * - 비교는 길이·내용이 시간으로 드러나지 않도록 해시끼리 timingSafeEqual로 한다.
 */
export async function requireOperator(request: Request): Promise<Response | null> {
  const expected = process.env.OPERATOR_PASSWORD?.trim();
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return errorResponse("SERVER_CONFIG", "운영자 비밀번호(OPERATOR_PASSWORD)가 서버에 설정되어 있지 않아요.");
    }
    return null;
  }

  if (timingSafeEqual(digest(readGivenPassword(request)), digest(expected))) return null;

  await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
  return errorResponse("UNAUTHORIZED", "운영자 비밀번호가 맞지 않아요.");
}
