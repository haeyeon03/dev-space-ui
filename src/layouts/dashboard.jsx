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
        toolbarActions: ToolbarActions,
        sidebarFooter: SidebarFooterAccount,
      }}
    >
      <Box sx={{ px: 20, py: 7 }}>
        <Outlet />
      </Box>
    </DashboardLayout>
  );
}
