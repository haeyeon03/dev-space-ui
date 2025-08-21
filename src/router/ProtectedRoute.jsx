import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectSession } from "../store/user-slice";

export default function ProtectedRoute({ children, requiredRole }) {
  const session = useSelector(selectSession);
  const user = session?.user;

  if (!user) {
    // 1. 로그인 안 된 경우
    return <Navigate to="/signin" replace />;
  }

  if (requiredRole === "ADMIN" && user.role !== "ADMIN") {
    // 3. 로그인 했지만 일반 사용자일 때
    return <Navigate to="/" replace />;
  }

  // 2. 관리자 or 권한 조건 없는 경우
  return children;
}
