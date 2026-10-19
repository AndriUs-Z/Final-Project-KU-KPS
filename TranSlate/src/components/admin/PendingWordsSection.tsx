import { useState } from "react"
import {
    Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
    RefreshCw, Loader2,
} from "lucide-react"
import toast from "react-hot-toast"
import { supabase } from "../../lib/supabase"
import type { PendingWord } from "../../types/admin"

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })

const statusBadge = (status: PendingWord["status"]) => {
    const styleMap = {
        pending: "bg-yellow-200 text-black",
        approved: "bg-green-200 text-black",
        rejected: "bg-red-200 text-black",
    }
    const labelMap = { pending: "รออนุมัติ", approved: "อนุมัติแล้ว", rejected: "ปฏิเสธแล้ว" }
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styleMap[status]}`}>
            {status === "pending" && <Clock className="size-3" />}
            {status === "approved" && <CheckCircle2 className="size-3" />}
            {status === "rejected" && <XCircle className="size-3" />}
            {labelMap[status]}
        </span>
    )
}

// ── Component ──────────────────────────────────────────────
const PendingWordsSection = () => {
    const [words, setWords] = useState<PendingWord[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending")
    const [open, setOpen] = useState(true)

    // Reject modal
    const [rejectTarget, setRejectTarget] = useState<PendingWord | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchWords = async (status = filter) => {
        setLoading(true)
        const query = supabase
            .from("pending_words")
            .select("*")
            .order("submitted_at", { ascending: false })

        const { data, error } = status === "all"
            ? await query
            : await query.eq("status", status)

        if (error) {
            toast.error(`โหลดคำศัพท์ไม่ได้: ${error.message}`)
        } else {
            setWords(data ?? [])
        }
        setLoading(false)
    }

    // โหลดครั้งแรก
    useState(() => { fetchWords() })

    const handleFilterChange = (s: typeof filter) => {
        setFilter(s)
        fetchWords(s)
    }

    const handleApprove = async (word: PendingWord) => {
        setActionLoading(word.id)
        const { error } = await supabase
            .from("pending_words")
            .update({ status: "approved", updated_at: new Date().toISOString() })
            .eq("id", word.id)
        if (error) {
            toast.error("อนุมัติไม่สำเร็จ")
        } else {
            toast.success(`อนุมัติ "${word.word}" แล้ว`)
            fetchWords()
        }
        setActionLoading(null)
    }

    const handleRejectConfirm = async () => {
        if (!rejectTarget) return
        setActionLoading(rejectTarget.id)
        const { error } = await supabase
            .from("pending_words")
            .update({
                status: "rejected",
                rejected_reason: rejectReason.trim() || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", rejectTarget.id)
        if (error) {
            toast.error("ปฏิเสธไม่สำเร็จ")
        } else {
            toast.success(`ปฏิเสธ "${rejectTarget.word}" แล้ว`)
            setRejectTarget(null)
            setRejectReason("")
            fetchWords()
        }
        setActionLoading(null)
    }

    const pendingCount = words.filter(w => w.status === "pending").length

    return (
        <>
            <div className="mt-8 border border-zinc-200 rounded-2xl overflow-hidden">

                {/* Header */}
                <button
                    onClick={() => setOpen(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-zinc-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-amber-50 flex-center">
                            <Clock className="size-4 text-amber-500" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-zinc-800 text-sm">คำศัพท์จากผู้ใช้</p>
                            <p className="text-xs text-zinc-400 mt-0.5">รายการที่รอตรวจสอบและอนุมัติ</p>
                        </div>
                        {pendingCount > 0 && (
                            <span className="ml-1 rounded-full bg-amber-400 text-white text-xs font-semibold px-2 py-0.5">
                                {pendingCount} รออนุมัติ
                            </span>
                        )}
                    </div>
                    {open
                        ? <ChevronUp className="size-4 text-zinc-400" />
                        : <ChevronDown className="size-4 text-zinc-400" />
                    }
                </button>

                {open && (
                    <div className="border-t border-zinc-100">

                        {/* Toolbar */}
                        <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100 flex-wrap">
                            {(["pending", "approved", "rejected", "all"] as const).map(s => {
                                const label = { pending: "รออนุมัติ", approved: "อนุมัติแล้ว", rejected: "ปฏิเสธแล้ว", all: "ทั้งหมด" }
                                return (
                                    <button
                                        key={s}
                                        onClick={() => handleFilterChange(s)}
                                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${filter === s
                                            ? "bg-white text-zinc-800 shadow-sm border border-zinc-200"
                                            : "text-zinc-400 hover:text-zinc-600"
                                            }`}
                                    >
                                        {label[s]}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => fetchWords()}
                                className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
                                รีเฟรช
                            </button>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="p-5 space-y-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
                                ))}
                            </div>
                        ) : words.length === 0 ? (
                            <div className="py-16 text-center text-zinc-400">
                                <p className="text-sm">ไม่มีคำศัพท์ในสถานะนี้</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-zinc-400 border-b border-zinc-100">
                                            <th className="px-5 py-2.5 text-left font-medium">คำศัพท์</th>
                                            <th className="px-5 py-2.5 text-left font-medium">คำแปล</th>
                                            <th className="px-5 py-2.5 text-left font-medium">ทิศทาง</th>
                                            <th className="px-5 py-2.5 text-left font-medium hidden md:table-cell">บริบท</th>
                                            <th className="px-5 py-2.5 text-left font-medium">สถานะ</th>
                                            <th className="px-5 py-2.5 text-left font-medium hidden lg:table-cell">วันที่</th>
                                            <th className="px-5 py-2.5 text-right font-medium">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {words.map(word => (
                                            <tr key={word.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-zinc-800">{word.word}</td>
                                                <td className="px-5 py-3 text-zinc-600">{word.translation}</td>
                                                <td className="px-5 py-3">
                                                    {word.direction === "th-en" && (
                                                        <span className="text-xs bg-lime-50 text-lime-700 border border-lime-200 rounded-md px-2 py-0.5 whitespace-nowrap">
                                                            ไทย → อังกฤษ
                                                        </span>
                                                    )}
                                                    {word.direction === "en-th" && (
                                                        <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-md px-2 py-0.5 whitespace-nowrap">
                                                            อังกฤษ → ไทย
                                                        </span>
                                                    )}
                                                    {!word.direction && <span className="text-zinc-300">—</span>}
                                                </td>
                                                <td className="px-5 py-3 text-zinc-400 text-xs max-w-[160px] truncate hidden md:table-cell">
                                                    {word.context ?? "—"}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {statusBadge(word.status)}
                                                    {word.status === "rejected" && word.rejected_reason && (
                                                        <p className="mt-1 text-xs text-red-400 max-w-[140px] truncate" title={word.rejected_reason}>
                                                            {word.rejected_reason}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap hidden lg:table-cell">
                                                    {fmtDate(word.submitted_at)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {word.status === "pending" && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleApprove(word)}
                                                                disabled={actionLoading === word.id}
                                                                className="flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                                                            >
                                                                {actionLoading === word.id
                                                                    ? <Loader2 className="size-3 animate-spin" />
                                                                    : <CheckCircle2 className="size-3" />}
                                                                อนุมัติ
                                                            </button>
                                                            <button
                                                                onClick={() => { setRejectTarget(word); setRejectReason("") }}
                                                                disabled={actionLoading === word.id}
                                                                className="flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:border-red-300 hover:text-red-500 disabled:opacity-40 transition-colors"
                                                            >
                                                                <XCircle className="size-3" />
                                                                ปฏิเสธ
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    onClick={e => { if (e.target === e.currentTarget) setRejectTarget(null) }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-9 rounded-lg bg-red-50 flex-center">
                                <XCircle className="size-4 text-red-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-800 text-sm">ปฏิเสธคำศัพท์</p>
                                <p className="text-xs text-zinc-400">"{rejectTarget.word}" → "{rejectTarget.translation}"</p>
                            </div>
                        </div>

                        <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                            เหตุผล <span className="text-zinc-400 font-normal">(ถ้ามี)</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="เช่น คำศัพท์ซ้ำ, ไม่ถูกต้อง..."
                            rows={3}
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm resize-none focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors"
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default PendingWordsSection
