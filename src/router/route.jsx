import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Layout from "../layouts/dashboard";
import LoadingPage from "../pages/common/LoadingPage";
import ProtectedRoute from "../components/common/ProtectedRoute";
import ProtectedAdminRoute from "../components/common/ProtectedAdminRoute";
import { Outlet } from "react-router-dom";
import { Navigate } from "react-router-dom";

// Lazy helper
const lazyPage = (importFn) => {
  const Component = lazy(importFn);
  return (
    <Suspense fallback={<LoadingPage />}>
      <Component />
    </Suspense>
  );
};

// Pages
const NewsListPage = () => lazyPage(() => import("../pages/news/NewsListPage"));
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

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          // 뉴스
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

          // Admin 전용
          {
            path: "admin",
            element: (
              <ProtectedAdminRoute>
                <Outlet />
              </ProtectedAdminRoute>
            ),
            children: [
              { index: true, element: <Navigate to="overview" replace /> }, // ← 여기 추가
              { path: "overview", element: <AdminOverviewPage /> },
              { path: "report", element: <AdminReportListPage /> },
              { path: "user", element: <AdminUserListPage /> },
              { path: "user/:userId", element: <AdminUserWritePage /> },
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

export default router;
