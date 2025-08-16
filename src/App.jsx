import * as React from "react";
import { Outlet } from "react-router-dom";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { NAVIGATOR } from "./_navigator";
import { useDispatch, useSelector } from "react-redux";
import { authStore } from "./store/auth-store";
import { selectSession, setUser, clearUser } from "./store/user-slice";

export default function App() {
  // Redux의 userSlice → Toolpad session 형태로 변환된 값 사용
  const session = useSelector(selectSession);
  const dispatch = useDispatch();

  const handleSignOut = () => {
    // TODO. Logout API 호출하여 http cookie 에 저장된 refresh token 삭제 후
    // const res = axios.delete("auth/logout");
    authStore.clear(); // 메모리(변수)에 저장된 Access Token 제거
    dispatch(clearUser()); // Localstorage 에 저장된 User 정보 제거
  };

  // Toolpad의 Account 등에서 쓸 로그인/로그아웃 핸들러
  const authentication = React.useMemo(
    () => ({
      // 예: signIn({ nickname, email, role })
      signIn: (payload) => dispatch(setUser(payload)),
      signOut: () => handleSignOut(),
    }),
    [dispatch]
  );

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATOR}
      branding={{ title: "DEV-SPACE" }}
      authentication={authentication}
      session={session}
    >
      <Outlet />
    </ReactRouterAppProvider>
  );
}
