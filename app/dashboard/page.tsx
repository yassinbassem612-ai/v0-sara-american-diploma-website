import { ProtectedRoute } from "@/components/protected-route"
import { StudentDashboard } from "@/components/student-dashboard"

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="student">
      <StudentDashboard />
    </ProtectedRoute>
  )
}
