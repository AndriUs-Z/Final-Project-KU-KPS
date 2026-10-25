// Section ใน Admin Dashboard — แสดงจำนวนคำที่อนุมัติ/เกณฑ์ขั้นต่ำ + ปุ่มสั่ง retrain model + ประวัติ retrain
import { useEffect, useState } from "react"
import {
    ChevronDown, ChevronUp,
    RefreshCw, Loader2, Sparkles, ArrowRightLeft,
} from "lucide-react"
import toast from "react-hot-toast"
import { supabase } from "../../lib/supabase"
import type { PendingWord, RetrainJob, RetrainStatus } from "../../types/admin"

// Base URLs จาก .env
const API_ADMIN = (import.meta.env.VITE_API_ADMIN_URL || "").replace(/\/+$/, "")
const API_TH_EN = API_ADMIN || (import.meta.env.VITE_API_TH_EN_URL || "").replace(/\/+$/, "")
const API_EN_TH = API_ADMIN || (import.meta.env.VITE_API_EN_TH_URL || "").replace(/\/+$/, "")

// กำหนดเกณฑ์ขั้นต่ำ (ลดชั่วคราวเพื่อเทส → เปลี่ยนกลับ 100 หลังเทสเสร็จ)
const DEFAULT_MIN_PAIRS = 100

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })

const JOB_LABEL: Record<RetrainJob["status"], string> = {
    queued: "รอคิว", running: "กำลังเทรน...", success: "เทรนสำเร็จ", failed: "ล้มเหลว",
}
const JOB_TEXT: Record<RetrainJob["status"], string> = {
    queued: "text-amber-600", running: "text-blue-600",
    success: "text-emerald-600", failed: "text-red-500",
}

const DirectionBadge = ({ direction }: { direction?: "th-en" | "en-th" | null }) => {
    if (!direction) return <span className="text-zinc-300">—</span>
    const isThEn = direction === "th-en"
    return (
        <span
            className={`text-xs border rounded-md px-2 py-0.5 whitespace-nowrap ${isThEn
                    ? "bg-lime-50 text-lime-700 border-lime-200"
                    : "bg-teal-50 text-teal-700 border-teal-200"
                }`}
        >
            {isThEn ? "ไทย → อังกฤษ" : "อังกฤษ → ไทย"}
        </span>
    )
}

// การ์ดแสดงสถานะโมเดลและปุ่มเทรน
interface ModelCardProps {
    dir: "th-en" | "en-th"
    name: string
    color: string
    count: number
    minPairs: number
    job?: RetrainJob | null
    isLoading: boolean
    onTrigger: (dir: "th-en" | "en-th") => void
}

const ModelCard = ({
    dir, name, color, count, minPairs, job, isLoading, onTrigger,
}: ModelCardProps) => {
    const isBusy = job?.status === "running" || job?.status === "queued"
    const isReady = count >= minPairs

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`size-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <ArrowRightLeft className="size-6 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm text-zinc-500 font-medium truncate">{name}</p>
                    <p className="text-2xl font-bold text-zinc-800 mt-0.5">
                        <span className={isReady ? "text-emerald-600" : "text-zinc-800"}>{count}</span>
                        <span className="text-sm font-normal text-zinc-400"> / {minPairs} คำ</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {job ? `สถานะ: ${JOB_LABEL[job.status]}` : "ยังไม่เคยเทรน"}
                    </p>
                </div>
            </div>

            <button
                onClick={() => onTrigger(dir)}
                disabled={isLoading || isBusy}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 ${isBusy
                        ? "bg-blue-50 text-blue-600 cursor-not-allowed"
                        : isReady
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    }`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>กำลังส่ง...</span>
                    </>
                ) : isBusy ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>กำลังเทรน...</span>
                    </>
                ) : (
                    "เทรน"
                )}
            </button>
        </div>
    )
}

