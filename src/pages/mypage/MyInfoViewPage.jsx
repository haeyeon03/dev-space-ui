// src/pages/mypage/MyInfoViewPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const MYPAGE = `${API_BASE}/mypage`;

function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data ?? {}; // null 방지
}

// 라벨/날짜
const CATEGORY_LABELS = { dev: "자유게시판", design: "디자인", ai: "뉴스", job: "취업", etc: "기타" };
const toLabel = (v) => CATEGORY_LABELS[String(v ?? "").toLowerCase()] ?? String(v ?? "");
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

export default function MyInfoViewPage() {
  const nav = useNavigate();

  // 프로필
  const [profile, setProfile] = useState({
    userId: "",
    nickname: "",
    email: "",
    gender: "",
    birthdate: "",
    profileImageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // 활동 내역 / 즐겨찾기
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [favs, setFavs] = useState([]);
  const [favsLoading, setFavsLoading] = useState(false);

  // 초기 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJSON(`${MYPAGE}`, { headers: authHeaders() });
        const d = (data && typeof data === "object") ? data : {};
        setProfile({
          userId: d.userId ?? "",
          nickname: d.nickname ?? "",
          email: d.email ?? "",
          gender: d.gender ?? "",
          birthdate: d.birthdate ?? "",
          profileImageUrl: d.profileImageUrl ?? "",
        });
      } catch (e) {
        console.error("[MyInfoView] profile load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 활동 내역: 최근 10건
  useEffect(() => {
    (async () => {
      try {
        setPostsLoading(true);
        const data = await fetchJSON(`${MYPAGE}/postlist?page=0&size=10`, { headers: authHeaders() });
        setPosts(Array.isArray(data?.content) ? data.content : []);
      } catch (e) {
        console.error("[MyInfoView] posts load failed:", e);
      } finally {
        setPostsLoading(false);
      }
    })();
  }, []);

  // 즐겨찾기
  useEffect(() => {
    (async () => {
      try {
        setFavsLoading(true);
        const data = await fetchJSON(`${MYPAGE}/bookmarks?page=0&size=6`, { headers: authHeaders() });
        const list = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
        setFavs(list);
      } catch (e) {
        console.warn("[MyInfoView] bookmarks empty or failed:", e);
        setFavs([]);
      } finally {
        setFavsLoading(false);
      }
    })();
  }, []);

  const profileImageSrc = useMemo(() => {
    const u = profile.profileImageUrl || "";
    if (!u) return "";
    return u.startsWith("http") ? u : u;
  }, [profile.profileImageUrl]);

  return (
    <div style={pageWrap}>
      <h1 style={pageTitle}>마이페이지</h1>

      {msg && (
        <div style={{ ...alertBar, background: "var(--mui-palette-success-light)", color: "var(--mui-palette-success-contrastText)" }}>
          {msg}
        </div>
      )}

      <div style={mainGrid}>
        {/* 좌측: 내 정보 + 즐겨찾기 */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* 내 정보 */}
          <div style={card}>
            <div style={cardHeader}>
              <div style={cardTitle}>내 정보</div>
              <button style={chipBtn} onClick={() => nav("/mypage/edit")}>수정하기</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, alignItems: "center" }}>
              <div style={avatarBox}>
                {profileImageSrc ? (
                  <img src={profileImageSrc} alt="profile" style={avatarImg} />
                ) : (
                  <div style={avatarFallback}>{(profile.nickname || profile.userId || "U").slice(0, 2).toUpperCase()}</div>
                )}
              </div>

              <dl style={dlList}>
                <div style={row}>
                  <dt style={dt}>아이디</dt>
                  <dd style={dd}>{loading ? "-" : (profile.userId || "-")}</dd>
                </div>
                <div style={row}>
                  <dt style={dt}>닉네임</dt>
                  <dd style={dd}>{loading ? "-" : (profile.nickname || "-")}</dd>
                </div>
                <div style={row}>
                  <dt style={dt}>이메일</dt>
                  <dd style={dd}>{loading ? "-" : (profile.email || "-")}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 즐겨찾기 */}
          <div style={card}>
            <div style={cardHeader}>
              <div style={cardTitle}>즐겨찾기</div>
              <button style={chipBtn} onClick={() => nav("/bookmarks")}>더보기</button>
            </div>

            {favsLoading ? (
              <div style={empty}>불러오는 중...</div>
            ) : favs.length === 0 ? (
              <div style={empty}>즐겨찾기한 글이 없습니다.</div>
            ) : (
              <ul style={listWrap}>
                {favs.slice(0, 6).map((it, idx) => (
                  <li key={it.boardPostId ?? idx} style={listRow}>
                    <div style={ellipsis}>
                      <span style={{ color: "var(--mui-palette-text-secondary)" }}>[{toLabel(it.category)}]</span>{" "}
                      {it.title}
                    </div>
                    <div style={dateText}>{fmtDate(it.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 우측: 내 활동 내역 */}
        <div style={cardTall}>
          <div style={cardHeader}>
            <div style={cardTitle}>내 활동 내역</div>
            <button style={chipBtn} onClick={() => nav("/board?mine=me")}>더보기</button>
          </div>

          {postsLoading ? (
            <div style={empty}>불러오는 중...</div>
          ) : posts.length === 0 ? (
            <div style={empty}>작성한 글이 없습니다.</div>
          ) : (
            <ul style={listWrap}>
              {posts.map((p) => (
                <li key={p.boardPostId} style={listRow}>
                  <div style={ellipsis}>
                    <span style={{ color: "var(--mui-palette-text-secondary)" }}>[{toLabel(p.category)}]</span>{" "}
                    {p.title}
                  </div>
                  <div style={dateText}>{fmtDate(p.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== 스타일 ===== */
const pageWrap = { maxWidth: 980, margin: "24px auto", padding: "0 12px" };
const pageTitle = { textAlign: "center", fontSize: 28, fontWeight: 700, marginBottom: 14 };
const alertBar = { borderRadius: 12, padding: "10px 12px", marginBottom: 12, textAlign: "center", fontSize: 13 };

const mainGrid = { display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" };
const cardBase = { border: "1px solid var(--mui-palette-divider)", background: "var(--mui-palette-background-paper)", borderRadius: 20, boxShadow: "0 1px 0 rgba(0,0,0,0.03)" };
const card = { ...cardBase, padding: 14 };
const cardTall = { ...cardBase, padding: 14, minHeight: 480 };

const cardHeader = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 };
const cardTitle = { fontWeight: 700 };

const chipBtn = { height: 28, padding: "0 12px", borderRadius: 999, border: "1px solid var(--mui-palette-divider)", background: "var(--mui-palette-background-default)", color: "var(--mui-palette-text-primary)", cursor: "pointer", fontSize: 13 };

const avatarBox = { width: 100, height: 100, borderRadius: "50%", border: "1px solid var(--mui-palette-divider)", background: "var(--mui-palette-background-default)", overflow: "hidden", display: "grid", placeItems: "center" };
const avatarImg = { width: "100%", height: "100%", objectFit: "cover" };
const avatarFallback = { fontSize: 22, color: "var(--mui-palette-text-secondary)" };

const dlList = { display: "grid", gap: 8 };
const row = { display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center" };
const dt = { color: "var(--mui-palette-text-secondary)", fontSize: 13 };
const dd = { border: "1px solid var(--mui-palette-divider)", background: "var(--mui-palette-background-default)", borderRadius: 8, padding: "6px 10px", minHeight: 28, display: "flex", alignItems: "center" };

const listWrap = { listStyle: "none", padding: 0, margin: 0 };
const listRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: "1px solid var(--mui-palette-divider)" };
const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };
const dateText = { color: "var(--mui-palette-text-secondary)", fontSize: 13 };
const empty = { padding: 14, textAlign: "center", color: "var(--mui-palette-text-secondary)" };
