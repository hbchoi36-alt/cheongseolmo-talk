"use client";

// Design Ref: DESIGN.md §3.4 ③ 분석 중 / 실패 화면, §6.3 오류별 안내 문구 (PLAN 작업 20)
// 마운트되면 분석을 시작하고(analyzeAll), 진행 상황("묶음 N / M")을 보여 준다.
// 성공하면 이름 가림·순화를 적용한 화면용 결과로 조립해(assembleResult) 넘기고, 실패하면 원인별 안내와 버튼을 보여 준다.
import { useEffect, useRef, useState } from "react";
import { analyzeAll, type AnalysisProgress } from "@/lib/analyzeAll";
import { AnalyzeError, type AnalyzeFailureKind } from "@/lib/analyzeClient";
import { assembleResult } from "@/lib/assemble";
import type { OpinionInput, ResultFile } from "@/lib/types";
import StepPlaceholder from "./StepPlaceholder";

type FailureAction = "retry" | "column" | "home";

// DESIGN.md §6.3 표의 화면 안내 문구와 버튼. 제목("분석에 실패했어요")은 모든 실패에 같다 (PRD).
const FAILURES: Record<AnalyzeFailureKind, { message: string; actions: FailureAction[] }> = {
  INVALID_INPUT: { message: "보낼 의견을 확인하지 못했어요. 의견 열을 다시 골라 주세요.", actions: ["column", "home"] },
  AI_RULE_VIOLATION: { message: "AI 결과가 규칙에 맞지 않았어요. 다시 시도해 주세요.", actions: ["retry", "home"] },
  AI_UNAVAILABLE: { message: "AI가 지금 응답하지 않아요. 잠시 후 다시 시도해 주세요.", actions: ["retry", "home"] },
  SERVER_CONFIG: {
    message: "AI 연결 설정(API 키·모델)에 문제가 있어요. 관리자에게 알려 주세요. 저장한 결과 파일이 있으면 불러올 수 있어요.",
    actions: ["home"],
  },
  NETWORK: { message: "응답이 너무 늦거나 연결이 끊겼어요. 다시 시도해 주세요.", actions: ["retry", "home"] },
};

const ACTION_LABEL: Record<FailureAction, string> = { retry: "다시 시도", column: "열 다시 고르기", home: "처음으로" };

type View =
  | { status: "running"; progress: AnalysisProgress | null }
  | { status: "failed"; kind: AnalyzeFailureKind }
  // 분석이 끝나 완료 팝업을 띄운 상태 — 운영자가 버튼을 눌러야 생각나무로 넘어간다
  | { status: "done"; result: ResultFile };

interface AnalyzingStepProps {
  /** [분석 시작]으로 넘어온 의견과 원본 파일 이름. 없으면(개발용 단계 이동) 안내만 보여 준다. */
  pending: { opinions: OpinionInput[]; sourceFileName: string } | null;
  /** 완료 팝업에서 [생각나무 보기]를 누르면 화면용 결과를 넘긴다 — App이 받아 생각나무로 넘어간다 */
  onDone: (result: ResultFile) => void;
  onChooseColumn: () => void;
  onGoHome: () => void;
}

interface Job {
  attempt: number;
  controller: AbortController;
  stopTimer?: ReturnType<typeof setTimeout>;
}

export default function AnalyzingStep({ pending, onDone, onChooseColumn, onGoHome }: AnalyzingStepProps) {
  const [view, setView] = useState<View>({ status: "running", progress: null });
  // [다시 시도]를 누를 때마다 올라가고, 올라가면 분석을 처음부터 다시 시작한다
  const [attempt, setAttempt] = useState(0);

  const jobRef = useRef<Job | null>(null);

  useEffect(() => {
    if (!pending) return;

    let job = jobRef.current;
    if (job && job.attempt === attempt) {
      // 개발 모드(StrictMode)가 효과를 다시 실행한 경우: 이미 시작한 분석을 이어서 쓴다 (AI를 두 번 부르지 않도록)
      clearTimeout(job.stopTimer);
    } else {
      job?.controller.abort();
      const controller = new AbortController();
      job = { attempt, controller };
      jobRef.current = job;
      void run(pending, controller);
    }

    // 화면을 떠나면 분석을 멈춘다. 곧바로 다시 실행되는 경우(위)를 구분하려고 한 박자 늦게 멈춘다.
    const current = job;
    return () => {
      current.stopTimer = setTimeout(() => current.controller.abort(), 0);
    };

    async function run(target: NonNullable<typeof pending>, controller: AbortController) {
      try {
        const analysis = await analyzeAll(target.opinions, {
          signal: controller.signal,
          onProgress: (progress) => {
            if (!controller.signal.aborted) setView({ status: "running", progress });
          },
        });
        if (controller.signal.aborted) return;

        // 조립 단계의 재검증(예: 이름을 가린 뒤 주제 이름이 겹침)에 걸리면 AI 결과 규칙 위반과 같게 안내한다
        const assembled = assembleResult({ opinions: target.opinions, analysis, sourceFileName: target.sourceFileName });
        if (!assembled.ok) {
          setView({ status: "failed", kind: "AI_RULE_VIOLATION" });
          return;
        }
        // 곧바로 넘어가지 않고 완료 팝업을 먼저 보여 준다 (운영자가 결과를 확인하고 넘어가도록)
        setView({ status: "done", result: assembled.result });
      } catch (error) {
        if (controller.signal.aborted) return;
        setView({ status: "failed", kind: error instanceof AnalyzeError ? error.kind : "NETWORK" });
      }
    }
  }, [pending, attempt]);

  if (!pending) {
    return (
      <div className="flex flex-1 flex-col">
        <StepPlaceholder title="③ 분석 중" plannedTask="의견 열을 고른 뒤 [분석 시작]을 누르면 나타나는 화면" />
      </div>
    );
  }

  function retry() {
    setView({ status: "running", progress: null });
    setAttempt((n) => n + 1);
  }

  const handlers: Record<FailureAction, () => void> = { retry, column: onChooseColumn, home: onGoHome };

  return (
    <div className="relative flex flex-1 flex-col">
      <header className="px-8 pt-6">
        <button
          type="button"
          onClick={onChooseColumn}
          className="rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 text-base hover:bg-white"
        >
          ← 열 다시 고르기
        </button>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-5 px-8 pb-16 text-center">
        {view.status === "failed" ? (
          <Failed kind={view.kind} handlers={handlers} />
        ) : (
          // 완료 팝업이 뜨면 이 화면은 어두운 막 뒤로 가려진다 (묶음 진행 문구는 빼고 기본 안내만 남김)
          <Running count={pending.opinions.length} progress={view.status === "running" ? view.progress : null} />
        )}
      </section>

      {view.status === "done" && <DonePopup result={view.result} onConfirm={() => onDone(view.result)} />}
    </div>
  );
}

