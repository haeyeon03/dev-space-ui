/* 왼쪽 사이드 바 하단 사용자 정보 표시 */
import * as React from "react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { AccountPreview } from "@toolpad/core/Account";

export default function AccountSidebarPreview(props) {
  const { handleClick, open, mini } = props;
  return (
    <Stack direction="column" p={0}>
      <Divider />
      <AccountPreview
        variant={mini ? "condensed" : "expanded"}
        handleClick={handleClick}
        open={open}
      />
    </Stack>
  );
}
