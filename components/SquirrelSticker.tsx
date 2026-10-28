// 생각나무 양옆을 꾸미는 청설모 캐릭터 — 운영자가 만든 배경이 투명한 그림 (public/squirrel-*.webp, 1254×1254)
import Image from "next/image";

const POSES = {
  hugging: { src: "/squirrel-left.webp", alt: "도토리를 안고 있는 청설모" }, // 왼쪽
  waving: { src: "/squirrel-right.webp", alt: "손을 흔드는 청설모" }, // 오른쪽
} as const;

/** width는 CSS 길이(예: "min(240px, 24vh)") — 화면 높이에 맞춰 커지고 작아진다 */
export default function SquirrelSticker({ pose, width }: { pose: keyof typeof POSES; width: string }) {
  const { src, alt } = POSES[pose];
  return (
    <Image
      src={src}
      alt={alt}
      width={1254}
      height={1254}
      loading="eager"
      draggable={false}
      className="h-auto shrink-0 select-none drop-shadow-md"
      style={{ width }}
    />
  );
}
