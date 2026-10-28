// Design Ref: DESIGN.md §3.3 ② 의견 열 선택 화면
// 지금은 읽어 들인 표의 정보(열 이름, 응답 수, 인코딩)를 보여 준다. 열을 고르고 유효 의견 수·미리보기를 보여 주는 일은 PLAN 작업 13에서 채운다.
import type { CsvEncoding } from "@/lib/parse/csv";
import type { SurveyTable } from "@/lib/parse/table";

interface ColumnStepProps {
  survey: { fileName: string; table: SurveyTable; encoding?: CsvEncoding } | null;
  onBack: () => void;
}

export default function ColumnStep({ survey, onBack }: ColumnStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
      <header className="flex items-center gap-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 text-base hover:bg-white"
        >
          ← 처음으로
        </button>
        {survey && <p className="font-display text-2xl text-acorn-line">📄 {survey.fileName}</p>}
      </header>

      {survey && (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border-4 border-acorn-line bg-acorn-body px-8 py-6">
          <p className="text-xl">
            열 <strong>{survey.table.headers.length}</strong>개 · 응답 <strong>{survey.table.rows.length}</strong>줄
            {survey.encoding && <span className="text-ink/60"> · 한글 인코딩 {survey.encoding}</span>}
          </p>
          <ol className="flex flex-col gap-1 text-lg">
            {survey.table.headers.map((header, i) => (
              <li key={i} className="rounded-xl bg-white/70 px-4 py-2">
                {i + 1}. {header}
              </li>
            ))}
          </ol>
          <p className="text-base text-ink/60">분석할 열을 고르는 기능은 PLAN 작업 13에서 만들어요.</p>
        </section>
      )}
    </div>
  );
}
