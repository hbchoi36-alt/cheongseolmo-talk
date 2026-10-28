"use client";

// Design Ref: DESIGN.md §3.2 [저장한 결과 파일 불러오기] — 결과 파일(.json)을 고르면 검증 후 AI 호출 없이 생각나무를 띄운다.
// 결과 파일 내려받기 버튼은 PLAN 작업 9에서 이 파일에 함께 만든다.
import { useRef, useState } from "react";
import { MAX_RESULT_FILE_BYTES, readResultFile } from "@/lib/resultFile";
import type { ResultFile } from "@/lib/types";

export function LoadResultButton({ onLoaded }: { onLoaded: (result: ResultFile, fileName: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("결과 파일이 올바르지 않아요 — 앱에서 내려받은 .json 파일을 골라 주세요.");
      return;
    }
    if (file.size > MAX_RESULT_FILE_BYTES) {
      setError("결과 파일이 올바르지 않아요 — 파일이 너무 커요.");
      return;
    }
    const read = readResultFile(await file.text());
    if (!read.ok) {
      setError(`결과 파일이 올바르지 않아요 — ${read.reason}`);
      return;
    }
    onLoaded(read.result, file.name);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-1 rounded-3xl border-4 border-acorn-line bg-acorn-body px-10 py-6 shadow-md transition hover:-translate-y-0.5 hover:bg-white"
      >
        <span className="font-display text-heading text-acorn-line">🌳 저장한 결과 파일 불러오기</span>
        <span className="text-xl text-ink/70">.json</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="저장한 결과 파일 고르기"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // 같은 파일을 다시 골라도 다시 읽도록
          if (file) void handleFile(file);
        }}
      />
      {error && (
        <p role="alert" className="max-w-xl rounded-2xl bg-heart/10 px-5 py-3 text-center text-xl text-heart">
          {error}
        </p>
      )}
    </div>
  );
}