// ── Component ──────────────────────────────────────────────
const RetrainSection = () => {
    const [open, setOpen] = useState(true)
    const [approvedWords, setApprovedWords] = useState<PendingWord[]>([])
    const [wordsLoading, setWordsLoading] = useState(false)
    const [retrainStatus, setRetrainStatus] = useState<RetrainStatus | null>(null)
    const [triggerLoading, setTriggerLoading] = useState<{ "th-en": boolean; "en-th": boolean }>({
        "th-en": false,
        "en-th": false,
    })
    const [tableFilter, setTableFilter] = useState<"all" | "th-en" | "en-th">("all")
    const [showHistory, setShowHistory] = useState(false)

    useEffect(() => {
        fetchApprovedWords()
        fetchRetrainStatus()
    }, [])

    // ── ดึงคำที่ approved จาก Supabase ─────────────────────────
    const fetchApprovedWords = async () => {
        setWordsLoading(true)
        const { data, error } = await supabase
            .from("pending_words")
            .select("*")
            .eq("status", "approved")
            .order("submitted_at", { ascending: false })
        if (error) {
            toast.error(`โหลดคำไม่ได้: ${error.message}`)
        } else {
            setApprovedWords(data ?? [])
        }
        setWordsLoading(false)
    }

    // ── ดึงสถานะ retrain jobs ───────────────────────────────────
    const fetchRetrainStatus = async () => {
        const base = API_TH_EN || API_EN_TH
        if (!base) return
        try {
            const res = await fetch(`${base}/api/admin/retrain/status`)
            if (!res.ok) return
            setRetrainStatus(await res.json())
        } catch (e) {
            console.warn("fetchRetrainStatus failed:", e)
        }
    }

    // ── สั่งเทรนแยกตามโมเดล ─────────────────────────────────────
    const handleTrigger = async (targetDir: "th-en" | "en-th") => {
        const count = targetDir === "th-en" ? thEnCount : enThCount
        if (count < DEFAULT_MIN_PAIRS) {
            toast.error(`จำนวนคำยังไม่ครบ 100 คำ (ปัจจุบันมี ${count}/100 คำ)`)
            return
        }

        const base = targetDir === "th-en"
            ? (API_TH_EN || API_EN_TH)
            : (API_EN_TH || API_TH_EN)

        if (!base) {
            toast.error("ไม่พบ Backend URL (ตรวจสอบ .env)")
            return
        }

        setTriggerLoading(prev => ({ ...prev, [targetDir]: true }))
        try {
            const res = await fetch(`${base}/api/admin/retrain`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ direction: targetDir }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data?.detail ?? `เริ่มเทรนโมเดลไม่สำเร็จ`)
            } else {
                toast.success(`ส่งคำสั่งเทรนโมเดล ${targetDir === "th-en" ? "ไทย → อังกฤษ" : "อังกฤษ → ไทย"} เรียบร้อย!`)
                await fetchRetrainStatus()
            }
        } catch {
            toast.error("เชื่อมต่อ Backend ไม่ได้ กรุณาตรวจสอบสถานะ Server")
        } finally {
            setTriggerLoading(prev => ({ ...prev, [targetDir]: false }))
        }
    }

    // จำนวนคำที่ approved แยกตามทิศทาง
    const thEnCount = approvedWords.filter(w => w.direction === "th-en").length
    const enThCount = approvedWords.filter(w => w.direction === "en-th").length
    const minPairs = DEFAULT_MIN_PAIRS

    // สถานะล่าสุดของแต่ละโมเดล
    const jobTh = retrainStatus?.latest["th-en"]
    const jobEn = retrainStatus?.latest["en-th"]

    // กรองตารางตามแท็บ
    const filteredWords = tableFilter === "all"
        ? approvedWords
        : approvedWords.filter(w => w.direction === tableFilter)

    return (
        <div className="mt-8 border border-zinc-200 rounded-2xl overflow-hidden bg-white">

            {/* Header ส่วนเทรนโมเดล */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-zinc-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-emerald-50 flex-center">
                        <Sparkles className="size-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-zinc-800 text-sm">เทรนโมเดล</p>
                        <p className="text-xs text-zinc-400 mt-0.5">ฝึกสอนโมเดลใหม่ด้วยคำศัพท์ที่อนุมัติแล้ว</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {open
                        ? <ChevronUp className="size-4 text-zinc-400" />
                        : <ChevronDown className="size-4 text-zinc-400" />
                    }
                </div>
            </button>

            {open && (
                <div className="border-t border-zinc-100">

                    {/* ═══════════════════════════════════════════════════════
                        2 STAT CARDS ข้างกัน (แบบเดียวกับการ์ดด้านบน)
                    ═══════════════════════════════════════════════════════ */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50">

                        {/* โมเดล 1: ไทย → อังกฤษ */}
                        <ModelCard
                            dir="th-en"
                            name="th-en"
                            color="bg-lime-600"
                            count={thEnCount}
                            minPairs={minPairs}
                            job={jobTh}
                            isLoading={triggerLoading["th-en"]}
                            onTrigger={handleTrigger}
                        />

                        {/* โมเดล 2: อังกฤษ → ไทย */}
                        <ModelCard
                            dir="en-th"
                            name="en-th"
                            color="bg-teal-600"
                            count={enThCount}
                            minPairs={minPairs}
                            job={jobEn}
                            isLoading={triggerLoading["en-th"]}
                            onTrigger={handleTrigger}
                        />

                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        ตารางคำศัพท์ที่ Approved แล้ว
                    ═══════════════════════════════════════════════════════ */}
                    <div className="border-t border-zinc-100">

                        {/* Toolbar ของตาราง */}
                        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-zinc-100 flex-wrap gap-2">
                            <div className="flex items-center gap-1">
                                {(["all", "th-en", "en-th"] as const).map(f => {
                                    const labels = {
                                        all: `ทั้งหมด (${approvedWords.length})`,
                                        "th-en": `ไทย→อังกฤษ (${thEnCount})`,
                                        "en-th": `อังกฤษ→ไทย (${enThCount})`,
                                    }
                                    return (
                                        <button
                                            key={f}
                                            onClick={() => setTableFilter(f)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tableFilter === f
                                                    ? "bg-zinc-100 text-zinc-800"
                                                    : "text-zinc-400 hover:text-zinc-600"
                                                }`}
                                        >
                                            {labels[f]}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowHistory(v => !v)}
                                    className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    {showHistory ? "ซ่อนประวัติเทรน" : "ดูประวัติเทรน"}
                                </button>
                                <button
                                    onClick={() => { fetchApprovedWords(); fetchRetrainStatus() }}
                                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <RefreshCw className={`size-3 ${wordsLoading ? "animate-spin" : ""}`} />
                                    รีเฟรช
                                </button>
                            </div>
                        </div>

                        {/* History table */}
                        {showHistory && retrainStatus && retrainStatus.history.length > 0 && (
                            <div className="border-b border-zinc-100 overflow-x-auto bg-zinc-50/40">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-zinc-400 border-b border-zinc-100 bg-zinc-50/60">
                                            <th className="px-5 py-2 text-left font-medium">โมเดล</th>
                                            <th className="px-5 py-2 text-left font-medium">สถานะ</th>
                                            <th className="px-5 py-2 text-left font-medium hidden sm:table-cell">ผู้สั่ง</th>
                                            <th className="px-5 py-2 text-left font-medium">เวลาที่สั่ง</th>
                                            <th className="px-5 py-2 text-left font-medium hidden md:table-cell">เวลาที่เสร็จ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {retrainStatus.history.map(job => (
                                            <tr key={job.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                                <td className="px-5 py-2.5 font-medium text-zinc-700">
                                                    {job.direction === "th-en" ? "ไทย → อังกฤษ" : "อังกฤษ → ไทย"}
                                                </td>
                                                <td className={`px-5 py-2.5 font-semibold ${JOB_TEXT[job.status] ?? "text-zinc-500"}`}>
                                                    {JOB_LABEL[job.status] ?? job.status}
                                                </td>
                                                <td className="px-5 py-2.5 text-zinc-400 hidden sm:table-cell">{job.triggered_by}</td>
                                                <td className="px-5 py-2.5 text-zinc-400 whitespace-nowrap">
                                                    {fmtDate(job.created_at)}
                                                </td>
                                                <td className="px-5 py-2.5 text-zinc-400 whitespace-nowrap hidden md:table-cell">
                                                    {job.finished_at ? fmtDate(job.finished_at) : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Approved words table */}
                        {wordsLoading ? (
                            <div className="p-5 space-y-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredWords.length === 0 ? (
                            <div className="py-12 text-center text-zinc-400">
                                <p className="text-sm">ยังไม่มีคำที่อนุมัติแล้วในหมวดนี้</p>
                                <p className="text-xs mt-1 text-zinc-300">อนุมัติคำศัพท์ได้ในส่วน "คำศัพท์จากผู้ใช้" ด้านบน</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-zinc-400 border-b border-zinc-100">
                                            <th className="px-5 py-2.5 text-left font-medium w-8">#</th>
                                            <th className="px-5 py-2.5 text-left font-medium">คำศัพท์</th>
                                            <th className="px-5 py-2.5 text-left font-medium">คำแปล</th>
                                            <th className="px-5 py-2.5 text-left font-medium">ทิศทาง</th>
                                            <th className="px-5 py-2.5 text-left font-medium hidden md:table-cell">บริบท</th>
                                            <th className="px-5 py-2.5 text-left font-medium hidden lg:table-cell">วันที่อนุมัติ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredWords.map((word, idx) => (
                                            <tr key={word.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                                <td className="px-5 py-3 text-zinc-300 text-xs">{idx + 1}</td>
                                                <td className="px-5 py-3 font-medium text-zinc-800">{word.word}</td>
                                                <td className="px-5 py-3 text-zinc-600">{word.translation}</td>
                                                <td className="px-5 py-3">
                                                    <DirectionBadge direction={word.direction} />
                                                </td>
                                                <td className="px-5 py-3 text-zinc-400 text-xs max-w-[160px] truncate hidden md:table-cell">
                                                    {word.context ?? "—"}
                                                </td>
                                                <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap hidden lg:table-cell">
                                                    {fmtDate(word.submitted_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default RetrainSection
