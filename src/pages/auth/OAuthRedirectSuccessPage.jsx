import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { api } from "../../api/api-client";
import { setUser } from "../../store/user-slice";
import useCustomMove from "../../hook/useCustomMove";

const OAuthRedirectSuccessPage = () => {
  const dispatch = useDispatch();
  const { moveToNewsList, moveToSignin } = useCustomMove();

  const url = window.location.href;
  const params = new URL(url).searchParams;
  const key = params.get("key");

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!key) return;

      try {
        const res = await api.get(`auth/authenticated/${key}`);
        console.log("OAuth2 key 조회 결과:", res);

        const { accessToken, nickname, email, role } = res.data;

        // Redux 상태에 토큰과 유저 정보 저장
        dispatch(setUser({ token: accessToken, nickname, email, role }));

        // 로그인 성공 후 페이지 이동
        moveToNewsList();
      } catch (err) {
        console.error("OAuth2 key 조회 실패:", err);
        moveToSignin();
      }
    };

    fetchUserInfo();
  }, [key, dispatch, moveToNewsList, moveToSignin]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <div>로그인 처리 중...</div>
    </div>
  );
};

export default OAuthRedirectSuccessPage;
