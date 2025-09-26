import { ProtectedRoute } from "@/components/protected-route"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  )
}
