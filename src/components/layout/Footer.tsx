/**
 * components/layout/Footer.tsx
 * 메인 페이지·관리자 페이지 공용 하단 푸터. 기존 화면 레이아웃(사이드바/카드/버튼 배치)은
 * 그대로 두고, 콘텐츠 맨 아래에 저작권 표기만 추가한다. "부군주 원재"는 단순 부가 텍스트가
 * 아니라 제작자 브랜드처럼 보이도록 더 크게(17px) + Bold + Blue + 자간을 살짝 키워 강조하고,
 * 이 텍스트만 방송 채널 링크로 클릭 가능하게 만든다(주소는 화면에 노출하지 않는다).
 */
export function Footer() {
  return (
    <footer className="mt-12 flex items-center justify-center gap-2.5 border-t border-[#1D2530] py-8 text-center">
      <span className="text-[11px] text-text-faint">©</span>
      <span className="text-[11px] font-semibold text-text-faint">THE K</span>
      <span className="text-[11px] text-text-faint">·</span>
      <a
        href="https://www.sooplive.com/station/elleeayo"
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer text-[17px] font-bold tracking-[0.04em] text-primary opacity-100 transition-opacity duration-200 hover:opacity-70"
      >
        부군주 원재
      </a>
    </footer>
  );
}
