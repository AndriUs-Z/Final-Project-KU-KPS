// Presentational component ฟอร์มส่งคำศัพท์ — word ล็อคไม่ให้แก้, translation แก้ได้, เพิ่มบริบทได้
import { Send, X, Loader2, Cog, Sparkles, Lock } from "lucide-react"

interface SubmitWordPanelProps {
    word: string
    translation: string
    setTranslation: (v: string) => void
    context: string
    setContext: (v: string) => void
    isSubmitting: boolean
    isSwap?: boolean
    onSubmit: () => void
    onClose: () => void
}

/**
 * SubmitWordPanel
 * พาเนลแสดงด้านล่างกล่องแปล ให้ผู้ใช้แก้ไขคำแปลเพื่อส่งไปพัฒนาโมเดล
 * - ส่วนของ Word (ข้อความต้นฉบับ) ถูกล็อคไม่ให้แก้ไข
 * - ส่วนของ Translation (คำแปล) สามารถแก้ไขได้
 */
const SubmitWordPanel = ({
    word,
    translation,
    setTranslation,
    context,
    setContext,
    isSubmitting,
    isSwap = false,
    onSubmit,
    onClose,
}: SubmitWordPanelProps) => {

    return (
        <div className="rounded-3xl bg-white p-6 shadow-xl border border-zinc-100">
            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
                <div className="flex items-center gap-3">
                    <Cog />
                    <div>
                        <h2 className="text-lg font-bold text-zinc-800 leading-tight">
                            แก้ไขคำแปลเพื่อพัฒนาโมเดล
                        </h2>
                        <p className="text-zinc-400 text-xs mt-0.5">
                            คำศัพท์ที่ส่งจะถูกส่งไปยัง Admin Dashboard เพื่อรอการอนุมัติ
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                    aria-label="ปิดพาเนล"
                >
                    <X className="size-5" />
                </button>
            </div>

            {/* ── คำอธิบาย ── */}
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 mb-5">
                <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                    ข้อมูลที่ส่งจะช่วยปรับปรุงความแม่นยำของโมเดลแปลภาษาสำหรับศัพท์เฉพาะทางด้านวิทยาการคอมพิวเตอร์
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Word (ข้อความต้นฉบับ - LOCKED) */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-1">
                            คำศัพท์ ({isSwap ? "ภาษาอังกฤษ" : "ภาษาไทย"})
                            <span className="text-red-400">*</span>
                        </label>
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                            <Lock className="size-3" />
                            ล็อคต้นฉบับ
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={word}
                            readOnly
                            tabIndex={-1}
                            placeholder="ข้อความต้นฉบับ"
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-4 py-2.5 text-base text-zinc-600 placeholder:text-zinc-400 cursor-not-allowed select-none focus:outline-none focus:ring-0 transition-all pr-10"
                        />
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                    </div>
                </div>

                {/* Translation (คำแปล - EDITABLE) */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                        คำแปล ({isSwap ? "ภาษาไทย" : "ภาษาอังกฤษ"})
                        <span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <input
                        type="text"
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                        placeholder="ระบุคำแปลที่ถูกต้อง"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-base text-zinc-800 placeholder:text-zinc-400 focus:border-app-green focus:outline-none focus:ring-2 focus:ring-app-green/20 transition-all"
                    />
                </div>
            </div>

            {/* Context */}
            <div className="mt-4">
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                    บริบท / ความหมายเพิ่มเติม
                    <span className="ml-1.5 text-xs text-zinc-400 font-normal">(ไม่บังคับ)</span>
                </label>
                <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="เช่น ใช้ในด้าน Machine Learning, Network, Database..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm placeholder:text-zinc-400 focus:border-app-green focus:outline-none focus:ring-2 focus:ring-app-green/20 transition-all"
                />
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between gap-4">
                <button
                    onClick={onClose}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting || !word.trim() || !translation.trim()}
                    className="flex items-center gap-2 rounded-xl bg-app-green px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            กำลังส่ง...
                        </>
                    ) : (
                        <>
                            <Send className="size-4" />
                            ส่งเพื่อรออนุมัติ
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default SubmitWordPanel
