"use client";

// Design Ref: DESIGN.md §3.5·§3.8 — 운영자 시안 그림(도토리를 지운 버전)을 그대로 깔고, 그 위 나뭇가지 자리에 도토리를 코드로 그린다.
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { acornWidths } from "@/lib/acornSize";
import { displayOrder } from "@/lib/topicOrder";
import type { Topic } from "@/lib/types";
import Acorn from "./Acorn";

// 배경 그림 원본 크기 (public/thought-tree-bg.webp)
const IMAGE_WIDTH = 1122;
const IMAGE_HEIGHT = 1402;

// 도토리 자리: 도토리 가운데의 위치 (그림 너비·높이 대비 비율). 앞 자리일수록 의견이 많은 주제가 놓인다.
type Slot = { x: number; y: number };

// 주제 5개 이하: 시안의 도토리 자리 그대로 (위 3개, 아래 2개)
const SLOTS_UP_TO_5: Slot[] = [
  { x: 0.51, y: 0.44 },
  { x: 0.24, y: 0.42 },
  { x: 0.77, y: 0.44 },
  { x: 0.335, y: 0.63 },
  { x: 0.665, y: 0.64 },
];

// 주제 6~7개: 위 4곳, 아래 3곳. 오른쪽 아래 표지판 앞은 비워 둔다.
const SLOTS_UP_TO_7: Slot[] = [
  { x: 0.38, y: 0.42 },
  { x: 0.62, y: 0.42 },
  { x: 0.455, y: 0.635 },
  { x: 0.14, y: 0.43 },
  { x: 0.86, y: 0.45 },
  { x: 0.215, y: 0.635 },
  { x: 0.69, y: 0.635 },
];

interface ThoughtTreeProps {
  topics: readonly Topic[];
  /** 선택된 주제의 순서 번호 (결과의 topics 배열 기준) */
  selectedIndex: number | null;
  onSelect: (topicIndex: number) => void;
}

export default function ThoughtTree({ topics, selectedIndex, onSelect }: ThoughtTreeProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);

  // 화면 크기에 맞춰 그림이 커지고 작아지므로, 도토리 크기를 정하려고 실제 너비를 잰다
  // 처음 그릴 때 바로 한 번 재서, 화면이 바뀌어도 도토리가 잠깐 사라지지 않게 한다
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    setFrameWidth(frame.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // 의견이 많은 주제부터 앞 자리, '기타'는 마지막 자리
  const ordered = displayOrder(topics).map((index) => ({ topic: topics[index], index }));
  const slots = ordered.length <= SLOTS_UP_TO_5.length ? SLOTS_UP_TO_5 : SLOTS_UP_TO_7;
  const widths = acornWidths(ordered.map(({ topic }) => topic.opinionIds.length));

  return (
    <div
      ref={frameRef}
      className="relative mx-auto h-full max-w-full"
      style={{ aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}` }}
    >
      <Image
        src="/thought-tree-bg.webp"
        alt="청설모 TALK 생각이 모여 자라는 생각나무 — 청설모들이 모인 큰 나무 그림"
        width={IMAGE_WIDTH}
        height={IMAGE_HEIGHT}
        loading="eager"
        className="absolute inset-0 h-full w-full select-none"
        draggable={false}
      />

      {frameWidth > 0 &&
        ordered.map(({ topic, index }, i) => {
          const slot = slots[i];
          const width = widths[i] * frameWidth;
          return (
            <div
              key={index}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
            >
              <Acorn
                name={topic.name}
                count={topic.opinionIds.length}
                width={width}
                selected={selectedIndex === index}
                onSelect={() => onSelect(index)}
              />
            </div>
          );
        })}
    </div>
  );
}
