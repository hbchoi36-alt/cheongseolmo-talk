"use client";

// Design Ref: DESIGN.md §3.2 [설문 파일 올리기] — CSV·엑셀(.xlsx)만 받는다. 눌러서 고르거나 파일을 끌어다 놓을 수 있다.
// 파일은 브라우저 안에서만 다루고 서버로 보내지 않는다 (DESIGN.md §4).
import { useRef, useState } from "react";
import { checkSurveyFile, type SurveyFileKind } from "@/lib/surveyFile";

export default function SurveyUploadButton({ onSelected }: { onSelected: (file: File, kind: SurveyFileKind) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    const check = checkSurveyFile(file);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setError(null);
    onSelected(file, check.kind);
  }

  return (
    <div className="flex w-[26rem] max-w-full flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`flex w-full flex-col items-center gap-1 rounded-3xl border-4 px-8 py-6 shadow-md transition hover:-translate-y-0.5 ${
          dragging ? "border-dashed border-title-green bg-white" : "border-acorn-line bg-acorn-body hover:bg-white"
        }`}
      >
        <span className="whitespace-nowrap font-display text-3xl text-acorn-line">📄 설문 파일 올리기</span>
        <span className="text-xl text-ink/70">CSV · 엑셀(.xlsx)</span>
        <span className="text-base text-ink/50">눌러서 고르거나 여기에 끌어다 놓으세요</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        aria-label="설문 파일 고르기"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // 같은 파일을 다시 골라도 다시 확인하도록
          if (file) handleFile(file);
        }}
      />
      {error && (
        <p role="alert" className="rounded-2xl bg-heart/10 px-5 py-3 text-center text-xl text-heart">
          {error}
        </p>
      )}
    </div>
  );
}
