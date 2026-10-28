// 비상용 요청문 내려받기 — 앱의 AI 분석을 쓸 수 없을 때 Claude 웹 채팅으로 결과 파일을 만드는 방법과 규칙을 담은 문서.
// 원본은 운영자가 관리하는 폴더의 파일 하나뿐이고, 빌드할 때 읽어 정적 파일로 내려준다 (원본을 고치면 다음 빌드부터 반영).
import { readFileSync } from "node:fs";
import path from "node:path";

const GUIDE_FILE_NAME = "클로드-채팅-분석-요청문.md";
const GUIDE_PATH = path.join(process.cwd(), "설문결과파일 json 변환 요청문", GUIDE_FILE_NAME);

// 요청마다 바뀌지 않는 파일이므로 모듈을 불러올 때 한 번만 읽는다 (Cache Components에서 정적으로 미리 만들어짐)
const guide = readFileSync(GUIDE_PATH, "utf8");

export async function GET() {
  return new Response(guide, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // 한글 파일 이름이 깨지지 않도록 RFC 5987 형식으로도 함께 보낸다
      "Content-Disposition": `attachment; filename="request-guide.md"; filename*=UTF-8''${encodeURIComponent(GUIDE_FILE_NAME)}`,
    },
  });
}
