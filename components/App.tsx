"use client";

// Design Ref: DESIGN.md §3.1 화면 흐름 — 한 페이지 안에서 4단계 화면을 바꿔 보여준다 (주소는 그대로)
// 단계마다 필요한 데이터(올린 파일, 분석 결과 등)는 이후 작업에서 각 단계에 붙인다.
import { useEffect, useState } from "react";
import { readCsvFile, type CsvEncoding } from "@/lib/parse/csv";
import type { SurveyTable } from "@/lib/parse/table";
import { readXlsxFile } from "@/lib/parse/xlsx";
import type { SurveyFileKind } from "@/lib/surveyFile";
import { resultFileSchema, type OpinionInput, type ResultFile, type Topic } from "@/lib/types";
import { validateResultFile } from "@/lib/validate";
import AnalyzingStep from "./AnalyzingStep";
import ColumnStep from "./ColumnStep";
import StartStep from "./StartStep";
import TreeStep from "./TreeStep";

/** 읽어 들인 설문 파일 (브라우저 안에만 있다) */
export interface Survey {
  fileName: string;
  tables: (SurveyTable & { sheetName?: string })[];
  encoding?: CsvEncoding;
}

export type StepName = "start" | "column" | "analyzing" | "tree";

const STEPS: { name: StepName; label: string }[] = [
  { name: "start", label: "① 시작" },
  { name: "column", label: "② 의견 열 선택" },
  { name: "analyzing", label: "③ 분석 중" },
  { name: "tree", label: "④ 생각나무" },
];

const IS_DEV = process.env.NODE_ENV === "development";

// Design Ref: DESIGN.md §3.5 — 서버에 저장하지 않으므로, 내려받지 않고 나가면 결과가 사라진다
const LEAVE_WARNING = "결과 파일을 내려받지 않았어요. 나가면 다시 분석해야 해요. 그래도 나갈까요?";

export default function App() {
  const [step, setStep] = useState<StepName>("start");
  // 시작 화면에서 올려 읽어 들인 설문 파일 (브라우저 안에만 있다)
  // CSV는 표 1개, 엑셀은 응답이 있는 시트마다 표 1개
  const [survey, setSurvey] = useState<Survey | null>(null);
  // [분석 시작]으로 넘어온 의견 — AI 분석(PLAN 작업 14~)이 이 목록을 보낸다
  const [pending, setPending] = useState<{ opinions: OpinionInput[]; sourceFileName: string } | null>(null);
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

  // 내려받지 않은 결과가 있을 때 창을 닫거나 새로고침하면 브라우저가 확인 창을 띄운다
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  function goHome() {
    if (hasUnsavedChanges && !window.confirm(LEAVE_WARNING)) return;
    setResult(null);
    setHasUnsavedChanges(false);
    setPreviewTopicCount(null);
    setStep("start");
  }

  // Design Ref: DESIGN.md §4.1 ① — 파일을 읽어 표로 만든 뒤 의견 열 선택 화면으로 넘어간다. 읽지 못하면 시작 화면에 이유를 보여 준다.
  async function selectSurvey(file: File, kind: SurveyFileKind): Promise<string | null> {
    try {
      if (kind === "xlsx") {
        const read = await readXlsxFile(file);
        if (!read.ok) return `파일을 읽지 못했어요 — ${read.reason}`;
        setSurvey({ fileName: file.name, tables: read.table.sheets });
      } else {
        const read = await readCsvFile(file);
        if (!read.ok) return `파일을 읽지 못했어요 — ${read.reason} 엑셀에서 다시 저장해 보세요.`;
        setSurvey({ fileName: file.name, tables: [read.table], encoding: read.table.encoding });
      }
      setStep("column");
      return null;
    } catch {
      return "파일을 읽지 못했어요. 엑셀에서 다시 저장해 보세요.";
    }
  }

  // 결과 파일을 불러오면 AI 호출 없이 바로 생각나무를 띄운다 (PLAN 작업 8)
  function loadResult(loaded: ResultFile) {
    setResult(loaded);
    setHasUnsavedChanges(false);
    setPreviewTopicCount(null);
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
        {step === "start" && <StartStep onSurveySelected={selectSurvey} onResultLoaded={loadResult} />}
        {step === "column" && (
          <ColumnStep
            survey={survey}
            onBack={() => setStep("start")}
            onStart={(opinions, sourceFileName) => {
              setPending({ opinions, sourceFileName });
              setStep("analyzing");
            }}
          />
        )}
        {step === "analyzing" && (
          <AnalyzingStep opinionCount={pending?.opinions.length ?? null} onBack={() => setStep(survey ? "column" : "start")} />
        )}
        {step === "tree" && <TreeStep
            key={previewTopicCount ?? "all"}
            result={shownResult}
            onTopicChange={changeTopic}
            hasUnsavedChanges={hasUnsavedChanges}
            onDownloaded={() => setHasUnsavedChanges(false)}
            onGoHome={goHome}
          />}
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
