import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";
import "./NewsViewPage.css";

const NewsViewPage = ({ refreshNewsPost }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [curCommentPage, setCurCommentPage] = useState(0);
  const [totalCommentPages, setTotalCommentPages] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loginUserId, setLoginUserId] = useState(null);

  // 로그인 정보 추출
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const idFromPayload = payload.userId || payload.id;
        setLoginUserId(String(idFromPayload));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // 뉴스 상세 조회
  useEffect(() => {
    const fetchNewsItem = async () => {
      try {
        const data = await api.get(`/news-posts/${id}`);
        setNewsItem(data);
        if (refreshNewsPost) refreshNewsPost(id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNewsItem();
  }, [id, refreshNewsPost]);

  // 댓글 조회
  const fetchComments = async (page = 0, reset = false) => {
    try {
      const data = await api.get(
        `/news-posts/${id}/comments?curPage=${page}&pageSize=10`
      );
      const newComments = Array.isArray(data.content) ? data.content : [];
      setComments(reset ? newComments : [...comments, ...newComments]);
      setCurCommentPage(data.number ?? page);
      setTotalCommentPages(data.totalPages ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) fetchComments(0, true);
  }, [id]);

  // 댓글 등록
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/news-posts/${id}/comments`, { content: commentText });
      setCommentText("");
      fetchComments(0, true);
      if (refreshNewsPost) refreshNewsPost(id);
    } catch (err) {
      console.error(err);
    }
  };

  // 댓글 수정
  const handleCommentUpdate = async (commentId) => {
    if (!editingText.trim()) return;
    try {
      await api.put(`/news-posts/${id}/comments/${commentId}`, {
        content: editingText,
      });
      setEditingCommentId(null);
      setEditingText("");
      fetchComments(curCommentPage, true);
      if (refreshNewsPost) refreshNewsPost(id);
    } catch (err) {
      console.error(err);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId) => {
    try {
      await api.delete(`/news-posts/${id}/comments/${commentId}`);
      fetchComments(curCommentPage, true);
      if (refreshNewsPost) refreshNewsPost(id);
    } catch (err) {
      console.error(err);
    }
  };

  // 이미지 캐러셀
  const images =
    newsItem?.imageUrls && newsItem.imageUrls.length > 0
      ? newsItem.imageUrls
      : newsItem?.url
        ? [newsItem.url]
        : [];

  const handlePrevClick = () =>
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const handleNextClick = useCallback(
    () =>
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      ),
    [images.length]
  );

  useEffect(() => {
    if (images.length === 0) return;
    const intervalId = setInterval(handleNextClick, 3000);
    return () => clearInterval(intervalId);
  }, [handleNextClick, images.length]);

  if (!newsItem) return <div className="news-view-page">로딩중...</div>;

  return (
    <div className="news-view-page-grid">
      {/* 좌측: 이미지 + 내용 */}
      <div className="left-section">
        <div className="photo-area">
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
        </div>
        <div className="description-area">
          <h2 className="news-title">{newsItem.title}</h2>
          {newsItem.content.split(/(?<=[.?!])\s+/).map((sentence, idx) => (
            <p key={idx} className="news-content">
              {sentence}
            </p>
          ))}

          {/* 조회수만 표시 */}
          <div className="news-views">조회수: {newsItem.viewCount ?? 0}</div>

          {/* 목록가기 버튼 */}
          <button
            className="back-to-list-btn"
            onClick={() => navigate("/news")}
          >
            목록가기
          </button>
        </div>
      </div>

      {/* 우측: 댓글 영역 */}
      <div className="right-section">
        <div className="newsComments-section-wrapper">
          <div className="newsComments-section">
            <div className="newsComment-page-info">
              페이지 {curCommentPage + 1} / {totalCommentPages}
            </div>
            <div className="newsComments-list">
              {comments.map((c) => (
                <div key={c.postCommentId} className="newsComment-item">
                  <div className="newsComment-header">
                    <div className="newsComment-profile"></div>
                    <span className="newsComment-author">{c.userNickname}</span>
                  </div>
                  {editingCommentId !== c.postCommentId ? (
                    <div className="newsComment-text">{c.content}</div>
                  ) : (
                    <input
                      className="newsComment-edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                  )}
                  {loginUserId && c.user && c.user.userId === loginUserId && (
                    <div className="newsComment-actions">
                      {editingCommentId === c.postCommentId ? (
                        <>
                          <button
                            onClick={() => handleCommentUpdate(c.postCommentId)}
                          >
                            저장
                          </button>
                          <button onClick={() => setEditingCommentId(null)}>
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingCommentId(c.postCommentId);
                              setEditingText(c.content);
                            }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleCommentDelete(c.postCommentId)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="newsComment-pagination">
              <button
                disabled={curCommentPage <= 0}
                onClick={() => fetchComments(curCommentPage - 1, true)}
              >
                {"<"}
              </button>
              {[...Array(totalCommentPages)].map((_, n) => (
                <button
                  key={n}
                  className={n === curCommentPage ? "active" : ""}
                  onClick={() => fetchComments(n, true)}
                >
                  {n + 1}
                </button>
              ))}
              <button
                disabled={curCommentPage >= totalCommentPages - 1}
                onClick={() => fetchComments(curCommentPage + 1, true)}
              >
                {">"}
              </button>
            </div>

            <form
              className="newsComment-input-container"
              onSubmit={(e) => {
                e.preventDefault();
                handleCommentSubmit();
              }}
            >
              <div className="newsComment-profile"></div>
              <input
                className="newsComment-input"
                placeholder="댓글을 입력..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit">등록</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsViewPage;
