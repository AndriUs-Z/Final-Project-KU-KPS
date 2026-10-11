import { useState, useEffect, useRef } from "react"
import { ArrowRightLeft, Copy, Check, ImagePlus, FilePlus, Download } from "lucide-react"
import Navbar from "../components/Navbar"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import { translateText } from "../lib/translate"

const Home = () => {
    const { user } = useAuth()
    const [isSwap, setIsSwap] = useState(false)
    const [inputText, setInputText] = useState("")
    const [outputText, setOutputText] = useState("")
    const [copied, setCopied] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // ใช้ ref เก็บ AbortController เพื่อ cancel request เก่าเมื่อพิมพ์ใหม่
    const abortRef = useRef<AbortController | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ============================================================
    // Auto-translate: พิมพ์แล้วแปลอัตโนมัติ (debounce 600ms)
    // ============================================================
    useEffect(() => {
        const text = inputText.trim()

        // ถ้าลบข้อความจนหมด → เคลียร์ผลแปล
        if (!text) {
            setOutputText("")
            return
        }

        // คำนวณ direction ตอนนี้เลย (ป้องกัน stale closure ใน setTimeout)
        const direction = isSwap ? "en-th" : "th-en"

        // เคลียร์ timer เก่า
        if (debounceRef.current) clearTimeout(debounceRef.current)

        // ตั้ง timer ใหม่ — รอ 600ms หลังหยุดพิมพ์
        debounceRef.current = setTimeout(() => {
            handleTranslate(text, direction)
        }, 600)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [inputText, isSwap])

    // ============================================================
    // เรียก API แปลภาษา
    // ============================================================
    const handleTranslate = async (text: string, direction: "th-en" | "en-th") => {
        // Cancel request เก่าที่ยังค้างอยู่
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        try {
            const result = await translateText(text, direction, controller.signal)
            setOutputText(result)

            // บันทึกประวัติลง Supabase (ถ้า login อยู่)
            if (user) {
                await supabase.from("translation_history").insert({
                    user_id: user.id,
                    input_text: text,
                    output_text: result,
                    direction,
                    translated_at: new Date().toISOString(),
                })
            }
        } catch (err) {
            // ถ้าเป็น abort (พิมพ์ใหม่ระหว่างรอ) → ไม่ต้องแจ้ง error
            if (err instanceof DOMException && err.name === "AbortError") return
            console.error("Translation error:", err)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setImagePreview(url)
    }

    const removeImage = () => {
        setImagePreview(null)
    }

    const [uploadedFile, setUploadedFile] = useState<File | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadedFile(file)
    }

    const removeFile = () => {
        setUploadedFile(null)
    }

    const handleCopy = () => {
        if (!outputText) return
        navigator.clipboard.writeText(outputText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ดาวน์โหลดผลแปลเป็นไฟล์ .txt
    const handleDownload = () => {
        if (!outputText) return
        const content = `ข้อความต้นฉบับ:\n${inputText}\n\nคำแปล:\n${outputText}`
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `translation_${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleswap = () => {
        setIsSwap(!isSwap)
    }

    const leftLabel = isSwap ? "ภาษาอังกฤษ" : "ภาษาไทย"
    const rightLabel = isSwap ? "ภาษาไทย" : "ภาษาอังกฤษ"
    const leftPlaceholder = isSwap ? "Type English word..." : "พิมพ์คำศัพท์ภาษาไทย..."
    const rightPlaceholder = isSwap ? "คำแปลภาษาไทย" : "English translation"

    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-12">
                <h1 className="mt-8 text-center text-8xl font-bold text-app-green"> แปลภาษา</h1>
                <h2 className="mt-6 text-center text-l font-semibold text-black/50">แปลคำศัพท์เฉพาะทาง วิทยาการคอมพิวเตอร์ ได้เลย!!</h2>

                <div className="mx-auto mt-12 w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
                    {/* ส่วนสลับภาษา */}
                    <div className="flex items-center justify-center gap-8 mb-6">
                        <p className="w-32 text-right text-xl font-medium">{leftLabel}</p>
                        <ArrowRightLeft
                            onClick={handleswap}
                            className={`size-8 shrink-0 text-app-green cursor-pointer transition-transform duration-300 active:scale-75 ${isSwap ? "rotate-180" : ""}`}
                        />
                        <p className="w-32 text-left text-xl font-medium">{rightLabel}</p>
                    </div>

                    {/* ส่วนช่องพิมพ์ข้อความ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ฝั่งซ้าย */}
                        <div className="flex flex-col">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={leftPlaceholder}
                                className="w-full h-48 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-lg placeholder:text-zinc-400 focus:border-app-green focus:ring-1 focus:ring-app-green"
                            />
                            {/* แสดงตัวอย่างรูปภาพ / ไฟล์ */}
                            {(imagePreview || uploadedFile) && (
                                <div className="flex items-center gap-3 mt-3">
                                    {imagePreview && (
                                        <div className="relative w-fit">
                                            <img src={imagePreview} alt="uploaded" className="h-24 rounded-lg border border-zinc-200 object-cover" />
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
                                            <span className="text-sm text-zinc-600 max-w-[150px] truncate">{uploadedFile.name}</span>
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
                            <div className="flex items-center justify-between mt-2 px-1">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green cursor-pointer">
                                        <ImagePlus className="size-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <label className="flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green cursor-pointer">
                                        <FilePlus className="size-4" />
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.txt"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <span className="text-sm text-zinc-400">{inputText.length} ตัวอักษร</span>
                            </div>
                        </div>

                        {/* ฝั่งขวา */}
                        <div className="flex flex-col">
                            <textarea
                                value={outputText}
                                readOnly
                                placeholder={rightPlaceholder}
                                className="w-full h-48 resize-none rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-4 text-lg placeholder:text-zinc-400 cursor-default"
                            />
                            <div className="flex items-center justify-end gap-3 mt-2 px-1">
                                <button
                                    onClick={handleDownload}
                                    disabled={!outputText}
                                    className="flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green disabled:hover:text-zinc-400"
                                >
                                    <Download className="size-4" />
                                    ดาวน์โหลด .txt
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={!outputText}
                                    className="flex items-center gap-1 text-sm text-zinc-400 hover:text-app-green disabled:hover:text-zinc-400"
                                >
                                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

            </main>
        </>
    )
}

export default Home