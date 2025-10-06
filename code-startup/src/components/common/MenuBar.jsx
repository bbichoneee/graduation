
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import MyRoutes from '/src/routes.jsx';
import './Menubar.scss'

/**
 * MenuBar – 하나의 진행바가 "선택한 메뉴의 오른쪽 끝"까지 정확히 차오르는 네비게이션
 *
 * • 왼쪽 로고, 오른쪽 메뉴(문제 은행, 사용자 맞춤 문제, 코드 챌린지, 랭킹, 내정보)
 * • 메뉴 클릭 → 네비 전체 뒤 배경이 해당 메뉴의 **오른쪽 끝**까지 부드럽게 채워짐
 * • 반응형 레이아웃에서도 실제 요소 너비/간격을 측정하여 정확히 맞춤
 */

const MENUS = [
  { key: "bank", label: "문제 은행" },
  { key: "personal", label: "사용자 맞춤 문제" },
  { key: "challenge", label: "코드 챌린지" },
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

  // 진행바 재계산: 선택 아이템의 '오른쪽 끝'까지 px로 계산
  const calcProgressPx = (idx) => {
    const inner = innerRef.current;
    const first = itemRefs.current[0];
    if (!inner || !first) return 0;

    const innerRect = inner.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();

    // 메뉴 첫 번째 요소의 왼쪽 남는 전체 너비 (로고 + 간격 포함)
    const baseLeft = Math.max(0, firstRect.left - innerRect.left);

    // 선택한 메뉴의 오른쪽 끝 위치(컨테이너 기준)
    let rightEdge = 0;
    if (idx >= 0) {
      const el = itemRefs.current[idx];
      if (el) {
        rightEdge = el.offsetLeft + el.offsetWidth;
      }
    }

    // 요구사항: 기본 진행 너비(현재 계산값)에 'baseLeft'를 추가하여 채움
    // - 선택 없음(idx < 0)일 때는 최소로 baseLeft까지 채움
    // - 선택 있을 때는 rightEdge + baseLeft
    const target = (idx < 0 ? baseLeft : rightEdge + baseLeft);

    // 진행바는 .csu-nav__inner 안에서만 표시
    return Math.max(0, Math.min(target, inner.clientWidth));
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

  return (
    <header className="csu-nav">
      <div className="csu-nav__inner" ref={innerRef}>
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

            <div className="csu-nav__logo" aria-label="사이트 로고">
                <img src={logoSrc} alt="사이트 로고" />
            </div>

        <nav className="csu-nav__menu" aria-label="주 메뉴">
          {MENUS.map((m, i) => (
            <div
              key={m.key}
              role="button"
              tabIndex={0}
              aria-current={activeIndex === i ? "page" : undefined}
              className={"csu-nav__item" + (activeIndex === i ? " is-active" : "") + (i <= activeIndex ? ' is-filled' : '')}
              onClick={() => handlePick(m, i)}
              onKeyDown={(e) => handleKeyDown(e, m, i)}
              ref={(el) => (itemRefs.current[i] = el)}
            >
              <span className="csu-nav__label">{m.label}</span>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
