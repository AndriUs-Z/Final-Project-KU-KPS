// Section ใน Admin Dashboard — แสดงรายการคำศัพท์ที่รอตรวจสอบ พร้อมปุ่มอนุมัติ/ปฏิเสธ
import { useState } from "react"
import {
    Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
    Loader2,
} from "lucide-react"
import toast from "react-hot-toast"
import { supabase } from "../../lib/supabase"
import type { PendingWord } from "../../types/admin"

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })

const statusBadge = (status: PendingWord["status"]) => {
    const styleMap = {
        pending: "bg-yellow-200 text-yellow-800",
        approved: "bg-green-200 text-green-800",
        rejected: "bg-red-200 text-red-800",
    }
    const labelMap = { pending: "รออนุมัติ", approved: "อนุมัติแล้ว", rejected: "ปฏิเสธแล้ว" }
    return (
        <span className={`inline-flex items-center gap-[4px] rounded-full px-[10px] py-[2px] text-[12px] font-semibold ${styleMap[status]}`}>
            {status === "pending" && <Clock className="size-[12px]" />}
            {status === "approved" && <CheckCircle2 className="size-[12px]" />}
            {status === "rejected" && <XCircle className="size-[12px]" />}
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
            <div className="mt-[32px] border border-zinc-200 rounded-[16px] overflow-hidden">

                {/* Header */}
                <button
                    onClick={() => setOpen(v => !v)}
                    className="w-full flex items-center justify-between px-[20px] py-[16px] bg-white hover:bg-zinc-50"
                >
                    <div className="flex items-center gap-[12px]">
                        <div className="size-[36px] rounded-[8px] bg-green-50 flex-center">
                            <Clock className="size-[16px] text-green-500" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-zinc-800 text-[14px]">คำศัพท์จากผู้ใช้</p>
                            <p className="text-[12px] text-zinc-400 mt-[2px]">รายการที่รอตรวจสอบและอนุมัติ</p>
                        </div>
                        {pendingCount > 0 && (
                            <span className="ml-[4px] rounded-full bg-yellow-200 text-yellow-800 text-[12px] font-semibold px-[8px] py-[2px]">
                                {pendingCount} รออนุมัติ
                            </span>
                        )}
                    </div>
                    {open
                        ? <ChevronUp className="size-[16px] text-zinc-400" />
                        : <ChevronDown className="size-[16px] text-zinc-400" />
                    }
                </button>

                {open && (
                    <div className="border-[1px] border-zinc-100">

                        {/* Toolbar */}
                        <div className="flex items-center gap-[8px] px-[20px] py-[12px] bg-zinc-50 border-b border-zinc-100 flex-wrap">
                            {(["pending", "approved", "rejected", "all"] as const).map(s => {
                                const label = { pending: "รออนุมัติ", approved: "อนุมัติแล้ว", rejected: "ปฏิเสธแล้ว", all: "ทั้งหมด" }
                                return (
                                    <button
                                        key={s}
                                        onClick={() => handleFilterChange(s)}
                                        className={`rounded-[8px] px-[12px] py-[4px] text-[12px] font-medium transition-colors ${filter === s
                                            ? "bg-white text-zinc-800 shadow-sm border border-zinc-200"
                                            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
                                            }`}
                                    >
                                        {label[s]}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="p-[20px] space-y-[8px]">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-[40px] rounded-[8px] bg-zinc-100 " />
                                ))}
                            </div>
                        ) : words.length === 0 ? (
                            <div className="py-[64px] text-center text-zinc-400">
                                <p className="text-[14px]">ไม่มีคำศัพท์ในสถานะนี้</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-[14px]">
                                    <thead>
                                        <tr className="text-[12px] text-zinc-400 border-b border-zinc-100">
                                            <th className="px-[20px] py-[10px] text-left font-medium">คำศัพท์</th>
                                            <th className="px-[20px] py-[10px] text-left font-medium">คำแปล</th>
                                            <th className="px-[20px] py-[10px] text-left font-medium">ทิศทาง</th>
                                            <th className="px-[20px] py-[10px] text-left font-medium hidden md:table-cell">บริบท</th>
                                            <th className="px-[20px] py-[10px] text-left font-medium">สถานะ</th>
                                            <th className="px-[20px] py-[10px] text-left font-medium hidden lg:table-cell">วันที่</th>
                                            <th className="px-[20px] py-[10px] text-right font-medium">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {words.map(word => (
                                            <tr key={word.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                                                <td className="px-[20px] py-[12px]">{word.word}</td>
                                                <td className="px-[20px] py-[12px]">{word.translation}</td>
                                                <td className="px-[20px] py-[12px]">
                                                    {word.direction === "th-en" && (
                                                        <span className="text-[12px] bg-blue-50 text-blue-700 border border-blue-200 rounded-[6px] px-[8px] py-[2px] whitespace-nowrap">
                                                            ไทย → อังกฤษ
                                                        </span>
                                                    )}
                                                    {word.direction === "en-th" && (
                                                        <span className="text-[12px] bg-purple-50 text-purple-700 border border-purple-200 rounded-[6px] px-[8px] py-[2px] whitespace-nowrap">
                                                            อังกฤษ → ไทย
                                                        </span>
                                                    )}
                                                    {!word.direction && <span className="text-zinc-300">—</span>}
                                                </td>
                                                <td className="px-[20px] py-[12px] text-zinc-400 text-[12px] max-w-[160px] truncate hidden md:table-cell">
                                                    {word.context ?? "—"}
                                                </td>
                                                <td className="px-[20px] py-[12px]">
                                                    {statusBadge(word.status)}
                                                    {word.status === "rejected" && word.rejected_reason && (
                                                        <p className="mt-1 text-[12px] text-red-400 max-w-[140px] truncate" title={word.rejected_reason}>
                                                            {word.rejected_reason}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-[20px] py-[12px] text-zinc-400 text-[12px] whitespace-nowrap hidden lg:table-cell">
                                                    {fmtDate(word.submitted_at)}
                                                </td>
                                                <td className="px-[20px] py-[12px]">
                                                    {word.status === "pending" && (
                                                        <div className="flex items-center justify-end gap-[8px]">
                                                            <button
                                                                onClick={() => handleApprove(word)}
                                                                disabled={actionLoading === word.id}
                                                                className="flex items-center gap-[4px] rounded-md bg-green-500 px-[10px] py-[4px] text-[12px] font-medium text-white hover:bg-green-600 "
                                                            >
                                                                {actionLoading === word.id
                                                                    ? <Loader2 className="size-[12px] " />
                                                                    : <CheckCircle2 className="size-[12px]" />}
                                                                อนุมัติ
                                                            </button>
                                                            <button
                                                                onClick={() => { setRejectTarget(word); setRejectReason("") }}
                                                                disabled={actionLoading === word.id}
                                                                className="flex items-center gap-[4px] rounded-md bg-red-500 px-[10px] py-[4px] text-[12px] font-medium text-white hover:bg-red-600"
                                                            >
                                                                <XCircle className="size-[12px]" />
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
                    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[4px] px-[16px]"
                    onClick={e => { if (e.target === e.currentTarget) setRejectTarget(null) }}
                >
                    <div className="bg-white rounded-[16px] w-full max-w-md p-[24px]">
                        <div className="flex items-center gap-[12px] mb-[16px]">
                            <div className="size-[36px] rounded-[8px] bg-red-100 flex-center">
                                <XCircle className="size-[16px] text-red-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-800 text-[14px]">ปฏิเสธคำศัพท์</p>
                                <p className="text-[12px] text-zinc-400">"{rejectTarget.word}" → "{rejectTarget.translation}"</p>
                            </div>
                        </div>

                        <label className="block text-[12px] font-medium mb-[6px]">
                            เหตุผล <span className="text-zinc-500 ">(ถ้ามี)</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="เช่น คำศัพท์ซ้ำ, ไม่ถูกต้อง..."
                            rows={4}
                            className="w-full rounded-[8px] border border-zinc-200 px-[12px] py-[10px] text-[14px] resize-none focus:outline-none"
                        />

                        <div className="flex justify-end gap-[8px] mt-[16px]">
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="rounded-[8px] border border-zinc-200 px-[16px] py-[8px] text-[12px]"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={!!actionLoading}
                                className="flex items-center gap-[8px] rounded-[8px] bg-red-500 px-[16px] py-[8px] text-[12px] font-semibold text-white hover:bg-red-600"
                            >
                                {actionLoading ? <Loader2 className="size-[14px]" /> : <XCircle className="size-[14px]" />}
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
