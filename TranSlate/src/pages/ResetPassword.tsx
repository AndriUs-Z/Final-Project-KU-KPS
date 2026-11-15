// หน้าตั้งรหัสผ่านใหม่ — ผู้ใช้จะถูก redirect มาหน้านี้หลังจากคลิกลิงก์รีเซ็ตรหัสผ่านในอีเมล
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import kuwinImage from '../assets/KUWIN.png'
import { Lock, Loader2Icon, Globe, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ResetPassword = () => {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const { updatePassword } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // ความยาวขั้นต่ำเช็คด้วย minLength ของ input แล้ว
        if (password !== confirmPassword) {
            toast.error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
            return
        }

        setLoading(true)
        try {
            const { error } = await updatePassword(password)
            if (error) {
                toast.error(error)
                return
            }
            // คลิกลิงก์จากอีเมล = Supabase login ให้แล้ว → ไปหน้าแปลภาษาได้เลย
            toast.success('เปลี่ยนรหัสผ่านสำเร็จ!')
            navigate('/home')
        } catch {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* ซ้าย */}
            <div className="hidden lg:flex lg:w-1/2 bg-app-green relative items-center justify-center">
                <img
                    src={kuwinImage}
                    alt="KU"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-10"
                />
                <div className="relative text-center px-[48px]">
                    <h2 className="text-[36px] font-bold text-white mb-[16px]">ตั้งรหัสผ่านใหม่</h2>
                    <p className="text-white/50 font-semibold text-[20px] max-w-[348px] mx-auto">
                        กำหนดรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชีคุณ
                    </p>
                </div>
            </div>

            {/* ขวา */}
            <div className="flex-1 flex-center px-[16px] py-[48px] bg-app-cream">
                <div className="w-full max-w-[448px]">
                    {/* หัว */}
                    <div className="text-center mb-[32px]">
                        <Link to="/" className="inline-flex items-center gap-[9px] mb-[24px]">
                            <Globe className="size-[32px] text-app-green" />
                            <span className="text-[24px] font-semibold text-app-green">Translate</span>
                        </Link>
                        <h1 className="text-[36px] font-bold text-app-green mb-[8px]">ตั้งรหัสผ่านใหม่</h1>
                        <p className="text-[14px] text-light">กรุณากรอกรหัสผ่านใหม่ของคุณด้านล่าง</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-[20px] mt-[24px]">
                        <label className="text-[14px] flex flex-col gap-[4px]">
                            รหัสผ่านใหม่
                            <div className="relative">
                                <Lock className="absolute left-[12px] top-1/2 -translate-y-1/2 size-[16px]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    className="w-full pl-[44px] pr-[16px] py-[12px] text-[14px] bg-white rounded-[12px] border border-app-border focus:border-app-green"
                                />
                            </div>
                        </label>

                        <label className="text-[14px] flex flex-col gap-[4px]">
                            ยืนยันรหัสผ่านใหม่
                            <div className="relative">
                                <Lock className="absolute left-[12px] top-1/2 -translate-y-1/2 size-[16px] text-light" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                    className="w-full pl-[44px] pr-[16px] py-[12px] text-[14px] bg-white rounded-[12px] border border-app-border focus:border-app-green"
                                />
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-center w-full py-[12px] bg-app-green text-white font-semibold rounded-[12px] hover:bg-green-900 "
                        >
                            {loading ? <Loader2Icon className="animate-spin" /> : 'บันทึกรหัสผ่านใหม่'}
                        </button>

                        <div className="text-center pt-[8px]">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-[6px] text-[14px] text-app-green"
                            >
                                <ArrowLeft className="size-[16px]" />
                                กลับไปหน้าเข้าสู่ระบบ
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
