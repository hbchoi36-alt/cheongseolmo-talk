"use client";

// Design Ref: DESIGN.md §3.5 ④ 생각나무 화면 — 왼쪽 시안 그림의 생각나무, 오른쪽 상세 패널
// 제목·안내 띠는 배경 그림에 들어 있다. 상세 패널 내용은 PLAN 작업 7(AcornDetail)에서 채운다.
import { useState } from "react";
import type { ResultFile } from "@/lib/types";
import StepPlaceholder from "./StepPlaceholder";
import ThoughtTree from "./ThoughtTree";

export default function TreeStep({ result }: { result: ResultFile | null }) {
  const [selectedName, setSelectedName] = useState<string | null>(null);

  if (!result) {
    return <StepPlaceholder title="④ 생각나무" plannedTask="결과를 불러온 뒤" />;
  }

  const selected = result.topics.find((topic) => topic.name === selectedName) ?? null;

  return (
    <div className="flex min-h-0 flex-1 bg-[#f7f3e3]">
      <section className="flex min-h-0 w-3/5 flex-col items-center justify-center">
        <div className="h-[calc(100vh-3rem)] min-h-0 max-w-full">
          <ThoughtTree topics={result.topics} selectedName={selectedName} onSelect={setSelectedName} />
        </div>
      </section>

      <aside className="flex w-2/5 flex-col gap-4 p-6">
        {/* 총 의견 수는 중복을 뺀 실제 의견 수 (DESIGN.md §3.5) */}
        <p className="text-right">
          의견 <strong className="font-display text-heading text-title-green">{result.opinions.length}</strong>건 · 주제{" "}
          <strong className="font-display text-heading text-title-orange">{result.topics.length}</strong>개
          <span className="block text-base text-ink/70">여러 주제에 걸친 의견은 주제마다 세어요</span>
        </p>
        <div className="flex flex-1 rounded-3xl border-4 border-acorn-line bg-acorn-body">
          {selected ? (
            <StepPlaceholder title={`🌰 ${selected.name} · ${selected.opinionIds.length}건`} plannedTask="PLAN 작업 7" />
          ) : (
            <StepPlaceholder title="도토리를 눌러 보세요 🌰" plannedTask="PLAN 작업 7" />
          )}
        </div>
      </aside>
    </div>
  );
}
