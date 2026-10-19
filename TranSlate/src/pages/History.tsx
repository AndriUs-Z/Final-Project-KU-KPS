import { useState, useEffect } from "react"
import { Clock, Trash2 } from "lucide-react"
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

const History = () => {
    const { user } = useAuth()
    const [history, setHistory] = useState<TranslationHistory[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // ดึงประวัติการแปลจาก Supabase
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

    useEffect(() => {
        fetchHistory()
    }, [user])

    // ลบประวัติทั้งหมดของ user
    const handleClearHistory = async () => {
        if (!user) return
        await supabase
            .from("translation_history")
            .delete()
            .eq("user_id", user.id)
        setHistory([])
    }

    // ลบรายการเดียว
    const handleDeleteItem = async (id: number) => {
        await supabase
            .from("translation_history")
            .delete()
            .eq("id", id)
        setHistory((prev) => prev.filter((item) => item.id !== id))
    }

    // จัดรูปแบบวันที่
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
                <h2 className="mt-6 text-center text-l font-semibold text-black/50">ประวัติการแปลภาษาของคุณ</h2>

                <div className="mx-auto mt-12 w-full max-w-5xl rounded-3xl bg-white p-8 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl flex items-center gap-2">
                            <Clock className="size-5" />
                            ประวัติการแปล
                        </h2>
                        {history.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-500 hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="size-4" />
                                ลบทั้งหมด
                            </button>
                        )}
                    </div>

                    {loadingHistory ? (
                        <p className="mt-4 text-sm text-zinc-400">กำลังโหลด...</p>
                    ) : history.length === 0 ? (
                        <p className="mt-4 text-sm text-zinc-400">ยังไม่มีประวัติการแปล</p>
                    ) : (
                        <div className="mt-4 flex flex-col gap-3">
                            {history.map((item) => (
                                <div key={item.id} className="group flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 hover:border-zinc-300 transition-colors">
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

            </main>
        </>
    )
}

export default History
