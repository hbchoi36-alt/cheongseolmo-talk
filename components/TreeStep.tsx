"use client";

// Design Ref: DESIGN.md §3.5 ④ 생각나무 화면
// - 가운데: 시안 그림의 생각나무 (제목·안내 띠는 그림에 들어 있다)
// - 양옆 여백: 총 의견 수·주제 수와 주제 목록을 크게, 청설모로 꾸민다
// - 도토리(또는 주제 목록)를 누르면 그 주제의 상세 화면이 전체 화면으로 열린다
import { useState } from "react";
import { displayOrder } from "@/lib/topicOrder";
import type { ResultFile, Topic } from "@/lib/types";
import AcornDetail from "./AcornDetail";
import SquirrelSticker from "./SquirrelSticker";
import StepPlaceholder from "./StepPlaceholder";
import ThoughtTree from "./ThoughtTree";

// 양옆 여백 글자 크기: 최소값, 화면 높이 비율, 최대값 (1080px 화면에서 최대값에 닿는다)
const BIG_NUMBER = "clamp(3rem, 10vh, 7rem)";
const SIDE_HEADING = "clamp(1.25rem, 3.6vh, 2.5rem)";
const SIDE_ITEM = "clamp(1rem, 2.6vh, 1.75rem)";
const SIDE_TEXT = "clamp(0.875rem, 2vh, 1.25rem)";

interface TreeStepProps {
  result: ResultFile | null;
  /** 운영자가 상세 화면에서 고친 주제를 결과에 반영한다 */
  onTopicChange: (topicIndex: number, topic: Topic) => void;
}

export default function TreeStep({ result, onTopicChange }: TreeStepProps) {
  // 이름을 고쳐도 같은 주제가 열린 채로 남도록 이름 대신 순서 번호로 기억한다
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!result) {
    return <StepPlaceholder title="④ 생각나무" plannedTask="결과를 불러온 뒤" />;
  }

  const order = displayOrder(result.topics);
  const open = openIndex !== null && openIndex < result.topics.length ? openIndex : null;

  return (
    <div className="relative flex min-h-0 flex-1 bg-[#f7f3e3]">
      {/* 왼쪽 여백: 숫자 정보 */}
      {/* 양옆 글자·그림은 화면 높이(vh)에 맞춰 커지고 작아진다 — 노트북 창에서도 회의실 스크린에서도 잘리지 않게 */}
      <aside className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-8 text-center" style={{ gap: "3vh" }}>
        <div className="flex flex-col items-center">
          <p className="font-display text-acorn-line" style={{ fontSize: SIDE_HEADING }}>모인 의견</p>
          <p className="font-display leading-none text-title-green" style={{ fontSize: BIG_NUMBER }}>
            {result.opinions.length}
            <span className="text-acorn-line" style={{ fontSize: SIDE_HEADING }}>건</span>
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p className="font-display text-acorn-line" style={{ fontSize: SIDE_HEADING }}>열린 도토리</p>
          <p className="font-display leading-none text-title-orange" style={{ fontSize: BIG_NUMBER }}>
            {result.topics.length}
            <span className="text-acorn-line" style={{ fontSize: SIDE_HEADING }}>개</span>
          </p>
        </div>
        {/* 총 의견 수는 중복을 뺀 실제 의견 수 (DESIGN.md §3.5) */}
        <p className="text-ink/70" style={{ fontSize: SIDE_TEXT }}>여러 주제에 걸친 의견은 주제마다 세어요</p>
        <SquirrelSticker pose="hugging" width="min(220px, 22vh)" />
      </aside>

      {/* 가운데: 생각나무 */}
      <section className="flex min-h-0 shrink-0 items-center justify-center">
        <div className="h-[calc(100vh-3rem)] min-h-0">
          <ThoughtTree topics={result.topics} selectedIndex={open} onSelect={setOpenIndex} />
        </div>
      </section>

      {/* 오른쪽 여백: 주제 한눈에 보기 */}
      <aside className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-8" style={{ gap: "2.5vh" }}>
        <h2 className="font-display text-acorn-line" style={{ fontSize: SIDE_HEADING }}>🌰 주제 한눈에 보기</h2>
        <ol className="flex w-full max-w-md flex-col" style={{ gap: "1vh" }}>
          {order.map((index, rank) => {
            const topic = result.topics[index];
            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-acorn-body px-5 text-left shadow-sm hover:bg-white"
                  style={{ paddingBlock: "0.8vh", fontSize: SIDE_TEXT }}
                >
                  <span className="font-display text-acorn-cap">{rank + 1}</span>
                  <span className="flex-1 font-display text-ink" style={{ fontSize: SIDE_ITEM }}>{topic.name}</span>
                  <span className="text-title-orange">{topic.opinionIds.length}건</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="flex items-end gap-3">
          <p className="mb-6 rounded-2xl rounded-br-none bg-white px-4 py-2 shadow" style={{ fontSize: SIDE_TEXT }}>도토리를 눌러 보세요!</p>
          <SquirrelSticker pose="waving" width="min(170px, 17vh)" />
        </div>
      </aside>

      {/* 도토리 상세 — 전체 화면 */}
      {open !== null && (
        <AcornDetail
          key={open}
          result={result}
          topicIndex={open}
          order={order}
          onNavigate={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          onTopicChange={(topic) => onTopicChange(open, topic)}
        />
      )}
    </div>
  );
}
