import { Outlet } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";

export default function Layout() {
  return (
    <DashboardLayout>
      <div style={{ padding: "40px" }}>
        <Outlet />
      </div>
    </DashboardLayout>
  );
}
