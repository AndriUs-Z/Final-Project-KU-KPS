// อ่านข้อความจากไฟล์ .txt (FileReader API) และ .pdf (pdfjs-dist)
import * as pdfjsLib from 'pdfjs-dist'

// ชี้ไปยัง worker ของ pdfjs ที่ bundler จัดการให้
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString()

/**
 * อ่านข้อความจากไฟล์ .txt
 */
export function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve((e.target?.result as string) ?? '')
        reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ .txt ได้'))
        reader.readAsText(file, 'UTF-8')
    })
}

/**
 * อ่านข้อความจากไฟล์ .pdf (ทุก page รวมกัน)
 */
export async function readPdfFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const pageTexts: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ')
        pageTexts.push(pageText)
    }

    return pageTexts.join('\n\n').trim()
}

/**
 * Router รวม: ส่งไฟล์มาแล้วจะเลือก function ที่เหมาะสมเอง
 * รองรับ: .txt | .pdf
 */
export async function extractTextFromFile(file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase()

    switch (ext) {
        case 'txt':
            return readTextFile(file)
        case 'pdf':
            return readPdfFile(file)
        default:
            throw new Error(`ไม่รองรับไฟล์นามสกุล .${ext} (รองรับเฉพาะ .txt และ .pdf)`)
    }
}
