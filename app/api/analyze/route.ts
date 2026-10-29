// Design Ref: DESIGN.md §6.1 POST /api/analyze — 의견 묶음 하나를 분석 (PLAN 작업 15)
// 요청 1번에 OpenAI 호출 1번. 재요청과 묶음 나누기는 브라우저가 맡는다.
// 받은 의견은 이 요청을 처리하는 동안에만 쓰고, 저장하거나 로그에 남기지 않는다.
import { errorResponse } from "@/lib/server/apiError";
import { ANALYZE_INSTRUCTIONS, ANALYZE_SCHEMA, ANALYZE_SCHEMA_NAME, buildAnalyzeInput } from "@/lib/server/analyzePrompt";
import { AiCallError, askStructured } from "@/lib/server/openai";
import { RULES, aiAnalysisSchema, analyzeRequestSchema } from "@/lib/types";
import { validateAiAnalysis } from "@/lib/validate";

// 브라우저가 120초 안에 응답이 없으면 먼저 끊으므로 실제로는 이보다 짧게 끝난다 (DESIGN 4.3절)
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

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) return invalidInput();
  const { opinions } = parsed.data;

  // 의견 번호는 전체에서 하나뿐이어야 하고, 공백뿐인 의견은 보내기 전에 빠져 있어야 한다
  const idCount = new Set(opinions.map((opinion) => opinion.id)).size;
  const hasBlank = opinions.some((opinion) => opinion.text.trim() === "");
  if (opinions.length > RULES.maxOpinionsPerRequest || idCount !== opinions.length || hasBlank) {
    return invalidInput();
  }

  let data: unknown;
  try {
    ({ data } = await askStructured({
      instructions: ANALYZE_INSTRUCTIONS,
      input: buildAnalyzeInput(opinions),
      schemaName: ANALYZE_SCHEMA_NAME,
      schema: ANALYZE_SCHEMA,
      reasoningEffort: "low",
      maxOutputTokens: 20_000,
    }));
  } catch (error) {
    if (error instanceof AiCallError) return errorResponse(error.code, error.message);
    return errorResponse("AI_UNAVAILABLE", "AI 분석 중 알 수 없는 오류가 났어요.");
  }

  // AI 출력을 그대로 믿지 않는다: 형식 → 규칙 순서로 다시 검사한다 (4.2절)
  const analysis = aiAnalysisSchema.safeParse(data);
  if (!analysis.success) {
    return errorResponse("AI_RULE_VIOLATION", "AI 결과가 정해진 형식과 달라요.");
  }
  const validation = validateAiAnalysis(analysis.data, opinions);
  if (!validation.ok) {
    // 어떤 규칙을 어겼는지만 남긴다 (의견 원문·번호는 남기지 않음)
    console.error("[analyze] AI 결과 규칙 위반:", [...new Set(validation.violations.map((v) => v.rule))].join(", "));
    return errorResponse("AI_RULE_VIOLATION", "AI 결과가 규칙에 맞지 않아요.");
  }

  return Response.json(analysis.data, { headers: { "Cache-Control": "no-store" } });
}

function invalidInput() {
  return errorResponse("INVALID_INPUT", "보낼 의견을 확인하지 못했어요.");
}

function tooLarge() {
  return errorResponse("INVALID_INPUT", "보낸 의견이 너무 많거나 길어요.");
}
