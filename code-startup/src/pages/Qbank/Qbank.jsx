// 2-1.문제은행 페이지
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MenuBar from "../../components/common/MenuBar";
import "./Qbank.scss";
import GroupedList from "../../components/common/GroupedList";
import { fetchProblems } from "../../api/problems";

const Qbank = () => {
  const [searchParams] = useSearchParams();
  const initialTag = searchParams.get("tag");

  const [lineUp, setLineUp] = useState("unit"); // "unit"(유형) | "level"(난이도)
  const [isClicked, setIsClicked] = useState(true);
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
        const adaptedProblems = await fetchProblems();
        if (!mounted) return;
        setProblems(adaptedProblems);
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
            initialOpenGroup={initialTag}
          />
        )}
      </div>
    </div>
  );
};

export default Qbank;
