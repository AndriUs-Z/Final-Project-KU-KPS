import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, MapPin, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const location = useLocation()
    const navigate = useNavigate()

    const { user, logout } = useAuth()

    // ปิด dropdown เมื่อคลิกข้างนอก
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // หา initials จากชื่อ (ใช้ 2 ตัวแรก)
    const getInitials = (name: string) => {
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return parts[0].charAt(0) + parts[1].charAt(0)
        }
        return name.substring(0, 2)
    }

    const isActive = (path: string) => location.pathname === path

    const handleLogout = async () => {
        setIsDropdownOpen(false)
        await logout()
        toast.success('ออกจากระบบแล้ว')
        navigate('/login')
    }

    // ถ้ายังไม่ login ไม่แสดง navbar
    if (!user) return null

    return (
        <nav className="bg-white sticky top-0 z-50 py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center relative">

                {/* แท็บตรงกลาง */}
                <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden">
                    <Link
                        to="/home"
                        className={`px-6 py-2 text-sm font-medium transition-colors rounded-full ${isActive('/home')
                            ? 'bg-app-green text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        แปลภาษา
                    </Link>
                    <Link
                        to="/history"
                        className={`px-6 py-2 text-sm font-medium transition-colors rounded-full ${isActive('/history')
                            ? 'bg-app-green text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        ประวัติ
                    </Link>
                </div>

                {/* User avatar — ขวาสุด */}
                <div className="absolute right-4 sm:right-6 lg:right-8" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1.5 p-1 cursor-pointer"
                    >
                        <div className="size-9 rounded-full bg-app-green text-white flex-center font-semibold text-sm">
                            {getInitials(user.full_name)}
                        </div>
                        {isDropdownOpen ? (
                            <ChevronUp className="size-3.5 text-zinc-500" />
                        ) : (
                            <ChevronDown className="size-3.5 text-zinc-500" />
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-fade-in">
                            {/* ข้อมูลผู้ใช้ */}
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-900">
                                    {user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {user.email}
                                </p>
                            </div>

                            {/* เมนู */}
                            <div className="py-1">

                                {user.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className="dropdown-link !text-app-green"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <MapPin className="size-4" />
                                        <span>Admin Panel</span>
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="dropdown-link w-full !text-app-green"
                                >
                                    <LogOut className="size-4" />
                                    <span>ออกจากระบบ</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </nav>
    )
}

export default Navbar