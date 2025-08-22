import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function RootRedirect() {
  const role = useSelector((state) => state.user.role);

  if (role === "ADMIN") return <Navigate to="/admin/overview" replace />;
  return <Navigate to="/news" replace />;
}
