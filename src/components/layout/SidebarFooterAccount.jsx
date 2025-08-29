/* 왼쪽 사이드 바 하단 */
import * as React from "react";
import { Account } from "@toolpad/core/Account";
import SidebarFooterAccountPopover from "./SidebarFooterAccountPopover";
import AccountSidebarPreview from "./AccountSidebarPreview";

/* 로그인 직후 자동으로 프로필 이미지 세팅 */
import { useDispatch, useSelector } from "react-redux";
import { setProfileImage } from "../../store/user-slice";

function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}
const withBust = (url) => (url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : "");

const createPreviewComponent = (mini) => {
  function PreviewComponent(props) {
    return <AccountSidebarPreview {...props} mini={mini} />;
  }
  return PreviewComponent;
};

export default function SidebarFooterAccount({ mini }) {
  const PreviewComponent = React.useMemo(() => createPreviewComponent(mini), [mini]);

  /* 여기서 한 번만 /mypage 조회 → 미니/헤더 동시 갱신 */
  const dispatch = useDispatch();
  const token = useSelector((s) => s.user?.token);
  const currentImg = useSelector((s) => s.user?.image);

  React.useEffect(() => {
    // 토큰 없으면 중단. 이미지가 이미 있고 blob이 아니면 스킵(=정상 URL이면 그대로 사용)
    if (!token) return;
    if (currentImg && !currentImg.startsWith("blob:")) return;

    (async () => {
      const base =
        sessionStorage.getItem("API_BASE_CACHED") || (import.meta.env.VITE_API_BASE || "/api");

      try {
        // 1) 내 정보에서 프로필 이미지 URL만 추출
        const r = await fetch(`${base}/mypage`, { headers: authHeaders() });
        if (!r.ok) return;
        const ct = r.headers.get("content-type") || "";
        const j = ct.includes("application/json") ? await r.json() : {};
        const d = j?.data ?? j?.result ?? j?.body ?? j ?? {};
        const raw =
          d.profileImageUrl ?? d.profile_image_url ?? d.avatarUrl ?? d.avatar ?? "";
        if (!raw) return;

        // 2) 절대경로 + 캐시버스터
        const abs = /^https?:\/\//i.test(raw)
          ? raw
          : `${location.protocol}//${location.hostname}:8080${raw.startsWith("/") ? raw : `/${raw}`
          }`;
        const absBust = withBust(abs);

        // 3) 원본 절대 URL만 저장 (blob 생성/보호 리소스 처리는 전역 미들웨어가 담당)
        dispatch(setProfileImage(absBust));
      } catch {
      }
    })();
  }, [token, currentImg, dispatch]);

  return (
    <Account
      slots={{
        preview: PreviewComponent,
        popoverContent: SidebarFooterAccountPopover,
      }}
      slotProps={{
        popover: {
          transformOrigin: { horizontal: "left", vertical: "bottom" },
          anchorOrigin: { horizontal: "right", vertical: "bottom" },
          disableAutoFocus: true,
          slotProps: {
            paper: {
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: (theme) =>
                  `drop-shadow(0px 2px 8px ${theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(0,0,0,0.32)"
                  })`,
                mt: 1,
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  bottom: 10,
                  left: 0,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translate(-50%, -50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            },
          },
        },
      }}
    />
  );
}
