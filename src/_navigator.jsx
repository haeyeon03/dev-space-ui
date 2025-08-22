import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import SupportIcon from "@mui/icons-material/HelpOutline";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export const USER_NAVIGATOR = [
  { segment: "", title: "News Feed", icon: <DashboardIcon />, pattern: "/" },
  { kind: "divider" },
  {
    title: "Board",
    icon: <ArticleIcon />,
    segment: "board",
    pattern: "board{/:id}*",
  },
  {
    title: "Support",
    icon: <SupportIcon />,
    segment: "support",
    children: [
      { title: "FAQ", segment: "faq", pattern: "support/faq" },
      { title: "Inquiry", segment: "inquiry", pattern: "support/inquiry" },
    ],
  },
];

export const ADMIN_NAVIGATOR = [
  {
    title: "Admin Overview",
    icon: <AdminPanelSettingsIcon />,
    segment: "admin/overview",
    pattern: "/admin/overview",
  },
  {
    title: "User List",
    icon: <AdminPanelSettingsIcon />,
    segment: "admin/user",
    pattern: "/admin/user",
  },
  // {
  //   title: "Report",
  //   icon: <AdminPanelSettingsIcon />,
  //   segment: "admin/report",
  //   pattern: "/admin/report",
  // },
];
