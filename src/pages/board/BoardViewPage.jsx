import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";
import CommentList from "./CommentList";

// 카테고리 라벨 표시
const CATEGORY_LABELS = { dev: "개발", design: "디자인", ai: "AI", job: "취업", etc: "기타" };
const toLabel = (v) => CATEGORY_LABELS[String(v ?? "").toLowerCase()] ?? String(v ?? "");

export default function BoardViewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = useSelector((s) => s.user.token);

  const [detail, setDetail] = useState(null);

  const load = async () => {
    const data = await api.get(`/board-posts/${id}`);
    setDetail(data);
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  if (!detail) {
    return (
      <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
        불러오는 중...
      </div>
    );
  }

  const createdAt = detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "";

  const onDelete = async () => {
    if (!token) return alert("로그인 후 이용해 주세요.");
    if (!window.confirm("이 게시글을 삭제할까요?")) return;
    await api.delete(`/board-posts/${id}`);
    nav("/board");
  };

  const decodeHTML = (s) => {
    const el = document.createElement("textarea");
    el.innerHTML = s ?? "";
    return el.value;
  };
  const raw = detail?.content || "";
  const html = /&lt;|&gt;|&amp;/.test(raw) ? decodeHTML(raw) : raw;

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 12px" }}>
      <h2 style={{ margin: "8px 0 12px" }}>{detail.title}</h2>

      <div style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>
        <span style={{ marginRight: 8 }}>[{toLabel(detail.category)}]</span>
        <span style={{ marginRight: 8 }}>{detail.userNickname}</span>
        <span style={{ marginRight: 8 }}>{createdAt}</span>
        <span>조회 {detail.viewCount ?? 0} · 댓글 {detail.commentCount ?? 0}</span>
      </div>

      {/* 본문 */}
      <>
        <article
          className="post-body"
          style={{ padding: 16, background: "transparent", lineHeight: 1.7, minHeight: 120 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <style>{`
          .post-body img { max-width: 100%; height: auto; display: block; margin: 8px 0; }
          .post-body p { margin: 0 0 12px; }
          .post-body ul, .post-body ol { padding-left: 20px; margin: 8px 0; }
          .post-body a { color: #2d5ae7; text-decoration: underline; }
        `}</style>
      </>

      {/* 액션 */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Link to="/board" style={btnGhost}>목록</Link>
        <Link to={`/board/edit/${id}`} style={btnPrimary}>수정</Link>
        <button onClick={onDelete} style={btnDanger}>삭제</button>
      </div>

      {/* 댓글 */}
      <CommentList postId={id} onAdded={load} />
    </div>
  );
}

const btnGhost = {
  display: "inline-block", height: 36, lineHeight: "36px", padding: "0 14px",
  borderRadius: 6, border: "1px solid #bbb", textDecoration: "none",
  color: "#111", background: "#f7f7f7", fontSize: "1rem"
};
const btnPrimary = {
  display: "inline-block", height: 36, lineHeight: "36px", padding: "0 14px",
  borderRadius: 6, border: "1px solid #2d5ae7", textDecoration: "none",
  color: "#fff", background: "#2d5ae7", fontSize: "1rem"
};
const btnDanger = {
  height: 36, padding: "0 14px", borderRadius: 6,
  border: "1px solid #e05757", background: "#e05757", color: "#fff", cursor: "pointer", fontSize: "1rem"
};
