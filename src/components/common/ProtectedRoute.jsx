import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
export default function ProtectedRoute({ children }) {
  // Token 존재 확인
  const token = useSelector((state) => state.user.token);

  // 값이 존재하면 접근 차단 → 다른 페이지로 이동
  if (token) {
    return <Navigate to="/" replace />; // 홈으로 리다이렉트
  }

  // 값이 없으면 원래 페이지 렌더
  return children;
}
