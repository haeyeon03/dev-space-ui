import * as React from "react";
import { Outlet } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import Box from "@mui/material/Box";
import ToolbarActions from "../components/layout/ToolbarActions";
import SidebarFooterAccount from "../components/layout/SidebarFooterAccount";

export default function Layout() {
  return (
    <DashboardLayout
      slots={{
        toolbarActions: ToolbarActions, // 오른쪽 상단 툴바
        sidebarFooter: SidebarFooterAccount, // 사이드바 하단
      }}
    >
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </DashboardLayout>
  );
}
