// Presentational component ฟอร์มส่งคำศัพท์ — word ล็อคไม่ให้แก้, translation แก้ได้, เพิ่มบริบทได้
import { Send, Loader2, Cog, Lock } from "lucide-react"
    
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
        <div className="rounded-[24px] bg-white p-[24px] shadow-lg">
            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-[16px] mb-[20px]">
                <div className="flex items-center gap-[12px]">
                    <Cog />
                    <div>
                        <h2 className="text-[18px] font-bold text-zinc-800 leading-tight">
                            แก้ไขคำแปลเพื่อพัฒนาโมเดล
                        </h2>
                        <p className="text-zinc-400 text-[12px] mt-[2px]">
                            ข้อมูลที่ส่งจะช่วยปรับปรุงความแม่นยำของโมเดลแปลภาษาสำหรับศัพท์เฉพาะทางด้านวิทยาการคอมพิวเตอร์
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-[16px]">
                {/* Word (ข้อความต้นฉบับ - LOCKED) */}
                <div>
                    <div className="flex items-center justify-between mb-[6px]">
                        <label className="text-[14px] font-semibold text-zinc-700 flex items-center gap-[4px]">
                            คำศัพท์ ({isSwap ? "ภาษาอังกฤษ" : "ภาษาไทย"})
                            <span className="text-[#FF0000]">*</span>
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={word}
                            readOnly
                            tabIndex={-1}
                            className="w-full rounded-[12px] border border-zinc-200 bg-zinc-100/80 px-[16px] py-[10px] text-[16px] text-zinc-600 pr-[40px] cursor-not-allowed"
                        />
                        <Lock className="absolute right-[14px] top-1/2 -translate-y-1/2 size-[16px] text-zinc-400 pointer-events-none" />
                    </div>
                </div>

                {/* Translation (คำแปล - EDITABLE) */}
                <div>
                    <label className="block text-[14px] font-semibold text-zinc-700 mb-[6px]">
                        คำแปล ({isSwap ? "ภาษาไทย" : "ภาษาอังกฤษ"})
                        <span className="text-[#FF0000] ml-[2px]">*</span>
                    </label>
                    <input
                        type="text"
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                        placeholder="ระบุคำแปลที่ถูกต้อง"
                        className="w-full rounded-[12px] border border-zinc-200 bg-white px-[16px] py-[10px] text-[16px] text-zinc-800 placeholder:text-zinc-400 focus:border-app-green focus:outline-none focus:ring-2 focus:ring-app-green/20 "
                    />
                </div>
            </div>

            {/* Context */}
            <div className="mt-4">
                <label className="block text-[14px] font-semibold text-zinc-700 mb-[6px]">
                    บริบท / ความหมายเพิ่มเติม
                    <span className="ml-[6px] text-[12px] text-zinc-400 font-normal">(ไม่บังคับ)</span>
                </label>
                <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="เช่น ใช้ในด้าน Machine Learning, Network, Database..."
                    className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 px-[16px] py-[10px] text-[14px] placeholder:text-zinc-400 focus:border-app-green focus:outline-none focus:ring-2 focus:ring-app-green/20"
                />
            </div>

            {/* Footer */}
            <div className="mt-[24px] flex items-center justify-between gap-[16px]">
                <button
                    onClick={onClose}
                    className="rounded-[12px] border border-zinc-200 px-[16px] py-[10px] text-[14px] text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting || !word.trim() || !translation.trim()}
                    className="flex items-center gap-[8px] rounded-[12px] bg-app-green px-[24px] py-[10px] text-[14px] font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-[16px] animate-spin" />
                            กำลังส่ง...
                        </>
                    ) : (
                        <>
                            <Send className="size-[16px]" />
                            ส่งเพื่อรออนุมัติ
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default SubmitWordPanel
