const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
    console.warn('Missing VITE_API_URL in .env — translation API will use mock data for now.')
}

/**
 * เรียก API แปลภาษา (โมเดลที่เทรนเอง บน Render)
 */
export async function translateText(
    text: string,
    direction: 'th-en' | 'en-th',
    signal?: AbortSignal
): Promise<string> {
    
    // 💡 ถ้ายั้งไม่ได้ตั้งค่า API_URL ให้ใช้ระบบจำลอง (Mock) ไปก่อน เพื่อให้เห็นภาพการทำงาน
    if (!API_URL) {
        // จำลองเวลาโหลด API 0.5 วินาที
        await new Promise(resolve => setTimeout(resolve, 500))
        return direction === 'th-en' 
            ? `[Mock] แปลว่า: ${text} (ภาษาอังกฤษ)` 
            : `[Mock] แปลว่า: ${text} (ภาษาไทย)`
    }

    try {
        const response = await fetch(`${API_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, direction }),
            signal,
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => null)
            throw new Error(errData?.detail || `API Error: ${response.status}`)
        }

        const data = await response.json()

        // ★ รองรับหลายรูปแบบ response จาก API
        return (
            data.translated ??
            data.translated_text ??
            data.translation ??
            data.result ??
            data.output ??
            data.text ??
            JSON.stringify(data)
        )
    } catch (err) {
        // กรณีเกิด error (เช่น server ปิดอยู่) และไม่ใช่การ abort ให้แสดง mock ไปก่อน
        if (err instanceof DOMException && err.name === "AbortError") {
            throw err
        }
        console.error("Translation API failed, using mock instead:", err)
        return `[ระบบจำลอง] ไม่สามารถต่อ API ได้: ${text}`
    }
}
