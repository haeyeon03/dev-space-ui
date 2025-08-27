// src/pages/mypage/MyInfoEditPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProfileImage } from "../../store/user-slice";

/* ====== 자동 API 베이스 감지 유틸 ====== */
const CANDIDATE_API_BASES = [
  import.meta.env.VITE_API_BASE || "/api",
  `${location.protocol}//${location.hostname}:8080/api`,
];

function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

// API 오리진 계산 (정적자원 URL 절대화용)
const getApiOrigin = () => {
  const cached = sessionStorage.getItem("API_BASE_CACHED");
  const base = cached || (import.meta.env.VITE_API_BASE || "/api");
  const pick = /^https?:\/\//i.test(base)
    ? base
    : `${location.protocol}//${location.hostname}:8080/api`;
  try {
    return new URL(pick).origin; // 예: http://localhost:8080
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

// 닉네임: 한글/영문 2~10자
const NICK_RULE = /^[A-Za-z가-힣]{2,10}$/;
const NICK_RULE_MSG = "닉네임은 한글 또는 영문 2~10자로 입력해주세요.";
// 새 비밀번호: 영문+숫자+특수문자, 8~20자
const PW_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
const PW_RULE_MSG = "비밀번호는 영문, 숫자, 특수문자 포함 8~20자로 입력해주세요.";

// 캐시 버스터
const withBust = (url) => (url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : "");

export default function MyInfoEditPage() {
  const nav = useNavigate();
  const dispatch = useDispatch(); // ✅ 전역 아바타 동기화용

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

  // 비밀번호 변경(인라인 메시지 포함)
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 아바타 표시용 src(일반 URL 실패 시 인증헤더로 blob 재시도)
  const [imgSrc, setImgSrc] = useState("");
  const [imgError, setImgError] = useState(false);
  const [imgTriedAuth, setImgTriedAuth] = useState(false);
  const lastBlobUrlRef = useRef("");

  // 유효성
  const nick = profile.nickname || "";
  const nickValid = NICK_RULE.test(nick);
  const newPwValid = PW_RULE.test(pwd.newPassword || "");
  const showPwWarning = pwd.newPassword.length > 0 && !newPwValid;
  const showNickWarning = nick.length > 0 && !nickValid;

  // 프로필 로딩
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchJSON(MYPAGE, { headers: authHeaders() });
        const d =
          raw && typeof raw === "object" ? raw.data ?? raw.result ?? raw.body ?? raw : {};
        setProfile((p) => ({
          ...p,
          userId: d.userId ?? d.id ?? d.memberId ?? d.username ?? "",
          nickname: d.nickname ?? d.nickName ?? d.name ?? d.displayName ?? "",
          email: d.email ?? d.userEmail ?? d.mail ?? "",
          gender: d.gender ?? d.sex ?? "",
          birthdate: d.birthdate ?? d.birthDate ?? d.birth_day ?? "",
          profileImageUrl:
            d.profileImageUrl ?? d.profile_image_url ?? d.avatarUrl ?? d.avatar ?? "",
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

  // 🔁 전역 아바타 이미지 동기화 (3-1, 3-2, 3-3)
  useEffect(() => {
    let revokeUrl = "";
    const raw = profile.profileImageUrl || "";
    if (!raw) {
      dispatch(setProfileImage("")); // 전역 비우기
      return;
    }
    const abs = toAbsoluteAssetUrl(raw);
    const busted = withBust(abs);

    // 1차: 공개 URL 그대로 반영
    dispatch(setProfileImage(busted));

    // 2차: 인증 필요한 경우 대비 → 토큰으로 받아 blob URL로 교체
    (async () => {
      try {
        const r = await fetch(abs, { headers: authHeaders() });
        if (!r.ok) return;
        const b = await r.blob();
        const url = URL.createObjectURL(b);
        revokeUrl = url;
        dispatch(setProfileImage(url));
      } catch {
        // 무시(공개 URL로도 충분한 경우)
      }
    })();

    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [profile.profileImageUrl, dispatch]);

  // 미리보기/블롭URL 메모리 해제
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
      if (lastBlobUrlRef.current) URL.revokeObjectURL(lastBlobUrlRef.current);
    },
    [preview]
  );

  // 프로필 이미지 URL 변경 시 1차: 공개 URL 시도 (로컬 미리보기와 별개)
  useEffect(() => {
    setImgError(false);
    setImgTriedAuth(false);
    if (lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = "";
    }
    const u = profile.profileImageUrl || "";
    if (!u) return setImgSrc("");
    const abs = toAbsoluteAssetUrl(u);
    setImgSrc(withBust(abs));
  }, [profile.profileImageUrl]);

  // `<img>` 실패 시 인증 헤더로 다시 받아(blob) 표시
  const handleAvatarError = async () => {
    if (imgTriedAuth) {
      setImgError(true);
      return;
    }
    try {
      const abs = toAbsoluteAssetUrl(profile.profileImageUrl || "");
      const res = await fetch(abs, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      lastBlobUrlRef.current = blobUrl;
      setImgSrc(blobUrl);
      setImgTriedAuth(true);
      setImgError(false);
    } catch {
      setImgError(true);
    }
  };

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (preview) {
      try {
        URL.revokeObjectURL(preview);
      } catch { }
    }
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  // 이미지 업로드
  const onUploadImage = async () => {
    if (!file || uploading) return;
    setMsg("");
    setErr("");
    setUploading(true);

    const reloadProfileImage = async () => {
      try {
        const raw = await fetchJSON(MYPAGE, { headers: authHeaders() });
        const d =
          raw && typeof raw === "object" ? raw.data ?? raw.result ?? raw.body ?? raw : {};
        const url =
          d.profileImageUrl ??
          d.profile_image_url ??
          d.avatarUrl ??
          d.avatar ??
          "";
        if (url) setProfile((p) => ({ ...p, profileImageUrl: url }));
      } catch (e) {
        console.warn("프로필 재조회 실패:", e);
      }
    };

    try {
      const apiBase =
        sessionStorage.getItem("API_BASE_CACHED") ||
        (import.meta.env.VITE_API_BASE || "/api");
      const uploadUrl = `${apiBase}${MYPAGE}/profile-image`;

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: authHeaders(), // FormData는 Content-Type 자동 설정
        body: fd,
      });

      if (!res.ok) {
        let emsg = res.statusText;
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const j = await res.json().catch(() => ({}));
            emsg = j?.message || j?.error || emsg;
          } else {
            emsg = (await res.text().catch(() => "")) || emsg;
          }
        } catch { }
        throw new Error(emsg || `HTTP ${res.status}`);
      }

      let uploadedUrl = "";
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await res.json().catch(() => ({}));
          uploadedUrl =
            j?.profileImageUrl ??
            j?.data?.profileImageUrl ??
            j?.url ??
            j?.data?.url ??
            j?.path ??
            j?.data?.path ??
            j?.location ??
            "";
        }
      } catch { }

      if (uploadedUrl) {
        setProfile((p) => ({ ...p, profileImageUrl: uploadedUrl }));
        // ✅ 업로드 직후 전역 아바타도 즉시 반영
        const abs = toAbsoluteAssetUrl(uploadedUrl);
        dispatch(setProfileImage(withBust(abs)));
      } else {
        await reloadProfileImage(); // 서버가 바로 새 URL 반환 안 할 때 대비
      }

      setMsg("프로필 이미지가 업데이트되었습니다.");

      if (preview) {
        try {
          URL.revokeObjectURL(preview);
        } catch { }
      }
      setPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
    } catch (e) {
      console.error("이미지 업로드 실패:", e);
      setErr(e.message || "이미지 업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  // 닉네임 중복확인
  const checkNickname = async () => {
    setNickInlineMsg("");
    setNickInlineErr("");
    const v = nick.trim();
    if (!v) return setNickInlineErr("닉네임을 입력해 주세요.");
    if (!nickValid) return setNickInlineErr(NICK_RULE_MSG);

    try {
      const r = await fetchJSON(
        `${MYPAGE}/check-nickname?nickname=${encodeURIComponent(v)}`,
        { headers: authHeaders() }
      );
      const ok = r?.available ?? r?.ok ?? true;
      if (ok === false) setNickInlineErr(r?.message || "이미 사용 중인 닉네임입니다.");
      else setNickInlineMsg(r?.message || "사용 가능한 닉네임입니다.");
    } catch (e1) {
      try {
        const r2 = await _fetchJSONCore(
          `${CANDIDATE_API_BASES[1]}${MYPAGE}/check-nickname?nickname=${encodeURIComponent(
            v
          )}`,
          { headers: authHeaders() }
        );
        const ok2 = r2?.available ?? r2?.ok ?? true;
        if (ok2 === false)
          setNickInlineErr(r2?.message || "이미 사용 중인 닉네임입니다.");
        else setNickInlineMsg(r2?.message || "사용 가능한 닉네임입니다.");
      } catch (e2) {
        setNickInlineErr(e2?.message || e1?.message || "닉네임 중복확인 실패");
      }
    }
  };

  // 이메일 중복확인
  const checkEmail = async () => {
    setMsg("");
    setErr("");
    const v = (profile.email || "").trim();
    if (!v) return setErr("이메일을 입력해 주세요.");
    try {
      await fetchJSON(`${MYPAGE}/check-email?email=${encodeURIComponent(v)}`, {
        headers: authHeaders(),
      });
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

  // 비밀번호 변경
  const onChangePassword = async () => {
    setPwdInlineMsg("");
    setPwdInlineErr("");
    if (!pwd.currentPassword || !pwd.newPassword) {
      setPwdInlineErr("현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.");
      return;
    }
    if (!newPwValid) {
      setPwdInlineErr(PW_RULE_MSG);
      return;
    }
    setMsg("");
    setErr("");
    setPwdSaving(true);
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
      setPwdInlineErr(e?.message || "현재 비밀번호가 올바르지 않습니다.");
    } finally {
      setPwdSaving(false);
    }
  };

  // 프로필 저장
  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

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

  return (
    <div style={pageWrap}>
      <h1 style={title}>내 정보</h1>

      {(msg || err) && (
        <div
          style={{
            ...alertBar,
            background: err
              ? "var(--mui-palette-error-light)"
              : "var(--mui-palette-success-light)",
            color: err
              ? "var(--mui-palette-error-contrastText)"
              : "var(--mui-palette-success-contrastText)",
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
            {imgSrc && !imgError ? (
              <img
                src={imgSrc}
                alt=""
                style={avatarImg}
                loading="lazy"
                onError={handleAvatarError}
              />
            ) : (
              <div style={avatarFallback}>
                {(profile.nickname || profile.userId || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* 버튼 2개를 한 줄에 배치 */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={smallPrimary}
            >
              프로필 업로드
            </button>
            <button
              type="button"
              onClick={onUploadImage}
              disabled={!file || uploading}
              style={smallGhost(!file || uploading)}
            >
              {uploading ? "업로드 중..." : "업로드 적용"}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            style={{ display: "none" }}
          />

          {/* 미리보기는 버튼 아래에 */}
          {preview && (
            <img
              src={preview}
              alt="preview"
              style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, marginTop: 8 }}
            />
          )}
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

          {/* 비밀번호 변경 */}
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
                  if (PW_RULE.test(e.target.value || "")) setPwdInlineErr("");
                }}
                minLength={8}
                maxLength={20}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={onChangePassword}
                disabled={pwdSaving || !pwd.currentPassword || !pwd.newPassword || !newPwValid}
                style={smallChip}
              >
                변경
              </button>

              <div
                style={{
                  width: "100%",
                  marginTop: 6,
                  fontSize: 12,
                  color: showPwWarning
                    ? "var(--mui-palette-error-main)"
                    : "var(--mui-palette-text-secondary)",
                }}
                aria-live="polite"
              >
                {PW_RULE_MSG}
              </div>

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
                onChange={(e) =>
                  setProfile((p) => ({ ...p, alertKeyword: e.target.value }))
                }
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

/* ===== 스타일 ===== */
const pageWrap = { maxWidth: 560, margin: "24px auto", padding: "0 12px" };
const title = { textAlign: "center", fontSize: 24, fontWeight: 700, marginBottom: 12 };
const alertBar = {
  borderRadius: 12,
  padding: "10px 12px",
  marginBottom: 12,
  textAlign: "center",
  fontSize: 13,
};

const card = {
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-paper)",
  borderRadius: 28,
  padding: 16,
};

const avatarBox = {
  width: 96,
  height: 96,
  borderRadius: "50%",
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-default)",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
};
const avatarImg = { width: "100%", height: "100%", objectFit: "cover" };
const avatarFallback = { fontSize: 20, color: "var(--mui-palette-text-secondary)" };

const smallPrimary = {
  height: 30,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid var(--mui-palette-primary-main)",
  background: "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-primary-contrastText)",
  cursor: "pointer",
};
const smallGhost = (disabled) => ({
  height: 28,
  padding: "0 10px",
  borderRadius: 8,
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
const tr = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  borderTop: "1px solid var(--mui-palette-divider)",
};
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
  height: 28,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid var(--mui-palette-divider)",
  background: "var(--mui-palette-background-default)",
  color: "var(--mui-palette-text-primary)",
  cursor: "pointer",
};

const primaryBtn = (disabled) => ({
  height: 34,
  padding: "0 16px",
  borderRadius: 8,
  border: "1px solid var(--mui-palette-primary-main)",
  background: disabled
    ? "var(--mui-palette-action-disabledBackground)"
    : "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-primary-contrastText)",
  cursor: disabled ? "default" : "pointer",
});
const ghostBtn = {
  height: 34,
  padding: "0 16px",
  borderRadius: 8,
  border: "1px solid var(--mui-palette-divider)",
  background: "transparent",
  color: "var(--mui-palette-text-primary)",
  cursor: "pointer",
};
