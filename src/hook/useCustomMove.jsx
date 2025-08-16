import { useNavigate } from "react-router-dom";

const useCustomMove = () => {
  const navigate = useNavigate();

  const moveToSignIn = () => {
    navigate("/signin");
  };

  const moveToSignUp = () => {
    navigate("/signup");
  };

  const moveToNewsList = () => {
    navigate("/");
  };

  return {
    moveToSignIn,
    moveToSignUp,
    moveToNewsList,
  };
};
export default useCustomMove;
