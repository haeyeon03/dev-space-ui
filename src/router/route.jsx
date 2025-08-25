// router.jsx
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import App from "../App";
import Layout from "../layouts/dashboard";
import LoadingPage from "../pages/common/LoadingPage";
import ProtectedRoute from "../components/common/ProtectedRoute";
import ProtectedAdminRoute from "../components/common/ProtectedAdminRoute";
import AuthGuard from "../components/common/AuthGuard";
import RootRedirect from "../components/common/RootDirect"; // 역할: "/"에서만 role별 리다이렉트

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
const OAuthRedirectSuccessPage = () =>
  lazyPage(() => import("../pages/auth/OAuthRedirectSuccessPage"));
const OAuthRedirectFailurePage = () =>
  lazyPage(() => import("../pages/auth/OAuthRedirectFailurePage"));

const router = createBrowserRouter([
  {
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
    children: [
      {
        path: "/",
        element: <Layout />, // ✅ 여기서는 Layout만
        children: [
          { index: true, element: <RootRedirect /> }, // ✅ "/"에서만 실행

          // ✅ 유저 기본 진입 경로 명시
          { path: "news", element: <NewsListPage /> },
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

          // Admin (중첩 + index 리다이렉트)
          {
            path: "admin",
            element: (
              <ProtectedAdminRoute>
                <Outlet />
              </ProtectedAdminRoute>
            ),
            children: [
              { index: true, element: <Navigate to="overview" replace /> }, // /admin → /admin/overview
              { path: "overview", element: <AdminOverviewPage /> },
              { path: "report", element: <AdminReportListPage /> },
              { path: "user", element: <AdminUserListPage /> },
              { path: "user/:userId", element: <AdminUserWritePage /> },
            ],
          },

          // 인증
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
          {
            path: "oauth2/callback/success",
            element: <OAuthRedirectSuccessPage />,
          },
          {
            path: "oauth2/callback/failure",
            element: <OAuthRedirectFailurePage />,
          },
        ],
      },
    ],
  },
]);

export default router;
