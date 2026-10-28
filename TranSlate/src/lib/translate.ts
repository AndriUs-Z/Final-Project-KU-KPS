// Pure function translateText() — เรียก Translation API ตามทิศทาง (th-en/en-th)
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
): Promise<string> { //ผลเป็น string
    //เลือก API ตาม direction
    const targetBaseUrl = direction === 'th-en' ? API_TH_EN_URL : API_EN_TH_URL

    if (!targetBaseUrl) {
        throw new Error(`ไม่พบการตั้งค่า API URL สำหรับการแปล (${direction})`)
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
        const translated = data.translated_text

        if (translated !== undefined && translated !== null) {
            return String(translated)
        }

        return JSON.stringify(data)
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            throw err
        }
        console.error("Translation API failed:", err)
        throw err
    }
}
