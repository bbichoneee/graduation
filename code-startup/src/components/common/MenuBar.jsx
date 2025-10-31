import  { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import './MenuBar.scss'

/**
 * MenuBar – 하나의 진행바가 "선택한 메뉴의 오른쪽 끝"까지 정확히 차오르는 네비게이션
 *
 * • 왼쪽 로고, 오른쪽 메뉴(문제 은행, 사용자 맞춤 문제, 코드 챌린지, 랭킹, 내정보)
 * • 메뉴 클릭 → 네비 전체 뒤 배경이 해당 메뉴의 **오른쪽 끝**까지 부드럽게 채워짐
 * • 반응형 레이아웃에서도 실제 요소 너비/간격을 측정하여 정확히 맞춤
 */
const PATHS = {
  qbank: "/qbank",
  userq: "/userq",          
  codechallenge: "/codechallenge",
  ranking: "/ranking",
  mypage: "/mypage",
};

const MENUS = [
  { key: "qbank", label: "문제 은행" },
  { key: "userq", label: "사용자 맞춤 문제" },
  { key: "ranking", label: "랭킹" },
  { key: "mypage", label: "내정보" },
];

export default function MenuBar({
  logoSrc = "../../public/img/logo.png",
  onNavigate,
}) {
  const [activeIndex, setActiveIndex] = useState(-1); // -1이면 0% 채움
  const [progressPx, setProgressPx] = useState(0);    // 실제 px 기준 진행 너비

  const innerRef = useRef(null);
  const itemRefs = useRef([]);
  const location = useLocation();

  useEffect(() => {
    const idx = MENUS.findIndex(m => location.pathname.startsWith(PATHS[m.key]));
    setActiveIndex(idx); // -1이면 아무 메뉴도 선택되지 않음
    requestAnimationFrame(() => setProgressPx(calcProgressPx(idx)));
  }, [location.pathname]);

  // 진행바 재계산: 선택 아이템의 '오른쪽 끝'까지 px로 계산
  const calcProgressPx = (idx) => {
    const inner = innerRef.current;
    const first = itemRefs.current[0];
    if (!inner || !first) return 0;

    const innerRect = inner.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();

    // 메뉴 첫 번째 요소의 왼쪽 남는 전체 너비 (로고 + 간격 + 여분 공간 포함)
    const baseLeft = Math.max(0, firstRect.left - innerRect.left);

    if (idx < 0) return Math.min(baseLeft, inner.clientWidth);

    const el = itemRefs.current[idx];
    if (!el) return Math.min(baseLeft, inner.clientWidth);

    const elRect = el.getBoundingClientRect();
    const rightEdge = Math.max(0, elRect.right - innerRect.left);

    // rightEdge에 이미 baseLeft가 포함되어 있으므로 추가 가산 불필요
    return Math.min(rightEdge, inner.clientWidth);
  };

  // 클릭/키보드 선택
  const handlePick = (m, i) => {
    setActiveIndex(i);
    if (typeof onNavigate === "function") onNavigate(m.key);
  };

  const handleKeyDown = (e, m, i) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePick(m, i);
    }
  };

  // 레이아웃 이후 측정이 필요하므로 useLayoutEffect 사용
  useLayoutEffect(() => {
    setProgressPx(calcProgressPx(activeIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // 창 크기 변경 시 재측정 (디바운스: rAF)
  useEffect(() => {
     if (document.fonts?.ready) {
      document.fonts.ready.then(() => setProgressPx(calcProgressPx(activeIndex)));
     }
    let rafId;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setProgressPx(calcProgressPx(activeIndex));
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // ✅ 오른쪽 메뉴 활성화 시 우측 정렬 플래그
  const isRightAligned = activeIndex === MENUS.length - 1;

  return (
    <header className="csu-nav">
      <div
        className={
          "csu-nav__inner" + (isRightAligned ? " is-right-aligned" : "")
        }
        ref={innerRef}
      >
        {/* 뒤쪽에 깔리는 '하나의 체력바' (너비: px 단위) */}
        <div
          className="csu-nav__progress"
          aria-hidden
          style={{
            ["--progress-px"]: `${progressPx}px`,
            ["--fill-duration"]: "700ms",
            ["--fill-color-start"]: "rgba(255, 69, 69, 1)",
            ["--fill-color-end"]: "rgb(255,36,36)",
          }}
        />

        {/* 로고 → 홈 이동 */}
        <Link to="/" className="csu-nav__logo" aria-label="사이트 로고">
          <img src={logoSrc} alt="사이트 로고" />
        </Link>

        <nav className="csu-nav__menu" aria-label="주 메뉴">
          {MENUS.map((m, i) => (
            <NavLink
              key={m.key}
              to={PATHS[m.key]}
              ref={(el) => (itemRefs.current[i] = el)}
              className={({ isActive }) =>
                "csu-nav__item" +
                (isActive ? " is-active" : "") +
                (i <= activeIndex ? " is-filled" : "")
              }
              aria-current={activeIndex === i ? "page" : undefined}
            >
              <span className="csu-nav__label">{m.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
