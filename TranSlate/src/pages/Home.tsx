// หน้าหลักสำหรับแปลภาษา — ประกอบด้วยช่อง input/output, upload รูป/ไฟล์, และฟอร์มส่งคำศัพท์
import { useState, useEffect } from "react"
import { ArrowRightLeft, Copy, Check, ImagePlus, FilePlus, Download, Loader2, Lightbulb, ExternalLink } from "lucide-react"
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
    const leftLabel = isSwap ? "English" : "ไทย"
    const rightLabel = isSwap ? "ไทย" : "English"
    const leftPlaceholder = isSwap ? "Type English word..." : "พิมพ์คำศัพท์ภาษาไทย..."
    const rightPlaceholder = isSwap ? "คำแปลภาษาไทย" : "English translation"
    const isLoading = isOcrRunning || isFileReading

    // ── UI ──────────────────────────────────────────────────────
    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-12">
                <h1 className="mt-[24px] text-center text-[96px] font-bold text-app-green"> แปลภาษา</h1>
                <h2 className="mt-[24px] text-center font-semibold text-black/50">
                    แปลคำศัพท์เฉพาะทาง วิทยาการคอมพิวเตอร์ ได้เลย!!
                </h2>

                <div className="mx-auto mt-[48px] w-full max-w-[1024px] rounded-[24px] bg-white p-[24px] shadow-lg">

                    {/* ── ส่วนสลับภาษา ── */}
                    <div className="flex items-center justify-center gap-[32px] mb-[24px]">
                        <p className="w-[128px] text-right text-[20px] font-medium">{leftLabel}</p>
                        <ArrowRightLeft
                            onClick={handleSwap}
                            className={`size-[32px] text-app-green cursor-pointer transition-transform duration-300  ${isSwap ? "rotate-180" : ""}`}
                        />
                        <p className="w-[128px] text-left text-[20px] font-medium">{rightLabel}</p>
                    </div>

                    {/* ── ส่วนช่องพิมพ์ข้อความ ── */}
                    <div className="grid grid-cols-2 gap-[16px]">

                        {/* ── ฝั่งซ้าย (input) ── */}
                        <div className="flex flex-col">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={leftPlaceholder}
                                className="w-full h-[200px] resize-none rounded-[12px] border border-zinc-200 bg-zinc-50 px-[20px] py-[16px] text-[18px] placeholder:text-zinc-500 focus:border-app-green focus:ring-1 focus:ring-app-green focus:outline-none"
                            />

                            {/* Loading OCR */}
                            {isOcrRunning && (
                                <p className="mt-2 text-[14px] text-zinc-400 flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" />
                                    กำลังอ่านข้อความจากรูปภาพ...
                                </p>
                            )}

                            {/* Loading อ่านไฟล์ */}
                            {isFileReading && (
                                <p className="mt-2 text-[14px] text-zinc-400 flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" />
                                    กำลังอ่านข้อความจากไฟล์...
                                </p>
                            )}

                            {/* Error message */}
                            {error && (
                                <p className="mt-2 text-[14px] text-red-500">{error}</p>
                            )}

                            {/* Preview รูปภาพ / ชื่อไฟล์ */}
                            {(imagePreview || uploadedFile) && (
                                <div className="flex items-center gap-[12px] mt-[12px]">
                                    {imagePreview && (
                                        <div className="relative w-fit">
                                            <img
                                                src={imagePreview}
                                                alt="uploaded"
                                                className="h-[96px] rounded-[8px] border border-zinc-200 object-cover"
                                            />
                                            <button
                                                onClick={removeImage}
                                                className="absolute -top-[8px] -right-[8px] flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
                                            >
                                                X
                                            </button>
                                        </div>
                                    )}
                                    {uploadedFile && (
                                        <div className="relative flex items-center gap-[10px] rounded-[8px] border border-zinc-200 bg-zinc-50 px-3 py-2">
                                            <FilePlus className="size-[16px] text-zinc-400" />
                                            <span className="text-[14px] text-zinc-600 max-w-[150px] truncate">
                                                {uploadedFile.name}
                                            </span>
                                            <button
                                                onClick={removeFile}
                                                className="absolute -top-[8px] -right-[8px] flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
                                            >
                                                X
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ปุ่มอัปโหลด + จำนวนตัวอักษร */}
                            <div className="flex items-center justify-between mt-[10px] px-[4px]">
                                <div className="flex items-center gap-[12px]">
                                    {/* ปุ่มรูปภาพ */}
                                    <label className={`flex items-center gap-[12px] text-zinc-400 hover:text-app-green cursor-pointer ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
                                        <ImagePlus className="size-[18px]" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isLoading}
                                        />
                                    </label>
                                    {/* ปุ่มไฟล์ */}
                                    <label className={`flex items-center gap-[12px] text-zinc-400 hover:text-app-green cursor-pointer ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
                                        <FilePlus className="size-[18px]" />
                                        <input
                                            type="file"
                                            accept=".pdf,.txt"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            disabled={isLoading}
                                        />
                                    </label>
                                </div>
                                <span className="text-[14px] text-zinc-400">{inputText.length} ตัวอักษร</span>
                            </div>
                        </div>

                        {/* ── ฝั่งขวา (output) ── */}
                        <div className="flex flex-col">
                            <textarea
                                value={isTranslating ? "กำลังแปล..." : outputText}
                                readOnly
                                placeholder={rightPlaceholder}
                                className={`w-full h-[200px] resize-none rounded-[12px] border border-zinc-200 bg-zinc-100 px-[20px] py-[16px] text-[14px] placeholder:text-zinc-400 cursor-default ${isTranslating ? "text-zinc-400 italic" : "text-zinc-800"
                                    }`}
                            />
                            <div className="flex items-center justify-end gap-[12px] mt-[12px] px-[4px]">
                                <button
                                    onClick={handleDownload}
                                    disabled={!outputText || isTranslating}
                                    className="flex items-center gap-[4px] text-[14px] text-zinc-400 hover:text-app-green cursor-pointer"
                                >
                                    <Download className="size-[16px]" />
                                    ดาวน์โหลด .txt
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={!outputText || isTranslating}
                                    className="flex items-center gap-[4px] text-[14px] text-zinc-400 hover:text-app-green cursor-pointer "
                                >
                                    {copied ? <Check className="size-[16px]" /> : <Copy className="size-[16px]" />}
                                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
                {/* ── Step 1: Prompt Banner (แบนเนอร์ถามผู้ใช้งาน) ── */}
                {outputText && !isTranslating && showPrompt && !showPanel && (
                    <div
                        className="mx-auto mt-[12px] w-full max-w-[700px] animate-slide-down"
                    >
                        <div className="flex items-center justify-between gap-[12px] rounded-[8px] bg-white px-[16px] py-[12px] shadow-lg ">
                            <div className="flex items-center gap-[12px]">
                                <Lightbulb />
                                <div>
                                    <p className="text-[16px] font-semibold text-app-green">
                                        อยากแก้ไขคำศัพท์นี้เพื่อพัฒนาโมเดลหรือไม่?
                                    </p>
                                    <p className="text-xs text-app-green/80">
                                        ร่วมแบ่งปันคำแปลที่ถูกต้องเพื่อพัฒนาโมเดลภาษาทางวิทยาการคอมพิวเตอร์
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-[12px] shrink-0">
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            toast.error("กรุณาเข้าสู่ระบบก่อนส่งคำศัพท์")
                                            return
                                        }
                                        setShowPanel(true)
                                        setShowPrompt(false)
                                    }}
                                    className="rounded-[8px] bg-app-green px-[20px] py-[8px] text-sm font-semibold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
                                >
                                    ใช่
                                </button>
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="rounded-[8px] border border-zinc-200 bg-white px-[16px] py-[8px] text-sm font-medium text-zinc-600 hover:bg-zinc-50 active:scale-95 transition-all"
                                >
                                    ไม่ใช่
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Submit Word Panel (ฟอร์มแก้ไขคำศัพท์ต่อท้ายด้านล่างแบบเดิม) ── */}
                {user && outputText && showPanel && (
                    <div className="mx-auto mt-[48px] w-full max-w-[1080px] animate-slide-down">
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
                <div className="mt-[32px] flex justify-center">
                    <a
                        href="https://github.com/AndriUs-Z/translate-extension#readme"
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-[6px] text-[14px] font-medium text-zinc-500 hover:text-app-green underline underline-offset-4 transition-colors"
                    >
                        ติดตั้งส่วนขยายแปลหน้าเว็บ
                        <ExternalLink className="size-[14px]" />
                    </a>
                </div>
            </main>
        </>
    )
}

export default Home