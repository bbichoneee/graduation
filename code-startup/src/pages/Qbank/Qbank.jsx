// 2-1.문제은행 페이지
import { useEffect, useState } from "react";
import MenuBar from "../../components/common/MenuBar";
import "./Qbank.scss";
import GroupedList from "../../components/common/GroupedList";
import { http } from "../../api/http";

// 백엔드 difficulty → level(1~5)
const mapDifficultyToLevel = (d) => {
  if (!d) return null;
  const s = String(d).toUpperCase();
  const m = s.match(/(\d+)/);          // e.g. LEVEL_3 -> 3
  if (m) return Number(m[1]);
  if (s.includes("EASY")) return 1;
  if (s.includes("MEDIUM")) return 3;
  if (s.includes("HARD")) return 5;
  return null;
};

// (선택) 난이도 → 점수(UP 포인트) 임시 맵핑
// 백엔드 Problem에 score가 있으면 그대로 사용하고, 없으면 아래 맵을 적용.
// 프로젝트 정책에 맞게 자유롭게 바꿔도 됨.
const mapDifficultyToScore = (d) => {
  const lv = mapDifficultyToLevel(d);
  if (!lv) return null;
  // 예시: 레벨당 10점
  return lv * 10;
};

// 백엔드 Problem → 프론트에서 쓰는 필드로 적응
const adaptProblem = (raw) => ({
  id: raw.id,
  title: raw.title,
  level: mapDifficultyToLevel(raw.difficulty),        // 별 아이콘용
  uppoint: raw.score ?? mapDifficultyToScore(raw.difficulty), // 없으면 난이도 기반 점수
  tags: ["기타"],                                     // 백엔드에 tags 없으므로 기본값
  _raw: raw,
});

const Qbank = () => {
  const [lineUp, setLineUp] = useState("unit"); // "unit"(유형) | "level"(난이도)
  const [isClicked, setIsClicked] = useState("false");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const setSwitch = () => {
    setIsClicked(!isClicked);
    if (isClicked) setLineUp("level");
    else setLineUp("unit");
  };

  // 사용자 진행도 예시(있으면 채우기)
  const userProgressById = {
    // [problemId]: "unattempted" | "solved" | "wrong"
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        // 백엔드: 전체 리스트(페이징 없음 기준)
        const res = await http.get("/api/problems");
        const rows = Array.isArray(res.data) ? res.data : [];
        const adapted = rows.map(adaptProblem);
        if (!mounted) return;
        setProblems(adapted);
      } catch (e) {
        if (!mounted) return;
        setLoadErr(e?.message ?? "문제 목록을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <div className="menu_container">
        <MenuBar />
      </div>

      <div>
        <div className="btn_box">
          <button type="button" onClick={setSwitch} className="btn btn-primary linebtn">
            {isClicked ? "난이도별로 정렬" : "유형별로 정렬"}
          </button>
        </div>

        <div className="qbar">
          <div>문제번호</div>
          <div>제목</div>
          <div>내정보</div>
          <div>UP포인트</div>
          <div>난이도</div>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-center text-muted py-5">불러오는 중…</div>
        ) : loadErr ? (
          <div className="text-center text-danger py-5">{String(loadErr)}</div>
        ) : (
          <GroupedList
            problems={problems}
            userProgressById={userProgressById}
            defaultOpenFirst
            groupMode={lineUp === "level" ? "level" : "unit"}
          />
        )}
      </div>
    </div>
  );
};

export default Qbank;
