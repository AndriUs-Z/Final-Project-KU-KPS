// Custom Hook จัดการ logic แปลภาษาทั้งหมด — auto-translate ด้วย debounce 600ms + AbortController + บันทึกประวัติ
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from './supabase'
import { translateText } from './translate'

/**
 * useTranslate
 * จัดการ state และ logic ทั้งหมดของการแปลภาษา
 * - auto-translate พร้อม debounce 600ms
 * - cancel request เก่าด้วย AbortController
 * - บันทึกประวัติลง Supabase เมื่อ login
 */
export function useTranslate() {
    const { user } = useAuth()
    const [inputText, setInputText] = useState('')
    const [outputText, setOutputText] = useState('')
    const [isTranslating, setIsTranslating] = useState(false)
    const [isSwap, setIsSwap] = useState(false)
    const [copied, setCopied] = useState(false)

    const abortRef = useRef<AbortController | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ============================================================
    // เรียก API แปลภาษา
    // ============================================================
    const runTranslate = async (text: string, direction: 'th-en' | 'en-th') => {
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setIsTranslating(true)

        try {
            const result = await translateText(text, direction, controller.signal)
            setOutputText(result)

            // บันทึกประวัติลง Supabase (ถ้า login อยู่)
            if (user) {
                const { error: histErr } = await supabase.from('translation_history').insert({
                    user_id: user.id,
                    word: text,
                    translate: result,
                    direction,
                    translated_at: new Date().toISOString(),
                })
                if (histErr) {
                    console.error('Save translation history error:', histErr)
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            console.error('Translation error:', err)
        } finally {
            if (abortRef.current === controller) {
                setIsTranslating(false)
            }
        }
    }

    // ============================================================
    // Auto-translate: พิมพ์แล้วแปลอัตโนมัติ (debounce 600ms)
    // ============================================================
    useEffect(() => {
        const text = inputText.trim()

        if (!text) {
            setOutputText('')
            setIsTranslating(false)
            if (abortRef.current) abortRef.current.abort()
            return
        }

        const direction = isSwap ? 'en-th' : 'th-en'

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
            runTranslate(text, direction)
        }, 600)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [inputText, isSwap])

    // ============================================================
    // Actions
    // ============================================================
    const handleSwap = () => setIsSwap((prev) => !prev)

    const handleCopy = () => {
        if (!outputText) return
        navigator.clipboard.writeText(outputText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        if (!outputText) return
        const content = `ข้อความต้นฉบับ:\n${inputText}\n\nคำแปล:\n${outputText}`
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `translation_${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return {
        inputText,
        setInputText,
        outputText,
        isTranslating,
        isSwap,
        handleSwap,
        handleCopy,
        handleDownload,
        copied,
    }
}
