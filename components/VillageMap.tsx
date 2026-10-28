"use client";

// 청설모 마을 지도 — 간담회를 시작하기 전에 청설모 프로그램 전체 흐름(의견 저장 → 간담회 → 보고회 → 실행·확산)을 보여 주는 아이스브레이킹 화면.
// 운영자가 GPT로 만든 그림(public/village-map.webp, 2000×1124)을 화면에 꽉 차게 보여 주고, 버튼이나 Enter·→ 키로 생각나무로 넘어간다.
import Image from "next/image";
import { useEffect } from "react";

export default function VillageMap({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === "ArrowRight" || e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="청설모 마을 지도" className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-cream p-4" style={{ gap: "2vh" }}>
      <div className="relative min-h-0 w-full flex-1">
        <Image
          src="/village-map.webp"
          alt="청설모 마을 지도 — 1 도토리 창고(익명게시판, 의견 저장) → 2 청렴 소통 광장(간담회, 의견 발아·공유, 지금 우리는 여기) → 3 청설모 의회(보고회, 의견 검토·피드백) → 4 참나무 숲 공방(조직문화 CLEAN 협의회, 의견 실행·확산)"
          fill
          // 지도 속 작은 글씨가 큰 스크린에서도 선명하도록 줄이지 않은 원본(2000px)을 그대로 보낸다
          unoptimized
          loading="eager"
          className="object-contain select-none"
          draggable={false}
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        autoFocus
        className="shrink-0 rounded-full bg-title-green px-8 py-3 font-display text-white shadow-md transition hover:bg-leaf-dark"
        style={{ fontSize: "clamp(1.25rem, 3vh, 2rem)" }}
      >
        🌳 생각나무 보러 가기 ▶
      </button>
    </div>
  );
}
