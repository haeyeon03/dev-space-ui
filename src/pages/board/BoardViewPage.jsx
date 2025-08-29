import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";
import CommentList from "./CommentList";

// MUI
import {
  IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  useTheme, Tooltip, Divider, Snackbar
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";

// ---- 유틸/상수 ----
const CATEGORY_LABELS = { dev: "개발", design: "디자인", ai: "AI", job: "취업", etc: "기타" };
const toLabel = (v) => CATEGORY_LABELS[String(v ?? "").toLowerCase()] ?? String(v ?? "");
const pick = (...arr) => arr.find((v) => v != null && v !== "");

// 내 정보(최소)
function useMe() {
  const base = useSelector((s) => s.user ?? {});
  const nested = base?.user ?? base?.profile ?? base;
  const myId = pick(nested?.userId, nested?.id, nested?.memberId, nested?.username, base?.userId, base?.id);
  const nick = pick(base?.nickname, nested?.nickname, nested?.name, nested?.displayName);
  const role = pick(base?.role, nested?.role);
  const token = base?.token;
  return useMemo(() => ({ myId, nick, role, token }), [myId, nick, role, token]);
}

// 글 작성자/권한(최소)
function authorFromPost(detail) {
  const id = pick(
    detail?.userId, detail?.memberId, detail?.authorId, detail?.createdById,
    detail?.user?.id, detail?.author?.id
  );
  const mine = Boolean(
    detail?.mine || detail?.isMine || detail?.owner || detail?.isOwner || detail?.canEdit || detail?.editable
  );
  return { id, mine };
}
function canEditPost(detail, me) {
  const { id: aid, mine } = authorFromPost(detail);
  if (mine) return true;
  // 관리자면 허용
  if (String(me?.role || "").toUpperCase() === "ADMIN") return true;
  // 작성자 ID 매칭
  if (me?.myId && aid && String(me.myId) === String(aid)) return true;
  // 작성자 닉네임 매칭(백이 ID를 안 줄 때 대비)
  const authorNick = pick(detail?.userNickname, detail?.user?.nickname, detail?.author?.nickname);
  if (authorNick && me?.nick && String(authorNick) === String(me.nick)) return true;
  return false;
}

/** ===== 인라인 목록(간단) ===== */
function InlineBoardList({ currentId, ensureScrollTop }) {
  const nav = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const VIEW_BASE = "/board/";
  const [curPage, setCurPage] = useState(0);
  const [size] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const buildQuery = (page, pageSize) => ({ page, size: pageSize, sort: "createdAt,desc" });

  const parseList = (data) => {
    const list = Array.isArray(data) ? data : (data?.content ?? data?.items ?? data?.posts ?? data?.data ?? []);
    const total =
      data?.totalPages ?? data?.pages ?? data?.page?.totalPages ??
      (data?.totalElements != null
        ? Math.max(1, Math.ceil(data.totalElements / (data.size ?? size)))
        : data?.totalCount != null
          ? Math.max(1, Math.ceil(data.totalCount / (data.size ?? size)))
          : 1);
    return { list: list || [], totalPages: total || 1 };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get("/board-posts", buildQuery(curPage, size));
        if (!cancelled) {
          const { list, totalPages } = parseList(data);
          setItems(list);
          setTotalPages(totalPages);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [curPage, size]);

  const goView = (pid) => {
    if (!pid) return;
    nav(`${VIEW_BASE}${pid}`);
    setTimeout(() => ensureScrollTop(), 0); // 라우팅 직후 상단 고정
  };

  const fmtDate = (s) => {
    if (!s) return "";
    try { return new Date(s).toLocaleDateString(); } catch { return ""; }
  };

  // 간단 스타일
  const borderColor = isDark ? "#27272a" : "#e5e7eb";
  const textMuted = isDark ? "#94a3b8" : "#64748b";
  const pgn = {
    border: isDark ? "#3f3f46" : "#d4d4d8",
    text: isDark ? "#e5e7eb" : "#111315",
    activeBg: isDark ? "rgba(255,255,255,.10)" : "#f1f5f9",
  };
  const btnStyle = {
    height: 30, padding: "0 12px", borderRadius: 8,
    border: `1px solid ${pgn.border}`, background: "transparent", color: pgn.text, cursor: "pointer",
  };
  const pageBtnStyle = (active) => ({ ...btnStyle, padding: "0 10px", fontWeight: active ? 800 : 500, background: active ? pgn.activeBg : "transparent" });

  const getPageWindow = (total, current, max = 7) => {
    if (total <= max) return [...Array(total)].map((_, i) => i);
    const half = Math.floor(max / 2);
    let start = Math.max(0, current - half);
    let end = Math.min(total - 1, start + max - 1);
    if (end - start + 1 < max) start = Math.max(0, end - (max - 1));
    const pages = [];
    if (start > 0) pages.push(0, "left-ellipsis");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("right-ellipsis", total - 1);
    return pages;
  };

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: isDark ? "#e5e7eb" : "#111827" }}>
        게시글 목록
      </div>

      <div style={{ border: "1px solid", borderColor, borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 16, color: textMuted }}>목록 불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 16, color: textMuted }}>표시할 게시글이 없습니다.</div>
        ) : (
          <>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {items.map((p, idx) => {
                const pid = p?.id ?? p?.postId ?? p?.boardPostId;
                const title = p?.title ?? "(제목 없음)";
                const cat = toLabel(p?.category);
                const nick = p?.userNickname ?? p?.nickname ?? p?.author?.nickname ?? "익명";
                const date = fmtDate(p?.createdAt);
                const views = p?.viewCount ?? p?.views ?? p?.hit ?? p?.hits ?? null;
                const comments = p?.commentCount ?? p?.comments ?? p?.replyCount ?? null;
                const isCurrent = String(pid) === String(currentId);

                const rightMeta = [];
                if (views != null) rightMeta.push(`조회 ${views}`);
                if (comments != null) rightMeta.push(`댓글 ${comments}`);

                return (
                  <li
                    key={pid ?? `row-${idx}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) auto",
                      gap: 12,
                      padding: "10px 12px",
                      borderTop: idx === 0 ? "none" : `1px solid ${isDark ? "#27272a" : "#f1f5f9"}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => goView(pid)}
                      style={{
                        textAlign: "left",
                        background: "transparent",
                        border: 0,
                        padding: 0,
                        cursor: "pointer",
                        color: isDark ? "#e5e7eb" : "#0f172a",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            flex: "0 0 auto",
                            fontSize: 12,
                            border: `1px solid ${isDark ? "#3f3f46" : "#d4d4d8"}`,
                            color: isDark ? "#e5e7eb" : "#111315",
                            padding: "2px 6px",
                            borderRadius: 6,
                            fontWeight: isCurrent ? 800 : 600,
                          }}
                        >
                          {cat}
                        </span>
                        <span
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: isCurrent ? 800 : 400,
                          }}
                          title={title}
                        >
                          {title}
                        </span>
                      </div>
                      <div style={{ marginTop: 2, fontSize: 12, color: textMuted, fontWeight: isCurrent ? 800 : 400 }}>
                        {nick} · {date}
                      </div>
                    </button>

                    <div style={{ alignSelf: "center", fontSize: 12, color: textMuted, fontWeight: isCurrent ? 800 : 400 }}>
                      {rightMeta.length > 0 ? rightMeta.join(" · ") : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* 페이지네이션 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                padding: 12,
                borderTop: `1px solid ${isDark ? "#27272a" : "#f1f5f9"}`,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setCurPage((p) => Math.max(0, p - 1))}
                disabled={curPage === 0}
                style={curPage === 0 ? { ...btnStyle, opacity: 0.5, cursor: "default" } : btnStyle}
              >
                이전
              </button>

              {getPageWindow(totalPages, curPage, 7).map((pg, i) =>
                typeof pg === "string" ? (
                  <span key={`el-${i}`} style={{ padding: "0 6px", color: pgn.text }}>…</span>
                ) : (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurPage(pg)}
                    style={pageBtnStyle(pg === curPage)}
                    aria-current={pg === curPage ? "page" : undefined}
                  >
                    {pg + 1}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                disabled={curPage + 1 >= totalPages}
                style={curPage + 1 >= totalPages ? { ...btnStyle, opacity: 0.5, cursor: "default" } : btnStyle}
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** ===== 글 보기 페이지 ===== */
export default function BoardViewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { myId, nick, role, token } = useMe();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [detail, setDetail] = useState(null);

  // 브라우저 스크롤 복원 방지
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => { window.history.scrollRestoration = prev; };
    }
  }, []);

  // 견고한 스크롤 최상단
  const ensureScrollTop = useCallback(() => {
    const els = [
      document.querySelector('[data-scroll-container]'),
      document.querySelector('main'),
      document.scrollingElement,
      document.documentElement,
      document.body,
    ].filter(Boolean);
    const doScroll = () => {
      for (const el of els) { try { el.scrollTop = 0; el.scrollTo?.(0, 0); } catch { } }
      try { window.scrollTo?.(0, 0); } catch { }
    };
    doScroll(); requestAnimationFrame(doScroll); setTimeout(doScroll, 50);
  }, []);

  // 메뉴
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  // 공유/복사 토스트
  const [copied, setCopied] = useState(false);

  // 캐시-버스트를 포함한 상세 재조회
  const load = useCallback(async () => {
    try {
      const data = await api.get(`/board-posts/${id}`, { _ts: Date.now() });
      setDetail(data);
    } catch {
      setDetail(null);
    }
  }, [id]);

  // 낙관적 카운트 반영 (필드 폴백 포함)
  const bumpCommentCount = useCallback((delta) => {
    setDetail((d) => {
      if (!d) return d;
      const current =
        (typeof d.commentCount === "number" ? d.commentCount : null) ??
        (typeof d.comments === "number" ? d.comments : null) ??
        (typeof d.replyCount === "number" ? d.replyCount : null) ?? 0;
      const next = Math.max(0, current + delta);
      return { ...d, commentCount: next };
    });
  }, []);

  // id/token 변경 시 상단고정 + 로드
  useEffect(() => {
    if (!id) return;
    ensureScrollTop();
    load();
    requestAnimationFrame(ensureScrollTop);
  }, [id, token, ensureScrollTop, load]);

  if (!detail) {
    return <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>불러오는 중...</div>;
  }

  const createdAt = detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "";
  const allow = canEditPost(detail, { myId, nick, role });

  // 공유
  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: detail?.title ?? "게시글", url });
        setCopied(true);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
      }
    } catch {/* 공유 취소 등 무시 */ }
  };

  const onDeletePost = async () => {
    closeMenu();
    if (!token) return alert("로그인 후 이용해 주세요.");
    if (!allow) return alert("삭제 권한이 없습니다.");
    if (!window.confirm("이 게시글을 삭제할까요?")) return;
    try {
      await api.delete(`/board-posts/${id}`);
      nav("/board");
    } catch {
      alert("삭제 실패: 잠시 후 다시 시도해주세요.");
    }
  };

  // 스타일
  const cardStyle = {
    border: "1px solid",
    borderColor: isDark ? "#27272a" : "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  };
  const iconSx = {
    width: 32, height: 32, borderRadius: 6,
    border: "1px solid",
    borderColor: isDark ? "#3f3f46" : "rgba(120,120,120,.35)",
    bgcolor: "transparent",
  };

  // 본문 (서버에서 sanitize 된다고 가정)
  const decodeHTML = (s) => { const el = document.createElement("textarea"); el.innerHTML = s ?? ""; return el.value; };
  const raw = detail?.content || "";
  const html = /&lt;|&gt;|&amp;/.test(raw) ? decodeHTML(raw) : raw;

  // 메타의 댓글수: 폴백 포함
  const commentCountForView =
    (typeof detail.commentCount === "number" ? detail.commentCount : null) ??
    (typeof detail.comments === "number" ? detail.comments : null) ??
    (typeof detail.replyCount === "number" ? detail.replyCount : null) ?? 0;

  // 자식 -> 부모 콜백: 낙관적 반영 + 강제 재조회(캐시 버스트, 약간의 지연으로 일관성 이슈 회피)
  const handleAdded = () => { bumpCommentCount(+1); setTimeout(load, 50); };
  const handleDeleted = () => { bumpCommentCount(-1); setTimeout(load, 120); };
  const handleChanged = () => { setTimeout(load, 80); };

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 12px" }}>
      {/* ====== 게시글 카드 ====== */}
      <div style={cardStyle}>
        {/* 제목 + 공유/케밥 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h2 style={{ margin: "4px 0 8px" }}>{detail.title}</h2>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tooltip title="공유하기">
              <IconButton aria-label="링크 공유" size="small" onClick={onShare} sx={iconSx}>
                <ShareOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {allow && (
              <>
                <Tooltip title="더보기">
                  <IconButton
                    size="small"
                    onClick={openMenu}
                    aria-label="게시물 더보기"
                    aria-haspopup="menu"
                    aria-controls={menuOpen ? "post-more-menu" : undefined}
                    sx={iconSx}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Menu id="post-more-menu" anchorEl={anchorEl} open={menuOpen} onClose={closeMenu}>
                  <MenuItem onClick={() => { closeMenu(); nav(`/board/edit/${id}`); }}>
                    <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>수정하기</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={onDeletePost}>
                    <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>삭제하기</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </div>
        </div>

        {/* 메타 */}
        <div style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>
          <span style={{ marginRight: 8 }}>[{toLabel(detail.category)}]</span>
          <span style={{ marginRight: 8 }}>{detail.userNickname}</span>
          <span style={{ marginRight: 8 }}>{createdAt}</span>
          <span>조회 {detail.viewCount ?? 0} · 댓글 {commentCountForView}</span>
        </div>

        {/* 본문 */}
        <article
          className="post-body"
          style={{ padding: 0, background: "transparent", lineHeight: 1.7, minHeight: 120 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <style>{`
          .post-body img { max-width: 100%; height: auto; display: block; margin: 8px 0; }
          .post-body p { margin: 0 0 12px; }
          .post-body ul, .post-body ol { padding-left: 20px; margin: 8px 0; }
          .post-body a { color: #2d5ae7; text-decoration: underline; }
        `}</style>
      </div>

      {/* ====== 댓글 ====== */}
      <div style={{ border: "1px solid", borderColor: isDark ? "#27272a" : "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 0 }}>
        <CommentList postId={id} onAdded={handleAdded} onChanged={handleChanged} onDeleted={handleDeleted} />
      </div>

      {/* 댓글 아래 인라인 목록 */}
      <InlineBoardList currentId={id} ensureScrollTop={ensureScrollTop} />

      {/* 공유/복사 토스트 */}
      <Snackbar
        open={copied}
        autoHideDuration={1800}
        onClose={() => setCopied(false)}
        message="링크를 복사했어요"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </div>
  );
}
