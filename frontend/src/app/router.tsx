import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { LoginModal } from '../components/LoginModal'
import { FullscreenLayout } from '../components/FullscreenLayout'
import { PublicLayout } from '../components/PublicLayout'
import { AuthenticatedLayout } from '../components/AuthenticatedLayout'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { GuestRoute } from '../features/auth/components/GuestRoute'
import { AdminRoute } from '../features/auth/components/AdminRoute'
import { HomeRoute } from './HomeRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { CourseReviewPage } from '../features/course-review/pages/CourseReviewPage'
import { MyCoursesPage } from '../features/my-courses/pages/MyCoursesPage'
import { ArchivedCoursesPage } from '../features/my-courses/pages/ArchivedCoursesPage'
import { AddCoursePage } from '../features/my-courses/pages/AddCoursePage'
import { SharePreviewPage } from '../features/sharing/pages/SharePreviewPage'
import { SharedCoursesPage } from '../features/sharing/pages/SharedCoursesPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage'
import { AdminCatalogPage } from '../features/admin/pages/AdminCatalogPage'
import { WorkspacePage } from '../features/workspace/pages/WorkspacePage'
import { ProgrammeRoutePage } from '../features/public-library/pages/ProgrammeRoutePage'
import { useAuthStore } from '../stores/authStore'

function AppRoutes() {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/programmes/:id" element={<ProgrammeRoutePage />} />
          <Route path="/share/:token" element={<SharePreviewPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        <Route element={<FullscreenLayout />}>
          <Route path="/courses/:courseId/review" element={<CourseReviewPage />} />
        </Route>

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<FullscreenLayout />}>
            <Route path="/workspace/:userCourseId" element={<WorkspacePage />} />
          </Route>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/my-courses/archived" element={<ArchivedCoursesPage />} />
            <Route path="/add-course" element={<AddCoursePage />} />
            <Route path="/shared-courses" element={<SharedCoursesPage />} />
            <Route path="/settings" element={<ProfilePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/catalog" element={<AdminCatalogPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LoginModal />
    </>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
