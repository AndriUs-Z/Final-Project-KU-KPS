import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import kuwinImage from '../assets/KUWIN.png'
import { Link } from 'react-router-dom'
import { UserIcon, MailBadgeIcon, Lock, Loader2Icon, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'


const Login = () => {
    const [isLoginState, setIsLoginState] = useState(true)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const { login, register } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isLoginState) {
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
                    setLoading(false)
                    return
                }
                const { error } = await register(email, password, name)
                if (error) {
                    toast.error(error)
                } else {
                    toast.success('สมัครสมาชิกสำเร็จ! เข้าสู่ระบบได้เลย')
                    setIsLoginState(true)
                    setPassword("")
                }
            }
        } catch {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/*ซ้าย*/}
            <div className="hidden lg:flex lg:w-1/2 bg-app-green relative items-center justify-center">
                <img src={kuwinImage} alt="KU" className="absolute inset-0 w-full h-full object-cover object-center opacity-10" />
                <div className="relative text-center px-12">
                    <h2 className="text-4xl font-bold text-white mb-4">ยินดีต้อนรับเข้าสู่เว็บ</h2>
                    <p className="text-white/50 font-semibold text-xl max-w-sm mx-auto">เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน</p>
                </div>
            </div>
            {/*ขวา */}
            <div className="flex-1 flex-center px-4 py-12 bg-app-cream">
                <div className="w-full max-w-md">
                    {/*หัว*/}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 mb-6">
                            <Globe className="size-8 text-app-green" />
                            <span className="text-2xl font-semibold text-green">Translate</span>
                        </Link>
                        <h1 className="text-4xl font-bold text-green mb-2">
                            {isLoginState ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                        </h1>
                        <p className="text-sm text-light">
                            {isLoginState ? "ไม่มีสมาชิก?" : "มีสมาชิกแล้ว"}
                            <button onClick={() => setIsLoginState(!isLoginState)}
                                className="text-red-500 ml-1 font-semibold hover:text-red-600 transition-colors">
                                {isLoginState ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
                            </button>
                        </p>
                    </div>
                    {/*ฟอร์ม */}
                    <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                        {!isLoginState && (
                            <label className="text-sm flex flex-col gap-1">
                                ชื่อ-นามสกุล
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-light" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="กรอกชื่อของคุณ"
                                        className="w-full pl-11 pr-4 py-3 text-sm bg-white
                                        rounded-xl border not-focus:border-app-border
                                        transition-all" />

                                </div>
                            </label>
                        )}
                        <label className="text-sm flex flex-col gap-1">
                            Email
                            <div className="relative">
                                <MailBadgeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-light" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@gmail.com"
                                    className="w-full pl-11 pr-4 py-3 text-sm bg-white
                                        rounded-xl border not-focus:border-app-border
                                        transition-all" />
                            </div>
                        </label>
                        <label className="text-sm flex flex-col gap-1">
                            Password
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-light" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="******"
                                    className="w-full pl-11 pr-4 py-3 text-sm bg-white
                                        rounded-xl border not-focus:border-app-border
                                        transition-all" />
                            </div>
                        </label>
                        <button type="submit" disabled={loading} className="flex-center w-full py-3 
                        bg-green-950 text-white font-semibold rounded-xl hover:bg-green-900
                        transition-color disabled:opacity-50">
                            {loading ? <Loader2Icon className="animate-spin" /> :
                                isLoginState ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                        </button>
                    </form>
                </div>

            </div>

        </div>
    )
}

export default Login