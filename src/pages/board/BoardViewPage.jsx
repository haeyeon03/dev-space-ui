// src/pages/board/BoardViewPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";
import CommentList from "./CommentList";

// 카테고리 라벨 표시
const CATEGORY_LABELS = { dev: "개발", design: "디자인", ai: "AI", job: "취업", etc: "기타" };
const toLabel = (v) => CATEGORY_LABELS[String(v ?? "").toLowerCase()] ?? String(v ?? "");

// 유틸: 첫 truthy 값을 반환
const pick = (...arr) => arr.find((v) => v != null && v !== "");

// 유틸: 문자열 비교(대소문자 무시)
const eqStr = (a, b) =>
  a != null &&
  b != null &&
  String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// 내 정보 추출 (리덕스 구조가 달라도 최대한 커버)
function useMe() {
  const base = useSelector((s) => s.user ?? {});
  const nested = base.user ?? base.profile ?? base;

  const myId = pick(
    nested?.userId,
    nested?.id,
    nested?.memberId,
    nested?.username,
    // 혹시 루트에 있을 수도 있음
    base?.userId,
    base?.id
  );
  const myEmail = pick(nested?.email, nested?.userEmail, nested?.mail, base?.email);
  const myNick = pick(nested?.nickname, nested?.nickName, nested?.name, nested?.displayName, base?.nickname);

  const token = base?.token;

  return useMemo(() => ({ myId, myEmail, myNick, token }), [myId, myEmail, myNick, token]);
}

// 작성자 정보에서 아이디/이메일/닉 추출
function authorFromPost(detail) {
  const id = pick(
    detail?.userId,
    detail?.memberId,
    detail?.authorId,
    detail?.createdById,
    detail?.user?.id,
    detail?.author?.id
  );
  const email = pick(detail?.userEmail, detail?.email, detail?.user?.email, detail?.author?.email);
  const nick = pick(detail?.userNickname, detail?.nickname, detail?.author?.nickname, detail?.user?.nickname);
  const flags = {
    mine: Boolean(detail?.mine || detail?.isMine || detail?.owner || detail?.isOwner || detail?.canEdit || detail?.editable),
  };
  return { id, email, nick, flags };
}

// 내가 수정/삭제 가능?
function canEditPost(detail, me) {
  const { id: aid, email: aemail, nick: anick, flags } = authorFromPost(detail);
  // 서버가 명시적 허용값을 준 경우 우선
  if (flags.mine) return true;

  // id, email, nickname 중 하나라도 일치하면 허용
  if (me.myId != null && aid != null && String(me.myId) === String(aid)) return true;
  if (me.myEmail && aemail && eqStr(me.myEmail, aemail)) return true;
  if (me.myNick && anick && eqStr(me.myNick, anick)) return true;

  return false;
}

export default function BoardViewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { myId, myEmail, myNick, token } = useMe();

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
  const allow = canEditPost(detail, { myId, myEmail, myNick });

  const onDelete = async () => {
    if (!token) return alert("로그인 후 이용해 주세요.");
    if (!allow) return alert("삭제 권한이 없습니다.");
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
        <span>
          조회 {detail.viewCount ?? 0} · 댓글 {detail.commentCount ?? 0}
        </span>
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

      {/* 액션: 내 글일 때만 */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Link to="/board" style={btnGhost}>목록</Link>
        {allow && (
          <>
            <Link to={`/board/edit/${id}`} style={btnPrimary}>수정</Link>
            <button onClick={onDelete} style={btnDanger}>삭제</button>
          </>
        )}
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
