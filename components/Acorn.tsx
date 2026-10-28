// Design Ref: DESIGN.md §3.5 — 시안처럼 금색 고리 + 갈색 모자 + 크림색 방패 몸통, 몸통 안에 주제 이름과 의견 건수
import { Fragment, useLayoutEffect, useRef } from "react";

interface AcornProps {
  name: string;
  count: number;
  /** 도토리 너비(px). 글자 크기도 이 너비에 맞춘다 */
  width: number;
  selected: boolean;
  onSelect: () => void;
}

/** 붙어 있는 이름("근무제도·환경")도 가운뎃점 뒤에서 줄이 바뀔 수 있게 한다 */
function breakableName(name: string) {
  const parts = name.split("·");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <>
          ·<wbr />
        </>
      )}
    </Fragment>
  ));
}

export default function Acorn({ name, count, width, selected, onSelect }: AcornProps) {
  const labelRef = useRef<HTMLSpanElement>(null);

  // 글자는 도토리 너비의 12%로 시작해, 이름과 건수가 몸통(크림색) 안에 다 들어갈 때까지 줄인다.
  // 화면이 작아 도토리가 작아져도 모자(갈색)를 침범하거나 잘리지 않게 하기 위해서다.
  useLayoutEffect(() => {
    const label = labelRef.current;
    if (!label) return;
    let size = Math.min(30, width * 0.12);
    label.style.fontSize = `${size}px`;
    while (size > 8 && (label.scrollHeight > label.clientHeight + 1 || label.scrollWidth > label.clientWidth + 1)) {
      size -= 0.5;
      label.style.fontSize = `${size}px`;
    }
  }, [width, name, count]);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${name}, 의견 ${count}건`}
      className={`group relative block transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none ${
        selected ? "-translate-y-1 drop-shadow-[0_0_12px_rgba(217,164,65,0.95)]" : "drop-shadow-md"
      }`}
      style={{ width, height: width * 1.3 }}
    >
      <svg viewBox="0 0 100 130" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* 금색 고리 */}
        <circle cx="50" cy="6" r="4.5" fill="none" stroke="var(--color-ring-gold)" strokeWidth="2.5" />
        <rect x="47.5" y="9.5" width="5" height="7" rx="2" fill="var(--color-ring-gold)" stroke="var(--color-acorn-line)" strokeWidth="1" />
        {/* 몸통 (방패 모양) */}
        <path
          d="M10 40 Q10 34 16 34 L84 34 Q90 34 90 40 L90 78 Q90 108 50 126 Q10 108 10 78 Z"
          fill="var(--color-acorn-body)"
          stroke="var(--color-acorn-line)"
          strokeWidth="3"
          className={selected ? "" : "group-hover:fill-[#fffaf0]"}
        />
        {/* 모자 */}
        <path
          d="M4 44 Q4 15 50 15 Q96 15 96 44 Q96 50 90 50 L10 50 Q4 50 4 44 Z"
          fill="var(--color-acorn-cap)"
          stroke="var(--color-acorn-line)"
          strokeWidth="3"
        />
        <path d="M20 24 Q30 20 40 22" fill="none" stroke="#a8754a" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </svg>

      {/* 주제 이름과 건수 — 모자(갈색) 아래, 몸통이 좁아지기 전까지의 영역에만 놓는다 (SVG 기준 y 52~108) */}
      <span
        ref={labelRef}
        className="absolute inset-x-[15%] top-[41%] bottom-[17%] flex flex-col items-center justify-center overflow-hidden text-center font-display leading-tight text-ink"
        style={{ wordBreak: "keep-all" }}
      >
        <span>{breakableName(name)}</span>
        <span className="mt-0.5 text-[0.8em] text-acorn-cap">
          {count}건
        </span>
      </span>
    </button>
  );
}
