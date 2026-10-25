// Route Guard ชั้นที่ 2 — ตรวจทั้ง login + role === admin ถ้าไม่ใช่ redirect ไป /home
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Loader2Icon } from "lucide-react"

// Guard route: ต้อง login และต้องมี role === 'admin'
const AdminRoute = () => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex-center">
                <Loader2Icon className="size-8 animate-spin text-app-green" />
            </div>
        )
    }

    // ยังไม่ login → ไปหน้า login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // login แล้วแต่ไม่ใช่ admin → กลับหน้า home
    if (user.role !== 'admin') {
        return <Navigate to="/home" replace />
    }

    return <Outlet />
}

export default AdminRoute
