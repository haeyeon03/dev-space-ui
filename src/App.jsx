import * as React from "react";
import { Outlet } from "react-router-dom";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { useSelector, useDispatch } from "react-redux";
import { selectSession, setProfileImage } from "./store/user-slice";
import { USER_NAVIGATOR, ADMIN_NAVIGATOR } from "./_navigator";
import useCustomMove from "./hook/useCustomMove";
import useAuth from "./hook/useAuth";

export default function App() {
  const session = useSelector(selectSession);
  const dispatch = useDispatch();
  const rawImage = useSelector((s) => s.user?.image);
  const imageBlob = useSelector((s) => s.user?.imageBlob);

  const { moveToSignin } = useCustomMove();
  const { signOut } = useAuth();

  const authentication = React.useMemo(
    () => ({
      signIn: () => moveToSignin(),
      signOut: () => signOut(),
    }),
    [dispatch]
  );

  // 새로고침 직후: 원본 URL만 있고 blob이 없으면 한 번 더 디스패치해서
  // resolveImageBlob 미들웨어가 인증 헤더로 받아 blob URL을 생성하도록 유도
  React.useEffect(() => {
    if (rawImage && !rawImage.startsWith("blob:") && !imageBlob) {
      dispatch(setProfileImage(rawImage));
    }
  }, [rawImage, imageBlob, dispatch]);

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
