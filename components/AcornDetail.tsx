"use client";

// Design Ref: DESIGN.md §3.5 도토리 상세 화면 — 도토리를 누르면 그 주제를 전체 화면으로 크게 보여준다.
// 왼쪽에 요약·토론 질문, 오른쪽에 의견 목록. [◀ 이전]·[다음 ▶]과 키보드 ←·→로 주제를 넘기고, Esc로 생각나무로 돌아간다.
// 의견은 화면용 문장(이름 ●●, 순화 반영)만 보여주고 원문은 고칠 수 없다 (PRD 원문 임의 변경 금지).
import { useEffect, useState } from "react";
import type { ResultFile, Topic } from "@/lib/types";
import TopicEditor from "./TopicEditor";

interface AcornDetailProps {
  result: ResultFile;
  topicIndex: number;
  /** 화면에 보여주는 주제 순서 (이전/다음 이동에 쓴다) */
  order: readonly number[];
  onNavigate: (topicIndex: number) => void;
  onClose: () => void;
  onTopicChange: (topic: Topic) => void;
}

export default function AcornDetail({ result, topicIndex, order, onNavigate, onClose, onTopicChange }: AcornDetailProps) {
  const [editing, setEditing] = useState(false);
  const topic = result.topics[topicIndex];
  const opinionsById = new Map(result.opinions.map((opinion) => [opinion.id, opinion]));

  const position = order.indexOf(topicIndex);
  const prevIndex = position > 0 ? order[position - 1] : null;
  const nextIndex = position < order.length - 1 ? order[position + 1] : null;

  // 고치는 중이 아닐 때만 키보드로 이동한다 (입력칸의 ←·→·Esc와 겹치지 않게)
  useEffect(() => {
    if (editing) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && prevIndex !== null) onNavigate(prevIndex);
      else if (e.key === "ArrowRight" && nextIndex !== null) onNavigate(nextIndex);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, prevIndex, nextIndex, onClose, onNavigate]);

  /** 이 의견이 들어 있는 다른 주제 이름들 (중복 집계를 참석자가 알 수 있게) */
  function otherTopicsOf(opinionId: number) {
    return result.topics.filter((t, i) => i !== topicIndex && t.opinionIds.includes(opinionId)).map((t) => t.name);
  }

  const navButton = "rounded-full border-2 border-acorn-line/30 bg-acorn-body px-6 py-2 text-xl hover:bg-white disabled:invisible";

  return (
    <div role="dialog" aria-modal="true" aria-label={`${topic.name} 주제 상세`} className="absolute inset-0 z-20 flex flex-col bg-cream px-12" style={{ gap: "2.5vh", paddingBlock: "3vh" }}>
      <header className="flex items-center gap-6">
        <button type="button" onClick={onClose} className={`${navButton} shrink-0`}>
          ← 생각나무로
        </button>
        <h2 className="min-w-0 flex-1 truncate text-center font-display text-acorn-line" style={{ fontSize: "clamp(1.75rem, 4.5vh, 3rem)" }}>
          🌰 {topic.name} <span className="text-title-orange">· {topic.opinionIds.length}건</span>
        </h2>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={editing}
          className="shrink-0 rounded-full border-2 border-acorn-line/30 px-4 py-1 text-base text-ink/70 hover:bg-white disabled:invisible"
        >
          ✏️ 고치기
        </button>
      </header>

      {editing ? (
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto rounded-3xl border-4 border-acorn-line bg-acorn-body p-8">
          <TopicEditor
            topic={topic}
            otherNames={result.topics.filter((_, i) => i !== topicIndex).map((t) => t.name)}
            onSave={(changed) => {
              onTopicChange(changed);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8">
          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto">
            <section className="rounded-3xl border-4 border-acorn-line bg-acorn-body px-8 py-6">
              <h3 className="mb-2 font-display text-2xl text-acorn-cap">요약</h3>
              <p className="leading-relaxed" style={{ fontSize: "clamp(1.25rem, 3vh, 2rem)" }}>
                {topic.summary}
              </p>
            </section>

            <section>
              <h3 className="mb-3 font-display text-2xl text-acorn-cap">💬 토론 질문</h3>
              {topic.discussionQuestions.length > 0 ? (
                <ol className="flex flex-col gap-3">
                  {topic.discussionQuestions.map((question, i) => (
                    <li key={i} className="flex gap-4 rounded-3xl bg-white/80 px-6 py-4 leading-snug shadow-sm" style={{ fontSize: "clamp(1.125rem, 2.8vh, 1.875rem)" }}>
                      <span className="shrink-0 font-display text-title-green">{i + 1}.</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-2xl text-ink/60">토론 질문이 없어요.</p>
              )}
            </section>
          </div>

          <section className="flex min-h-0 flex-col">
            <h3 className="mb-3 font-display text-2xl text-acorn-cap">📝 의견 ({topic.opinionIds.length})</h3>
            <ul className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-2">
              {topic.opinionIds.map((id) => {
                const opinion = opinionsById.get(id);
                if (!opinion) return null;
                const others = otherTopicsOf(id);
                return (
                  <li key={id} className="rounded-2xl border-l-8 border-leaf/70 bg-white/60 px-5 py-3 leading-relaxed" style={{ fontSize: "clamp(1rem, 2.2vh, 1.5rem)" }}>
                    {opinion.softened && (
                      <span className="mr-2 rounded-full bg-sky px-3 py-0.5 text-lg text-ink/80">순화됨</span>
                    )}
                    {opinion.displayText}
                    {others.length > 0 && (
                      <span className="mt-1 block text-lg text-ink/60">다른 주제에도 포함: {others.join(", ")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {!editing && (
        <footer className="flex items-center justify-between">
          <button type="button" onClick={() => prevIndex !== null && onNavigate(prevIndex)} disabled={prevIndex === null} className={navButton}>
            ◀ {prevIndex !== null ? result.topics[prevIndex].name : ""}
          </button>
          <span className="text-xl text-ink/60">
            {position + 1} / {order.length}
          </span>
          <button type="button" onClick={() => nextIndex !== null && onNavigate(nextIndex)} disabled={nextIndex === null} className={navButton}>
            {nextIndex !== null ? result.topics[nextIndex].name : ""} ▶
          </button>
        </footer>
      )}
    </div>
  );
}
