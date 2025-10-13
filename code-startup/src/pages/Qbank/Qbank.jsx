//2-1.문제은행 페이지
import { useState } from "react";
import MenuBar from "../../components/common/MenuBar";
import './Qbank.scss';
import GroupedList from "../../components/common/GroupedList";
import problems from "../../data/problems.json";

const Qbank = () => {
    const [lineUp,setLineUp] = useState ("unit");
    const [isClicked, setIsClicked ] = useState("false");
    const setSwitch = () =>{
        setIsClicked(!isClicked);
        if (isClicked){
            setLineUp("level");
        }
        else setLineUp("unit"); 
    }

    const userProgressById = {
        1 : "unattempted"
    }
   console.log("✅ problems type:", typeof problems, Array.isArray(problems), problems?.length);

    return (
        <div>
            <div className="menu_container">
                <MenuBar/>
            </div>
            <div>
                <div className="btn_box">
                    <button type = "button" onClick={setSwitch} className="btn btn-primary linebtn">
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
            <div className = "">
                <GroupedList
                    problems={problems}
                    userProgressById={userProgressById}
                    defaultOpenFirst
                />
            </div>
        </div>
    ) ;
}
export default Qbank;