import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";
import "./NewsListPage.css";

// ==================== NewsCard 컴포넌트 ====================
const NewsCard = ({ item }) => {
  const navigate = useNavigate();
  const images = item.images || (item.imageUrl ? [item.imageUrl] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const pRef = useRef();

  const handlePrevClick = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextClick = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // 자동 슬라이드
  useEffect(() => {
    if (!images.length) return;
    const intervalId = setInterval(handleNextClick, 3000);
    return () => clearInterval(intervalId);
  }, [handleNextClick, images.length]);

  // 상세 페이지 이동
  const goToDetail = () => {
    navigate(`/news/${item.newsPostId}`);
  };

  return (
    <div className="news-card">
      <div className="news-card-image-box">
        {images.length > 0 ? (
          <>
            <button className="prev-btn" onClick={handlePrevClick}>
              {"<"}
            </button>
            <img
              className="carousel-image"
              src={images[currentImageIndex]}
              alt={item.title}
            />
            <button className="next-btn" onClick={handleNextClick}>
              {">"}
            </button>
          </>
        ) : (
          <div className="placeholder">이미지 없음</div>
        )}
      </div>

      <div className="news-card-content">
        <h2
          dangerouslySetInnerHTML={{ __html: item.title || "제목 없음" }}
        ></h2>
        <p
          ref={pRef}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.content}
        </p>
        <div className="news-card-more" onClick={goToDetail}>
          더 보기
        </div>
      </div>
    </div>
  );
};

// ==================== DevSpaceLayout ====================
const DevSpaceLayout = () => {
  const [news, setNews] = useState([]);
  const [curPage, setCurPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  const [searchType, setSearchType] = useState("전체");
  const [searchText, setSearchText] = useState("");

  // 뉴스 데이터 불러오기
  const fetchNews = async (page = 0, reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("curPage", page);
      params.append("pageSize", 10);

      if (searchType === "제목") params.append("title", searchText);
      else if (searchType === "내용") params.append("content", searchText);
      else if (searchType === "제목 + 내용") {
        params.append("title", searchText);
        params.append("content", searchText);
      }

      const data = await api.get(`/news-posts/?${params.toString()}`);
      const newItems = Array.isArray(data.contents) ? data.contents : [];
      setNews(reset ? newItems : [...news, ...newItems]);
      setCurPage(data.pageNumber ?? page);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      console.error("뉴스 게시글 불러오기 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드 및 검색
  useEffect(() => {
    fetchNews(0, true);
  }, [searchType, searchText]);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") fetchNews(0, true);
  };

  // 무한 스크롤
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          curPage < totalPages - 1
        ) {
          fetchNews(curPage + 1);
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(loaderRef.current);
    return () => loaderRef.current && observer.unobserve(loaderRef.current);
  }, [isLoading, curPage, totalPages]);

  return (
    <div className="news-list-page">
      <header className="news-list-page-header">
        <video className="header-video" autoPlay muted loop playsInline>
          <source
            src="https://hyojunbang9.github.io/MediaFile/DevSpace-Header.mp4"
            type="video/mp4"
          />
        </video>
        <h1>
          개발자들의 소통공간
          <span className="highlight">
            <br /> DevSpace
          </span>
        </h1>
      </header>

      <div className="search-bar">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option>전체</option>
          <option>제목</option>
          <option>내용</option>
          <option>제목 + 내용</option>
        </select>
        <input
          type="text"
          placeholder="검색어를 입력…🔍"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleSearchKeyPress}
        />
      </div>

      <div className="news-card-list">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}

        <div ref={loaderRef} className="spinner-container">
          {isLoading && <div className="spinner"></div>}
        </div>
      </div>
    </div>
  );
};

export default DevSpaceLayout;
