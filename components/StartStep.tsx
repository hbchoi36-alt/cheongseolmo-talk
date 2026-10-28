// Design Ref: DESIGN.md §3.2 ① 시작 화면 — 업로드·불러오기 버튼과 안내 문구는 PLAN 작업 10에서 채운다
import StepPlaceholder from "./StepPlaceholder";

export default function StartStep() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col items-center gap-2 pt-16">
        <h1 className="font-display text-title text-title-green">
          청설모 <span className="text-title-orange">Talk</span>
        </h1>
        <p>간담회 사전 설문 의견을 생각나무로 보여드려요</p>
      </header>
      <StepPlaceholder title="① 시작" plannedTask="PLAN 작업 10" />
    </div>
  );
}
