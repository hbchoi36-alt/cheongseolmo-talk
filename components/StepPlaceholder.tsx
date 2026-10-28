// 아직 만들지 않은 화면 자리에 보여주는 안내 상자. 각 화면을 만드는 작업에서 실제 내용으로 바뀐다.
export default function StepPlaceholder({ title, plannedTask }: { title: string; plannedTask: string }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="font-display text-heading text-acorn-line">{title}</h2>
      <p className="rounded-3xl border-4 border-dashed border-acorn-cap/40 bg-acorn-body px-8 py-6 text-ink/70">
        이 화면은 {plannedTask}에서 만들어요.
      </p>
    </section>
  );
}
