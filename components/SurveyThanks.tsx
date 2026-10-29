"use client";

// Design Ref: DESIGN.md §3.9 ⑤ 사후 설문 안내 화면
// 간담회를 마치며 감사 인사 그림(public/survey-thanks.webp, 1672×941)을 전체 화면으로 보여 주고,
// 운영자가 입력한 구글폼 링크의 QR코드를 그림 속 흰색 QR 칸에 올린다. 링크는 서버로 보내지 않는다.
import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import { encode } from "uqr";

const IMAGE_WIDTH = 1672;
const IMAGE_HEIGHT = 941;

// 그림 속 흰색 QR 칸과 초록 [설문 바로가기] 버튼 위치 — 그림 크기에 대한 비율이라 화면 크기와 함께 커지고 작아진다
const QR_SLOT = { left: 0.753, top: 0.399, width: 0.166, height: 0.292 };
const GO_BUTTON = { left: 0.371, top: 0.574, width: 0.308, height: 0.14 };

// QR 바깥 흰 여백(점 칸 수) — 스캔이 되려면 최소 4칸이 필요하다
const QUIET_ZONE = 4;

function isSurveyUrl(text: string): boolean {
  try {
    const { protocol } = new URL(text);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

// 링크를 QR 점 배열로 바꿔 SVG 경로 하나로 만든다. 길이가 너무 길어 QR로 못 만들면 null.
function buildQrPath(url: string): { path: string; size: number } | null {
  try {
    // border: 0 — 흰 여백은 아래 QUIET_ZONE으로 직접 정한다 (uqr 기본값 1칸이 더해지지 않게)
    const { data, size } = encode(url, { ecc: "M", border: 0 });
    let path = "";
    data.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
      }),
    );
    return { path, size: size + QUIET_ZONE * 2 };
  } catch {
    return null;
  }
}

interface SurveyThanksProps {
  url: string | null;
  onUrlChange: (url: string) => void;
  onClose: () => void;
}

export default function SurveyThanks({ url, onUrlChange, onClose }: SurveyThanksProps) {
  const [draft, setDraft] = useState(url ?? "");
  // 링크가 아직 없거나 [링크 바꾸기]를 눌렀으면 입력 줄을 보여 준다
  const [editing, setEditing] = useState(url === null);
  const [error, setError] = useState<string | null>(null);

  const qr = useMemo(() => (url ? buildQrPath(url) : null), [url]);

  // 입력 줄 form에 noValidate를 둔 이유: 브라우저 기본 안내 대신 아래 한국어 안내를 보여 주려고
  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!isSurveyUrl(text)) {
      setError("https://로 시작하는 설문 링크를 넣어 주세요");
      return;
    }
    if (!buildQrPath(text)) {
      setError("링크가 너무 길어서 QR코드로 만들 수 없어요. 짧은 링크(forms.gle)를 써 주세요");
      return;
    }
    setError(null);
    onUrlChange(text);
    setDraft(text);
    setEditing(false);
  }

  // Esc: 링크를 바꾸는 중이면 바꾸기만 취소하고, 아니면 화면을 닫는다
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Escape") return;
    if (editing && url) {
      setEditing(false);
      setDraft(url);
      setError(null);
    } else {
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사후 설문 안내"
      onKeyDown={onKeyDown}
      className="absolute inset-0 z-30 flex flex-col items-center bg-cream p-4"
      style={{ gap: "1.5vh" }}
    >
      {/* 남는 공간에 맞춰 그림 비율 그대로 가장 크게 — QR이 그림 위 같은 자리에 오도록 그림과 한 상자에 둔다 */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center" style={{ containerType: "size" }}>
        <div
          className="relative"
          style={{ width: `min(100cqw, 100cqh * ${IMAGE_WIDTH} / ${IMAGE_HEIGHT})`, aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}` }}
        >
          <Image
            src="/survey-thanks.webp"
            alt="간담회에 참석해 주셔서 감사합니다. 청설모 간담회 사후설문, 약 2~3분, 익명설문. QR코드를 스캔해 주세요."
            fill
            // 큰 스크린에서도 글자가 선명하도록 줄이지 않은 원본을 그대로 보낸다
            unoptimized
            loading="eager"
            className="select-none"
            draggable={false}
          />
          {qr && url && (
            <>
              <svg
                role="img"
                aria-label="설문 QR코드"
                viewBox={`0 0 ${qr.size} ${qr.size}`}
                shapeRendering="crispEdges"
                className="absolute"
                style={{
                  left: `${QR_SLOT.left * 100}%`,
                  top: `${QR_SLOT.top * 100}%`,
                  width: `${QR_SLOT.width * 100}%`,
                  height: `${QR_SLOT.height * 100}%`,
                }}
              >
                <rect width={qr.size} height={qr.size} fill="#fff" />
                <path d={qr.path} fill="#3a2515" />
              </svg>
              {/* 그림 속 [설문 바로가기] 버튼 위에 겹친 링크 — 운영자가 눌러 설문을 직접 열 때 쓴다 */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="설문 바로가기 (새 탭)"
                className="absolute rounded-full outline-none focus-visible:ring-4 focus-visible:ring-title-orange"
                style={{
                  left: `${GO_BUTTON.left * 100}%`,
                  top: `${GO_BUTTON.top * 100}%`,
                  width: `${GO_BUTTON.width * 100}%`,
                  height: `${GO_BUTTON.height * 100}%`,
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* 운영자용 줄 — 그림 아래에 작게 둔다 */}
      <div className="flex w-full shrink-0 items-center justify-center gap-3" style={{ fontSize: "clamp(0.875rem, 2vh, 1.25rem)" }}>
        {editing ? (
          <form onSubmit={submit} noValidate className="flex w-full max-w-3xl items-center gap-3">
            <label htmlFor="survey-url" className="shrink-0 font-display text-acorn-line">설문 링크</label>
            <input
              id="survey-url"
              type="url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://forms.gle/…"
              autoFocus
              className="min-w-0 flex-1 rounded-full border-2 border-acorn-line/30 bg-white px-5 py-1.5 text-ink outline-none focus:border-title-green"
            />
            <button type="submit" className="shrink-0 rounded-full bg-title-green px-5 py-1.5 text-white hover:opacity-90">
              QR 만들기
            </button>
            {url && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(url);
                  setError(null);
                }}
                className="shrink-0 rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 hover:bg-white"
              >
                취소
              </button>
            )}
          </form>
        ) : (
          <>
            <p className="min-w-0 truncate text-ink/70">설문 링크가 연결됐어요 · {url}</p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 hover:bg-white"
            >
              링크 바꾸기
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border-2 border-acorn-line/30 bg-acorn-body px-5 py-1.5 hover:bg-white"
        >
          ← 생각나무로
        </button>
      </div>
      {error && (
        <p role="alert" className="shrink-0 text-center text-red-700" style={{ fontSize: "clamp(0.875rem, 2vh, 1.25rem)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
