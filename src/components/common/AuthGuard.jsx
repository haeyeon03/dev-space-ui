import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const token = useSelector((state) => state.user.token);
  // token이 ""일 때만 로그아웃으로 판단하여 자식 컴포넌트 리로드
  const renderKey = token === "" ? "out" : "in";

  return <div key={renderKey}>{children}</div>;
}
