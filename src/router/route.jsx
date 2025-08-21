import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "../App"; // Toolpad AppProvider + Outlet
import Layout from "../layouts/dashboard"; // 공통 레이아웃
import LoadingPage from "../pages/common/LoadingPage";
import ProtectedRoute from "../components/common/ProtectedRoute";
import { Outlet } from "react-router-dom";

// Lazy 로딩 + Suspense 헬퍼
const lazyPage = (importFn) => {
  const Component = lazy(importFn);
  return (
    <Suspense fallback={<LoadingPage />}>
      <Component />
    </Suspense>
  );
};

// Pages
const NewsListPage = () => lazyPage(() => import("../pages/news/NewsListPage")); // 기본 대시보드
const NewsViewPage = () => lazyPage(() => import("../pages/news/NewsViewPage"));
const BoardListPage = () =>
  lazyPage(() => import("../pages/board/BoardListPage"));
const BoardViewPage = () =>
  lazyPage(() => import("../pages/board/BoardViewPage"));
const BoardWritePage = () =>
  lazyPage(() => import("../pages/board/BoardWritePage"));
const BoardEditPage = () =>
  lazyPage(() => import("../pages/board/BoardEditPage"));
const FaqPage = () => lazyPage(() => import("../pages/support/FaqPage"));
const InquiryPage = () =>
  lazyPage(() => import("../pages/support/InquiryPage"));
const MyInfoViewPage = () =>
  lazyPage(() => import("../pages/mypage/MyInfoViewPage"));
const MyInfoWritePage = () =>
  lazyPage(() => import("../pages/mypage/MyInfoWritePage"));
const SignInPage = () => lazyPage(() => import("../pages/auth/SignInPage"));
const SignUpPage = () => lazyPage(() => import("../pages/auth/SignUpPage"));
const AdminOverviewPage = () =>
  lazyPage(() => import("../pages/admin/AdminOverviewPage"));
const AdminReportListPage = () =>
  lazyPage(() => import("../pages/admin/AdminReportListPage"));
const AdminUserListPage = () =>
  lazyPage(() => import("../pages/admin/AdminUserListPage"));
const AdminUserWritePage = () =>
  lazyPage(() => import("../pages/admin/AdminUserWritePage"));

const root = createBrowserRouter([
  {
    element: <App />, // Toolpad Provider
    children: [
      {
        path: "/",
        element: <Layout />, // Toolpad Layout
        children: [
          // 뉴스(메인)
          { index: true, element: <NewsListPage /> },
          { path: "news/:id", element: <NewsViewPage /> },

          // 게시판
          {
            path: "board",
            children: [
              { index: true, element: <BoardListPage /> },
              { path: ":id", element: <BoardViewPage /> },
              { path: "write", element: <BoardWritePage /> },
              { path: "edit/:id", element: <BoardEditPage /> },
            ],
          },

          // 고객 지원
          {
            path: "support",
            children: [
              { path: "faq", element: <FaqPage /> },
              { path: "inquiry", element: <InquiryPage /> },
            ],
          },

          // 마이페이지
          {
            path: "mypage",
            children: [
              { index: true, element: <MyInfoViewPage /> },
              { path: "write", element: <MyInfoWritePage /> },
            ],
          },

          // 어드민

          {
            path: "admin",
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { path: "overview", element: <AdminOverviewPage /> },
              { path: "report", element: <AdminReportListPage /> },
              { path: "user", element: <AdminUserListPage /> },
              { path: "user/write", element: <AdminUserWritePage /> },
            ],
          },
          // 인증 페이지
          {
            path: "signin",
            element: (
              <ProtectedRoute>
                <SignInPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "signup",
            element: (
              <ProtectedRoute>
                <SignUpPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
]);

export default root;
