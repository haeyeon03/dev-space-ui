// src/pages/mypage/MyInfoEditPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ====== 자동 API 베이스 감지 유틸 ====== */
const CANDIDATE_API_BASES = [
  import.meta.env.VITE_API_BASE || "/api",
  `${location.protocol}//${location.hostname}:8080/api`,
];

function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

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
      const isJson = ct.includes("application/json");
      if (!isJson) {
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

// ✅ 닉네임: 한글/영문 2~10자
const NICK_RULE = /^[A-Za-z가-힣]{2,10}$/;
const NICK_RULE_MSG = "닉네임은 한글 또는 영문 2~10자로 입력해주세요.";
// ✅ 새 비밀번호: 영문+숫자+특수문자, 8~20자
const PW_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
const PW_RULE_MSG = "비밀번호는 영문, 숫자, 특수문자 포함 8~20자로 입력해주세요.";

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

  // 비밀번호 변경용(인라인 메시지 포함)
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdInlineMsg, setPwdInlineMsg] = useState("");
  const [pwdInlineErr, setPwdInlineErr] = useState("");

  // 닉네임 중복체크 인라인 메시지
  const [nickInlineMsg, setNickInlineMsg] = useState("");
  const [nickInlineErr, setNickInlineErr] = useState("");

  // 이미지 업로드
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef(null);

  // 파생 값들
  const nick = profile.nickname || "";
  const nickValid = NICK_RULE.test(nick);
  const newPwValid = PW_RULE.test(pwd.newPassword || "");
  const showPwWarning = pwd.newPassword.length > 0 && !newPwValid;
  const showNickWarning = nick.length > 0 && !nickValid;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchJSON(MYPAGE, { headers: authHeaders() });
        const d = (raw && typeof raw === "object") ? (raw.data ?? raw.result ?? raw.body ?? raw) : {};
        setProfile((p) => ({
          ...p,
          userId: d.userId ?? d.id ?? d.memberId ?? d.username ?? "",
          nickname: d.nickname ?? d.nickName ?? d.name ?? d.displayName ?? "",
          email: d.email ?? d.userEmail ?? d.mail ?? "",
          gender: d.gender ?? d.sex ?? "",
          birthdate: d.birthdate ?? d.birthDate ?? d.birth_day ?? "",
          profileImageUrl: d.profileImageUrl ?? d.profile_image_url ?? d.avatarUrl ?? d.avatar ?? "",
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

  // ✅ 닉네임 중복확인: 상대경로 우선 → 8080 절대주소 폴백
  const checkNickname = async () => {
    setNickInlineMsg(""); setNickInlineErr("");
    const v = nick.trim();
    if (!v) {
      setNickInlineErr("닉네임을 입력해 주세요.");
      return;
    }
    if (!nickValid) {
      setNickInlineErr(NICK_RULE_MSG);
      return;
    }
    try {
      const r = await fetchJSON(`${MYPAGE}/check-nickname?nickname=${encodeURIComponent(v)}`, { headers: authHeaders() });
      const ok = r?.available ?? r?.ok ?? true;
      if (ok === false) setNickInlineErr(r?.message || "이미 사용 중인 닉네임입니다.");
      else setNickInlineMsg(r?.message || "사용 가능한 닉네임입니다.");
    } catch (e1) {
      try {
        const r2 = await _fetchJSONCore(
          `${CANDIDATE_API_BASES[1]}${MYPAGE}/check-nickname?nickname=${encodeURIComponent(v)}`,
          { headers: authHeaders() }
        );
        const ok2 = r2?.available ?? r2?.ok ?? true;
        if (ok2 === false) setNickInlineErr(r2?.message || "이미 사용 중인 닉네임입니다.");
        else setNickInlineMsg(r2?.message || "사용 가능한 닉네임입니다.");
      } catch (e2) {
        setNickInlineErr(e2?.message || e1?.message || "닉네임 중복확인 실패");
      }
    }
  };

  // 이메일 중복확인: 상대경로 우선 → 8080 절대주소 폴백
  const checkEmail = async () => {
    setMsg(""); setErr("");
    const v = (profile.email || "").trim();
    if (!v) return setErr("이메일을 입력해 주세요.");
    try {
      await fetchJSON(`${MYPAGE}/check-email?email=${encodeURIComponent(v)}`, { headers: authHeaders() });
      setMsg("사용 가능한 이메일입니다.");
    } catch (e1) {
      try {
        await _fetchJSONCore(
          `${CANDIDATE_API_BASES[1]}${MYPAGE}/check-email?email=${encodeURIComponent(v)}`,
          { headers: authHeaders() }
        );
        setMsg("사용 가능한 이메일입니다.");
      } catch (e2) {
        setErr(e2?.message || e1?.message || "이메일 중복확인 실패");
      }
    }
  };

  // 프로필 저장
  const onSave = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");

    // 닉네임 규칙 우선 검증
    if (!nickValid) {
      setNickInlineErr(NICK_RULE_MSG);
      return;
    }

    setSaving(true);
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

  // 비밀번호 변경
  const onChangePassword = async () => {
    setPwdInlineMsg(""); setPwdInlineErr("");
    if (!pwd.currentPassword || !pwd.newPassword) {
      setPwdInlineErr("현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.");
      return;
    }
    if (!newPwValid) {
      setPwdInlineErr(PW_RULE_MSG);
      return;
    }
    setMsg(""); setErr(""); setPwdSaving(true);
    try {
      await fetchJSON(`${MYPAGE}/password`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          currentPassword: pwd.currentPassword,
          newPassword: pwd.newPassword,
        }),
      });
      setPwdInlineMsg("비밀번호가 변경되었습니다.");
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (e) {
      // 서버 메시지를 그대로 노출(예: 현재 비밀번호가 틀렸습니다)
      setPwdInlineErr(e?.message || "현재 비밀번호가 올바르지 않습니다.");
    } finally {
      setPwdSaving(false);
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

      {/* 프로필 수정 폼 */}
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
                onChange={(e) => {
                  setProfile((p) => ({ ...p, nickname: e.target.value }));
                  setNickInlineMsg("");
                  setNickInlineErr("");
                }}
                placeholder="닉네임"
              />
              <button
                type="button"
                onClick={checkNickname}
                style={smallChip}
                disabled={!nickValid}
                title={!nickValid ? NICK_RULE_MSG : "닉네임 중복확인"}
              >
                중복확인
              </button>

              {/* 닉네임 규칙 안내/경고 */}
              <div
                style={{
                  width: "100%",
                  fontSize: 12,
                  marginTop: 4,
                  color: showNickWarning
                    ? "var(--mui-palette-error-main)"
                    : "var(--mui-palette-text-secondary)",
                }}
                aria-live="polite"
              >
                {NICK_RULE_MSG}
              </div>

              {/* 닉네임 중복체크 결과 메시지 */}
              {(nickInlineMsg || nickInlineErr) && (
                <div
                  style={{
                    width: "100%",
                    fontSize: 12,
                    marginTop: 4,
                    color: nickInlineErr
                      ? "var(--mui-palette-error-main)"
                      : "var(--mui-palette-success-main)",
                  }}
                  aria-live="polite"
                >
                  {nickInlineErr || nickInlineMsg}
                </div>
              )}
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

          {/* 🔐 비밀번호 변경 */}
          <div style={tr}>
            <div style={th}>비밀번호</div>
            <div style={{ ...tdInput, flexWrap: "wrap" }}>
              <input
                style={{ ...cellInput, minWidth: 180 }}
                type="password"
                placeholder="현재 비밀번호"
                value={pwd.currentPassword}
                onChange={(e) => {
                  setPwd((s) => ({ ...s, currentPassword: e.target.value }));
                  setPwdInlineMsg("");
                  setPwdInlineErr("");
                }}
                autoComplete="current-password"
              />
              <input
                style={{ ...cellInput, minWidth: 180 }}
                type="password"
                placeholder="새 비밀번호 (8~20자, 영문/숫자/특수문자 포함)"
                value={pwd.newPassword}
                onChange={(e) => {
                  setPwd((s) => ({ ...s, newPassword: e.target.value }));
                  setPwdInlineMsg("");
                  if (PW_RULE.test(e.target.value || "")) {
                    setPwdInlineErr("");
                  }
                }}
                minLength={8}
                maxLength={20}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={onChangePassword}
                disabled={pwdSaving || !pwd.currentPassword || !pwd.newPassword || !newPwValid}
                style={primaryBtn(pwdSaving || !pwd.currentPassword || !pwd.newPassword || !newPwValid)}
              >
                {pwdSaving ? "변경 중..." : "변경"}
              </button>

              {/* 비번 규칙 안내/경고 */}
              <div
                style={{
                  width: "100%",
                  marginTop: 6,
                  fontSize: 12,
                  color: showPwWarning ? "var(--mui-palette-error-main)" : "var(--mui-palette-text-secondary)",
                }}
                aria-live="polite"
              >
                {PW_RULE_MSG}
              </div>

              {/* 서버 응답 기반 inline 메시지 */}
              {(pwdInlineMsg || pwdInlineErr) && (
                <div
                  style={{
                    width: "100%",
                    marginTop: 4,
                    fontSize: 12,
                    color: pwdInlineErr
                      ? "var(--mui-palette-error-main)"
                      : "var(--mui-palette-success-main)",
                  }}
                  aria-live="polite"
                >
                  {pwdInlineErr || pwdInlineMsg}
                </div>
              )}
            </div>
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
          <button
            type="submit"
            disabled={saving || !nickValid}
            style={primaryBtn(saving || !nickValid)}
            title={!nickValid ? NICK_RULE_MSG : "저장"}
          >
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
const tdInput = { ...td, gap: 8, alignItems: "center", flexWrap: "wrap" };
const cellInput = {
  flex: 1,
  minWidth: 0,
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
