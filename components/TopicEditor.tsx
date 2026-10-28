"use client";

// Design Ref: DESIGN.md §3.5 주제 이름·요약·토론 질문 직접 고치기 — 한 주제를 한 번에 고치고 저장·취소한다.
// 사람이 고친 내용도 PRD 규칙(이름 10자, 요약 100자, 질문 3개)을 지키도록 칸마다 확인한다.
import { useState } from "react";
import { RULES, type Topic } from "@/lib/types";
import { charLength } from "@/lib/validate";

interface TopicEditorProps {
  topic: Topic;
  /** 다른 주제들의 이름 — 같은 이름을 막는 데 쓴다 */
  otherNames: readonly string[];
  onSave: (topic: Topic) => void;
  onCancel: () => void;
}

interface FieldErrors {
  name?: string;
  summary?: string;
  questions: (string | undefined)[];
}

function checkFields(name: string, summary: string, questions: string[], isOther: boolean, otherNames: readonly string[]) {
  const errors: FieldErrors = { questions: questions.map(() => undefined) };

  if (!isOther) {
    if (name === "") errors.name = "주제 이름을 써 주세요.";
    else if (charLength(name) > RULES.maxTopicNameLength) errors.name = `${RULES.maxTopicNameLength}자 이내로 써 주세요.`;
    else if (name === RULES.otherTopicName) errors.name = `'${RULES.otherTopicName}'는 정해진 주제 이름이라 쓸 수 없어요.`;
    else if (otherNames.includes(name)) errors.name = "다른 주제와 이름이 같아요.";
  }

  if (summary === "") errors.summary = "요약을 써 주세요.";
  else if (charLength(summary) > RULES.maxSummaryLength) errors.summary = `${RULES.maxSummaryLength}자 이내로 써 주세요.`;

  questions.forEach((question, i) => {
    if (question === "") errors.questions[i] = "빈 질문은 저장할 수 없어요. 쓰지 않을 질문은 [삭제]해 주세요.";
  });

  const ok = !errors.name && !errors.summary && errors.questions.every((error) => !error);
  return { ok, errors };
}

const inputClass =
  "w-full rounded-xl border-2 border-acorn-line/40 bg-white px-3 py-2 text-ink focus:border-acorn-cap focus:outline-none";

function Counter({ text, max }: { text: string; max: number }) {
  const length = charLength(text.trim());
  return <span className={`text-base ${length > max ? "text-heart" : "text-ink/60"}`}>{`${length} / ${max}`}</span>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-base text-heart">{message}</p> : null;
}

export default function TopicEditor({ topic, otherNames, onSave, onCancel }: TopicEditorProps) {
  const isOther = topic.name === RULES.otherTopicName;
  const [name, setName] = useState(topic.name);
  const [summary, setSummary] = useState(topic.summary);
  const [questions, setQuestions] = useState<string[]>(topic.discussionQuestions);
  const [errors, setErrors] = useState<FieldErrors | null>(null);

  function save() {
    const trimmedName = isOther ? topic.name : name.trim();
    const trimmedSummary = summary.trim();
    const trimmedQuestions = questions.map((question) => question.trim());
    const check = checkFields(trimmedName, trimmedSummary, trimmedQuestions, isOther, otherNames);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave({ ...topic, name: trimmedName, summary: trimmedSummary, discussionQuestions: trimmedQuestions });
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <p className="rounded-xl bg-sky/60 px-4 py-2 text-base">✏️ 고치는 중 · 사람 이름은 쓰지 마세요</p>

      <label className="flex flex-col gap-1">
        <span className="flex items-baseline justify-between font-display text-acorn-line">
          주제 이름 {isOther ? <span className="text-base text-ink/60">{`🔒 '${RULES.otherTopicName}'는 이름을 고칠 수 없어요`}</span> : <Counter text={name} max={RULES.maxTopicNameLength} />}
        </span>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={isOther} className={`${inputClass} disabled:bg-acorn-body disabled:text-ink/60`} autoFocus={!isOther} />
        <FieldError message={errors?.name} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex items-baseline justify-between font-display text-acorn-line">
          요약 <Counter text={summary} max={RULES.maxSummaryLength} />
        </span>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className={inputClass} autoFocus={isOther} />
        <FieldError message={errors?.summary} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 flex w-full items-baseline justify-between font-display text-acorn-line">
          토론 질문 <span className="font-sans text-base text-ink/60">{`${questions.length} / ${RULES.maxQuestionsPerTopic}`}</span>
        </legend>
        {questions.map((question, i) => (
          <div key={i}>
            <div className="flex gap-2">
              <input
                value={question}
                aria-label={`토론 질문 ${i + 1}`}
                onChange={(e) => setQuestions(questions.map((q, j) => (j === i ? e.target.value : q)))}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                className="shrink-0 rounded-xl border-2 border-acorn-line/30 px-3 text-base hover:bg-white"
              >
                삭제
              </button>
            </div>
            <FieldError message={errors?.questions[i]} />
          </div>
        ))}
        {questions.length < RULES.maxQuestionsPerTopic && (
          <button
            type="button"
            onClick={() => setQuestions([...questions, ""])}
            className="self-start rounded-xl border-2 border-dashed border-acorn-cap/50 px-4 py-1 text-base hover:bg-white"
          >
            + 질문 추가
          </button>
        )}
      </fieldset>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full border-2 border-acorn-line/40 px-6 py-2 hover:bg-white">
          취소
        </button>
        <button type="submit" className="rounded-full bg-acorn-cap px-6 py-2 text-acorn-body hover:bg-acorn-line">
          저장
        </button>
      </div>
    </form>
  );
}
