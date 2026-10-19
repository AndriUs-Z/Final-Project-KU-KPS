const API_TH_EN_URL = (import.meta.env.VITE_API_TH_EN_URL || import.meta.env.VITE_API_URL || '').trim()
const API_EN_TH_URL = (import.meta.env.VITE_API_EN_TH_URL || import.meta.env.VITE_API_URL || '').trim()

function getEndpointUrl(baseUrl: string): string {
    const cleaned = baseUrl.replace(/\/+$/, '')
    // ถ้าลงท้ายด้วย path เช่น /translate หรือ /predict อยู่แล้ว ให้ใช้ตามนั้น
    if (/\/translate$|\/predict$/i.test(cleaned)) {
        return cleaned
    }
    return `${cleaned}/translate`
}

/**
 * เรียก API แปลภาษา (แยกตามทิศทางการแปล th-en หรือ en-th)
 */
export async function translateText(
    text: string,
    direction: 'th-en' | 'en-th',
    signal?: AbortSignal
): Promise<string> {
    const targetBaseUrl = direction === 'th-en' ? API_TH_EN_URL : API_EN_TH_URL

    // 💡 ถ้ายังไม่ได้ตั้งค่า API URL ให้ใช้ระบบจำลอง (Mock) ไปก่อน
    if (!targetBaseUrl) {
        // จำลองเวลาโหลด API 0.5 วินาที
        await new Promise(resolve => setTimeout(resolve, 500))
        return direction === 'th-en' 
            ? `[Mock] แปลว่า: ${text} (ภาษาอังกฤษ)` 
            : `[Mock] แปลว่า: ${text} (ภาษาไทย)`
    }

    try {
        const endpoint = getEndpointUrl(targetBaseUrl)
        const response = await fetch(endpoint, {
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
