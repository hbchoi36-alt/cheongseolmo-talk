"use client";

// Design Ref: DESIGN.md §3.5 상세 패널 — 고른 도토리의 요약, 토론 질문, 의견 목록을 보여주고 [✏️ 고치기]로 다듬는다.
// 의견은 화면용 문장(이름 ●●, 순화 반영)만 보여주고 원문은 고칠 수 없다 (PRD 원문 임의 변경 금지).
import { useState } from "react";
import type { ResultFile, Topic } from "@/lib/types";
import TopicEditor from "./TopicEditor";

interface AcornDetailProps {
  result: ResultFile;
  topicIndex: number;
  onTopicChange: (topic: Topic) => void;
}

export default function AcornDetail({ result, topicIndex, onTopicChange }: AcornDetailProps) {
  const [editing, setEditing] = useState(false);
  const topic = result.topics[topicIndex];
  const opinionsById = new Map(result.opinions.map((opinion) => [opinion.id, opinion]));

  /** 이 의견이 들어 있는 다른 주제 이름들 (중복 집계를 참석자가 알 수 있게) */
  function otherTopicsOf(opinionId: number) {
    return result.topics.filter((t, i) => i !== topicIndex && t.opinionIds.includes(opinionId)).map((t) => t.name);
  }

  if (editing) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
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
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-start justify-between gap-4 border-b-2 border-acorn-line/20 px-6 pb-4 pt-6">
        <h2 className="font-display text-heading leading-tight text-acorn-line">
          🌰 {topic.name} <span className="text-title-orange">· {topic.opinionIds.length}건</span>
        </h2>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-full border-2 border-acorn-line/30 px-3 py-1 text-base text-ink/70 hover:bg-white"
        >
          ✏️ 고치기
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
        <section>
          <h3 className="mb-1 font-display text-acorn-cap">요약</h3>
          <p className="leading-relaxed">{topic.summary}</p>
        </section>

        <section>
          <h3 className="mb-2 font-display text-acorn-cap">💬 토론 질문</h3>
          {topic.discussionQuestions.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {topic.discussionQuestions.map((question, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-white/70 px-4 py-3 leading-snug">
                  <span className="font-display text-title-green">{i + 1}.</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink/60">토론 질문이 없어요.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-display text-acorn-cap">📝 의견 ({topic.opinionIds.length})</h3>
          <ul className="flex flex-col gap-3">
            {topic.opinionIds.map((id) => {
              const opinion = opinionsById.get(id);
              if (!opinion) return null;
              const others = otherTopicsOf(id);
              return (
                <li key={id} className="border-l-4 border-leaf/60 pl-4 text-xl leading-relaxed">
                  {opinion.softened && (
                    <span className="mr-2 rounded-full bg-sky px-2 py-0.5 text-base text-ink/80">순화됨</span>
                  )}
                  {opinion.displayText}
                  {others.length > 0 && (
                    <span className="mt-1 block text-base text-ink/60">다른 주제에도 포함: {others.join(", ")}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
