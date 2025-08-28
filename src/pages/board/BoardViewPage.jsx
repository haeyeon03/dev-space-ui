// src/pages/board/BoardViewPage.jsx
import { useEffect, useState, useMemo } from "react";
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// 카테고리 라벨 표시
const CATEGORY_LABELS = { dev: "개발", design: "디자인", ai: "AI", job: "취업", etc: "기타" };
const toLabel = (v) => CATEGORY_LABELS[String(v ?? "").toLowerCase()] ?? String(v ?? "");

// 유틸
const pick = (...arr) => arr.find((v) => v != null && v !== "");
const eqStr = (a, b) =>
  a != null && b != null && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// 내 정보 추출
function useMe() {
  const base = useSelector((s) => s.user ?? {});
  const nested = base?.user ?? base?.profile ?? base;
  const myId = pick(nested?.userId, nested?.id, nested?.memberId, nested?.username, base?.userId, base?.id);
  const myEmail = pick(nested?.email, nested?.userEmail, nested?.mail, base?.email);
  const myNick = pick(nested?.nickname, nested?.nickName, nested?.name, nested?.displayName, base?.nickname);
  const token = base?.token;
  return useMemo(() => ({ myId, myEmail, myNick, token }), [myId, myEmail, myNick, token]);
}

function authorFromPost(detail) {
  const id = pick(detail?.userId, detail?.memberId, detail?.authorId, detail?.createdById, detail?.user?.id, detail?.author?.id);
  const email = pick(detail?.userEmail, detail?.email, detail?.user?.email, detail?.author?.email);
  const nick = pick(detail?.userNickname, detail?.nickname, detail?.author?.nickname, detail?.user?.nickname);
  const flags = { mine: Boolean(detail?.mine || detail?.isMine || detail?.owner || detail?.isOwner || detail?.canEdit || detail?.editable) };
  return { id, email, nick, flags };
}
function canEditPost(detail, me) {
  const { id: aid, email: aemail, nick: anick, flags } = authorFromPost(detail);
  if (flags.mine) return true;
  if (me.myId != null && aid != null && String(me.myId) === String(aid)) return true;
  if (me.myEmail && aemail && eqStr(me.myEmail, aemail)) return true;
  if (me.myNick && anick && eqStr(me.myNick, anick)) return true;
  return false;
}

