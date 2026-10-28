"use client";

// Design Ref: DESIGN.md §3.3 ② 의견 열 선택 화면 — 분석할 문항(열) 하나를 고르면 유효 의견 수와 미리보기를 보여 주고 [분석 시작]으로 넘긴다.
// 한 번에 한 문항만 분석한다 (2026-10-28 운영자 결정: 문항마다 따로 분석해 결과 파일을 나눠 저장).
import { useState } from "react";
import { extractOpinions } from "@/lib/opinions";
import { RULES, type OpinionInput } from "@/lib/types";
import type { Survey } from "./App";

interface ColumnStepProps {
  survey: Survey | null;
  onBack: () => void;
  /** 고른 열의 유효 의견과 원본 파일 이름을 넘겨 분석을 시작한다 */
  onStart: (opinions: OpinionInput[], sourceFileName: string) => void;
}

const PREVIEW_COUNT = 3;

export default function ColumnStep({ survey, onBack, onStart }: ColumnStepProps) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const [columnIndex, setColumnIndex] = useState<number | null>(null);
  const table = survey?.tables[sheetIndex];

  if (!survey || !table) return null;

  const counts = table.headers.map((_, i) => extractOpinions(table.rows, i));
  const selected = columnIndex !== null ? counts[columnIndex] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex items-center gap-6">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 text-base hover:bg-white"
          >
            ← 처음으로
          </button>
          <p className="min-w-0 truncate font-display text-2xl text-acorn-line">📄 {survey.fileName}</p>
          <p className="ml-auto shrink-0 text-base text-ink/60">
            {table.sheetName && survey.tables.length === 1 && <>시트 {table.sheetName} · </>}
            응답 {table.rows.length}줄{survey.encoding && <> · 한글 인코딩 {survey.encoding}</>}
          </p>
        </header>

        <h2 className="font-display text-heading text-acorn-line">분석할 의견이 들어 있는 열을 골라 주세요</h2>

        {/* 시트가 2개 이상일 때만 고르게 한다 (DESIGN.md §12) */}
        {survey.tables.length > 1 && (
          <label className="flex items-center gap-3 text-xl">
            시트:
            <select
              value={sheetIndex}
              onChange={(e) => {
                setSheetIndex(Number(e.target.value));
                setColumnIndex(null);
              }}
              className="rounded-xl border-2 border-acorn-line/40 bg-white px-3 py-1"
            >
              {survey.tables.map((t, i) => (
                <option key={i} value={i}>
                  {t.sheetName}
                </option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">분석할 열</legend>
          {table.headers.map((header, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 py-3 transition ${
                columnIndex === i ? "border-acorn-cap bg-white shadow" : "border-transparent bg-acorn-body hover:bg-white"
              }`}
            >
              <input
                type="radio"
                name="opinion-column"
                checked={columnIndex === i}
                onChange={() => setColumnIndex(i)}
                className="h-5 w-5 shrink-0 accent-acorn-cap"
              />
              <span className="flex-1 text-lg leading-snug">{header}</span>
              <span className="shrink-0 text-base text-ink/60">응답 {counts[i].opinions.length}건</span>
            </label>
          ))}
        </fieldset>

        {selected && (
          <section className="flex flex-col gap-3 rounded-3xl border-4 border-acorn-line bg-acorn-body px-8 py-5">
            <p className="text-xl">
              유효 의견 <strong className="font-display text-3xl text-title-green">{selected.opinions.length}</strong>건
              <span className="text-ink/60"> (빈칸 {selected.blankCount}건 제외)</span>
            </p>
            {selected.opinions.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-base text-ink/60">미리보기</p>
                <ul className="flex flex-col gap-1">
                  {selected.opinions.slice(0, PREVIEW_COUNT).map((opinion) => (
                    <li key={opinion.id} className="line-clamp-2 rounded-xl bg-white/70 px-4 py-2 text-lg">
                      “{opinion.text}”
                    </li>
                  ))}
                </ul>
                {selected.opinions.length > PREVIEW_COUNT && (
                  <p className="text-base text-ink/60">외 {selected.opinions.length - PREVIEW_COUNT}건</p>
                )}
              </div>
            )}
            {selected.opinions.length > RULES.maxOpinionsPerRequest && (
              <p className="text-base text-ink/70">
                의견이 많아 {RULES.maxOpinionsPerRequest}건씩 나눠 분석한 뒤 주제를 합쳐요. 조금 더 오래 걸려요.
              </p>
            )}
          </section>
        )}

        <div className="flex items-center justify-end gap-4">
          {selected && selected.opinions.length === 0 && (
            <p className="text-lg text-heart">이 열에는 분석할 의견이 없어요. 다른 열을 골라 주세요.</p>
          )}
          <button
            type="button"
            disabled={!selected || selected.opinions.length === 0}
            onClick={() => selected && onStart(selected.opinions, survey.fileName)}
            className="rounded-full bg-title-green px-8 py-3 font-display text-2xl text-white shadow-md transition hover:bg-leaf-dark disabled:cursor-not-allowed disabled:bg-ink/20 disabled:shadow-none"
          >
            분석 시작 ▶
          </button>
        </div>
      </div>
    </div>
  );
}
