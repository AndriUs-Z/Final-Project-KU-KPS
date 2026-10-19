export interface DashboardSummary {
    total_users: number
    total_translations: number
    total_input_chars: number
    total_output_chars: number
    th_to_en: number
    en_to_th: number
}

export interface PendingWord {
    id: string
    user_id: string
    word: string
    translation: string
    context: string | null
    direction?: "th-en" | "en-th" | null
    status: "pending" | "approved" | "rejected"
    rejected_reason: string | null
    submitted_at: string
}

export interface RetrainJob {
    id: string
    direction: "th-en" | "en-th"
    status: "queued" | "running" | "success" | "failed"
    triggered_by: string
    message: string | null
    created_at: string
    started_at: string | null
    finished_at: string | null
}

export interface RetrainStatus {
    latest: { "th-en": RetrainJob | null; "en-th": RetrainJob | null }
    history: RetrainJob[]
    approved_counts: { "th-en": number; "en-th": number }
    min_pairs: number
}
