// Design Ref: DESIGN.md §3.3 ② 의견 열 선택 화면 — 파일 읽기는 PLAN 작업 11·12, 열 선택은 작업 13에서 채운다
import StepPlaceholder from "./StepPlaceholder";

export default function ColumnStep({ fileName, onBack }: { fileName: string | null; onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-6 px-8 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 text-base hover:bg-white"
        >
          ← 처음으로
        </button>
        {fileName && <p className="font-display text-2xl text-acorn-line">📄 {fileName}</p>}
      </header>
      <StepPlaceholder title="② 의견 열 선택" plannedTask="PLAN 작업 11~13" />
    </div>
  );
}
