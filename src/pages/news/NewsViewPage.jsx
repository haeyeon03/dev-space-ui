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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loginUserId, setLoginUserId] = useState(null);

  // 로그인 사용자 ID 가져오기 (JWT에서)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const idFromPayload = payload.userId || payload.id;
        setLoginUserId(String(idFromPayload));
      } catch (err) {
        console.error("JWT 파싱 실패:", err);
      }
    }
  }, []);

  // 게시글 불러오기
  useEffect(() => {
    const fetchNewsItem = async () => {
      try {
        const data = await api.get(`/news-posts/${id}`);
        setNewsItem(data);
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
      const newComments = Array.isArray(data.content) ? data.content : [];
      setComments(reset ? newComments : [...comments, ...newComments]);
      setCurCommentPage(data.number ?? page);
      setTotalCommentPages(data.totalPages ?? 0);
    } catch (err) {
      console.error("댓글 조회 실패:", err);
    }
  };

  useEffect(() => {
    if (id) fetchComments(0, true);
  }, [id]);

  // 댓글 작성
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/news-posts/${id}/comments`, { content: commentText });
      setCommentText("");
      fetchComments(0, true);
    } catch (err) {
      console.error("댓글 등록 실패:", err);
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
    } catch (err) {
      console.error("댓글 수정 실패:", err);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId) => {
    try {
      await api.delete(`/news-posts/${id}/comments/${commentId}`);
      fetchComments(curCommentPage, true);
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
    }
  };

  // 이미지 캐러셀
  const images =
    newsItem?.images || (newsItem?.imageUrl ? [newsItem.imageUrl] : []);
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
        </div>
      </div>

      {/* 우측: 댓글 영역 */}
      <div className="right-section">
        <div className="comments-section-wrapper">
          <div className="comments-section">
            <div className="comment-page-info">
              페이지 {curCommentPage + 1} / {totalCommentPages}
            </div>
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.postCommentId} className="comment-item">
                  {/* 1. 프로필 + 닉네임 */}
                  <div className="comment-header">
                    <div className="comment-profile"></div>
                    <span className="comment-author">{c.userNickname}</span>
                  </div>

                  {/* 2. 내용 */}
                  {editingCommentId !== c.postCommentId ? (
                    <div className="comment-text">{c.content}</div>
                  ) : (
                    <input
                      className="comment-edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                  )}

                  {/* 3. 수정/삭제 버튼 (본인 댓글만) */}
                  {loginUserId && c.user && c.user.userId === loginUserId && (
                    <div className="comment-actions">
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

            {/* 페이지네이션 버튼 */}
            <div className="comment-pagination">
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

            {/* 댓글 입력 부분: form으로 감싸기 */}
            <form
              className="comment-input-container"
              onSubmit={(e) => {
                e.preventDefault(); // Enter 기본 동작 방지
                handleCommentSubmit();
              }}
            >
              <div className="comment-profile"></div>
              <input
                className="comment-input"
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
