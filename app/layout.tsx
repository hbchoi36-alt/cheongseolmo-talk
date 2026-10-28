import type { Metadata } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// Design Ref: DESIGN.md §3.7 — 글꼴은 next/font로 직접 내려받아 써서 간담회장 인터넷 상태와 상관없이 보이게 한다
const jua = Jua({
  variable: "--font-jua",
  weight: "400",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "청설모 Talk",
  description: "간담회 사전 설문 의견을 AI로 분석해 생각나무로 보여주는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${jua.variable} ${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-body">{children}</body>
    </html>
  );
}
