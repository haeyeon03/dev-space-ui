// src/pages/mypage/MyInfoEditPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    const msg = data?.message || data?.error || res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data ?? {}; // null 방지
}

export default function MyInfoEditPage() {
  const nav = useNavigate();

  const [profile, setProfile] = useState({
    userId: "",
    nickname: "",
    email: "",
    gender: "",
    birthdate: "",
    profileImageUrl: "",
    extra1: "",
    extra2: "",
    extra3: "",
    alertKeyword: "",
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 이미지 업로드
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJSON(`${MYPAGE}`, { headers: authHeaders() });
        const d = data ?? {};
        setProfile((p) => ({
          ...p,
          userId: d.userId ?? "",
          nickname: d.nickname ?? "",
          email: d.email ?? "",
          gender: d.gender ?? "",
          birthdate: d.birthdate ?? "",
          profileImageUrl: d.profileImageUrl ?? "",
          alertKeyword: d.alertKeyword ?? "",
          extra1: d.extra1 ?? "",
          extra2: d.extra2 ?? "",
          extra3: d.extra3 ?? "",
        }));
      } catch (e) {
        setErr(e.message || "내 정보 조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 미리보기 메모리 해제
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const profileImageSrc = useMemo(() => {
    const u = profile.profileImageUrl || "";
    if (!u) return "";
    return u.startsWith("http") ? u : u;
  }, [profile.profileImageUrl]);

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const onUploadImage = async () => {
    if (!file) return;
    setMsg(""); setErr("");
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

  // 닉네임/이메일 중복확인
  const checkNickname = async () => {
    try {
      const url1 = `${MYPAGE}/check-nickname?nickname=${encodeURIComponent(profile.nickname)}`;
      const url2 = `${API_BASE}/members/check-nickname?nickname=${encodeURIComponent(profile.nickname)}`;
      await fetchJSON(url1, { headers: authHeaders() }).catch(() =>
        fetchJSON(url2, { headers: authHeaders() }),
      );
      setMsg("사용 가능한 닉네임입니다.");
    } catch (e) {
      setErr(e.message || "닉네임 중복확인 실패");
    }
  };
  const checkEmail = async () => {
    try {
      const url1 = `${MYPAGE}/check-email?email=${encodeURIComponent(profile.email)}`;
      const url2 = `${API_BASE}/members/check-email?email=${encodeURIComponent(profile.email)}`;
      await fetchJSON(url1, { headers: authHeaders() }).catch(() =>
        fetchJSON(url2, { headers: authHeaders() }),
      );
      setMsg("사용 가능한 이메일입니다.");
    } catch (e) {
      setErr(e.message || "이메일 중복확인 실패");
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setSaving(true);
    try {
      const body = {
        nickname: profile.nickname || null,
        email: profile.email || null,
        gender: profile.gender || null,
        birthdate: profile.birthdate || null,
        alertKeyword: profile.alertKeyword || null,
        extra1: profile.extra1 || null,
        extra2: profile.extra2 || null,
        extra3: profile.extra3 || null,
      };
      await fetchJSON(`${MYPAGE}/update`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      setMsg("수정이 완료되었습니다.");
      nav("/mypage");
    } catch (e2) {
      setErr(e2.message || "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageWrap}>
      <h1 style={title}>내 정보</h1>

      {(msg || err) && (
        <div
          style={{
            ...alertBar,
            background: err ? "var(--mui-palette-error-light)" : "var(--mui-palette-success-light)",
            color: err ? "var(--mui-palette-error-contrastText)" : "var(--mui-palette-success-contrastText)",
          }}
        >
          {err || msg}
        </div>
      )}

      <form onSubmit={onSave} style={card}>
        {/* 상단: 프로필 + 업로드 */}
        <div style={{ display: "grid", justifyItems: "center", marginBottom: 8 }}>
          <div style={avatarBox}>
            {profileImageSrc ? (
              <img src={profileImageSrc} alt="profile" style={avatarImg} />
            ) : (
              <div style={avatarFallback}>
                {(profile.nickname || profile.userId || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 6, justifyItems: "center", marginTop: 8 }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={smallPrimary}>
              프로필 업로드
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              style={{ display: "none" }}
            />
            {preview && (
              <img
                src={preview}
                alt="preview"
                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
              />
            )}
            <div style={{ fontSize: 12, color: "var(--mui-palette-text-secondary)" }}>
              * 용량/확장자/픽셀 제한 안내 문구 추후 수정예정
            </div>
            <button type="button" onClick={onUploadImage} disabled={!file} style={smallGhost(!file)}>
              업로드 적용
            </button>
          </div>
        </div>

        {/* 표 형태 폼 */}
        <div style={tableWrap}>
          <div style={tr}>
            <div style={th}>아이디</div>
            <div style={td}>{loading ? "불러오는 중..." : profile.userId || "-"}</div>
          </div>

          <div style={tr}>
            <div style={th}>닉네임</div>
            <div style={tdInput}>
              <input
                style={cellInput}
                value={profile.nickname}
                onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
                placeholder="닉네임"
              />
              <button type="button" onClick={checkNickname} style={smallChip}>
                중복확인
              </button>
            </div>
          </div>

          <div style={tr}>
            <div style={th}>이메일</div>
            <div style={tdInput}>
              <input
                style={cellInput}
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
              />
              <button type="button" onClick={checkEmail} style={smallChip}>
                중복확인
              </button>
            </div>
          </div>

          <div style={tr}>
            <div style={th}>비밀번호</div>
            <div style={tdMuted}>{"마이페이지 > 보안에서 변경"}</div>
          </div>

          <div style={tr}>
            <div style={th}>알림키워드 등록</div>
            <div style={tdInput}>
              <input
                style={cellInput}
                value={profile.alertKeyword}
                onChange={(e) => setProfile((p) => ({ ...p, alertKeyword: e.target.value }))}
                placeholder="예: 스프링, 리액트"
              />
            </div>
          </div>

          <div style={tr}>
            <div style={th}>기타등록1</div>
            <div style={tdInput}>
              <input
                style={cellInput}
                value={profile.extra1}
                onChange={(e) => setProfile((p) => ({ ...p, extra1: e.target.value }))}
              />
            </div>
          </div>
          <div style={tr}>
            <div style={th}>기타등록2</div>
            <div style={tdInput}>
              <input
                style={cellInput}
                value={profile.extra2}
                onChange={(e) => setProfile((p) => ({ ...p, extra2: e.target.value }))}
              />
            </div>
          </div>
          <div style={tr}>
            <div style={th}>기타등록3</div>
            <div style={tdInput}>
              <input
                style={cellInput}
                value={profile.extra3}
                onChange={(e) => setProfile((p) => ({ ...p, extra3: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
          <button type="submit" disabled={saving} style={primaryBtn(saving)}>
            {saving ? "저장 중..." : "수정완료"}
          </button>
          <button type="button" onClick={() => nav("/mypage")} style={ghostBtn}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

const pageWrap = { maxWidth: 560, margin: "24px auto", padding: "0 12px" };
const title = { textAlign: "center", fontSize: 24, fontWeight: 700, marginBottom: 12 };
const alertBar = { borderRadius: 12, padding: "10px 12px", marginBottom: 12, textAlign: "center", fontSize: 13 };

const card = {
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-paper)",
  borderRadius: 28,
  padding: 16,
};

const avatarBox = {
  width: 96, height: 96, borderRadius: "50%",
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-default)",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
};
const avatarImg = { width: "100%", height: "100%", objectFit: "cover" };
const avatarFallback = { fontSize: 20, color: "var(--mui-palette-text-secondary)" };

const smallPrimary = {
  height: 30, padding: "0 12px", borderRadius: 8,
  border: "1px solid var(--mui-palette-primary-main)",
  background: "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-primary-contrastText)",
  cursor: "pointer",
};
const smallGhost = (disabled) => ({
  height: 28, padding: "0 10px", borderRadius: 8,
  border: "1px solid var(--mui-palette-divider)",
  background: disabled ? "var(--mui-palette-action-disabledBackground)" : "transparent",
  color: "var(--mui-palette-text-primary)",
  cursor: disabled ? "default" : "pointer",
});

const tableWrap = {
  marginTop: 12,
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 8,
  overflow: "hidden",
};
const tr = { display: "grid", gridTemplateColumns: "140px 1fr", borderTop: "1px solid var(--mui-palette-divider)" };
const th = {
  background: "var(--mui-palette-action-hover)",
  padding: "10px 12px",
  fontWeight: 700,
  fontSize: 13,
};
const td = { padding: "10px 12px", display: "flex", alignItems: "center" };
const tdMuted = { ...td, color: "var(--mui-palette-text-secondary)" };
const tdInput = { ...td, gap: 8 };
const cellInput = {
  flex: 1,
  height: 32,
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 6,
  padding: "0 10px",
  background: "var(--mui-palette-background-paper)",
  color: "var(--mui-palette-text-primary)",
};

const smallChip = {
  height: 28, padding: "0 10px", borderRadius: 8,
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-default)",
  color: "var(--mui-palette-text-primary)",
  cursor: "pointer",
};

const primaryBtn = (disabled) => ({
  height: 34, padding: "0 16px", borderRadius: 8,
  border: "1px solid var(--mui-palette-primary-main)",
  background: disabled ? "var(--mui-palette-action-disabledBackground)" : "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-primary-contrastText)",
  cursor: disabled ? "default" : "pointer",
});
const ghostBtn = {
  height: 34, padding: "0 16px", borderRadius: 8,
  border: "1px solid var(--mui-palette-divider)",
  background: "transparent",
  color: "var(--mui-palette-text-primary)",
  cursor: "pointer",
};
