import * as React from "react";
import { Outlet } from "react-router-dom";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { useSelector, useDispatch } from "react-redux";
import { selectSession, clearUser } from "./store/user-slice";
import { USER_NAVIGATOR, ADMIN_NAVIGATOR } from "./_navigator";
import useCustomMove from "./hook/useCustomMove";

export default function App() {
  const session = useSelector(selectSession);
  const dispatch = useDispatch();
  const { moveToSignin } = useCustomMove();

  const handleSignOut = () => dispatch(clearUser());

  const authentication = React.useMemo(
    () => ({
      signIn: () => moveToSignin(),
      signOut: () => handleSignOut(),
    }),
    [dispatch]
  );

  const role = session?.user?.role;

  // role별 navigator 선택
  const navigator = role === "ADMIN" ? ADMIN_NAVIGATOR : USER_NAVIGATOR;

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
