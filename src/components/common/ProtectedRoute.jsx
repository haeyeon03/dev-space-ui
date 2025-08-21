import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.user.token);

  // 로그인 되어 있으면 접근 차단 → 홈으로 이동
  if (token) return <Navigate to="/" replace />;

  // 로그인 안되어 있으면 렌더
  return children;
}
