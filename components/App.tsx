"use client";

// Design Ref: DESIGN.md §3.1 화면 흐름 — 한 페이지 안에서 4단계 화면을 바꿔 보여준다 (주소는 그대로)
// 단계마다 필요한 데이터(올린 파일, 분석 결과 등)는 이후 작업에서 각 단계에 붙인다.
import { useState } from "react";
import AnalyzingStep from "./AnalyzingStep";
import ColumnStep from "./ColumnStep";
import StartStep from "./StartStep";
import TreeStep from "./TreeStep";

export type StepName = "start" | "column" | "analyzing" | "tree";

const STEPS: { name: StepName; label: string }[] = [
  { name: "start", label: "① 시작" },
  { name: "column", label: "② 의견 열 선택" },
  { name: "analyzing", label: "③ 분석 중" },
  { name: "tree", label: "④ 생각나무" },
];

export default function App() {
  const [step, setStep] = useState<StepName>("start");

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        {step === "start" && <StartStep />}
        {step === "column" && <ColumnStep />}
        {step === "analyzing" && <AnalyzingStep />}
        {step === "tree" && <TreeStep />}
      </main>

      {/* 화면을 하나씩 만드는 동안 단계를 바로 오가기 위한 개발용 이동 막대 — 실제 배포 화면에는 나오지 않는다 */}
      {process.env.NODE_ENV === "development" && (
        <nav aria-label="개발용 단계 이동" className="flex justify-center gap-2 border-t border-acorn-line/20 bg-white/60 p-2 text-base">
          <span className="self-center text-ink/60">개발용 단계 이동:</span>
          {STEPS.map(({ name, label }) => (
            <button
              key={name}
              type="button"
              onClick={() => setStep(name)}
              aria-current={step === name ? "step" : undefined}
              className={`rounded-full px-3 py-1 ${step === name ? "bg-acorn-cap text-acorn-body" : "bg-acorn-body text-ink hover:bg-sky"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
