"use client";

// Design Ref: DESIGN.md §3.1 화면 흐름 — 한 페이지 안에서 4단계 화면을 바꿔 보여준다 (주소는 그대로)
// 단계마다 필요한 데이터(올린 파일, 분석 결과 등)는 이후 작업에서 각 단계에 붙인다.
import { useState } from "react";
import { resultFileSchema, type ResultFile, type Topic } from "@/lib/types";
import { validateResultFile } from "@/lib/validate";
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

const IS_DEV = process.env.NODE_ENV === "development";

export default function App() {
  const [step, setStep] = useState<StepName>("start");
  const [result, setResult] = useState<ResultFile | null>(null);
  // 고친 결과를 아직 내려받지 않았는지 — 나가기 전 확인 창(PLAN 작업 9)에 쓴다
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // 개발용: 주제 수가 달라질 때 도토리 배치를 미리 보려고 예시 결과의 앞 N개 주제만 보여준다
  const [previewTopicCount, setPreviewTopicCount] = useState<number | null>(null);

  // 개발용: 결과 파일 불러오기(PLAN 작업 8) 전까지 예시 결과로 생각나무를 띄운다. 배포 화면에는 포함되지 않는다.
  async function openExampleTree() {
    const example = resultFileSchema.parse((await import("@/samples/result-example.json")).default);
    const check = validateResultFile(example);
    if (!check.ok) console.warn("예시 결과가 규칙에 맞지 않아요", check.violations);
    setResult(example);
    setStep("tree");
  }

  function changeTopic(topicIndex: number, topic: Topic) {
    setResult((current) =>
      current ? { ...current, topics: current.topics.map((t, i) => (i === topicIndex ? topic : t)) } : current,
    );
    setHasUnsavedChanges(true);
  }

  const shownResult =
    result && previewTopicCount !== null ? { ...result, topics: result.topics.slice(0, previewTopicCount) } : result;

  return (
    <div className="flex h-screen flex-col">
      <main className="flex min-h-0 flex-1 flex-col">
        {step === "start" && <StartStep />}
        {step === "column" && <ColumnStep />}
        {step === "analyzing" && <AnalyzingStep />}
        {step === "tree" && <TreeStep key={previewTopicCount ?? "all"} result={shownResult} onTopicChange={changeTopic} />}
      </main>

      {/* 화면을 하나씩 만드는 동안 단계를 바로 오가기 위한 개발용 이동 막대 — 실제 배포 화면에는 나오지 않는다 */}
      {IS_DEV && (
        <nav aria-label="개발용 단계 이동" className="flex h-12 shrink-0 items-center justify-center gap-2 border-t border-acorn-line/20 bg-white/60 px-2 text-base">
          <span className="text-ink/60">개발용 단계 이동:</span>
          {hasUnsavedChanges && <span className="text-heart">● 내려받지 않은 변경</span>}
          {STEPS.map(({ name, label }) => (
            <button
              key={name}
              type="button"
              onClick={() => (name === "tree" && !result ? openExampleTree() : setStep(name))}
              aria-current={step === name ? "step" : undefined}
              className={`rounded-full px-3 py-1 ${step === name ? "bg-acorn-cap text-acorn-body" : "bg-acorn-body text-ink hover:bg-sky"}`}
            >
              {label}
            </button>
          ))}
          {step === "tree" && result && (
            <label className="ml-4 flex items-center gap-1 text-ink/70">
              도토리 수 미리보기
              <select
                value={previewTopicCount ?? "all"}
                onChange={(e) => setPreviewTopicCount(e.target.value === "all" ? null : Number(e.target.value))}
                className="rounded border border-acorn-line/30 bg-white px-1"
              >
                <option value="all">전체 ({result.topics.length}개)</option>
                {Array.from({ length: result.topics.length - 1 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}개
                  </option>
                ))}
              </select>
            </label>
          )}
        </nav>
      )}
    </div>
  );
}
