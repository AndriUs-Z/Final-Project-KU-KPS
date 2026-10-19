import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'

/**
 * useSubmitWord
 * จัดการ state + logic ของการส่งคำศัพท์เพื่อรออนุมัติ
 *
 * @param inputText  - ข้อความต้นฉบับจากช่อง input (คำศัพท์ที่ถูกล็อค)
 * @param outputText - ข้อความผลแปลจากช่อง output (คำแปลที่ผู้ใช้แก้ไขได้)
 * @param isSwap     - สถานะสลับภาษา (false = TH→EN, true = EN→TH)
 */
export function useSubmitWord(
    inputText: string,
    outputText: string,
    isSwap?: boolean
) {
    const { user } = useAuth()

    const [word, setWord] = useState('')
    const [translation, setTranslation] = useState('')
    const [context, setContext] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // ── Pre-fill เมื่อ inputText หรือ outputText เปลี่ยน ──────
    useEffect(() => {
        if (!outputText) return
        setWord(inputText.trim())
        setTranslation(outputText.trim())
    }, [inputText, outputText])

    // ── ล้างฟอร์ม ──────────────────────────────────────────────
    const resetForm = () => {
        setWord('')
        setTranslation('')
        setContext('')
    }

    // ── ส่งคำศัพท์ ──────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!user) return
        if (!word.trim() || !translation.trim()) {
            toast.error('กรุณาระบุทั้งคำศัพท์และคำแปล')
            return
        }

        const direction = isSwap ? 'en-th' : 'th-en'

        setIsSubmitting(true)
        try {
            const { error } = await supabase.from('pending_words').insert({
                user_id: user.id,
                word: word.trim(),
                translation: translation.trim(),
                context: context.trim() || null,
                direction,
                status: 'pending',
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })

            if (error) throw error

            toast.success('ส่งคำศัพท์เพื่อรออนุมัติสำเร็จแล้ว!')
            resetForm()
        } catch (err) {
            console.error('Submit word error:', err)
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        word,
        translation,
        setTranslation,
        context,
        setContext,
        isSubmitting,
        handleSubmit,
        resetForm,
    }
}
