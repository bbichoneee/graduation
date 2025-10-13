//2. 메인 페이지
import MenuBar from "../../components/common/MenuBar";
import MyRoutes from "../../routes";
import './Car.scss';

const Home = () => {
    return (
        <div>
            <MenuBar/>
            <div className="user_item">
                사용자 정보칸
            </div>
            <div id="heroCarousel"
                className="carousel slide carousel-80vh"
                data-bs-ride="carousel">
            <div className="carousel-inner">
                <div className="carousel-item active">
                <img src="/img/sample1.jpg" className="d-block w-100" alt="..." />
                </div>
                <div className="carousel-item">
                <img src="/img/sample2.jpg" className="d-block w-100" alt="..." />
                </div>
                <div className="carousel-item">
                <img src="/img/sample3.jpg" className="d-block w-100" alt="..." />
                </div>
            </div>

            <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
            </button>
            </div>
        </div>
    );
}

export default Home;