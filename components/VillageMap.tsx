"use client";

// 청설모 마을 지도 — 간담회를 시작하기 전에 청설모 프로그램 전체 흐름(의견 저장 → 간담회 → 보고회 → 실행·확산)을 보여 주는 아이스브레이킹 화면.
// 운영자가 GPT로 만든 그림(public/village-map.webp, 2000×1124)을 화면에 꽉 차게 보여 주고,
// 지도 속 "② 청렴 소통 광장(간담회)"을 누르면 생각나무로 넘어간다 (2026-10-28 운영자 제안). Enter·→ 키로도 넘어갈 수 있다.
import Image from "next/image";
import { useEffect } from "react";

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 1124;

// 그림에서 "② 청렴 소통 광장" 이름판과 광장(큰 나무) 영역 — 그림 크기에 대한 비율이라 화면 크기와 함께 커지고 작아진다
const PLAZA = { left: 0.36, top: 0.15, width: 0.27, height: 0.47 };

export default function VillageMap({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === "ArrowRight" || e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="청설모 마을 지도" className="absolute inset-0 z-30 flex flex-col items-center bg-cream p-4" style={{ gap: "1.5vh" }}>
      {/* 남는 공간에 맞춰 그림 비율 그대로 가장 크게 — 눌리는 영역이 그림 위 같은 자리에 오도록 그림과 한 상자에 둔다 */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center" style={{ containerType: "size" }}>
        <div
          className="relative"
          style={{ width: `min(100cqw, 100cqh * ${MAP_WIDTH} / ${MAP_HEIGHT})`, aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
        >
          <Image
            src="/village-map.webp"
            alt="청설모 마을 지도 — 1 도토리 창고(익명게시판, 의견 저장) → 2 청렴 소통 광장(간담회, 의견 발아·공유, 지금 우리는 여기) → 3 청설모 의회(보고회, 의견 검토·피드백) → 4 참나무 숲 공방(조직문화 CLEAN 협의회, 의견 실행·확산)"
            fill
            // 지도 속 작은 글씨가 큰 스크린에서도 선명하도록 줄이지 않은 원본(2000px)을 그대로 보낸다
            unoptimized
            loading="eager"
            className="select-none"
            draggable={false}
          />
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="청렴 소통 광장으로 가서 생각나무 보기"
            className="group absolute rounded-[45%] outline-none"
            style={{
              left: `${PLAZA.left * 100}%`,
              top: `${PLAZA.top * 100}%`,
              width: `${PLAZA.width * 100}%`,
              height: `${PLAZA.height * 100}%`,
            }}
          >
            {/* 누를 곳을 알려 주는 은은한 테두리 — 마우스를 올리거나 키보드로 고르면 진해진다 */}
            <span className="pointer-events-none absolute inset-0 animate-pulse rounded-[45%] border-[6px] border-dashed border-white/90 shadow-[0_0_0_4px_rgba(217,164,65,0.85),0_0_40px_rgba(217,164,65,0.7)] transition group-hover:animate-none group-hover:border-solid group-hover:bg-white/10 group-focus-visible:animate-none group-focus-visible:border-solid" />
            <span
              className="pointer-events-none absolute bottom-[4%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-title-green px-5 py-1.5 font-display text-white opacity-0 shadow-md transition group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ fontSize: "clamp(1rem, 2.4vh, 1.75rem)" }}
            >
              ▶ 간담회 시작
            </span>
          </button>
        </div>
      </div>
      <p className="shrink-0 text-ink/70" style={{ fontSize: "clamp(0.875rem, 2vh, 1.25rem)" }}>
        지도에서 <strong className="text-title-green">② 청렴 소통 광장</strong>을 누르면 생각나무로 가요 (Enter)
      </p>
    </div>
  );
}
