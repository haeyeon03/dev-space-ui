/* 오른쪽 상단 아이콘 */
import * as React from "react";
import Stack from "@mui/material/Stack";
import { ThemeSwitcher } from "@toolpad/core/DashboardLayout";
import { Account } from "@toolpad/core/Account";

export default function ToolbarActions() {
  const spacing = 1; // 메뉴 간격
  return (
    <Stack direction="row" alignItems="center" spacing={spacing}>
      <ThemeSwitcher />
      <Account />
    </Stack>
  );
}
