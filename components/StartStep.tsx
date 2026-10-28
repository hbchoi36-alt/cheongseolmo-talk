// Design Ref: DESIGN.md §3.2 ① 시작 화면
// [저장한 결과 파일 불러오기]는 PLAN 작업 8에서, [설문 파일 올리기]와 안내 문구는 작업 10에서 만든다.
import type { ResultFile } from "@/lib/types";
import { LoadResultButton } from "./ResultFileButtons";

export default function StartStep({ onResultLoaded }: { onResultLoaded: (result: ResultFile, fileName: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
      <header className="flex flex-col items-center gap-2">
        <h1 className="font-display text-title text-title-green">
          청설모 <span className="text-title-orange">Talk</span>
        </h1>
        <p>간담회 사전 설문 의견을 생각나무로 보여드려요</p>
      </header>

      <div className="flex flex-wrap items-start justify-center gap-8">
        <div className="flex flex-col items-center gap-1 rounded-3xl border-4 border-dashed border-acorn-cap/40 px-10 py-6 text-ink/60">
          <span className="font-display text-heading">📄 설문 파일 올리기</span>
          <span className="text-xl">PLAN 작업 10에서 만들어요</span>
        </div>
        <LoadResultButton onLoaded={onResultLoaded} />
      </div>
    </div>
  );
}
