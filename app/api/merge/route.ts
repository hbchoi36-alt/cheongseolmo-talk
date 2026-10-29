// Design Ref: DESIGN.md §6.2 POST /api/merge — 묶음별 주제를 7개 이내로 합침 (PLAN 작업 19)
// 묶음이 2개 이상일 때만 브라우저가 부른다. 요청 1번에 OpenAI 호출 1번, 재요청은 브라우저 담당.
// 받은 주제와 대표 의견은 이 요청을 처리하는 동안에만 쓰고, 저장하거나 로그에 남기지 않는다.
import { errorResponse } from "@/lib/server/apiError";
import { MERGE_INSTRUCTIONS, MERGE_SCHEMA, MERGE_SCHEMA_NAME, buildMergeInput } from "@/lib/server/mergePrompt";
import { AiCallError, askStructured } from "@/lib/server/openai";
import { RULES, mergeRequestSchema, mergeResponseSchema } from "@/lib/types";
import { validateMerge } from "@/lib/validate";

export const maxDuration = 300;

const MAX_BODY_BYTES = 1_000_000;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > MAX_BODY_BYTES) return tooLarge();

  const bodyText = await request.text();
  if (Buffer.byteLength(bodyText, "utf8") > MAX_BODY_BYTES) return tooLarge();

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return invalidInput();
  }

  const parsed = mergeRequestSchema.safeParse(body);
  if (!parsed.success) return invalidInput();
  const { topics } = parsed.data;

  // 임시 번호는 하나뿐이어야 한다 (같은 번호가 있으면 어느 주제를 합쳤는지 알 수 없다)
  const inputIds = topics.map((topic) => topic.id);
  if (topics.length > RULES.maxMergeInputTopics || new Set(inputIds).size !== inputIds.length) {
    return invalidInput();
  }

  let data: unknown;
  try {
    ({ data } = await askStructured({
      instructions: MERGE_INSTRUCTIONS,
      input: buildMergeInput(topics),
      schemaName: MERGE_SCHEMA_NAME,
      schema: MERGE_SCHEMA,
      reasoningEffort: "low",
      maxOutputTokens: 8_000,
    }));
  } catch (error) {
    if (error instanceof AiCallError) return errorResponse(error.code, error.message);
    return errorResponse("AI_UNAVAILABLE", "AI 주제 합치기 중 알 수 없는 오류가 났어요.");
  }

  // AI 출력을 그대로 믿지 않는다: 형식 → 규칙(원래 주제가 정확히 한 번씩 쓰였는지 포함) 순서로 검사한다
  const merged = mergeResponseSchema.safeParse(data);
  if (!merged.success) return errorResponse("AI_RULE_VIOLATION", "AI 결과가 정해진 형식과 달라요.");

  const violations = validateMerge(merged.data, inputIds);
  if (violations.length > 0) {
    // 어떤 규칙을 어겼는지만 남긴다 (주제 내용은 남기지 않음)
    console.error("[merge] AI 결과 규칙 위반:", [...new Set(violations.map((v) => v.rule))].join(", "));
    return errorResponse("AI_RULE_VIOLATION", "AI 결과가 규칙에 맞지 않아요.");
  }

  return Response.json(merged.data, { headers: { "Cache-Control": "no-store" } });
}

function invalidInput() {
  return errorResponse("INVALID_INPUT", "합칠 주제를 확인하지 못했어요.");
}

function tooLarge() {
  return errorResponse("INVALID_INPUT", "보낸 주제가 너무 많거나 길어요.");
}
