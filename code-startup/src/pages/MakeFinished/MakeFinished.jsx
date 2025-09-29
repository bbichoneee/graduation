//1-5. 회원가입 축하 페이지
import './MakeFinished.scss'
import MyRoutes from '/src/routes.jsx';
import {Link} from 'react-router-dom'
import { useEffect, useRef } from "react"; // ★ 추가

const ICONS = [
  { src: "/img/ico1.jpg", alt: "아이콘1" },
  { src: "/img/ico2.jpg", alt: "아이콘2" },
  { src: "/img/ico3.jpg", alt: "아이콘3" },
  { src: "/img/ico4.jpg", alt: "아이콘4" },
  { src: "/img/ico5.jpg", alt: "아이콘5" },
  { src: "/img/ico6.jpg", alt: "아이콘6" },
  { src: "/img/ico7.jpg", alt: "아이콘7" },
  { src: "/img/ico8.jpg", alt: "아이콘8" },
];

const MakeFinished = () => {
    const trackRef = useRef(null);
     const setRef = useRef(null);

    useEffect(() => {
        let mounted = true;

        // 1) 이미지 디코드가 끝난 뒤에 시작 (초기 끊김 방지)
        const imgs = Array.from(setRef.current.querySelectorAll("img"));
        const decodeAll = Promise.all(
        imgs.map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
        );

        const applyWidth = () => {
        if (!mounted || !setRef.current || !trackRef.current) return;
        const w = setRef.current.offsetWidth; // 세트 한 번의 정확한 픽셀 너비
        trackRef.current.style.setProperty("--set-width", `${w}px`);
        trackRef.current.classList.add("is-ready"); // 애니메이션 시작
        };

        decodeAll.then(applyWidth);

        // 2) 리사이즈 시 너비 재계산
        const onResize = () => applyWidth();
        window.addEventListener("resize", onResize);

        return () => {
        mounted = false;
        window.removeEventListener("resize", onResize);
        };
    }, []);

    return(
        <div className="container make-finished">
            {/* 텍스트가 위로 올라오도록, 마키는 배경 레이어 */}
            <div className="celebrate">
                <div className="icon-marquee" aria-hidden="true">
                    <div className="icon-track" ref={trackRef}>
                        {/* 세트 A (측정 기준) */}
                        <div className="icon-set" ref={setRef}>
                        {ICONS.map((it, i) => (
                            <img key={`a-${i}`} src={it.src} alt="" className="icon" loading="eager" />
                        ))}
                        </div>
                        {/* 세트 B (연속 루프용 복제) */}
                        <div className="icon-set" aria-hidden="true">
                        {ICONS.map((it, i) => (
                            <img key={`b-${i}`} src={it.src} alt="" className="icon" loading="eager" />
                        ))}
                        </div>
                    </div>
                </div>

                <div className="main_text gradient-text">
                축하합니다! <br /> 이제 로그인할 수 있습니다.
                </div>
            </div>

            <Link to="/login" className="btn btn-primary custom_btn">
                로그인 
                <img src="/img/arrow-forward-64.png" className="arrow" alt="" />
            </Link>
        </div>
    );
}

export default MakeFinished;