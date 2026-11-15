// สร้าง React Context เก็บ user/session state — จัดการ login, register, logout ผ่าน Supabase Auth
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// -------------------------------------------------------
// Types
// -------------------------------------------------------
interface AuthUser {
    id: string
    email: string
    full_name: string
    role: 'user' | 'admin'
}

interface AuthContextType {
    user: AuthUser | null
    session: Session | null
    loading: boolean
    login: (email: string, password: string) => Promise<{ error: string | null }>
    register: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
    resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>
    updatePassword: (newPassword: string) => Promise<{ error: string | null }>
    logout: () => Promise<void>
}

// -------------------------------------------------------
// Context
// -------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// -------------------------------------------------------
// Helper: แปลง Supabase User → AuthUser
// -------------------------------------------------------
function toAuthUser(user: User): AuthUser {
    const meta = user.user_metadata ?? {}
    return {
        id: user.id,
        email: user.email ?? '',
        full_name: meta.full_name ?? meta.name ?? 'ผู้ใช้',
        role: meta.role ?? 'user',
    }
}

// -------------------------------------------------------
// Provider
// -------------------------------------------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // ดึง session ปัจจุบันตอนเปิด app
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ? toAuthUser(session.user) : null)
            setLoading(false)
        })

        // ฟัง auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setUser(session?.user ? toAuthUser(session.user) : null)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    // ----- Login -----
    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
    }

    // ----- Register -----
    const register = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'user',
                },
            },
        })
        return { error: error?.message ?? null }
    }

    // ----- Reset Password (ส่งอีเมลรีเซ็ตรหัสผ่าน) -----
    const resetPasswordForEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error: error?.message ?? null }
    }

    // ----- Update Password (ตั้งรหัสผ่านใหม่หลังจากคลิกลิงก์ในอีเมล) -----
    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        return { error: error?.message ?? null }
    }

    // ----- Logout -----
    const logout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, login, register, resetPasswordForEmail, updatePassword, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// -------------------------------------------------------
// Hook
// -------------------------------------------------------
export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
