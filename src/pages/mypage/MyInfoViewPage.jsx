import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MyInfoViewPage.jsx — 마이페이지 전체 기능 (조회/수정/이미지/비번/이메일/내 글)
 *
 * ▶ 사용법
 *  1) 라우터에 <Route path="/mypage" element={<MyInfoViewPage/>}/> 추가
 *  2) 로그인 후 localStorage.setItem('token', '...') 로 토큰 저장되어 있어야 함
 *  3) 필요시 .env에 VITE_API_BASE 설정 (기본 "/api")
 */

const API_BASE = import.meta.env.VITE_API_BASE || "/api"; // 예: http://localhost:8080/api
const MYPAGE = `${API_BASE}/mypage`;

function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return {
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

export default function MyInfoViewPage() {
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
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // 이미지 업로드
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef(null);

  // 내 글 목록
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);

  // 비밀번호 변경
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  // 이메일 변경
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJSON(`${MYPAGE}`, {
          headers: authHeaders(),
        });
        setProfile({
          userId: data.userId || "",
          nickname: data.nickname || "",
          email: data.email || "",
          gender: data.gender || "",
          birthdate: data.birthdate || "",
          profileImageUrl: data.profileImageUrl || "",
        });
        setErr("");
      } catch (e) {
        setErr(e.message || "내 정보 조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadPosts = async (p = page, s = size) => {
    try {
      setPostsLoading(true);
      const qp = new URLSearchParams({ page: String(p), size: String(s) }).toString();
      const data = await fetchJSON(`${MYPAGE}/postlist?${qp}`, {
        headers: authHeaders(),
      });
      // Spring Page 구조 가정
      setPosts(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (e) {
      setErr(e.message || "내 글 조회 실패");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(0, size);
  }, [size]);

  // -------- 액션 --------
  const onSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const body = {
        nickname: profile.nickname || null,
        gender: profile.gender || null,
        birthdate: profile.birthdate || null,
      };
      const data = await fetchJSON(`${MYPAGE}/update`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      setProfile((p) => ({ ...p, ...data }));
      setMsg("프로필이 저장되었습니다.");
    } catch (e2) {
      setErr(e2.message || "프로필 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("");
    }
  };

  const onUploadImage = async () => {
    if (!file) return;
    setMsg("");
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await fetchJSON(`${MYPAGE}/profile-image`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      setProfile((p) => ({ ...p, ...data }));
      setMsg("프로필 이미지가 업데이트되었습니다.");
      setPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
    } catch (e) {
      setErr(e.message || "이미지 업로드 실패");
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await fetchJSON(`${MYPAGE}/password`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(pwd),
      });
      setMsg("비밀번호가 변경되었습니다.");
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (e2) {
      setErr(e2.message || "비밀번호 변경 실패");
    }
  };

  const onChangeEmail = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await fetchJSON(`${MYPAGE}/email`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ newEmail }),
      });
      setMsg("이메일이 변경되었습니다.");
      setProfile((p) => ({ ...p, email: newEmail }));
      setNewEmail("");
    } catch (e2) {
      setErr(e2.message || "이메일 변경 실패");
    }
  };

  const onDeactivate = async () => {
    if (!confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setMsg("");
    setErr("");
    try {
      await fetchJSON(`${MYPAGE}/deactivate`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setMsg("계정이 비활성화되었습니다. 로그아웃 후 재로그인 불가 정책이라면 주의하세요.");
    } catch (e2) {
      setErr(e2.message || "탈퇴 처리 실패");
    }
  };

  const profileImageSrc = useMemo(() => {
    const u = profile.profileImageUrl || "";
    if (!u) return "";
    if (u.startsWith("http")) return u;
    return u; // 상대경로 그대로 사용
  }, [profile.profileImageUrl]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <h1 className="text-2xl font-bold">마이페이지</h1>

      {(msg || err) && (
        <div className={`p-3 rounded border ${err ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
          <p className="text-sm">{err || msg}</p>
        </div>
      )}

      {/* 프로필 조회/수정 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 flex flex-col items-center gap-3">
          <div className="w-36 h-36 rounded-full overflow-hidden border bg-gray-100">
            {profileImageSrc ? (
              <img src={profileImageSrc} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
            )}
          </div>

          <div className="w-full">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} className="block w-full text-sm" />
            {preview && (
              <div className="mt-2">
                <img src={preview} alt="preview" className="w-40 h-40 object-cover rounded" />
              </div>
            )}
            <button onClick={onUploadImage} disabled={!file} className="mt-2 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
              프로필 이미지 업로드
            </button>
          </div>
        </div>

        <form onSubmit={onSaveProfile} className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">사용자 ID</label>
              <input className="mt-1 w-full border rounded px-3 py-2 bg-gray-50" value={profile.userId} disabled />
            </div>
            <div>
              <label className="text-sm text-gray-600">이메일</label>
              <input className="mt-1 w-full border rounded px-3 py-2 bg-gray-50" value={profile.email || ""} disabled />
            </div>
            <div>
              <label className="text-sm text-gray-600">닉네임</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={profile.nickname}
                onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-gray-600">성별</label>
              <select className="mt-1 w-full border rounded px-3 py-2" value={profile.gender || ""}
                onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}>
                <option value="">선택</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
                <option value="O">기타</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">생년월일</label>
              <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={profile.birthdate || ""}
                onChange={(e) => setProfile((p) => ({ ...p, birthdate: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50">
            {saving ? "저장 중..." : "프로필 저장"}
          </button>
        </form>
      </section>

      {/* 이메일 변경 / 비밀번호 변경 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={onChangeEmail} className="space-y-3 p-4 border rounded">
          <h2 className="font-semibold">이메일 변경</h2>
          <input className="w-full border rounded px-3 py-2" placeholder="새 이메일" value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)} />
          <button className="px-4 py-2 rounded bg-indigo-600 text-white">이메일 변경</button>
        </form>

        <form onSubmit={onChangePassword} className="space-y-3 p-4 border rounded">
          <h2 className="font-semibold">비밀번호 변경</h2>
          <input className="w-full border rounded px-3 py-2" type="password" placeholder="현재 비밀번호"
            value={pwd.currentPassword}
            onChange={(e) => setPwd((s) => ({ ...s, currentPassword: e.target.value }))} />
          <input className="w-full border rounded px-3 py-2" type="password" placeholder="새 비밀번호"
            value={pwd.newPassword}
            onChange={(e) => setPwd((s) => ({ ...s, newPassword: e.target.value }))} />
          <button className="px-4 py-2 rounded bg-indigo-600 text-white">비밀번호 변경</button>
        </form>
      </section>

      {/* 내 글 목록 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">내가 쓴 글</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">페이지 크기</label>
            <select className="border rounded px-2 py-1" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="border rounded divide-y">
          {postsLoading ? (
            <div className="p-4 text-sm text-gray-500">불러오는 중...</div>
          ) : posts.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">작성한 글이 없습니다.</div>
          ) : (
            posts.map((p) => (
              <article key={p.boardPostId} className="p-4">
                <div className="text-sm text-gray-400">{new Date(p.createdAt).toLocaleString()}</div>
                <h3 className="font-medium">{p.title}</h3>
                <div className="text-xs text-gray-500">카테고리: {p.category} · 조회 {p.viewCount} · 댓글 {p.commentCount}</div>
              </article>
            ))
          )}
        </div>

        <div className="flex items-center justify-between">
          <button className="px-3 py-1 border rounded" disabled={page <= 0}
            onClick={() => { const np = Math.max(0, page - 1); setPage(np); loadPosts(np, size); }}>
            이전
          </button>
          <div className="text-sm text-gray-500">{page + 1} / {Math.max(1, totalPages)}</div>
          <button className="px-3 py-1 border rounded" disabled={page + 1 >= totalPages}
            onClick={() => { const np = page + 1; setPage(np); loadPosts(np, size); }}>
            다음
          </button>
        </div>
      </section>

      {/* 계정 비활성 */}
      <section className="p-4 border rounded">
        <h2 className="font-semibold text-red-600">계정 비활성(탈퇴)</h2>
        <p className="text-sm text-gray-600 mb-2">이 작업은 되돌릴 수 없습니다.</p>
        <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={onDeactivate}>계정 비활성화</button>
      </section>
    </div>
  );
}
