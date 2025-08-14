import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import SupportIcon from "@mui/icons-material/HelpOutline";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export const NAVIGATOR = [
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
      { title: "Notice", segment: "notice", pattern: "support/notice" },
    ],
  },
  { kind: "divider" },
  {
    title: "Admin",
    icon: <AdminPanelSettingsIcon />,
    segment: "admin",
    children: [
      { title: "Overview", segment: "overview", pattern: "admin/overview" },
      { title: "Report", segment: "report", pattern: "admin/report" },
      { title: "User List", segment: "user", pattern: "admin/user" },
    ],
  },
];
