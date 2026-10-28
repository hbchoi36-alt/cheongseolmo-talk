// Design Ref: DESIGN.md §3.4 ③ 분석 중 / 실패 화면 — 진행 표시와 실패 안내는 PLAN 작업 20에서, 실제 AI 분석은 작업 14~19에서 붙인다
import StepPlaceholder from "./StepPlaceholder";

export default function AnalyzingStep({ opinionCount, onBack }: { opinionCount: number | null; onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-8 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 text-base hover:bg-white"
        >
          ← 열 다시 고르기
        </button>
      </header>
      {opinionCount !== null && <p className="pt-6 text-center text-xl">의견 {opinionCount}건이 분석을 기다리고 있어요.</p>}
      <StepPlaceholder title="③ 분석 중" plannedTask="AI 연결(PLAN 작업 14~20)" />
    </div>
  );
}
