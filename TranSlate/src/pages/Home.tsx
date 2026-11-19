// หน้าหลักสำหรับแปลภาษา — ประกอบด้วยช่อง input, การ์ดผลแปล, upload รูป/ไฟล์, และฟอร์มเสนอคำแปล
import { useState, useEffect, useRef } from "react"
import { ArrowRightLeft, Check, FileText, Loader2, X, ArrowUpRight } from "lucide-react"
import Navbar from "../components/Navbar"
import SubmitWordPanel from "../components/SubmitWordPanel"
import { useTranslate } from "../lib/useTranslate"
import { useOcr } from "../lib/useOcr"
import { useSubmitWord } from "../lib/useSubmitWord"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

const MAX_CHARS = 5000

const Home = () => {
    const { user } = useAuth()

    // ── Hook 1: logic แปลภาษาทั้งหมด ──────────────────────────
    const {
        inputText,
        setInputText,
        outputText,
        isTranslating,
        isSwap,
        handleSwap,
        translateNow,
        handleClear,
        handleCopy,
        handleDownload,
        copied,
    } = useTranslate()

    // ── Hook 2: logic รูปภาพ + ไฟล์ ────────────────────────────
    const {
        imagePreview,
        isOcrRunning,
        handleImageUpload,
        removeImage,
        uploadedFile,
        isFileReading,
        handleFileUpload,
        removeFile,
        error,
    } = useOcr(setInputText)

    // ── Hook 3: ส่งคำศัพท์เพื่อรออนุมัติ ──────────────────────
    const {
        word,
        translation,
        setTranslation,
        context,
        setContext,
        isSubmitting,
        handleSubmit,
    } = useSubmitWord(inputText, outputText, isSwap)

    // ── แสดงฟอร์มเสนอคำแปล ─────────────────────────────────────
    const [showPanel, setShowPanel] = useState(false)

    // เมื่อมีผลแปลใหม่ → ซ่อนฟอร์ม
    useEffect(() => {
        setShowPanel(false)
    }, [outputText])

    // textarea ขยายความสูงตามเนื้อหา
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${Math.min(el.scrollHeight, 320)}px`
    }, [inputText])

    // ── computed values ─────────────────────────────────────────
    const targetLabel = isSwap ? "ไทย" : "English"
    const placeholder = isSwap ? "Type English text..." : "พิมพ์ข้อความภาษาไทย..."
    const isLoading = isOcrRunning || isFileReading
    const hasResult = !!outputText || isTranslating

    // guest กดอัปโหลด → ไม่เปิดหน้าต่างเลือกไฟล์ + แจ้งให้ login
    const requireLogin = (e: React.MouseEvent<HTMLInputElement>) => {
        if (user) return
        e.preventDefault()
        toast.error("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพหรือไฟล์")
    }

    const handleClearAll = () => {
        handleClear()
        if (imagePreview) removeImage()
        if (uploadedFile) removeFile()
    }

    const openSuggest = () => {
        if (!user) {
            toast.error("กรุณาเข้าสู่ระบบก่อนเสนอคำแปล")
            return
        }
        setShowPanel(true)
    }

    // ปุ่มเลือกภาษาแบบ pill
    const langBtn = (active: boolean) =>
        `rounded-full px-[18px] py-[8px] text-[14px] font-semibold transition-colors ${active ? "bg-app-green text-white" : "text-app-green hover:bg-black/5"
        }`

    const toolBtn =
        "flex items-center gap-[4px] rounded-[8px] px-[8px] py-[6px] text-[13px] text-zinc-600 hover:bg-zinc-100 hover:text-app-green cursor-pointer"

    // ── UI ──────────────────────────────────────────────────────
    return (
        <>
            <Navbar />
            <main className="min-h-screen px-[16px] pb-[48px]">
                <h1 className="mt-[24px] text-center text-[56px] md:text-[72px] font-bold leading-tight text-app-green">
                    แปลภาษา
                </h1>
                <p className="mt-[8px] text-center text-[15px] font-semibold text-app-green/80">
                    แปลทั้งประโยค และเข้าใจศัพท์วิทยาการคอมพิวเตอร์ทีละคำ
                </p>

                <div className="mx-auto mt-[32px] w-full max-w-[1024px] space-y-[16px]">

                    {/* ── การ์ดช่องพิมพ์ข้อความ ── */}
                    <section className="rounded-[24px] bg-white px-[20px] pt-[16px] pb-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">

                        {/* ส่วนสลับภาษา */}
                        <div className="inline-flex items-center gap-[4px] rounded-full bg-[#f1ede4] p-[3px]">
                            <button onClick={() => isSwap && handleSwap()} className={langBtn(!isSwap)}>
                                ไทย
                            </button>
                            <button
                                onClick={handleSwap}
                                aria-label="สลับภาษา"
                                className="flex size-[32px] items-center justify-center rounded-full text-app-green hover:bg-black/5"
                            >
                                <ArrowRightLeft className={`size-[16px] transition-transform duration-300 ${isSwap ? "rotate-180" : ""}`} />
                            </button>
                            <button onClick={() => !isSwap && handleSwap()} className={langBtn(isSwap)}>
                                English
                            </button>
                        </div>

                        {/* ช่องพิมพ์ */}
                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            maxLength={MAX_CHARS}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) translateNow()
                            }}
                            placeholder={placeholder}
                            rows={1}
                            className="mt-[12px] block min-h-[48px] w-full resize-none bg-transparent px-[4px] py-[8px] text-[18px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                        />

                        {/* สถานะ / error */}
                        {isOcrRunning && (
                            <p className="flex items-center gap-1 px-[4px] text-[13px] text-zinc-400">
                                <Loader2 className="size-3 animate-spin" />
                                กำลังอ่านข้อความจากรูปภาพ...
                            </p>
                        )}
                        {isFileReading && (
                            <p className="flex items-center gap-1 px-[4px] text-[13px] text-zinc-400">
                                <Loader2 className="size-3 animate-spin" />
                                กำลังอ่านข้อความจากไฟล์...
                            </p>
                        )}
                        {error && <p className="px-[4px] text-[13px] text-red-500">{error}</p>}

                        {/* Preview รูปภาพ / ชื่อไฟล์ */}
                        {(imagePreview || uploadedFile) && (
                            <div className="mt-[8px] flex items-center gap-[12px] px-[4px]">
                                {imagePreview && (
                                    <div className="relative w-fit">
                                        <img
                                            src={imagePreview}
                                            alt="uploaded"
                                            className="h-[72px] rounded-[8px] border border-zinc-200 object-cover"
                                        />
                                        <button
                                            onClick={removeImage}
                                            className="absolute -top-[8px] -right-[8px] flex size-[18px] items-center justify-center rounded-full bg-app-green text-white"
                                        >
                                            <X className="size-[12px]" />
                                        </button>
                                    </div>
                                )}
                                {uploadedFile && (
                                    <div className="relative flex items-center gap-[8px] rounded-[8px] border border-zinc-200 bg-zinc-50 px-3 py-2">
                                        <FileText className="size-[16px] text-zinc-400" />
                                        <span className="max-w-[160px] truncate text-[13px] text-zinc-600">
                                            {uploadedFile.name}
                                        </span>
                                        <button
                                            onClick={removeFile}
                                            className="absolute -top-[8px] -right-[8px] flex size-[18px] items-center justify-center rounded-full bg-app-green text-white"
                                        >
                                            <X className="size-[12px]" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* แถบเครื่องมือ */}
                        <div className="mt-[8px] flex items-center justify-between border-t border-[#ece6da] pt-[10px]">
                            <div className="flex items-center gap-[4px]">
                                <label className={`${toolBtn} ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
                                    รูปภาพ
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onClick={requireLogin}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                </label>
                                <label className={`${toolBtn} ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
                                    ไฟล์
                                    <input
                                        type="file"
                                        accept=".pdf,.txt"
                                        onClick={requireLogin}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                </label>
                                <button
                                    onClick={handleClearAll}
                                    disabled={!inputText && !imagePreview && !uploadedFile}
                                    className={`${toolBtn} disabled:pointer-events-none disabled:opacity-40`}
                                >
                                    ล้าง
                                    <X className="size-[14px]" />
                                </button>
                            </div>

                            <div className="flex items-center gap-[16px]">
                                <span className="text-[13px] text-zinc-500">
                                    {inputText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                                </span>
                                <button
                                    onClick={translateNow}
                                    disabled={!inputText.trim() || isTranslating}
                                    className="flex min-w-[72px] items-center justify-center rounded-full bg-app-green px-[24px] py-[10px] text-[15px] font-semibold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isTranslating ? <Loader2 className="size-[18px] animate-spin" /> : "แปล"}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ── การ์ดผลแปล ── */}
                    {hasResult && (
                        <section className="animate-slide-down rounded-[24px] bg-app-green px-[24px] py-[24px] text-white">
                            <p className="text-[12px] font-semibold tracking-wide text-[#c9e4b8]">
                                คำแปลทั้งประโยค · {targetLabel.toUpperCase()}
                            </p>
                            {isTranslating ? (
                                <p className="mt-[10px] flex items-center gap-[10px] text-[20px] text-white/60">
                                    <Loader2 className="size-[20px] animate-spin" />
                                    กำลังแปล...
                                </p>
                            ) : (
                                <p
                                    className={`mt-[8px] whitespace-pre-wrap break-words font-semibold leading-snug ${outputText.length > 120 ? "text-[20px]" : "text-[28px]"
                                        }`}
                                >
                                    {outputText}
                                </p>
                            )}
                            <div className="mt-[18px] flex items-center gap-[8px]">
                                <button
                                    onClick={handleCopy}
                                    disabled={!outputText || isTranslating}
                                    className="flex items-center gap-[6px] rounded-[8px] bg-white px-[16px] py-[8px] text-[13px] font-semibold text-app-green hover:bg-white/90 disabled:opacity-50"
                                >
                                    {copied && <Check className="size-[14px]" />}
                                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={!outputText || isTranslating}
                                    className="rounded-[8px] border border-white/40 px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-white/10 disabled:opacity-50"
                                >
                                    ดาวน์โหลด .txt
                                </button>
                            </div>
                        </section>
                    )}

                    {/* ── แบนเนอร์เสนอคำแปล ── */}
                    {outputText && !isTranslating && !showPanel && (
                        <section className="animate-slide-down flex flex-col gap-[12px] rounded-[16px] border border-dashed border-zinc-400/70 bg-white px-[16px] py-[12px] sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[13px] text-zinc-600">
                                <span className="text-[14px] font-bold text-app-green">คำแปลไม่ถูกต้อง?</span>{" "}
                                ส่ง Feed Back เพื่อช่วยพัฒนาโมเดลแปลภาษา
                            </p>
                            <button
                                onClick={openSuggest}
                                className="shrink-0 rounded-[8px] bg-app-green px-[18px] py-[8px] text-[14px] font-semibold text-white hover:opacity-90 active:scale-95"
                            >
                                เสนอคำแปล
                            </button>
                        </section>
                    )}

                    {/* ── ฟอร์มเสนอคำแปล ── */}
                    {user && outputText && showPanel && (
                        <div className="animate-slide-down">
                            <SubmitWordPanel
                                word={word}
                                translation={translation}
                                setTranslation={setTranslation}
                                isSwap={isSwap}
                                context={context}
                                setContext={setContext}
                                isSubmitting={isSubmitting}
                                onSubmit={async () => {
                                    await handleSubmit()
                                    setShowPanel(false)
                                }}
                                onClose={() => setShowPanel(false)}
                            />
                        </div>
                    )}

                    {/* ── ลิงก์ส่วนขยายแปลหน้าเว็บ ── */}
                    <div className="flex justify-center pt-[16px]">
                        <a
                            href="https://github.com/AndriUs-Z/translate-extension#readme"
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-[4px] text-[13px] font-medium text-app-green underline underline-offset-4 hover:opacity-80"
                        >
                            ติดตั้งส่วนขยายแปลหน้าเว็บ
                            <ArrowUpRight className="size-[13px]" />
                        </a>
                    </div>
                </div>
            </main>
        </>
    )
}

export default Home
