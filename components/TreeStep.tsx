// Design Ref: DESIGN.md §3.5 ④ 생각나무 화면 — 왼쪽 약 60% 생각나무, 오른쪽 약 40% 상세 패널
// 나무와 도토리는 PLAN 작업 6(ThoughtTree), 상세 패널은 작업 7(AcornDetail)에서 채운다.
import StepPlaceholder from "./StepPlaceholder";

export default function TreeStep() {
  return (
    <div className="flex flex-1 flex-col bg-sky/40">
      <header className="flex flex-col items-center gap-1 pt-6">
        <p className="rounded-xl bg-trunk px-8 py-1 font-display text-heading text-acorn-body shadow">청설모 TALK</p>
        <p className="font-display text-heading text-ink">생각이 모여 자라는</p>
        <h1 className="font-display text-title leading-none">
          <span className="text-title-green">생각</span>
          <span className="text-title-orange">나무</span>
        </h1>
        <p>
          여러분의 소중한 의견이 더 좋은 변화를 만듭니다 <span className="text-heart">♥</span>
        </p>
      </header>

      <div className="flex flex-1">
        <section className="flex w-3/5 flex-col">
          <StepPlaceholder title="생각나무" plannedTask="PLAN 작업 6" />
        </section>
        <aside className="flex w-2/5 flex-col p-6">
          <div className="flex flex-1 rounded-3xl border-4 border-acorn-line bg-acorn-body">
            <StepPlaceholder title="상세 패널" plannedTask="PLAN 작업 7" />
          </div>
        </aside>
      </div>

      <footer className="flex justify-center pb-4">
        <p className="rounded-full border-2 border-acorn-line/40 bg-acorn-body px-8 py-2">
          🌰 도토리가 클수록 더 많은 의견이 모인 주제예요!
        </p>
      </footer>
    </div>
  );
}
