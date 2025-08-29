import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useCustomMove from "../../hook/useCustomMove";
import { api } from "../../api/api-client";

const OAuthRedirectFailurePage = () => {
  const [searchParams] = useSearchParams();
  const { moveToSignupWithOauth, moveToSignin } = useCustomMove();

  useEffect(() => {
    const key = searchParams.get("key");
    const error = searchParams.get("error");

    if (key) {
      // key가 있으면 서버에서 임시 사용자 정보 조회
      const fetchTempUser = async () => {
        try {
          const res = await api.get(`/auth/authenticated/${key}`);
          console.log(res);
          const { email, nickname } = res.data; // 서버에서 받은 임시 사용자 정보

          // 회원가입 페이지로 이동하면서 이메일/닉네임 전달
          moveToSignupWithOauth(key, { email, nickname });
        } catch (err) {
          console.error("임시 사용자 정보 조회 실패:", err);
          alert(
            "회원가입 정보를 불러오지 못했습니다. 로그인 페이지로 이동합니다."
          );
          moveToSignin();
        }
      };
      fetchTempUser();
    } else if (error) {
      if (error !== "unknown") {
        alert(error);
      } else {
        alert("OAuth2 로그인 중 오류가 발생했습니다.");
      }
      moveToSignin();
    } else {
      alert("로그인 중 문제가 발생했습니다.");
      moveToSignin();
    }
  }, [searchParams, moveToSignupWithOauth, moveToSignin]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Loading...</h2>
      <p>잠시 후 다시 시도해주세요.</p>
    </div>
  );
};

export default OAuthRedirectFailurePage;
