/* 왼쪽 사이드 바 하단 케밥 메뉴 */
import * as React from "react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import { AccountPopoverFooter, SignOutButton } from "@toolpad/core/Account";

export default function SidebarFooterAccountPopover() {
  return (
    <Stack direction="column">
      {/* <Typography variant="body2" mx={2} mt={1}>Menu Title</Typography> */}
      <MenuList>
        <MenuItem
          component="button"
          sx={{ justifyContent: "flex-start", width: "100%", columnGap: 2 }}
        >
          <ListItemText
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%",
            }}
            primary="My Page"
            // secondary="Sub Title"
          />
        </MenuItem>
      </MenuList>
      <Divider />
      <AccountPopoverFooter>
        <SignOutButton />
      </AccountPopoverFooter>
    </Stack>
  );
}
