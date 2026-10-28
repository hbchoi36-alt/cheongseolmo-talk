// 생각나무 배경 그림 속 청설모를 스티커처럼 잘라 보여준다 (새 그림 파일 없이 같은 그림을 다시 쓴다).
// 운영자가 따로 만든 캐릭터 그림이 생기면 이 부품만 바꾸면 된다.

// 배경 그림(1122×1402)에서 청설모가 있는 영역 (px)
const CROPS = {
  hugging: { x: 100, y: 1005, width: 300, height: 250 }, // 왼쪽 아래, 도토리를 안은 청설모
  waving: { x: 730, y: 990, width: 240, height: 250 }, // 오른쪽 아래, 손 흔드는 청설모
} as const;

const IMAGE_WIDTH = 1122;
const IMAGE_HEIGHT = 1402;

/** width는 CSS 길이(예: "min(220px, 22vh)") — 화면 높이에 맞춰 커지고 작아지게 비율로 자른다 */
export default function SquirrelSticker({ pose, width }: { pose: keyof typeof CROPS; width: string }) {
  const crop = CROPS[pose];
  return (
    <div
      aria-hidden="true"
      className="shrink-0 rounded-[2rem] border-4 border-acorn-body bg-no-repeat shadow-md"
      style={{
        width,
        aspectRatio: `${crop.width} / ${crop.height}`,
        backgroundImage: "url(/thought-tree-bg.webp)",
        backgroundSize: `${(IMAGE_WIDTH / crop.width) * 100}% ${(IMAGE_HEIGHT / crop.height) * 100}%`,
        backgroundPosition: `${(crop.x / (IMAGE_WIDTH - crop.width)) * 100}% ${(crop.y / (IMAGE_HEIGHT - crop.height)) * 100}%`,
      }}
    />
  );
}
