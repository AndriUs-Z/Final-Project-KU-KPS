import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Loader2Icon } from "lucide-react"

const ProtectedRoute = () => {
    const { user, loading } = useAuth()

    // กำลังโหลด session — แสดง loading
    if (loading) {
        return (
            <div className="min-h-screen flex-center">
                <Loader2Icon className="size-8 animate-spin text-app-green" />
            </div>
        )
    }

    // ยังไม่ login — redirect ไปหน้า login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export default ProtectedRoute