/** 인라인 자유게시판 목록 */
function InlineBoardList({ currentId, ensureScrollTop }) {
  const nav = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const VIEW_BASE = "/board/"; // 라우터: /board/:id

  // 페이지네이션 상태
  const [curPage, setCurPage] = useState(0); // 0-based
  const [size] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const buildQuery = (pageIdx, pageSize) => ({
    page: pageIdx, curPage: pageIdx, pageNo: pageIdx, pageNumber: pageIdx, pageIndex: pageIdx,
    size: pageSize, pageSize: pageSize, perPage: pageSize, limit: pageSize,
    sort: "createdAt,desc",
  });

  const parseList = (data) => {
    const list = Array.isArray(data)
      ? data
      : (data?.content ?? data?.items ?? data?.posts ?? data?.data ?? []);
    let tp =
      data?.totalPages ??
      data?.pages ??
      data?.page?.totalPages ??
      (data?.totalElements != null
        ? Math.max(1, Math.ceil(data.totalElements / (data.size ?? size)))
        : data?.totalCount != null
          ? Math.max(1, Math.ceil(data.totalCount / (data.size ?? size)))
          : 1);
    return { list: list || [], totalPages: tp || 1 };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get("/board-posts", buildQuery(curPage, size));
        const { list, totalPages: tp } = parseList(data);
        if (mounted) {
          setItems(list);
          setTotalPages(tp);
        }
      } catch {
        if (mounted) {
          setItems([]);
          setTotalPages(1);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [curPage, size]);

  const goView = (pid) => {
    if (!pid) return;
    ensureScrollTop();
    nav(`${VIEW_BASE}${pid}`);
  };

  const fmtDate = (s) => {
    if (!s) return "";
    try { return new Date(s).toLocaleDateString(); } catch { return ""; }
  };

  const pgn = {
    border: isDark ? "#3f3f46" : "#d4d4d8",
    text: isDark ? "#e5e7eb" : "#111315",
    activeBg: isDark ? "rgba(255,255,255,.10)" : "#f1f5f9",
  };

  const btnStyle = {
    height: 30,
    padding: "0 12px",
    borderRadius: 8,
    border: `1px solid ${pgn.border}`,
    background: "transparent",
    color: pgn.text,
    cursor: "pointer",
  };
  const btnDisabledStyle = { ...btnStyle, opacity: 0.5, cursor: "default" };
  const pageBtnStyle = (active) => ({
    ...btnStyle,
    padding: "0 10px",
    fontWeight: active ? 800 : 500,
    background: active ? pgn.activeBg : "transparent",
  });

  return (
    <section className="inline-board ib ib--force" style={{ marginTop: 28 }}>
      {/* 초고특이성 + !important 강제 오버라이드 */}
      <style>{`
        /* 다크 인식 셀렉터 묶음 */
        html.dark .ib.ib--force, body.dark .ib.ib--force,
        [data-theme="dark"] .ib.ib--force,
        [data-color-mode="dark"] .ib.ib--force,
        [data-mui-color-scheme="dark"] .ib.ib--force,
        [data-toolpad-color-scheme="dark"] .ib.ib--force {
          /* 컨테이너 표식만 */
        }

        /* 라벨 */
        html.dark .ib.ib--force.ib--force .ib__header,
        body.dark .ib.ib--force.ib--force .ib__header,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__header,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__header,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__header,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__header {
          color: #e5e7eb !important;
        }

        /* 타이틀/행 텍스트 */
        html.dark .ib.ib--force.ib--force .ib__row,
        body.dark .ib.ib--force.ib--force .ib__row,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__row,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__row,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__row,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__row {
          color: #e5e7eb !important;
        }

        /* 카테고리 배지 */
        html.dark .ib.ib--force.ib--force .ib__cat,
        body.dark .ib.ib--force.ib--force .ib__cat,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__cat,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__cat,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__cat,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__cat {
          color: #e5e7eb !important;
          border-color: #3f3f46 !important;
          background: transparent !important;
        }

        /* 닉네임/날짜 */
        html.dark .ib.ib--force.ib--force .ib__meta,
        body.dark .ib.ib--force.ib--force .ib__meta,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__meta,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__meta,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__meta,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__meta {
          color: #94a3b8 !important;
        }

        /* 우측 조회/댓글 */
        html.dark .ib.ib--force.ib--force .ib__right,
        body.dark .ib.ib--force.ib--force .ib__right,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__right,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__right,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__right,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__right {
          color: #94a3b8 !important;
        }

        /* 페이지네이션 버튼 */
        html.dark .ib.ib--force.ib--force .ib__pgn-btn,
        body.dark .ib.ib--force.ib--force .ib__pgn-btn,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__pgn-btn,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__pgn-btn,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__pgn-btn,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__pgn-btn {
          color: #e5e7eb !important;
          border-color: #3f3f46 !important;
          background: transparent !important;
        }
        html.dark .ib.ib--force.ib--force .ib__pgn-btn[disabled],
        body.dark .ib.ib--force.ib--force .ib__pgn-btn[disabled],
        [data-theme="dark"] .ib.ib--force.ib--force .ib__pgn-btn[disabled],
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__pgn-btn[disabled],
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__pgn-btn[disabled],
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__pgn-btn[disabled] {
          color: #e5e7eb !important;
          opacity: .5 !important;
        }
        html.dark .ib.ib--force.ib--force .ib__pgn-btn--active,
        body.dark .ib.ib--force.ib--force .ib__pgn-btn--active,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__pgn-btn--active,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__pgn-btn--active,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__pgn-btn--active,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__pgn-btn--active {
          background: rgba(255,255,255,.10) !important;
        }

        /* 생략표시 */
        html.dark .ib.ib--force.ib--force .ib__ellipsis,
        body.dark .ib.ib--force.ib--force .ib__ellipsis,
        [data-theme="dark"] .ib.ib--force.ib--force .ib__ellipsis,
        [data-color-mode="dark"] .ib.ib--force.ib--force .ib__ellipsis,
        [data-mui-color-scheme="dark"] .ib.ib--force.ib--force .ib__ellipsis,
        [data-toolpad-color-scheme="dark"] .ib.ib--force.ib--force .ib__ellipsis {
          color: #e5e7eb !important;
        }
      `}</style>

      {/* 좌측 상단 라벨 */}
      <div className="ib__header" style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: isDark ? "#e5e7eb" : "#111827" }}>
        게시글 목록
      </div>

      <div
        className="ib__box"
        style={{
          border: "1px solid",
          borderColor: isDark ? "#27272a" : "#e5e7eb",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 16, color: isDark ? "#a1a1aa" : "#6b7280" }}>목록 불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 16, color: isDark ? "#a1a1aa" : "#6b7280" }}>표시할 게시글이 없습니다.</div>
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
                      className="ib__row"
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
                          className="ib__cat"
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
                      <div
                        className="ib__meta"
                        style={{
                          marginTop: 2,
                          fontSize: 12,
                          color: isDark ? "#a1a1aa" : "#64748b",
                          fontWeight: isCurrent ? 800 : 400,
                        }}
                      >
                        {nick} · {date}
                      </div>
                    </button>

                    <div
                      className="ib__right"
                      style={{
                        alignSelf: "center",
                        fontSize: 12,
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontWeight: isCurrent ? 800 : 400,
                      }}
                    >
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
                className="ib__pgn-btn"
                style={curPage === 0 ? btnDisabledStyle : btnStyle}
              >
                이전
              </button>

              {(() => {
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
                return getPageWindow(totalPages, curPage, 7).map((pg, i) =>
                  typeof pg === "string" ? (
                    <span key={`el-${i}`} className="ib__ellipsis" style={{ padding: "0 6px", color: pgn.text }}>…</span>
                  ) : (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurPage(pg)}
                      className={`ib__pgn-btn ${pg === curPage ? "ib__pgn-btn--active" : ""}`}
                      style={pageBtnStyle(pg === curPage)}
                    >
                      {pg + 1}
                    </button>
                  )
                );
              })()}

              <button
                type="button"
                onClick={() => setCurPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                disabled={curPage + 1 >= totalPages}
                className="ib__pgn-btn"
                style={curPage + 1 >= totalPages ? btnDisabledStyle : btnStyle}
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

export default function BoardViewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { myId, myEmail, myNick, token } = useMe();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [detail, setDetail] = useState(null);

  // 케밥 메뉴
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  // 복사 토스트
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const data = await api.get(`/board-posts/${id}`);
    setDetail(data);
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  /** 스크롤 최상단 고정 */
  const ensureScrollTop = () => {
    const candidates = [
      document.querySelector('[data-scroll-container]'),
      document.querySelector('main'),
      document.getElementById('root'),
      document.getElementById('app'),
      document.scrollingElement,
      document.documentElement,
      document.body,
    ].filter(Boolean);

    for (const el of candidates) {
      try { el.scrollTo?.({ top: 0, behavior: "auto" }); el.scrollTop = 0; } catch { }
    }
    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { }

    requestAnimationFrame(() => {
      for (const el of candidates) {
        try { el.scrollTop = 0; el.scrollTo?.({ top: 0, behavior: "auto" }); } catch { }
      }
      try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { }
    });

    setTimeout(() => {
      for (const el of candidates) {
        try { el.scrollTop = 0; el.scrollTo?.({ top: 0, behavior: "auto" }); } catch { }
      }
      try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { }
    }, 50);
  };

  // 브라우저 스크롤 복원 방지
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => { window.history.scrollRestoration = prev; };
    }
  }, []);

  // 글이 바뀔 때 항상 최상단
  useEffect(() => { ensureScrollTop(); }, [id]);

  if (!detail) {
    return <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>불러오는 중...</div>;
  }

  const createdAt = detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "";
  const allow = canEditPost(detail, { myId, myEmail, myNick });

  const onDelete = async () => {
    closeMenu();
    if (!token) return alert("로그인 후 이용해 주세요.");
    if (!allow) return alert("삭제 권한이 없습니다.");
    if (!window.confirm("이 게시글을 삭제할까요?")) return;
    await api.delete(`/board-posts/${id}`);
    nav("/board");
  };

  // 현재 URL 복사
  const copyLink = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
    } catch {
      alert("복사에 실패했습니다. 수동으로 복사해 주세요.");
    }
  };

  const decodeHTML = (s) => { const el = document.createElement("textarea"); el.innerHTML = s ?? ""; return el.value; };
  const raw = detail?.content || "";
  const html = /&lt;|&gt;|&amp;/.test(raw) ? decodeHTML(raw) : raw;

  const cardStyle = {
    border: "1px solid",
    borderColor: isDark ? "#27272a" : "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  };

  const iconSx = {
    width: 32,
    height: 32,
    borderRadius: 1.5,
    border: "1px solid",
    borderColor: isDark ? "#3f3f46" : "rgba(120,120,120,.35)",
    bgcolor: "transparent",
    color: isDark ? "#a1a1aa" : "#7a7a7a",
    "&:hover": {
      bgcolor: isDark ? "rgba(255,255,255,.06)" : "rgba(120,120,120,.08)",
      borderColor: isDark ? "#52525b" : "#cfcfd4",
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: isDark
        ? "0 0 0 3px rgba(255,255,255,.12)"
        : "0 0 0 3px rgba(17,24,39,.12)",
    },
  };

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 12px" }}>
      {/* ====== 게시글 카드 (제목~본문) ====== */}
      <div style={cardStyle}>
        {/* 제목 + 복사/케밥 메뉴 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h2 style={{ margin: "4px 0 8px" }}>{detail.title}</h2>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* 복사 버튼 */}
            <Tooltip title="링크 복사">
              <IconButton aria-label="링크 복사" size="small" onClick={copyLink} sx={iconSx}>
                <ContentCopyIcon fontSize="small" />
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

                <Menu
                  id="post-more-menu"
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={closeMenu}
                  PaperProps={{
                    elevation: 8,
                    sx: {
                      bgcolor: isDark ? "#000" : "#fff",
                      color: isDark ? "#fff" : "inherit",
                      border: "1px solid",
                      borderColor: isDark ? "#333" : "#ddd",
                      boxShadow: isDark ? "0 10px 24px rgba(0,0,0,.5)" : "0 10px 24px rgba(0,0,0,.12)",
                      "& .MuiDivider-root": { borderColor: isDark ? "#333" : "#eee" },
                      "& .MuiMenuItem-root:hover": {
                        backgroundColor: isDark ? "#111" : "rgba(120,120,120,.08)",
                      },
                    },
                  }}
                  slotProps={{ paper: { className: "post-more-paper" } }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                  <MenuItem
                    onClick={() => {
                      closeMenu();
                      nav(`/board/edit/${id}`);
                    }}
                  >
                    <ListItemIcon><EditOutlinedIcon fontSize="small" sx={{ color: "inherit" }} /></ListItemIcon>
                    <ListItemText>수정하기</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={onDelete}>
                    <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: "inherit" }} /></ListItemIcon>
                    <ListItemText>삭제하기</ListItemText>
                  </MenuItem>
                </Menu>

                {/* 다크 모드 보정 */}
                <style>{`
                  html.dark .post-more-paper,
                  body.dark .post-more-paper,
                  [data-theme="dark"] .post-more-paper,
                  [data-color-mode="dark"] .post-more-paper,
                  [data-mui-color-scheme="dark"] .post-more-paper,
                  [data-toolpad-color-scheme="dark"] .post-more-paper {
                    background-color: #000 !important;
                    color: #fff !important;
                    border: 1px solid #333 !important;
                  }
                  html.dark .post-more-paper .MuiMenuItem-root:hover,
                  body.dark .post-more-paper .MuiMenuItem-root:hover,
                  [data-theme="dark"] .post-more-paper .MuiMenuItem-root:hover,
                  [data-color-mode="dark"] .post-more-paper .MuiMenuItem-root:hover,
                  [data-mui-color-scheme="dark"] .post-more-paper .MuiMenuItem-root:hover,
                  [data-toolpad-color-scheme="dark"] .post-more-paper .MuiMenuItem-root:hover {
                    background-color: #111 !important;
                  }
                `}</style>
              </>
            )}
          </div>
        </div>

        {/* 메타 */}
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
            style={{ padding: 0, background: "transparent", lineHeight: 1.7, minHeight: 120 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <style>{`
            .post-body img { max-width: 100%; height: auto; display: block; margin: 8px 0; }
            .post-body p { margin: 0 0 12px; }
            .post-body ul, .post-body ol { padding-left: 20px; margin: 8px 0; }
            .post-body a { color: #2d5ae7; text-decoration: underline; }
          `}</style>
        </>
      </div>

      {/* ====== 댓글 카드 ====== */}
      <div style={{ border: "1px solid", borderColor: isDark ? "#27272a" : "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 0 }}>
        <CommentList postId={id} onAdded={load} />
      </div>

      {/* 댓글 아래 인라인 목록 */}
      <InlineBoardList currentId={id} ensureScrollTop={ensureScrollTop} />

      {/* 복사 토스트 */}
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
