import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import SupportIcon from "@mui/icons-material/HelpOutline";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";

export const USER_NAVIGATOR = [
  { segment: "", title: "뉴스 피드", icon: <DashboardIcon />, pattern: "/" },
  { kind: "divider" },
  {
    title: "자유 게시판",
    icon: <ArticleIcon />,
    segment: "board",
    pattern: "board{/:id}*",
  },
  { kind: "divider" },
  {
    title: "공지사항",
    icon: <SupportIcon />,
    segment: "support",
    children: [
      { title: "FAQ", segment: "faq", pattern: "support/faq" },
      { title: "1:1 문의", segment: "inquiry", pattern: "support/inquiry" },
    ],
  },
  { kind: "divider" },
  {
    title: "내 정보",
    icon: <PersonIcon />,
    segment: "mypage",
    pattern: "/mypage",
  },
];

export const ADMIN_NAVIGATOR = [
  {
    title: "대시보드",
    icon: <AdminPanelSettingsIcon />,
    segment: "admin/overview",
    pattern: "/admin/overview",
  },
  {
    title: "유저 정보 관리",
    icon: <AdminPanelSettingsIcon />,
    segment: "admin/user",
    pattern: "/admin/user",
  },
  // {
  //   title: "신고 관리",
  //   icon: <AdminPanelSettingsIcon />,
  //   segment: "admin/report",
  //   pattern: "/admin/report",
  // },
];
