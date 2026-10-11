import { useEffect, useState } from "react"
import { Users, FileText, TrendingUp, ArrowRightLeft, Activity, RefreshCw } from "lucide-react"
import Navbar from "../components/Navbar"
import { supabase } from "../lib/supabase"

// -------------------------------------------------------
// Types
// -------------------------------------------------------
interface DashboardSummary {
    total_users: number
    total_translations: number
    total_input_chars: number
    total_output_chars: number
    th_to_en: number
    en_to_th: number
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------
const AdminDashboard = () => {
    const [summary, setSummary] = useState<DashboardSummary>({
        total_users: 0,
        total_translations: 0,
        total_input_chars: 0,
        total_output_chars: 0,
        th_to_en: 0,
        en_to_th: 0,
    })
    const [loading, setLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    // ดึงข้อมูลจาก Supabase
    const fetchData = async () => {
        setLoading(true)

        // ดึงประวัติการแปลทั้งหมด
        const { data: histories, error } = await supabase
            .from("translation_history")
            .select("user_id, input_text, output_text, direction, translated_at")

        if (error || !histories) {
            setLoading(false)
            return
        }

        // --- คำนวณ Summary ---
        const totalInputChars = histories.reduce((sum, h) => sum + (h.input_text?.length ?? 0), 0)
        const totalOutputChars = histories.reduce((sum, h) => sum + (h.output_text?.length ?? 0), 0)
        const thToEn = histories.filter((h) => h.direction === "th-en").length
        const enToTh = histories.filter((h) => h.direction === "en-th").length
        const uniqueUsers = new Set(histories.map((h) => h.user_id)).size

        setSummary({
            total_users: uniqueUsers,
            total_translations: histories.length,
            total_input_chars: totalInputChars,
            total_output_chars: totalOutputChars,
            th_to_en: thToEn,
            en_to_th: enToTh,
        })

        setLastRefresh(new Date())
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    // จัดรูปแบบตัวเลข
    const fmtNum = (n: number) => n.toLocaleString("th-TH")

    // -------------------------------------------------------
    // Stat Card
    // -------------------------------------------------------
    const StatCard = ({
        icon: Icon,
        label,
        value,
        sub,
        color,
    }: {
        icon: React.ElementType
        label: string
        value: string | number
        sub?: string
        color: string
    }) => (
        <div className="bg-white rounded-2xl p-5 shadow-md border border-zinc-100 flex items-start gap-4 hover:shadow-lg transition-shadow">
            <div className={`size-12 rounded-xl flex-center shrink-0 ${color}`}>
                <Icon className="size-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-zinc-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-zinc-800 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    )

    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-16">
                {/* Header */}
                <div className="bg-app-green text-white py-10 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                                <p className="text-white/70 mt-1 text-sm">
                                    ภาพรวมการใช้งานระบบแปลภาษา
                                </p>
                            </div>
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                                รีเฟรช
                            </button>
                        </div>
                        <p className="text-white/50 text-xs mt-3">
                            อัปเดตล่าสุด: {lastRefresh.toLocaleTimeString("th-TH")}
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                        <StatCard
                            icon={Users}
                            label="จำนวนผู้ใช้ทั้งหมด"
                            value={loading ? "..." : fmtNum(summary.total_users)}
                            sub="คนที่เคยใช้งาน"
                            color="bg-app-green"
                        />
                        <StatCard
                            icon={FileText}
                            label="การแปลทั้งหมด"
                            value={loading ? "..." : fmtNum(summary.total_translations)}
                            sub="ครั้งที่แปลสำเร็จ"
                            color="bg-emerald-600"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="ตัวอักษรที่ Input ทั้งหมด"
                            value={loading ? "..." : fmtNum(summary.total_input_chars)}
                            sub="ตัวอักษร (ข้อความต้นฉบับ)"
                            color="bg-teal-600"
                        />
                        <StatCard
                            icon={Activity}
                            label="ตัวอักษรที่ Output ทั้งหมด"
                            value={loading ? "..." : fmtNum(summary.total_output_chars)}
                            sub="ตัวอักษร (ผลแปล)"
                            color="bg-cyan-600"
                        />
                        <StatCard
                            icon={ArrowRightLeft}
                            label="ไทย → อังกฤษ"
                            value={loading ? "..." : fmtNum(summary.th_to_en)}
                            sub={`คิดเป็น ${summary.total_translations ? Math.round((summary.th_to_en / summary.total_translations) * 100) : 0}%`}
                            color="bg-lime-600"
                        />
                        <StatCard
                            icon={ArrowRightLeft}
                            label="อังกฤษ → ไทย"
                            value={loading ? "..." : fmtNum(summary.en_to_th)}
                            sub={`คิดเป็น ${summary.total_translations ? Math.round((summary.en_to_th / summary.total_translations) * 100) : 0}%`}
                            color="bg-green-700"
                        />
                    </div>

                </div>
            </main>
        </>
    )
}

export default AdminDashboard
