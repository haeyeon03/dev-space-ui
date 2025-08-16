// koKRLabels.jsx
import { getLocalization } from "./getLocalization";

const koKRLabels = {
  // Account
  accountSignInLabel: "로그인",
  accountSignOutLabel: "로그아웃",

  // AccountPreview
  accountPreviewTitle: "계정",
  accountPreviewIconButtonLabel: "현재 사용자",

  // SignInPage
  signInTitle: (brandingTitle) =>
    brandingTitle ? `${brandingTitle}에 로그인` : `로그인`,
  signInSubtitle: "환영합니다! 계속하려면 로그인하세요",
  signInRememberMe: "로그인 상태 유지",
  providerSignInTitle: () => `로그인`,

  // Common authentication labels
  email: "아이디",
  password: "비밀번호",
  username: "사용자 이름",
  passkey: "패스키",

  // Common action labels
  save: "저장",
  cancel: "취소",
  ok: "확인",
  or: "또는",
  to: "로",
  with: "~와 함께",
  close: "닫기",
  delete: "삭제",
  alert: "알림",
  confirm: "확인",
  loading: "로딩 중...",
};

export default getLocalization(koKRLabels);
