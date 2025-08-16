import { useNavigate } from "react-router-dom";

const useCustomMove = () => {
  const navigate = useNavigate();

  const moveToSignin = () => {
    navigate("/signin");
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
  };
};
export default useCustomMove;
