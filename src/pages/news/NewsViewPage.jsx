import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/api-client";
import "./NewsViewPage.css";

const NewsViewPage = () => {
  const { id } = useParams();
  const [newsItem, setNewsItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [curCommentPage, setCurCommentPage] = useState(0);
  const [totalCommentPages, setTotalCommentPages] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 게시글 정보 불러오기
  useEffect(() => {
    const fetchNewsItem = async () => {
      try {
        const data = await api.get(`/news-posts/${id}`);
        setNewsItem(data);
        console.log(data);
      } catch (err) {
        console.error("게시글 조회 실패:", err);
      }
    };
    fetchNewsItem();
  }, [id]);

  // 댓글 불러오기
  const fetchComments = async (page = 0, reset = false) => {
    try {
      const data = await api.get(
        `/news-posts/${id}/comments?curPage=${page}&pageSize=10`
      );
      const newComments = Array.isArray(data.contents) ? data.contents : [];
      setComments(reset ? newComments : [...comments, ...newComments]);
      setCurCommentPage(data.pageNumber ?? page);
      setTotalCommentPages(data.totalPages ?? 0);
    } catch (err) {
      console.error("댓글 조회 실패:", err);
    }
  };

  useEffect(() => {
    if (id) fetchComments(0, true);
  }, [id]);

  // 댓글 입력
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/news-posts/${id}/comments`, { text: commentText });
      setCommentText("");
      fetchComments(0, true);
    } catch (err) {
      console.error("댓글 등록 실패:", err);
    }
  };

  // 캐러셀 이미지
  const images =
    newsItem?.images || (newsItem?.imageUrl ? [newsItem.imageUrl] : []);
  const handlePrevClick = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextClick = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    if (images.length === 0) return;
    const intervalId = setInterval(handleNextClick, 3000);
    return () => clearInterval(intervalId);
  }, [handleNextClick, images.length]);

  if (!newsItem) return <div className="news-view-page">로딩중...</div>;

  return (
    <div className="news-view-page">
      <table className="news-view-table">
        <tbody>
          <tr>
            {/* 왼쪽: 사진 + 설명 */}
            <td className="left-panel">
              <table className="left-inner-table">
                <tbody>
                  {/* 사진 영역 */}
                  <tr className="photo-row">
                    <td>
                      {images.length > 0 ? (
                        <>
                          <button
                            className="carousel-btn prev-btn"
                            onClick={handlePrevClick}
                          >
                            {"<"}
                          </button>
                          <img
                            src={images[currentImageIndex]}
                            alt={newsItem.title}
                            className="carousel-image"
                          />
                          <button
                            className="carousel-btn next-btn"
                            onClick={handleNextClick}
                          >
                            {">"}
                          </button>
                        </>
                      ) : (
                        <div className="no-image">이미지 없음</div>
                      )}
                    </td>
                  </tr>

                  {/* 설명 영역 */}
                  <tr className="description-row">
                    <td>
                      <h2 className="news-title">{newsItem.title}</h2>
                      <p>{newsItem.content}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>

            {/* 오른쪽: 댓글 영역 */}
            <td className="right-panel">
              <table className="right-inner-table">
                <tbody>
                  {/* 댓글 리스트 */}
                  <tr className="comments-row">
                    <td>
                      <table className="w-full">
                        <tbody>
                          {comments.map((c) => (
                            <tr key={c.id} className="comment-item">
                              <td>
                                <div className="comment-header">
                                  <div className="comment-profile">사진</div>
                                  <span className="comment-author">
                                    {c.author}
                                  </span>
                                </div>
                                <div className="comment-text">{c.text}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* 페이지네이션 */}
                  <tr className="comment-pagination-row">
                    <td>
                      <button
                        className="comment-page-btn"
                        disabled={curCommentPage <= 0}
                        onClick={() => fetchComments(curCommentPage - 1)}
                      >
                        {"<"}
                      </button>
                      {[...Array(totalCommentPages)].map((_, n) => (
                        <button
                          key={n}
                          className={`comment-page-btn ${
                            n === curCommentPage ? "active" : ""
                          }`}
                          onClick={() => fetchComments(n)}
                        >
                          {n + 1}
                        </button>
                      ))}
                      <button
                        className="comment-page-btn"
                        disabled={curCommentPage >= totalCommentPages - 1}
                        onClick={() => fetchComments(curCommentPage + 1)}
                      >
                        {">"}
                      </button>
                    </td>
                  </tr>

                  {/* 댓글 입력창 */}
                  <tr className="comment-input-row">
                    <td>
                      <div className="comment-input-container">
                        <div className="comment-profile">사진</div>
                        <input
                          className="comment-input"
                          placeholder="댓글을 입력..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleCommentSubmit()
                          }
                        />
                        <button
                          className="comment-submit-btn"
                          onClick={handleCommentSubmit}
                        >
                          등록
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default NewsViewPage;
