"use client";

// Design Ref: DESIGN.md §3.5 ④ 생각나무 화면 — 왼쪽 시안 그림의 생각나무, 오른쪽 상세 패널
// 제목·안내 띠는 배경 그림에 들어 있다.
import { useState } from "react";
import type { ResultFile, Topic } from "@/lib/types";
import AcornDetail from "./AcornDetail";
import StepPlaceholder from "./StepPlaceholder";
import ThoughtTree from "./ThoughtTree";

interface TreeStepProps {
  result: ResultFile | null;
  /** 운영자가 상세 패널에서 고친 주제를 결과에 반영한다 */
  onTopicChange: (topicIndex: number, topic: Topic) => void;
}

export default function TreeStep({ result, onTopicChange }: TreeStepProps) {
  // 이름을 고쳐도 같은 도토리가 선택된 채로 남도록 이름 대신 순서 번호로 기억한다
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!result) {
    return <StepPlaceholder title="④ 생각나무" plannedTask="결과를 불러온 뒤" />;
  }

  const selected = selectedIndex !== null && selectedIndex < result.topics.length ? selectedIndex : null;

  return (
    <div className="flex min-h-0 flex-1 bg-[#f7f3e3]">
      <section className="flex min-h-0 w-3/5 flex-col items-center justify-center">
        <div className="h-[calc(100vh-3rem)] min-h-0 max-w-full">
          <ThoughtTree topics={result.topics} selectedIndex={selected} onSelect={setSelectedIndex} />
        </div>
      </section>

      <aside className="flex min-h-0 w-2/5 flex-col gap-4 p-6">
        {/* 총 의견 수는 중복을 뺀 실제 의견 수 (DESIGN.md §3.5) */}
        <p className="text-right">
          의견 <strong className="font-display text-heading text-title-green">{result.opinions.length}</strong>건 · 주제{" "}
          <strong className="font-display text-heading text-title-orange">{result.topics.length}</strong>개
          <span className="block text-base text-ink/70">여러 주제에 걸친 의견은 주제마다 세어요</span>
        </p>
        <div className="flex min-h-0 flex-1 flex-col rounded-3xl border-4 border-acorn-line bg-acorn-body shadow-lg">
          {selected !== null ? (
            <AcornDetail
              key={selected}
              result={result}
              topicIndex={selected}
              onTopicChange={(topic) => onTopicChange(selected, topic)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="font-display text-heading text-acorn-line">도토리를 눌러 보세요 🌰</p>
              <p className="text-ink/70">주제별 요약과 토론 질문, 직원 의견을 볼 수 있어요.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
