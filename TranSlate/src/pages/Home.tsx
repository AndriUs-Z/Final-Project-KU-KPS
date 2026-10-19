import { useState, useEffect } from "react"
import { ArrowRightLeft, Copy, Check, ImagePlus, FilePlus, Download, Loader2, Lightbulb } from "lucide-react"
import Navbar from "../components/Navbar"
import SubmitWordPanel from "../components/SubmitWordPanel"
import { useTranslate } from "../lib/useTranslate"
import { useOcr } from "../lib/useOcr"
import { useSubmitWord } from "../lib/useSubmitWord"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

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
        handleCopy,
        handleDownload,
        copied,
    } = useTranslate()

    // ── Hook 2: logic รูปภาพ + ไฟล์ ────────────────────────────
    const {
        imagePreview,
        ocrProgress,
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

    // ── State UX 2 ขั้นตอน ─────────────────────────────────────
    const [showPrompt, setShowPrompt] = useState(false)
    const [showPanel, setShowPanel] = useState(false) // เปลี่ยนค่าเริ่มต้นเป็น false

    // เมื่อมีผลแปลใหม่ → รีเซ็ตให้แสดง Prompt และซ่อน Panel
    useEffect(() => {
        if (outputText) {
            setShowPrompt(true)
            setShowPanel(false) // ซ่อน panel เมื่อมีการแปลคำใหม่
        } else {
            setShowPrompt(false)
            setShowPanel(false)
        }
    }, [outputText])

    // ── computed values ─────────────────────────────────────────
    const leftLabel = isSwap ? "ภาษาอังกฤษ" : "ภาษาไทย"
    const rightLabel = isSwap ? "ภาษาไทย" : "ภาษาอังกฤษ"
    const leftPlaceholder = isSwap ? "Type English word..." : "พิมพ์คำศัพท์ภาษาไทย..."
    const rightPlaceholder = isSwap ? "คำแปลภาษาไทย" : "English translation"
    const isLoading = isOcrRunning || isFileReading

    // ── UI ──────────────────────────────────────────────────────
    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-12">
                <h1 className="mt-8 text-center text-8xl font-bold text-app-green"> แปลภาษา</h1>
                <h2 className="mt-6 text-center text-l font-semibold text-black/50">
                    แปลคำศัพท์เฉพาะทาง วิทยาการคอมพิวเตอร์ ได้เลย!!
                </h2>

                <div className="mx-auto mt-12 w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">

                    {/* ── ส่วนสลับภาษา ── */}
                    <div className="flex items-center justify-center gap-8 mb-6">
                        <p className="w-32 text-right text-xl font-medium">{leftLabel}</p>
                        <ArrowRightLeft
                            onClick={handleSwap}
                            className={`size-8 shrink-0 text-app-green cursor-pointer transition-transform duration-300 active:scale-75 ${isSwap ? "rotate-180" : ""}`}
                        />
                        <p className="w-32 text-left text-xl font-medium">{rightLabel}</p>
                    </div>

                    {/* ── ส่วนช่องพิมพ์ข้อความ ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* ── ฝั่งซ้าย (input) ── */}
                        <div className="flex flex-col">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={leftPlaceholder}
                                className="w-full h-48 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-lg placeholder:text-zinc-400 focus:border-app-green focus:ring-1 focus:ring-app-green"
                            />

                            {/* Progress bar OCR */}
                            {isOcrRunning && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                                            <Loader2 className="size-3 animate-spin" />
                                            กำลังอ่านข้อความจากรูปภาพ...
                                        </span>
                                        <span className="text-xs text-app-green font-medium">{ocrProgress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-app-green rounded-full transition-all duration-300"
                                            style={{ width: `${ocrProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Loading อ่านไฟล์ */}
                            {isFileReading && (
                                <p className="mt-2 text-xs text-zinc-400 flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" />
                                    กำลังอ่านข้อความจากไฟล์...
                                </p>
                            )}

                            {/* Error message */}
                            {error && (
                                <p className="mt-2 text-xs text-red-500">{error}</p>
                            )}

                            {/* Preview รูปภาพ / ชื่อไฟล์ */}
                            {(imagePreview || uploadedFile) && (
                                <div className="flex items-center gap-3 mt-3">
                                    {imagePreview && (
                                        <div className="relative w-fit">
                                            <img
                                                src={imagePreview}
                                                alt="uploaded"
                                                className="h-24 rounded-lg border border-zinc-200 object-cover"
                                            />
                                            <button
                                                onClick={removeImage}
                                                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    {uploadedFile && (
                                        <div className="relative flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                                            <FilePlus className="size-4 text-zinc-400" />
                                            <span className="text-sm text-zinc-600 max-w-[150px] truncate">
                                                {uploadedFile.name}
                                            </span>
                                            <button
                                                onClick={removeFile}
                                                className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ปุ่มอัปโหลด + จำนวนตัวอักษร */}
                            <div className="flex items-center justify-between mt-2 px-1">
                                <div className="flex items-center gap-3">
                                    {/* ปุ่มรูปภาพ */}
                                    <label className={`flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green cursor-pointer ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
                                        <ImagePlus className="size-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isLoading}
                                        />
                                    </label>
                                    {/* ปุ่มไฟล์ */}
                                    <label className={`flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green cursor-pointer ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
                                        <FilePlus className="size-4" />
                                        <input
                                            type="file"
                                            accept=".pdf,.txt"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            disabled={isLoading}
                                        />
                                    </label>
                                </div>
                                <span className="text-sm text-zinc-400">{inputText.length} ตัวอักษร</span>
                            </div>
                        </div>

                        {/* ── ฝั่งขวา (output) ── */}
                        <div className="flex flex-col">
                            <textarea
                                value={isTranslating ? "กำลังแปล..." : outputText}
                                readOnly
                                placeholder={rightPlaceholder}
                                className={`w-full h-48 resize-none rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-4 text-lg placeholder:text-zinc-400 cursor-default ${isTranslating ? "text-zinc-400 italic" : "text-zinc-800"
                                    }`}
                            />
                            <div className="flex items-center justify-end gap-3 mt-2 px-1">
                                <button
                                    onClick={handleDownload}
                                    disabled={!outputText || isTranslating}
                                    className="flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green disabled:hover:text-zinc-400 disabled:opacity-50"
                                >
                                    <Download className="size-4" />
                                    ดาวน์โหลด .txt
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={!outputText || isTranslating}
                                    className="flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green disabled:hover:text-zinc-400 disabled:opacity-50"
                                >
                                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
                {/* ── Step 1: Prompt Banner (แบนเนอร์ถามผู้ใช้งาน) ── */}
                {outputText && !isTranslating && showPrompt && !showPanel && (
                    <div
                        className="mx-auto mt-6 w-full max-w-5xl animate-slide-down"
                    >
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm ">
                            <div className="flex items-center gap-3">
                                <Lightbulb />
                                <div>
                                    <p className="text-base font-semibold text-emerald-950">
                                        อยากแก้ไขคำศัพท์นี้เพื่อพัฒนาโมเดลหรือไม่?
                                    </p>
                                    <p className="text-xs text-emerald-700/80">
                                        ร่วมแบ่งปันคำแปลที่ถูกต้องเพื่อพัฒนาโมเดลภาษาทางวิทยาการคอมพิวเตอร์
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            toast.error("กรุณาเข้าสู่ระบบก่อนส่งคำศัพท์")
                                            return
                                        }
                                        setShowPanel(true)
                                        setShowPrompt(false)
                                    }}
                                    className="rounded-xl bg-app-green px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                                >
                                    ใช่
                                </button>
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all"
                                >
                                    ไม่ใช่
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Submit Word Panel (ฟอร์มแก้ไขคำศัพท์ต่อท้ายด้านล่างแบบเดิม) ── */}
                {user && outputText && showPanel && (
                    <div className="mx-auto mt-6 w-full max-w-5xl animate-slide-down">
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
            </main>
        </>
    )
}

export default Home