import Tesseract from 'tesseract.js'

/**
 * OCR: ดึงข้อความจากรูปภาพโดยใช้ Tesseract.js
 * รองรับภาษาไทย + อังกฤษ
 *
 * @param file       - ไฟล์รูปภาพที่ผู้ใช้อัปโหลด
 * @param onProgress - callback รับ progress 0–100 (optional)
 * @returns ข้อความที่ดึงได้จากรูป
 */
export async function extractTextFromImage(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    const result = await Tesseract.recognize(file, 'tha+eng', {
        logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
                onProgress(Math.round(m.progress * 100))
            }
        },
    })

    return result.data.text.trim()
}
