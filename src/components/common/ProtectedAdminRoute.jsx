import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const role = useSelector((state) => state.user.role);

  if (role !== "ADMIN") return <Navigate to="/" replace />;

  return children;
}
