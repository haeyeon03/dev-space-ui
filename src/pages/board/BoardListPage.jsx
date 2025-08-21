import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api-client";

// 카테고리 라벨 표시
const CATEGORY_LABELS = { dev: "개발", design: "디자인", ai: "AI", job: "취업", etc: "기타" };
const toLabel = (v) => CATEGORY_LABELS[String(v ?? "").toLowerCase()] ?? String(v ?? "");
const toApi = (v) => {
  if (!v) return "";
  const up = String(v).toUpperCase();
  const code = { DEV: "dev", DESIGN: "design", AI: "ai", JOB: "job", ETC: "etc" }[up];
  return code ?? String(v).toLowerCase();
};

const PAGE_SIZE = 10;

const CATEGORY_TABS = [
  { label: "전체", value: "" },
  { label: "개발", value: "DEV" },
  { label: "디자인", value: "DESIGN" },
  { label: "AI", value: "AI" },
  { label: "취업", value: "JOB" },
  { label: "기타", value: "ETC" },
];

const ORDER_OPTIONS = [
  { label: "최신순", value: "recent" },
  { label: "오래된순", value: "oldest" },
];

const SEARCH_TYPES = [
  { label: "닉네임", value: "nickname" },
  { label: "제목", value: "title" },
  { label: "제목+내용", value: "title+content" },
];

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

