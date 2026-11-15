// หน้า Login/Register/Forgot Password — สลับ form ได้ใน component เดียว เชื่อมกับ Supabase Auth
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import kuwinImage from '../assets/KUWIN.png'
import { UserIcon, MailBadgeIcon, Lock, Loader2Icon, Globe, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

type Mode = 'login' | 'register' | 'forgot'

// ข้อความที่เปลี่ยนตามโหมด
const TITLE: Record<Mode, string> = {
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    forgot: 'ลืมรหัสผ่าน',
}
const SUBMIT_LABEL: Record<Mode, string> = {
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    forgot: 'ส่งลิงก์รีเซ็ตรหัสผ่าน',
}

const Login = () => {
    const [mode, setMode] = useState<Mode>('login')
    const [resetEmailSent, setResetEmailSent] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const { login, register, resetPasswordForEmail } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (mode === 'forgot') {
                // ----- Forgot Password (ส่งลิงก์รีเซ็ตรหัสผ่านทางอีเมล) -----
                const { error } = await resetPasswordForEmail(email)
                if (error) {
                    toast.error(error)
                } else {
                    setResetEmailSent(true)
                    toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว!')
                }
            } else if (mode === 'login') {
                // ----- Login -----
                const { error } = await login(email, password)
                if (error) {
                    toast.error(error)
                } else {
                    toast.success('เข้าสู่ระบบสำเร็จ!')
                    navigate('/home')
                }
            } else {
                // ----- Register -----
                if (!name.trim()) {
                    toast.error('กรุณากรอกชื่อ-นามสกุล')
                    return
                }
                const { error } = await register(email, password, name)
                if (error) {
                    toast.error(error)
                } else {
                    toast.success('สมัครสมาชิกสำเร็จ! เข้าสู่ระบบได้เลย')
                    setMode('login')
                    setPassword("")
                }
            }
        } catch {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        } finally {
            setLoading(false)
        }
    }

    const handleBackToLogin = () => {
        setMode('login')
        setResetEmailSent(false)
    }

    return (
        <div className="min-h-screen flex">
            {/*ซ้าย*/}
            <div className="lg:flex lg:w-1/2 bg-app-green relative items-center justify-center">
                <img src={kuwinImage} alt="KU" className="absolute inset-0 w-full h-full object-cover object-center opacity-10" />
                <div className="relative text-center px-[48px]">
                    <h2 className="text-[36px] font-bold text-white mb-[16px]">ยินดีต้อนรับเข้าสู่เว็บ</h2>
                    <p className="text-white/50 font-semibold text-[20px] max-w-[384px] mx-auto">เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน</p>
                </div>
            </div>
            {/*ขวา */}
            <div className="flex-1 flex-center px-[16px] py-[48px] bg-app-cream">
                <div className="w-full max-w-md">
                    {/*หัว*/}
                    <div className="text-center mb-[32px]">
                        <Link to="/" className="inline-flex items-center gap-[9px] mb-[24px]">
                            <Globe className="size-[32px] text-app-green" />
                            <span className="text-[24px] font-semibold text-app-green">Translate</span>
                        </Link>
                        <h1 className="text-[36px] font-bold text-app-green mb-[8px]">{TITLE[mode]}</h1>
                        {mode === 'forgot' ? (
                            <p className="text-[14px] text-light">
                                กรอกอีเมลที่ใช้สมัครสมาชิกเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน
                            </p>
                        ) : (
                            <p className="text-[14px] text-light">
                                {mode === 'login' ? "ไม่มีสมาชิก?" : "มีสมาชิกแล้ว"}
                                <button
                                    type="button"
                                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                    className="text-red-500 ml-1 font-semibold hover:text-red-600 transition-colors"
                                >
                                    {mode === 'login' ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
                                </button>
                            </p>
                        )}
                    </div>

                    {/* กรณีส่งอีเมลรีเซ็ตรหัสผ่านสำเร็จ */}
                    {resetEmailSent ? (
                        <div className="bg-white p-[24px] rounded-[16px] border border-gray-300 text-center space-y-[16px]">
                            <CheckCircle2 className="size-[48px] text-app-success mx-auto" />
                            <h3 className="text-[18px] font-semibold text-app-text">ส่งอีเมลเรียบร้อยแล้ว!</h3>
                            <p className="text-[14px] text-app-text-light">
                                เราได้ส่งลิงก์รีเซ็ตรหัสผ่านใหม่ไปที่ <span className="font-semibold text-app-green">{email}</span> กรุณาตรวจสอบกล่องจดหมาย (รวมถึงจดหมายขยะ และ Spam)
                            </p>
                            <div className="pt-[8px] flex flex-col gap-[8px]">
                                <button
                                    type="button"
                                    onClick={() => setResetEmailSent(false)}
                                    className="text-[14px] text-red-500 font-semibold hover:text-red-600 "
                                >
                                    ไม่ได้รับอีเมล? ส่งอีกครั้ง
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBackToLogin}
                                    className="inline-flex items-center justify-center gap-[6px] text-[14px] text-gray-500 hover:text-gray-700 mt-[4px]"
                                >
                                    <ArrowLeft className="size-[16px]" />
                                    กลับไปหน้าเข้าสู่ระบบ
                                </button>
                            </div>
                        </div>
                    ) : (
                        /*ฟอร์ม */
                        <form onSubmit={handleSubmit} className="space-y-[20px] mt-[24px]">
                            {mode === 'register' && (
                                <label className="text-[14px] flex flex-col gap-[4px]">
                                    ชื่อ-นามสกุล
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-[16px]" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="กรอกชื่อของคุณ"
                                            className="w-full pl-[44px] pr-[16px] py-[12px] text-[14px] bg-white
                                            rounded-[12px] border not-focus:border-gray-300" />

                                    </div>
                                </label>
                            )}
                            <label className="text-[14px] flex flex-col gap-[4px]">
                                Email
                                <div className="relative">
                                    <MailBadgeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-[16px]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="you@gmail.com"
                                        className="w-full pl-[44px] pr-[16px] py-[12px] text-[14px] bg-white
                                            rounded-[12px] border not-focus:border-gray-300" />
                                </div>
                            </label>
                            {mode !== 'forgot' && (
                                <label className="text-[14px] flex flex-col gap-[4px]">
                                    <div className="flex items-center justify-between">
                                        <span>Password</span>
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => setMode('forgot')}
                                                className="text-[12px] font-medium text-red-500 hover:text-red-600 hover:underline transition-colors"
                                            >
                                                ลืมรหัสผ่าน?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-[16px]" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="******"
                                            className="w-full pl-[44px] pr-[16px] py-[12px] text-[14px] bg-white
                                                rounded-[12px] border not-focus:border-gray-300" />
                                    </div>
                                </label>
                            )}
                            <button type="submit" disabled={loading} className="flex-center w-full py-[12px] 
                            bg-app-green text-white font-semibold rounded-[14px] hover:bg-app-green-light
                            ">
                                {loading ? <Loader2Icon className="animate-spin" /> : SUBMIT_LABEL[mode]}
                            </button>

                            {mode === 'forgot' ? (
                                <div className="text-center pt-[4px]">
                                    <button
                                        type="button"
                                        onClick={handleBackToLogin}
                                        className="inline-flex items-center gap-[6px] text-[14px] text-app-text-light hover:text-app-text"
                                    >
                                        <ArrowLeft className="size-[16px]" />
                                        กลับไปหน้าเข้าสู่ระบบ
                                    </button>
                                </div>
                            ) : (
                                /* ข้ามไปใช้แปลภาษาโดยไม่ login (ไม่บันทึกประวัติ) */
                                <div className="text-center pt-[4px]">
                                    <Link
                                        to="/home"
                                        className="text-[14px] text-app-text-light hover:text-app-text hover:underline"
                                    >
                                        ใช้งานแปลภาษาโดยไม่เข้าสู่ระบบ →
                                    </Link>
                                    <p className="text-[12px] text-light mt-[4px]">(จะไม่มีการบันทึกประวัติการแปล)</p>
                                </div>
                            )}
                        </form>
                    )}
                </div>

            </div>

        </div>
    )
}

export default Login
