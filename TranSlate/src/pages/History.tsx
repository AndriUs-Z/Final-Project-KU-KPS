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

// Status Badge Component 
const StatusBadge = ({ status }: { status: FeedbackHistory["status"] }) => {
    const config = {
        pending: {
            bg: "bg-yellow-50 border-yellow-200 text-yellow-700",
            icon: <Clock className="size-3" />,
            label: "รออนุมัติ",
        },
        approved: {
            bg: "bg-green-50 border-green-200 text-green-700",
            icon: <CheckCircle2 className="size-3" />,
            label: "อนุมัติแล้ว",
        },
        rejected: {
            bg: "bg-red-50 border-red-200 text-red-700",
            icon: <XCircle className="size-3" />,
            label: "ปฏิเสธแล้ว",
        },
    }
    const { bg, icon, label } = config[status]
    return (
        <span className={`inline-flex items-center gap-[4px] rounded-full border px-[10px] py-[2px] text-[12px] font-semibold ${bg}`}>
            {icon}
            {label}
        </span>
    )
}

//  Main Component 
const History = () => {
    const { user } = useAuth()

    //  Translation History State 
    const [history, setHistory] = useState<TranslationHistory[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [openTranslation, setOpenTranslation] = useState(true)

    //  Feedback History State 
    const [feedbacks, setFeedbacks] = useState<FeedbackHistory[]>([])
    const [loadingFeedback, setLoadingFeedback] = useState(false)
    const [openFeedback, setOpenFeedback] = useState(true)
    

    //  Fetch Translation History เช็ค user login ก่อน
    const fetchHistory = async () => {
        if (!user) return
        setLoadingHistory(true)

        const { data, error } = await supabase
            .from("translation_history")
            .select("*")
            .eq("user_id", user.id)
            .order("translated_at", { ascending: false })
            .limit(20)

        if (!error && data) {
            setHistory(data)
        }
        setLoadingHistory(false)
    }

    // Fetch Feedback History  
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

    // Delete Handlers 
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
            <main className="min-h-screen pb-[48px]">
                <h1 className="mt-[32px] text-center text-[96px] font-bold text-app-green">ประวัติ</h1>
                <h2 className="mt-[24px] text-center text-[16px] font-semibold text-black/50">ประวัติการแปลภาษาและ feedback ของคุณ</h2>

                <div className="mx-auto mt-[48px] w-full max-w-[1080px] flex flex-col gap-[24px]">

                    {/* Section 1: ประวัติคำแปล */}
                    <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
                        {/* Header — Collapsible */}
                        <button
                            onClick={() => setOpenTranslation(v => !v)}
                            className="w-full flex items-center justify-between px-[24px] py-[16px] hover:bg-zinc-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-[16px]">
                                <div className="size-[36px] rounded-[8px] bg-gray-100 flex items-center justify-center">
                                    <Clock className="size-[16px] text-app-green" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-zinc-800">ประวัติคำแปล</p>
                                    <p className="text-[12px] text-zinc-400 mt-[2px]">คำศัพท์ที่คุณเคยแปล</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-[16px]">
                                {history.length > 0 && openTranslation && (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleClearHistory()
                                        }}
                                        className="flex items-center gap-[4px] rounded-[8px] bg-red-100 px-[12px] py-[6px] text-[12px] text-red-500 hover:bg-red-200 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="size-[12px]" />
                                        ลบทั้งหมด
                                    </span>
                                )}
                                {openTranslation
                                    ? <ChevronUp className="size-[16px] text-zinc-400" />
                                    : <ChevronDown className="size-[16px] text-zinc-400" />
                                }
                            </div>
                        </button>

                        {/* Content */}
                        {openTranslation && (
                            <div className="border-t border-zinc-300 px-[24px] py-[16px]">
                                {loadingHistory ? (
                                    <div className="flex items-center gap-[8px] text-[14px] text-zinc-400 py-[16px]">
                                        <Loader2 className="size-[16px] animate-spin" />
                                        กำลังโหลด...
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-[16px] text-zinc-400 py-6 text-center">ยังไม่มีประวัติการแปล</p>
                                ) : (
                                    <div className="flex flex-col gap-[8px]">
                                        {history.map((item) => (
                                            <div key={item.id} className="group flex items-center justify-between rounded-[12px] border border-zinc-300 px-[16px] py-[12px] hover:border-zinc-400 hover:bg-zinc-50/50">
                                                {/* ข้อมูลการแปล */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">
                                                        {item.word}
                                                    </p>
                                                    <p className="text-[14px] text-app-green mt-[2px] truncate">
                                                        {item.translate}
                                                    </p>
                                                </div>
                                                {/* วันที่และภาษา */}
                                                <div className="shrink-0 text-right ml-[16px] flex items-center gap-[12px]">
                                                    <div>
                                                        <span className="rounded-[8px] bg-zinc-100 px-[12px] py-[4px] text-[12px] font-medium text-zinc-500">
                                                            {item.direction === "th-en" ? "ไทย → อังกฤษ" : "อังกฤษ → ไทย"}
                                                        </span>
                                                        <p className="text-[12px] text-zinc-400 mt-[4px]">
                                                            {formatDate(item.translated_at)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-zinc-300 hover:text-red-500"
                                                        title="ลบรายการนี้"
                                                    >
                                                        <Trash2 className="size-[16px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 2: ประวัติ Feedback */}
                    <div className="rounded-[8px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
                        {/* Header — Collapsible */}
                        <button
                            onClick={() => setOpenFeedback(v => !v)}
                            className="w-full flex items-center justify-between px-[24px] py-[16px] hover:bg-zinc-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-[12px]">
                                <div className="size-[36px] rounded-[8px] bg-yellow-50 flex items-center justify-center">
                                    <MessageSquare className="size-[16px] text-yellow-500" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-zinc-800">ประวัติ Feedback</p>
                                    <p className="text-[12px] text-zinc-400 mt-[2px]">คำศัพท์ที่คุณส่งเพื่อพัฒนาโมเดล</p>
                                </div>
                            </div>
                            {openFeedback
                                ? <ChevronUp className="size-[16px] text-zinc-400" />
                                : <ChevronDown className="size-[16px] text-zinc-400" />
                            }
                        </button>

                        {/* Content */}
                        {openFeedback && (
                            <div className="border-t border-zinc-300">
                                {/* Feedback List */}
                                <div className="px-[28px] py-[16px]">
                                    {loadingFeedback ? (
                                        <div className="flex items-center gap-[8px] text-[12px] text-zinc-400 py-4">
                                            <Loader2 className="size-[16px] animate-spin" />
                                            กำลังโหลด...
                                        </div>
                                    ) : feedbacks.length === 0 ? (
                                        <p className="text-[12px] text-zinc-400 py-[24px] text-center">ยังไม่มี feedback</p>
                                    ) : (
                                        <div className="flex flex-col gap-[12px]">
                                            {feedbacks.map((item) => (
                                                <div key={item.id} className={"rounded-[8px] border border-zinc-300 px-[16px] py-[14px] bg-white "}
                                                >
                                                    {/* Top row: word → translation + status */}
                                                    <div className="flex items-start justify-between gap-[16px]">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-[8px] flex-wrap">
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
                                                                <p className="text-[14px] text-zinc-400 mt-[4px] truncate">
                                                                    บริบท: {item.context}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 flex flex-col items-end gap-[6px]">
                                                            <StatusBadge status={item.status} />
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-[8px] bg-zinc-100 px-[10px] py-[2px] text-[12px] font-medium text-zinc-500">
                                                                    {item.direction === "th-en" ? "ไทย → อังกฤษ" : "อังกฤษ → ไทย"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Rejected reason */}
                                                    {item.status === "rejected" && item.rejected_reason && (
                                                        <div className="mt-[10px] flex items-start gap-[8px] rounded-[8px] bg-red-50 border border-red-100 px-[12px] py-[8px]">                                                            <p className="text-xs text-red-600 leading-relaxed">
                                                                เหตุผล: {item.rejected_reason}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Bottom: date */}
                                                    <p className="text-[12px] text-zinc-500 mt-[8px]">
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
