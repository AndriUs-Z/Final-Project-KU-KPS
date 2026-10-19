import { useEffect, useState } from "react"
import {
    Users, FileText, TrendingUp, ArrowRightLeft, Activity,
} from "lucide-react"
import Navbar from "../components/Navbar"
import { supabase } from "../lib/supabase"
import PendingWordsSection from "../components/admin/PendingWordsSection"
import RetrainSection from "../components/admin/RetrainSection"
import type { DashboardSummary } from "../types/admin"

// ── StatCard ───────────────────────────────────────────────
const StatCard = ({
    icon: Icon, label, value, sub, color,
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

// ── Page ───────────────────────────────────────────────────
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

    const fetchSummary = async () => {
        setLoading(true)
        const { data: histories, error } = await supabase
            .from("translation_history")
            .select("user_id, word, translate, direction, translated_at")

        if (error || !histories) {
            if (error) console.error("fetchSummary error:", error)
            setLoading(false)
            return
        }

        const totalInputChars = histories.reduce((sum, h) => sum + (h.word?.length ?? 0), 0)
        const totalOutputChars = histories.reduce((sum, h) => sum + (h.translate?.length ?? 0), 0)
        const thToEn = histories.filter(h => h.direction === "th-en").length
        const enToTh = histories.filter(h => h.direction === "en-th").length
        const uniqueUsers = new Set(histories.map(h => h.user_id).filter(Boolean)).size

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

    useEffect(() => { fetchSummary() }, [])

    const fmtNum = (n: number) => n.toLocaleString("th-TH")
    const pct = (part: number) =>
        summary.total_translations
            ? Math.round((part / summary.total_translations) * 100)
            : 0

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
                                <p className="text-white/70 mt-1 text-sm">ภาพรวมการใช้งานระบบแปลภาษา</p>
                            </div>
                        </div>
                        <p className="text-white/50 text-xs mt-3">
                            อัปเดตล่าสุด: {lastRefresh.toLocaleTimeString("th-TH")}
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <StatCard icon={Users} label="จำนวนผู้ใช้ทั้งหมด" value={loading ? "..." : fmtNum(summary.total_users)} sub="คนที่เคยใช้งาน" color="bg-app-green" />
                        <StatCard icon={FileText} label="การแปลทั้งหมด" value={loading ? "..." : fmtNum(summary.total_translations)} sub="ครั้งที่แปลสำเร็จ" color="bg-emerald-600" />
                        <StatCard icon={TrendingUp} label="ตัวอักษรที่ Input ทั้งหมด" value={loading ? "..." : fmtNum(summary.total_input_chars)} sub="ตัวอักษร (ข้อความต้นฉบับ)" color="bg-teal-600" />
                        <StatCard icon={Activity} label="ตัวอักษรที่ Output ทั้งหมด" value={loading ? "..." : fmtNum(summary.total_output_chars)} sub="ตัวอักษร (ผลแปล)" color="bg-cyan-600" />
                        <StatCard icon={ArrowRightLeft} label="ไทย → อังกฤษ" value={loading ? "..." : fmtNum(summary.th_to_en)} sub={`คิดเป็น ${pct(summary.th_to_en)}%`} color="bg-lime-600" />
                        <StatCard icon={ArrowRightLeft} label="อังกฤษ → ไทย" value={loading ? "..." : fmtNum(summary.en_to_th)} sub={`คิดเป็น ${pct(summary.en_to_th)}%`} color="bg-green-700" />
                    </div>

                    {/* Sections */}
                    <PendingWordsSection />
                    <RetrainSection />

                </div>
            </main>
        </>
    )
}

export default AdminDashboard
