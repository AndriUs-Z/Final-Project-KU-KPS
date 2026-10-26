// แสดงประวัติการแปลของผู้ใช้ที่ login — ดึงจากตาราง translation_history ใน Supabase
// + แสดงประวัติ feedback จากตาราง pending_words ที่ user ส่งไป พร้อมสถานะ
import { useState, useEffect } from "react"
import {
    Clock, Trash2, ChevronDown, ChevronUp,
    MessageSquare, CheckCircle2, XCircle, Loader2,
} from "lucide-react"
import Navbar from "../components/Navbar"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"

// โครงสร้างข้อมูลประวัติการแปล
interface TranslationHistory {
    id: number
    user_id: string
    word: string
    translate: string
    direction: "th-en" | "en-th"
    translated_at: string
}

// โครงสร้างข้อมูล feedback (pending_words)
interface FeedbackHistory {
    id: string
    user_id: string
    word: string
    translation: string
    context: string | null
    direction: "th-en" | "en-th"
    status: "pending" | "approved" | "rejected"
    rejected_reason: string | null
    submitted_at: string
    updated_at: string
}

// ── Status Badge Component ─────────────────────────────────
const StatusBadge = ({ status }: { status: FeedbackHistory["status"] }) => {
    const config = {
        pending: {
            bg: "bg-amber-50 border-amber-200 text-amber-700",
            icon: <Clock className="size-3" />,
            label: "รออนุมัติ",
        },
        approved: {
            bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
            icon: <CheckCircle2 className="size-3" />,
            label: "อนุมัติแล้ว",
        },
        rejected: {
            bg: "bg-red-50 border-red-200 text-red-600",
            icon: <XCircle className="size-3" />,
            label: "ปฏิเสธแล้ว",
        },
    }
    const { bg, icon, label } = config[status]
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bg}`}>
            {icon}
            {label}
        </span>
    )
}

// ── Main Component ─────────────────────────────────────────
const History = () => {
    const { user } = useAuth()

    // ── Translation History State ──────────────────────────
    const [history, setHistory] = useState<TranslationHistory[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [openTranslation, setOpenTranslation] = useState(true)

    // ── Feedback History State ─────────────────────────────
    const [feedbacks, setFeedbacks] = useState<FeedbackHistory[]>([])
    const [loadingFeedback, setLoadingFeedback] = useState(false)
    const [openFeedback, setOpenFeedback] = useState(true)
    

    // ── Fetch Translation History ──────────────────────────
    const fetchHistory = async () => {
        if (!user) return
        setLoadingHistory(true)

        const { data, error } = await supabase
            .from("translation_history")
            .select("*")
            .eq("user_id", user.id)
            .order("translated_at", { ascending: false })
            .limit(50)

        if (!error && data) {
            setHistory(data)
        }
        setLoadingHistory(false)
    }

    // ── Fetch Feedback History ─────────────────────────────
    const fetchFeedbacks = async () => {
        if (!user) return
        setLoadingFeedback(true)

        const { data, error } = await supabase
            .from("pending_words")
            .select("*")
            .eq("user_id", user.id)
            .order("submitted_at", { ascending: false })
            .limit(50)

        if (!error && data) {
            setFeedbacks(data)
        }
        setLoadingFeedback(false)
    }

    useEffect(() => {
        fetchHistory()
        fetchFeedbacks()
    }, [user])

    // ── Delete Handlers ────────────────────────────────────
    const handleClearHistory = async () => {
        if (!user) return
        await supabase
            .from("translation_history")
            .delete()
            .eq("user_id", user.id)
        setHistory([])
    }

    const handleDeleteItem = async (id: number) => {
        await supabase
            .from("translation_history")
            .delete()
            .eq("id", id)
        setHistory((prev) => prev.filter((item) => item.id !== id))
    }

    // ── Format Date ────────────────────────────────────────
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-12">
                <h1 className="mt-8 text-center text-8xl font-bold text-app-green">ประวัติ</h1>
                <h2 className="mt-6 text-center text-l font-semibold text-black/50">ประวัติการแปลภาษาและ feedback ของคุณ</h2>

                <div className="mx-auto mt-12 w-full max-w-5xl flex flex-col gap-6">

                    {/* ════════════════════════════════════════════════════════
                       Section 1: ประวัติคำแปล
                       ════════════════════════════════════════════════════════ */}
                    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                        {/* Header — Collapsible */}
                        <button
                            onClick={() => setOpenTranslation(v => !v)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-app-green/10 flex items-center justify-center">
                                    <Clock className="size-4 text-app-green" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-zinc-800">ประวัติคำแปล</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">คำศัพท์ที่คุณเคยแปล</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {history.length > 0 && openTranslation && (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleClearHistory()
                                        }}
                                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="size-3" />
                                        ลบทั้งหมด
                                    </span>
                                )}
                                {openTranslation
                                    ? <ChevronUp className="size-4 text-zinc-400" />
                                    : <ChevronDown className="size-4 text-zinc-400" />
                                }
                            </div>
                        </button>

                        {/* Content */}
                        {openTranslation && (
                            <div className="border-t border-zinc-100 px-6 py-4">
                                {loadingHistory ? (
                                    <div className="flex items-center gap-2 text-sm text-zinc-400 py-4">
                                        <Loader2 className="size-4 animate-spin" />
                                        กำลังโหลด...
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-sm text-zinc-400 py-6 text-center">ยังไม่มีประวัติการแปล</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {history.map((item) => (
                                            <div key={item.id} className="group flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 hover:border-zinc-200 hover:bg-zinc-50/50 transition-all">
                                                {/* ข้อมูลการแปล */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">
                                                        {item.word}
                                                    </p>
                                                    <p className="text-sm text-app-green mt-0.5 truncate">
                                                        {item.translate}
                                                    </p>
                                                </div>
                                                {/* วันที่และภาษา */}
                                                <div className="shrink-0 text-right ml-4 flex items-center gap-3">
                                                    <div>
                                                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
                                                            {item.direction === "th-en" ? "ไทย → อังกฤษ" : "อังกฤษ → ไทย"}
                                                        </span>
                                                        <p className="text-xs text-zinc-400 mt-1">
                                                            {formatDate(item.translated_at)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all"
                                                        title="ลบรายการนี้"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ════════════════════════════════════════════════════════
                       Section 2: ประวัติ Feedback
                       ════════════════════════════════════════════════════════ */}
                    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                        {/* Header — Collapsible */}
                        <button
                            onClick={() => setOpenFeedback(v => !v)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <MessageSquare className="size-4 text-amber-500" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-zinc-800">ประวัติ Feedback</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">คำศัพท์ที่คุณส่งเพื่อพัฒนาโมเดล</p>
                                </div>
                            </div>
                            {openFeedback
                                ? <ChevronUp className="size-4 text-zinc-400" />
                                : <ChevronDown className="size-4 text-zinc-400" />
                            }
                        </button>

                        {/* Content */}
                        {openFeedback && (
                            <div className="border-t border-zinc-100">
                                {/* Feedback List */}
                                <div className="px-6 py-4">
                                    {loadingFeedback ? (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400 py-4">
                                            <Loader2 className="size-4 animate-spin" />
                                            กำลังโหลด...
                                        </div>
                                    ) : feedbacks.length === 0 ? (
                                        <p className="text-sm text-zinc-400 py-6 text-center">ยังไม่มี feedback</p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {feedbacks.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`rounded-xl border px-4 py-3.5 transition-all ${
                                                        item.status === "rejected"
                                                            ? "border-red-100 bg-red-50/30"
                                                            : item.status === "approved"
                                                                ? "border-emerald-100 bg-emerald-50/30"
                                                                : "border-zinc-100 bg-white"
                                                    }`}
                                                >
                                                    {/* Top row: word → translation + status */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-medium text-zinc-800 truncate">
                                                                    {item.word}
                                                                </p>
                                                                <span className="text-zinc-300">→</span>
                                                                <p className="font-medium text-app-green truncate">
                                                                    {item.translation}
                                                                </p>
                                                            </div>
                                                            {/* Context */}
                                                            {item.context && (
                                                                <p className="text-xs text-zinc-400 mt-1 truncate">
                                                                    บริบท: {item.context}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                                                            <StatusBadge status={item.status} />
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                                                                    {item.direction === "th-en" ? "ไทย → อังกฤษ" : "อังกฤษ → ไทย"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Rejected reason */}
                                                    {item.status === "rejected" && item.rejected_reason && (
                                                        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                                                            <XCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                                                            <p className="text-xs text-red-600 leading-relaxed">
                                                                เหตุผล: {item.rejected_reason}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Bottom: date */}
                                                    <p className="text-xs text-zinc-400 mt-2">
                                                        ส่งเมื่อ {formatDate(item.submitted_at)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </>
    )
}

export default History
