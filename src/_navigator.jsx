// _navigator.jsx
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import SupportIcon from "@mui/icons-material/HelpOutline";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export const getNavigator = (role) => {
  if (role === "ADMIN") {
    // 관리자 메뉴만
    return [
      { kind: "header", title: "Admin" },
      {
        title: "Overview",
        icon: <AdminPanelSettingsIcon />,
        segment: "overview",
        pattern: "admin/overview",
      },
      {
        title: "Report",
        icon: <AdminPanelSettingsIcon />,
        segment: "report",
        pattern: "admin/report",
      },
      {
        title: "User List",
        icon: <AdminPanelSettingsIcon />,
        segment: "user",
        pattern: "admin/user",
      },
    ];
  }

  // 로그인 X 혹은 일반 사용자 → 일반 메뉴
  return [
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
};
