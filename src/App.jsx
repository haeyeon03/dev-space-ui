import * as React from "react";
import { Outlet } from "react-router-dom";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { NAVIGATOR } from "./_navigator";
import { useDispatch, useSelector } from "react-redux";
import { selectSession, clearUser } from "./store/user-slice";
import useCustomMove from "./hook/useCustomMove";

export default function App() {
  // Redux의 userSlice → Toolpad session 형태로 변환된 값 사용
  const session = useSelector(selectSession);

  const dispatch = useDispatch();
  const { moveToSignin } = useCustomMove();

  const handleSignOut = () => {
    // TODO. Logout API 호출하여 http cookie 에 저장된 refresh token 삭제 후
    // const res = axios.delete("auth/logout");
    dispatch(clearUser()); // Localstorage 에 저장된 User 정보 제거
  };

  // Toolpad의 Account 등에서 쓸 로그인/로그아웃 핸들러
  const authentication = React.useMemo(
    () => ({
      signIn: () => moveToSignin(),
      signOut: () => handleSignOut(),
    }),
    [dispatch]
  );

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATOR}
      branding={{ title: "DEV-SPACE" }}
      // ToolPad UI Template -> 내부적으로 어떻게 동작하는지는 모르겠으나.
      // AppProvider 속성 중 authentication, session 에 적절한 값을 넣으면
      // 왼쪽 사이드바 하단과 오른쪽 상단 헤더 부분을 채워줌.
      authentication={authentication}
      session={session}
    >
      <Outlet />
    </ReactRouterAppProvider>
  );
}
