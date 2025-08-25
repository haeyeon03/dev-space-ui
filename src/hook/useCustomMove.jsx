import { useNavigate } from "react-router-dom";

const useCustomMove = () => {
  const navigate = useNavigate();

  const moveToSignin = () => {
    navigate("/signin");
  };

  const moveToSignupWithOauth = (key, oauthData) => {
    navigate("/signup", { state: { key, oauthData } });
  };

  const moveToSignup = () => {
    navigate("/signup");
  };
  const moveToNewsList = () => {
    navigate("/");
  };

  return {
    moveToSignin,
    moveToSignup,
    moveToNewsList,
    moveToSignupWithOauth,
  };
};
export default useCustomMove;
