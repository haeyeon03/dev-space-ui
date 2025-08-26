import * as React from "react";
import { Outlet } from "react-router-dom";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { useSelector, useDispatch } from "react-redux";
import { selectSession } from "./store/user-slice";
import { USER_NAVIGATOR, ADMIN_NAVIGATOR } from "./_navigator";
import useCustomMove from "./hook/useCustomMove";
import useAuth from "./hook/useAuth";

export default function App() {
  const session = useSelector(selectSession);
  const dispatch = useDispatch();
  const { moveToSignin } = useCustomMove();
  const { signOut } = useAuth();

  const authentication = React.useMemo(
    () => ({
      signIn: () => moveToSignin(),
      signOut: () => signOut(),
    }),
    [dispatch]
  );

  const role = session?.user?.role;

  // role별 navigator 선택
  const navigator =
    role === "ADMIN"
      ? ADMIN_NAVIGATOR
      : USER_NAVIGATOR.map((item) => {
          // My Page는 로그인된 경우만 포함
          if (item.segment === "mypage" && !session) return null;
          return item;
        }).filter(Boolean); // null 제거

  return (
    <ReactRouterAppProvider
      navigation={navigator}
      branding={{ title: "DEV-SPACE" }}
      authentication={authentication}
      session={session}
    >
      <Outlet />
    </ReactRouterAppProvider>
  );
}
