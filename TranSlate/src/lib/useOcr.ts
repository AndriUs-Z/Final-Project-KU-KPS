// Custom Hook จัดการอัปโหลดรูปภาพ (OCR) และไฟล์ (.txt/.pdf) — ส่งข้อความที่ได้ไปยัง setInputText
import { useState } from 'react'
import { extractTextFromImage } from './ocr'
import { extractTextFromFile } from './fileReader'

/**
 * useOcr
 * จัดการ state และ logic ทั้งหมดของการอัปโหลดรูปภาพและไฟล์
 *
 * @param onTextExtracted - callback ที่จะเรียกเมื่อดึงข้อความได้แล้ว
 *                          (ใช้เพื่อยัดข้อความเข้า inputText ใน useTranslate)
 */
export function useOcr(onTextExtracted: (text: string) => void) {
    // ---- รูปภาพ ----
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [ocrProgress, setOcrProgress] = useState<number>(0)
    const [isOcrRunning, setIsOcrRunning] = useState(false)

    // ---- ไฟล์ ----
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [isFileReading, setIsFileReading] = useState(false)

    // ---- Error ----
    const [error, setError] = useState<string | null>(null)

    // ============================================================
    // จัดการอัปโหลดรูปภาพ → OCR → ส่งข้อความออก
    // ============================================================
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // แสดง preview ทันที
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)
        setError(null)
        setIsOcrRunning(true)
        setOcrProgress(0)

        try {
            const text = await extractTextFromImage(file, (progress) => {
                setOcrProgress(progress)
            })

            if (text) {
                onTextExtracted(text)
            } else {
                setError('ไม่พบข้อความในรูปภาพนี้')
            }
        } catch (err) {
            console.error('OCR error:', err)
            setError('เกิดข้อผิดพลาดระหว่าง OCR')
        } finally {
            setIsOcrRunning(false)
            setOcrProgress(0)
            // reset input เพื่อให้อัปโหลดรูปเดิมซ้ำได้
            e.target.value = ''
        }
    }

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview)
        setImagePreview(null)
        setError(null)
    }

    // ============================================================
    // จัดการอัปโหลดไฟล์ → อ่านข้อความ → ส่งข้อความออก
    // ============================================================
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadedFile(file)
        setError(null)
        setIsFileReading(true)

        try {
            const text = await extractTextFromFile(file)
            if (text) {
                onTextExtracted(text)
            } else {
                setError('ไม่พบข้อความในไฟล์นี้')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอ่านไฟล์'
            console.error('File read error:', err)
            setError(message)
        } finally {
            setIsFileReading(false)
            e.target.value = ''
        }
    }

    const removeFile = () => {
        setUploadedFile(null)
        setError(null)
    }

    return {
        // รูปภาพ
        imagePreview,
        ocrProgress,
        isOcrRunning,
        handleImageUpload,
        removeImage,
        // ไฟล์
        uploadedFile,
        isFileReading,
        handleFileUpload,
        removeFile,
        // error
        error,
    }
}
