import { api } from "../api/api-client";
import { useDispatch } from "react-redux";
import { clearUser } from "../store/user-slice";

const useAuth = () => {
  const dispatch = useDispatch();
  const signOut = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    } finally {
      dispatch(clearUser());
    }
  };
  return {
    signOut,
  };
};
export default useAuth;
