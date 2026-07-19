/**
 * components/layout/Footer.tsx
 * 메인 페이지·관리자 페이지 공용 하단 푸터. 기존 화면 레이아웃(사이드바/카드/버튼 배치)은
 * 그대로 두고, 콘텐츠 맨 아래에 저작권 표기 한 줄만 조용히 추가한다.
 */
export function Footer() {
  return (
    <footer className="mt-12 border-t border-[#1D2530] py-6 text-center text-[11px] text-text-faint">
      © THE K · 부군주 원재
    </footer>
  );
}
