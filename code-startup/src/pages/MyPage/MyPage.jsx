// 2-5. 내정보 페이지
import MenuBar from "../../components/common/MenuBar";
import ProfileCard from "../../components/common/Profilecard";

const MyPage = () => {
    return (
        <div>
            <MenuBar />
            <div>
                <ProfileCard/>
                <div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
    );
}

export default MyPage;