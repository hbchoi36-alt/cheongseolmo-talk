// Design Ref: DESIGN.md §3.2 ① 시작 화면 — [설문 파일 올리기] · [저장한 결과 파일 불러오기] 두 갈래와 안내 문구
import type { SurveyFileKind } from "@/lib/surveyFile";
import type { ResultFile } from "@/lib/types";
import { LoadResultButton } from "./ResultFileButtons";
import SquirrelSticker from "./SquirrelSticker";
import SurveyUploadButton from "./SurveyUploadButton";

interface StartStepProps {
  /** 파일을 읽어 보고, 읽지 못하면 이유를 돌려준다 */
  onSurveySelected: (file: File, kind: SurveyFileKind) => Promise<string | null>;
  onResultLoaded: (result: ResultFile, fileName: string) => void;
}

export default function StartStep({ onSurveySelected, onResultLoaded }: StartStepProps) {
  return (
    // 내용이 화면보다 길면 위가 잘리지 않고 스크롤되도록, 가운데 정렬은 안쪽 상자의 m-auto로 한다
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="m-auto flex flex-col items-center" style={{ gap: "clamp(1rem, 3.5vh, 2.5rem)" }}>
        <header className="flex items-center gap-6">
          <SquirrelSticker pose="hugging" width="min(140px, 16vh)" />
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-title leading-none text-title-green">
              청설모 <span className="text-title-orange">Talk</span>
            </h1>
            <p>간담회 사전 설문 의견을 생각나무로 보여드려요</p>
          </div>
        </header>

        <div className="flex flex-wrap items-start justify-center gap-8">
          <SurveyUploadButton onSelected={onSurveySelected} />
          <LoadResultButton onLoaded={onResultLoaded} />
        </div>

        <ul className="flex max-w-3xl flex-col gap-1 rounded-3xl bg-white/70 px-8 py-4 text-lg leading-relaxed">
          <li>
            💡 <strong>간담회 전날 미리</strong> 분석하고 결과 파일을 내려받아 두세요. 당일에는 결과 파일만 불러오면 돼요.
          </li>
          <li>📥 구글폼에서 받은 파일이 <strong>.zip</strong>이면 압축을 풀고 안에 있는 CSV 파일을 올려 주세요.</li>
          <li>🔒 올린 파일은 이 컴퓨터의 브라우저 안에서만 읽어요. 분석할 때는 고른 문항의 의견 글만 AI로 보내요.</li>
        </ul>

        {/* 비상 경로: API 분석을 쓸 수 없을 때 다른 담당자도 따라 할 수 있도록 요청문을 앱에서 바로 받는다 */}
        <section className="flex max-w-3xl flex-wrap items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-acorn-cap/50 px-8 py-3 text-base">
          <p>
            🆘 <strong>AI 분석을 쓸 수 없을 때</strong>는 Claude 웹 채팅으로 결과 파일을 만들 수 있어요. 요청문에 방법이 적혀 있어요.
          </p>
          <a
            href="/request-guide"
            download="클로드-채팅-분석-요청문.md"
            className="shrink-0 rounded-full bg-acorn-cap px-5 py-2 text-base text-acorn-body shadow hover:bg-acorn-line"
          >
            ⬇ 비상용 요청문 내려받기
          </a>
        </section>
      </div>
    </div>
  );
}
