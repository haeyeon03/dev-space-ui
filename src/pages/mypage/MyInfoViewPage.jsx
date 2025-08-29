// src/pages/mypage/MyInfoViewPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProfileImage, setUser } from "../../store/user-slice";


/* ====== 자동 API 베이스 감지 유틸 ====== */
const CANDIDATE_API_BASES = [
  import.meta.env.VITE_API_BASE || "/api",
  `${location.protocol}//${location.hostname}:8080/api`,
];

function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

// JSON 전용 fetch (상대경로면 가능한 베이스들을 시도)
async function fetchJSON(urlOrPath, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(urlOrPath);
  if (isAbsolute) return _fetchJSONCore(urlOrPath, options);

  const cached = sessionStorage.getItem("API_BASE_CACHED");
  const bases = cached
    ? [cached, ...CANDIDATE_API_BASES.filter((b) => b !== cached)]
    : CANDIDATE_API_BASES;

  let lastErr;
  for (const base of bases) {
    const full = `${base}${urlOrPath}`;
    try {
      const res = await fetch(full, options);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        lastErr = new Error(`Non-JSON response from ${full}`);
        continue;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || res.statusText;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      sessionStorage.setItem("API_BASE_CACHED", base);
      return data ?? {};
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("No API base reachable");
}
async function _fetchJSONCore(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data ?? {};
}
/* ====== /유틸 ====== */

const MYPAGE = "/mypage";

/* ====== 이미지 URL 절대화 + 캐시버스터 ====== */
const getApiOrigin = () => {
  const cached = sessionStorage.getItem("API_BASE_CACHED");
  const base = cached || (import.meta.env.VITE_API_BASE || "/api");
  const pick = /^https?:\/\//i.test(base)
    ? base
    : `${location.protocol}//${location.hostname}:8080/api`;
  try {
    return new URL(pick).origin;
  } catch {
    return location.origin;
  }
};

const toAbsoluteAssetUrl = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const origin = getApiOrigin();
  return u.startsWith("/") ? origin + u : `${origin}/${u}`;
};

const withBust = (url) => (url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : "");

// /api 프록시로 변환
const toApiProxyUrl = (u) => {
  const base = sessionStorage.getItem("API_BASE_CACHED") || (import.meta.env.VITE_API_BASE || "/api");
  try {
    const url = new URL(u, location.origin);
    const path = url.pathname + url.search;
    return `${base.replace(/\/$/, "")}${path}`;
  } catch {
    return `${(base || "/api").replace(/\/$/, "")}/${u.replace(/^\//, "")}`;
  }
};

/* ====== 라벨/날짜 ====== */
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
  const dispatch = useDispatch();

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

  // 이미지 에러(깨짐) 처리 + 보안이미지(blob) 폴백
  const [imgError, setImgError] = useState(false);
  const [blobSrc, setBlobSrc] = useState("");
  const [triedAuth, setTriedAuth] = useState(false);

  useEffect(() => setImgError(false), [profile.profileImageUrl]);
  useEffect(() => {
    if (blobSrc) {
      try { URL.revokeObjectURL(blobSrc); } catch { }
    }
    setBlobSrc("");
    setTriedAuth(false);
    setImgError(false);
  }, [profile.profileImageUrl]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const raw = profile.profileImageUrl || "";
    if (!imgError || triedAuth || !raw || !token) return;

    const controller = new AbortController();
    (async () => {
      const candidates = [];
      const abs = toAbsoluteAssetUrl(raw);
      if (abs) candidates.push(abs);
      candidates.push(toApiProxyUrl(raw));
      if (abs) candidates.push(toApiProxyUrl(abs));

      for (const u of candidates) {
        try {
          const res = await fetch(u, { headers: authHeaders(), signal: controller.signal, credentials: "include" });
          if (!res.ok) continue;
          const b = await res.blob();
          const url = URL.createObjectURL(b);
          setBlobSrc(url);
          setImgError(false);
          break;
        } catch { }
      }
      setTriedAuth(true);
    })();

    return () => controller.abort();
  }, [imgError, triedAuth, profile.profileImageUrl]);

  // 활동 내역
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // 초기 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJSON(MYPAGE, { headers: authHeaders() });
        const d = (data && typeof data === "object") ? (data.data ?? data.result ?? data.body ?? data) : {};
        const next = {
          userId: d.userId ?? d.id ?? d.memberId ?? d.username ?? "",
          nickname: d.nickname ?? d.nickName ?? d.name ?? d.displayName ?? "",
          email: d.email ?? d.userEmail ?? d.mail ?? "",
          gender: d.gender ?? d.sex ?? "",
          birthdate: d.birthdate ?? d.birthDate ?? d.birth_day ?? "",
          profileImageUrl: d.profileImageUrl ?? d.profile_image_url ?? d.avatarUrl ?? d.avatar ?? "",
        };
        setProfile(next);

        // 전역 유저 상태도 동기화 (닉네임/이메일)
        dispatch(setUser({
          nickname: next.nickname || "",
          email: next.email || "",
        }));

        // 미니 프로필 즉시 갱신
        if (next.profileImageUrl) {
          const abs = withBust(toAbsoluteAssetUrl(next.profileImageUrl));
          dispatch(setProfileImage(abs));
        }
      } catch (e) {
        console.error("[MyInfoView] profile load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

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

  // 프로필 이미지 URL (절대 + 캐시버스터)
  const profileImageSrc = useMemo(() => {
    const u = profile.profileImageUrl || "";
    if (!u) return "";
    return withBust(toAbsoluteAssetUrl(u));
  }, [profile.profileImageUrl]);

  // 게시글 상세 이동
  const makePostPath = (p) => {
    const id = p?.boardPostId ?? p?.id ?? p?.postId ?? p?.seq ?? "";
    if (!id) return null;
    return `/board/${id}`;
  };
  const goPost = (p) => {
    const path = makePostPath(p);
    if (!path) return;
    nav(path);
  };

  return (
    <div style={pageWrap}>
      <h1 style={pageTitle}>마이페이지</h1>

      {msg && (
        <div style={{ ...alertBar, background: "var(--mui-palette-success-light)", color: "var(--mui-palette-success-contrastText)" }}>
          {msg}
        </div>
      )}

      <div style={mainGrid}>
        {/* 좌측: 내 정보 */}
        <div style={{ display: "grid", gap: 14, minWidth: 0, overflow: "hidden" }}>
          <div style={card}>
            <div style={cardHeader}>
              <div style={cardTitle}>내 정보</div>
              <button style={chipBtn} onClick={() => nav("/mypage/edit")}>수정하기</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, alignItems: "center", minWidth: 0 }}>
              <div style={avatarBox}>
                {(blobSrc || profileImageSrc) && !imgError ? (
                  <img
                    src={blobSrc || profileImageSrc}
                    alt="profile"
                    style={avatarImg}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div style={avatarFallback}>
                    {(profile.nickname || profile.userId || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <dl style={{ ...dlList, minWidth: 0 }}>
                <div style={{ ...row, minWidth: 0 }}>
                  <dt style={dt}>아이디</dt>
                  <dd style={dd}>{loading ? "-" : (profile.userId || "-")}</dd>
                </div>
                <div style={{ ...row, minWidth: 0 }}>
                  <dt style={dt}>닉네임</dt>
                  <dd style={dd}>{loading ? "-" : (profile.nickname || "-")}</dd>
                </div>
                <div style={{ ...row, minWidth: 0 }}>
                  <dt style={dt}>이메일</dt>
                  <dd style={dd}>{loading ? "-" : (profile.email || "-")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* 우측: 내 활동 내역 */}
        <div style={{ ...cardTall, minWidth: 0, overflow: "hidden" }}>
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
                <li key={p.boardPostId ?? p.id} style={listRow}>
                  <button
                    type="button"
                    onClick={() => goPost(p)}
                    style={rowBtn}
                    title="게시글로 이동"
                  >
                    <div style={ellipsis}>
                      <span style={{ color: "var(--mui-palette-text-secondary)" }}>
                        [{toLabel(p.category)}]
                      </span>{" "}
                      <span style={{ color: "inherit" }}>{p.title}</span>
                    </div>
                    <div style={dateText}>{fmtDate(p.createdAt)}</div>
                  </button>
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

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 500px) minmax(0, 1fr)",
  gap: 16,
  alignItems: "start",
};
const cardBase = {
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-paper)",
  borderRadius: 20,
  boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
  boxSizing: "border-box",
};
const card = { ...cardBase, padding: 14 };
const cardTall = { ...cardBase, padding: 14, minHeight: 480 };

const cardHeader = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 };
const cardTitle = { fontWeight: 700 };

const chipBtn = {
  height: 28,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-default)",
  color: "var(--mui-palette-text-primary)",
  cursor: "pointer",
  fontSize: 13,
};

const avatarBox = { width: 100, height: 100, borderRadius: "50%", border: "1px solid var(--mui-palette-divider)", background: "var(--mui-palette-background-default)", overflow: "hidden", display: "grid", placeItems: "center" };
const avatarImg = { width: "100%", height: "100%", objectFit: "cover" };
const avatarFallback = { fontSize: 22, color: "var(--mui-palette-text-secondary)" };

const dlList = { display: "grid", gap: 8 };
const row = { display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center" };
const dt = { color: "var(--mui-palette-text-secondary)", fontSize: 13 };
const dd = {
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-default)",
  borderRadius: 8,
  padding: "6px 10px",
  minHeight: 28,
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const listWrap = { listStyle: "none", padding: 0, margin: 0 };
const listRow = { borderTop: "1px solid var(--mui-palette-divider)" };
const rowInner = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0" };
const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };
const dateText = { color: "var(--mui-palette-text-secondary)", fontSize: 13 };
const empty = { padding: 14, textAlign: "center", color: "var(--mui-palette-text-secondary)" };

/* 줄 전체 클릭용 버튼(언더라인 없음, 기본색) */
const rowBtn = {
  ...rowInner,
  width: "100%",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  color: "inherit",
};