export default function BoardListPage() {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [status, setStatus] = useState("idle");

  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState("recent");
  const [curPage, setCurPage] = useState(0);

  const load = async (p = 0) => {
    setCurPage(p);
    setStatus("loading");
    try {
      const base = {
        page: p,
        size: PAGE_SIZE,
        order,
        category: category ? toApi(category) : undefined,
      };

      const data = keyword.trim()
        ? await api.get("/board-posts/search", {
          ...base,
          searchType,
          keyword: keyword.trim(),
        })
        : await api.get("/board-posts", base);

      setList(data?.content ?? []);
      setPage(data?.number ?? 0);
      setTotalPages(data?.totalPages ?? 1);
      setTotalElements(data?.totalElements ?? 0);
      setStatus("succeeded");
    } catch (e) {
      console.error(e);
      setStatus("failed");
    }
  };

  useEffect(() => {
    load(0);
  }, [order, category]);

  const onSubmitSearch = (e) => {
    e?.preventDefault();
    load(0);
  };

  const pages = useMemo(() => {
    const max = totalPages || 1;
    const cur = curPage;
    const span = 5;
    const start = Math.max(0, Math.min(cur - Math.floor(span / 2), max - span));
    const end = Math.min(max, start + span);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [curPage, totalPages]);

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 12px" }}>

      {/* 카테고리 탭 + 정렬 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.value || (!category && tab.value === "");
            return (
              <button key={tab.value}
                onClick={() => { setCategory(tab.value); setCurPage(0); }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 16,
                  border: active ? "1px solid #fff" : "1px solid #aeaeae",
                  background: active ? "#111" : "#fff",
                  color: active ? "#fff" : "#111",
                  cursor: "pointer",
                }}>
                {tab.label}
              </button>
            );
          })}
        </div>
        <div style={{ justifySelf: "end" }}>
          <select value={order} onChange={(e) => setOrder(e.target.value)}
            style={{ height: 32, borderRadius: 6, border: "1px solid #bbb", padding: "0 8px" }}>
            {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* 상단 검색 + 글쓰기 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <form onSubmit={onSubmitSearch}
          style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}
            style={{ height: 36, borderRadius: 6, border: "1px solid #bbb", padding: "0 8px" }}>
            {SEARCH_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="검색어를 입력하세요"
            style={{ height: 36, borderRadius: 6, border: "1px solid #bbb", padding: "0 10px" }} />
          <button
            type="submit"
            style={{
              height: 36,
              borderRadius: 6,
              border: "1px solid var(--mui-palette-divider)",
              background: "var(--mui-palette-grey-500)",
              color: "var(--mui-palette-text-primary-contrastText)",
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </form>
        <Link
          to="/board/write"
          style={{
            flexShrink: 0,
            height: 36,
            lineHeight: "36px",
            padding: "0 12px",
            borderRadius: 6,
            border: "1px solid var(--mui-palette-primary-main)",
            background: "var(--mui-palette-primary-main)",
            color: "var(--mui-palette-primary-contrastText)",
            textDecoration: "none",
          }}
        >
          글쓰기
        </Link>
      </div>

      {/* 목록 */}
      <div
        style={{
          border: "1px solid var(--mui-palette-divider)",
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--mui-palette-background-paper)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 140px 120px 80px 80px",
            background: "var(--mui-palette-action-hover)",
            fontWeight: 600,
            padding: "10px 12px",
            borderBottom: "1px solid var(--mui-palette-divider)",
            color: "var(--mui-palette-text-primary)",
          }}
        >
          <div style={{ textAlign: "center" }}>카테고리</div>
          <div style={{ textAlign: "center" }}>제목</div>
          <div style={{ textAlign: "center" }}>닉네임</div>
          <div style={{ textAlign: "center" }}>작성일자</div>
          <div style={{ textAlign: "center" }}>조회</div>
          <div style={{ textAlign: "center" }}>댓글</div>
        </div>

        {status === "loading" && list.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--mui-palette-text-secondary)" }}>
            불러오는 중...
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--mui-palette-text-secondary)" }}>
            게시글이 없습니다.
          </div>
        ) : (
          list.map((p) => (
            <div
              key={p.boardPostId}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 140px 120px 80px 80px",
                padding: "10px 12px",
                borderTop: "1px solid var(--mui-palette-divider)",
                alignItems: "center",
                color: "var(--mui-palette-text-primary)",
                background: "var(--mui-palette-background-paper)",
              }}
            >
              <div style={{ color: "var(--mui-palette-text-secondary)", textAlign: "center" }}>
                [{toLabel(p.category)}]
              </div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                <Link
                  to={`/board/${p.boardPostId}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {p.title}
                </Link>
              </div>

              <div style={{ textAlign: "center" }}>{p.userNickname}</div>
              <div style={{ textAlign: "center" }}>{fmtDate(p.createdAt)}</div>
              <div style={{ textAlign: "center" }}>{p.viewCount ?? 0}</div>
              <div style={{ textAlign: "center" }}>{p.commentCount ?? 0}</div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={() => load(0)} disabled={curPage === 0} style={pgBtnStyle(curPage === 0)}>« First</button>
        <button onClick={() => load(Math.max(0, curPage - 1))} disabled={curPage === 0} style={pgBtnStyle(curPage === 0)}>‹ Prev</button>
        {pages.map((p) => (
          <button key={p} onClick={() => load(p)} style={p === curPage ? pgNumActiveStyle : pgNumStyle}>{p + 1}</button>
        ))}
        <button onClick={() => load(Math.min((totalPages || 1) - 1, curPage + 1))}
          disabled={curPage + 1 >= (totalPages || 1)} style={pgBtnStyle(curPage + 1 >= (totalPages || 1))}>Next ›</button>
        <button onClick={() => load((totalPages || 1) - 1)}
          disabled={curPage + 1 >= (totalPages || 1)} style={pgBtnStyle(curPage + 1 >= (totalPages || 1))}>Last »</button>
      </div>
    </div>
  );
}

const pgBtnStyle = (disabled) => ({
  padding: "6px 10px", border: "1px solid #bbb",
  background: disabled ? "#eee" : "#fff", color: "#333",
  borderRadius: 6, cursor: disabled ? "default" : "pointer",
});
const pgNumStyle = { padding: "6px 10px", border: "1px solid #bbb", background: "#fff", color: "#333", borderRadius: 6, cursor: "pointer" };
const pgNumActiveStyle = { ...pgNumStyle, background: "#111", color: "#fff", borderColor: "#ffffff" };