/** 분석이 끝났다는 팝업 — 결과를 한눈에 알려 주고, 운영자가 버튼을 눌러야 생각나무로 넘어간다 */
function DonePopup({ result, onConfirm }: { result: ResultFile; onConfirm: () => void }) {
  const softenedCount = result.opinions.filter((opinion) => opinion.softened).length;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="analysis-done-title" className="absolute inset-0 z-30 flex items-center justify-center bg-ink/40 p-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border-4 border-acorn-cap/40 bg-cream px-10 py-8 text-center shadow-2xl">
        <p aria-hidden="true" className="text-6xl">🌰</p>
        <h2 id="analysis-done-title" className="font-display text-heading text-title-green">분석이 끝났어요!</h2>
        <p className="text-xl text-ink/80">
          의견 <strong className="text-acorn-line">{result.opinions.length}건</strong>을{" "}
          <strong className="text-acorn-line">{result.topics.length}개 주제</strong>로 정리했어요.
        </p>
        {softenedCount > 0 && <p className="text-base text-ink/60">거친 표현이 있던 의견 {softenedCount}건은 순화해서 보여 줘요.</p>}
        <button
          type="button"
          onClick={onConfirm}
          autoFocus
          className="mt-2 rounded-full bg-title-green px-10 py-2.5 font-display text-2xl text-white hover:opacity-90"
        >
          생각나무 보기 ▶
        </button>
      </div>
    </div>
  );
}

function Running({ count, progress }: { count: number; progress: AnalysisProgress | null }) {
  const multiBatch = progress !== null && progress.totalBatches > 1;

  return (
    <>
      <p aria-hidden="true" className="text-7xl motion-safe:animate-bounce">🌱</p>
      <h2 className="font-display text-heading text-acorn-line">의견 {count}건을 읽고 있어요…</h2>
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-2 text-xl text-ink/80">
        <p>{multiBatch ? "의견이 많아서 나눠서 읽고 있어요. 조금 더 걸릴 수 있어요" : "보통 1~2분 정도 걸려요"}</p>
        {multiBatch &&
          (progress.merging ? (
            <p className="font-display text-2xl text-title-green">분석 결과를 하나로 합치고 있어요</p>
          ) : (
            <p className="font-display text-2xl text-title-green">
              묶음 {progress.doneBatches} / {progress.totalBatches} 완료
            </p>
          ))}
        {progress?.retrying && <p className="text-base text-title-orange">조금 늦어져서 한 번 더 시도하고 있어요</p>}
      </div>
    </>
  );
}

function Failed({ kind, handlers }: { kind: AnalyzeFailureKind; handlers: Record<FailureAction, () => void> }) {
  const { message, actions } = FAILURES[kind];

  return (
    <div role="alert" className="flex flex-col items-center gap-5">
      <p aria-hidden="true" className="text-7xl">🍂</p>
      <h2 className="font-display text-heading text-acorn-line">분석에 실패했어요</h2>
      <p className="max-w-2xl text-xl text-ink/80">{message}</p>
      <div className="mt-2 flex gap-4">
        {actions.map((action, index) => (
          <button
            key={action}
            type="button"
            onClick={handlers[action]}
            autoFocus={index === 0}
            className={
              index === 0
                ? "rounded-full bg-title-green px-8 py-2.5 font-display text-2xl text-white hover:opacity-90"
                : "rounded-full border-2 border-acorn-line/30 bg-acorn-body px-8 py-2.5 font-display text-2xl text-acorn-line hover:bg-white"
            }
          >
            {ACTION_LABEL[action]}
          </button>
        ))}
      </div>
    </div>
  );
}
