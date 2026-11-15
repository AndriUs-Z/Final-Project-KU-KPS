// Navigation bar — แสดง tabs (แปลภาษา/ประวัติ) + user avatar dropdown + ลิงก์ไป Admin Panel (เฉพาะ admin)
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, MapPin, LogOut, User } from 'lucide-react'
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

    const isActive = (path: string) => location.pathname === path

    const handleLogout = async () => {
        setIsDropdownOpen(false)
        await logout()
        toast.success('ออกจากระบบแล้ว')
        navigate('/login')
    }

    // guest กดแท็บประวัติ → แจ้งเตือนแล้วพาไปหน้า login
    const handleHistoryClick = (e: React.MouseEvent) => {
        if (user) return
        e.preventDefault()
        toast.error('กรุณาเข้าสู่ระบบเพื่อดูประวัติการแปล')
        navigate('/login')
    }

    return (
        <nav className="bg-white sticky top-0 z-50 py-[12px]">
            <div className="max-w-[1920px] mx-auto px-[16px] flex items-center justify-center relative">

                {/* แท็บตรงกลาง */}
                <div className="flex items-center bg-white rounded-[18px] shadow-sm border border-gray-200 overflow-hidden">
                    <Link
                        to="/home"
                        className={`px-[24px] py-[8px] text-[14px] font-medium transition-colors rounded-[18px] ${isActive('/home')
                            ? 'bg-app-green text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        แปลภาษา
                    </Link>
                    <Link
                        to="/history"
                        onClick={handleHistoryClick}
                        className={`px-[24px] py-[8px] text-[14px] font-medium transition-colors rounded-[18px] ${isActive('/history')
                            ? 'bg-app-green text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        ประวัติ
                    </Link>
                </div>

                {/* guest — ปุ่มเข้าสู่ระบบ ขวาสุด */}
                {!user && (
                    <Link
                        to="/login"
                        className="absolute right-[16px] px-[16px] py-[8px] text-[14px] font-semibold text-white bg-app-green rounded-[18px] hover:opacity-90 transition-opacity"
                    >
                        เข้าสู่ระบบ
                    </Link>
                )}

                {/* User avatar — ขวาสุด */}
                {user && (
                <div className="absolute right-[16px]" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-[6px] p-[4px] cursor-pointer"
                    >
                        <div className="size-[36px] rounded-full bg-app-green text-white flex-center">
                            <User className="size-[20px]" />
                        </div>
                        {isDropdownOpen ? (
                            <ChevronUp className="size-[14px] text-zinc-500" />
                        ) : (
                            <ChevronDown className="size-[14px] text-zinc-500" />
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-[8px] w-[200px] bg-white rounded-[12px] shadow-lg border border-gray-200 py-[8px]">
                            {/* ข้อมูลผู้ใช้ */}
                            <div className="px-[16px] py-[12px] border-b border-gray-200">
                                <p className="text-[14px] font-semibold text-gray-900">
                                    {user.full_name}
                                </p>
                                <p className="text-[12px] text-gray-500 mt-[2px]">
                                    {user.email}
                                </p>
                            </div>

                            {/* เมนู */}
                            <div className="py-[4px]">

                                {user.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className="dropdown-link !text-app-green"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <MapPin className="size-[16px]" />
                                        <span>Admin Panel</span>
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="dropdown-link w-full !text-app-green"
                                >
                                    <LogOut className="size-[16px]" />
                                    <span>ออกจากระบบ</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                )}

            </div>
        </nav>
    )
}

export default Navbar