import React, { useState, useEffect, useCallback } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";
import "./NewsListPage.css";

const NewsCard = ({ item }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevClick = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? item.images.length - 1 : prevIndex - 1
    );
  };

  const handleNextClick = useCallback(() => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === item.images.length - 1 ? 0 : prevIndex + 1
    );
  }, [item.images.length]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      handleNextClick();
    }, 3000); // 3초마다 다음 이미지로 넘김

    // 컴포넌트가 언마운트될 때 인터벌을 정리합니다.
    return () => clearInterval(intervalId);
  }, [handleNextClick]);

  return (
    <div className="news-card">
      {/* 왼쪽 이미지 캐러셀 */}
      <div className="news-card-image-box">
        <button onClick={handlePrevClick}>{"<"}</button>
        <img
          className="carousel-image"
          src={item.images[currentImageIndex]}
          alt={item.title}
        />
        <button onClick={handleNextClick}>{">"}</button>
      </div>

      {/* 오른쪽 텍스트 */}
      <div className="news-card-content">
        <div>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </div>
        <div className="news-card-more">더 보기</div>
      </div>
    </div>
  );
};

const DevSpaceLayout = () => {
  const data = [
    {
      id: 1,
      title: "헤드라인1",
      description: "설명~~~~~1",
      images: ["이미지1-1", "이미지1-2", "이미지1-3"],
    },
    {
      id: 2,
      title: "헤드라인2",
      description: "설명~~~~~2",
      images: ["이미지2-1", "이미지2-2", "이미지2-3"],
    },
  ];

  return (
    <div className="news-list-page">
      {/* 헤더 */}
      <header className="news-list-page-header">
        <h1>
          개발자들의 소통공간{" "}
          <span className="highlight">
            <br />
            DevSpace
          </span>
        </h1>
      </header>

      {/* 검색 */}
      <div className="search-bar">
        <select>
          <option>검색</option>
          <option>제목</option>
          <option>내용</option>
          <option>제목 + 내용</option>
        </select>
        <input type="text" placeholder="검색어를 입력…🔍" />
      </div>

      {/* 콘텐츠 카드 리스트 */}
      <div className="news-card-list">
        {data.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default DevSpaceLayout;
