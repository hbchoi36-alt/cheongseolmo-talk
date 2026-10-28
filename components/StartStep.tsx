// Design Ref: DESIGN.md §3.2 ① 시작 화면 — [설문 파일 올리기] · [저장한 결과 파일 불러오기] 두 갈래와 안내 문구
import type { SurveyFileKind } from "@/lib/surveyFile";
import type { ResultFile } from "@/lib/types";
import { LoadResultButton } from "./ResultFileButtons";
import SquirrelSticker from "./SquirrelSticker";
import SurveyUploadButton from "./SurveyUploadButton";

interface StartStepProps {
  onSurveySelected: (file: File, kind: SurveyFileKind) => void;
  onResultLoaded: (result: ResultFile, fileName: string) => void;
}

export default function StartStep({ onSurveySelected, onResultLoaded }: StartStepProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 overflow-y-auto p-8">
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

      <ul className="flex max-w-3xl flex-col gap-2 rounded-3xl bg-white/70 px-8 py-5 text-xl leading-relaxed">
        <li>
          💡 <strong>간담회 전날 미리</strong> 분석하고 결과 파일을 내려받아 두세요. 당일에는 결과 파일만 불러오면 돼요.
        </li>
        <li>📥 구글폼에서 받은 파일이 <strong>.zip</strong>이면 압축을 풀고 안에 있는 CSV 파일을 올려 주세요.</li>
        <li>🔒 올린 파일은 이 컴퓨터의 브라우저 안에서만 읽어요. 분석할 때는 고른 문항의 의견 글만 AI로 보내요.</li>
      </ul>
    </div>
  );
}
