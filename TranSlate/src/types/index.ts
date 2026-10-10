/**
 * ==========================================================
 * TypeScript Interface (Type Definitions)
 * โครงสร้างข้อมูลของระบบเว็บแอปพลิเคชันแปลภาษา
 * อ้างอิงตาม Data Store D1-D7 ใน DFD
 * ==========================================================
 */

// ---------------------------------------------------------
// D1: แฟ้มผู้ใช้ (User Account)
// ---------------------------------------------------------
export type UserRole = "user" | "admin";

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  password: string; // เก็บแบบ hash แล้วเท่านั้น ไม่เก็บ plain text
  is_verified: boolean;
  verification_code: string | null;
  reset_password_token: string | null;
  reset_token_expire: Date | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

// เวอร์ชันที่ปลอดภัยสำหรับส่งกลับให้ frontend (ไม่มี password)
export type PublicUser = Omit<
  User,
  "password" | "verification_code" | "reset_password_token" | "reset_token_expire"
>;

// ---------------------------------------------------------
// D2: แฟ้มคำศัพท์หลัก (Dictionary — ที่อนุมัติแล้ว)
// ---------------------------------------------------------
export interface DictionaryWord {
  word_id: number;
  english_word: string;
  thai_translation: string;
  context: string | null;
  category: string | null;
  submitted_by: number; // FK -> User.user_id
  approved_by: number; // FK -> User.user_id
  approved_at: Date;
}

// ---------------------------------------------------------
// D3: แฟ้มคำศัพท์ที่รอตรวจสอบ (Pending Words Queue)
// ---------------------------------------------------------
export type WordStatus = "pending" | "approved" | "rejected";

export interface PendingWord {
  pending_id: number;
  english_word: string;
  thai_translation: string;
  context: string | null;
  submitted_by: number; // FK -> User.user_id
  status: WordStatus;
  rejected_reason: string | null;
  submitted_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------
// D4: แฟ้ม Session/Token ที่ใช้งาน
// (ใช้เฉพาะกรณี session-based auth; ถ้าใช้ JWT ไม่ต้องมีแฟ้มนี้จริง)
// ---------------------------------------------------------
export interface Session {
  session_id: string;
  user_id: number; // FK -> User.user_id
  created_at: Date;
  expired_at: Date;
}

// เวอร์ชัน JWT payload (ถ้าเลือกใช้ JWT แทน session-based)
export interface JwtPayload {
  user_id: number;
  email: string;
  role: UserRole;
  iat: number; // issued at
  exp: number; // expire at
}

// ---------------------------------------------------------
// D5: แฟ้ม Model Store (โมเดลแปลภาษา)
// ---------------------------------------------------------
export interface TranslationModel {
  model_version: string;
  model_file_path: string;
  trained_at: Date;
  accuracy_score: number;
  is_active: boolean;
}

// ---------------------------------------------------------
// D6: แฟ้มไฟล์ที่ผู้ใช้อัปโหลด (Uploaded Files)
// ---------------------------------------------------------
export type UploadedFileType = "jpg" | "jpeg" | "png" | "pdf";

export interface UploadedFile {
  file_id: number;
  uploaded_by: number; // FK -> User.user_id
  file_path: string;
  file_type: UploadedFileType;
  extracted_text: string | null; // ข้อความที่สกัดได้จาก OCR
  uploaded_at: Date;
}

// ---------------------------------------------------------
// D7: แฟ้มกฎการแทนที่คำศัพท์ (Term Replacement Rules)
// ---------------------------------------------------------
export interface ReplacementRule {
  id: number;
  pattern: string; // คำหรือ regex ต้นทาง
  replacement: string; // คำที่ใช้แทนที่
  is_regex: boolean;
  active: boolean;
  dictionary_id: number | null; // FK -> DictionaryWord.word_id (NULL = กฎที่ developer เขียนเอง)
}

/**
 * ==========================================================
 * DTO / Request-Response Types
 * โครงสร้างข้อมูลที่ใช้รับส่งระหว่าง Frontend <-> Backend
 * (ไม่ใช่โครงสร้างของฐานข้อมูลโดยตรง แต่เป็น "รูปร่าง" ของ
 * ข้อมูลที่ไหลอยู่ใน DFD แต่ละ process)
 * ==========================================================
 */

// --- Process 1: สมัครสมาชิก ---
export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

// --- Process 2: ยืนยันตัวตน ---
export interface VerifyEmailRequest {
  email: string;
  verification_code: string;
}

// --- Process 3: เข้าสู่ระบบ ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: PublicUser;
  token: string; // session_id หรือ JWT แล้วแต่สถาปัตยกรรมที่เลือกใช้
}

// --- Process 4: ลืมรหัสผ่าน ---
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  reset_password_token: string;
  new_password: string;
}

// --- Process 5: แก้ไขโปรไฟล์ ---
export interface UpdateProfileRequest {
  full_name?: string;
  current_password?: string; // ต้องกรอกถ้าต้องการเปลี่ยนรหัสผ่าน
  new_password?: string;
}

// --- Process 7: แปลภาษา ---
export type TranslationDirection = "th-en" | "en-th";

export interface TranslateRequest {
  text: string;
  direction: TranslationDirection;
}

export interface TranslateResponse {
  original_text: string;
  translated_text: string;
  accuracy: number; // ค่าความแม่นยำ (%)
  applied_rules: ReplacementRule[]; // กฎที่ถูกใช้แทนที่ในคำแปลนี้
}

// --- Process 8: อัปโหลดรูปภาพ/ไฟล์เพื่อแปลภาษา ---
export interface UploadFileRequest {
  file: File; // ฝั่ง frontend ก่อนอัปโหลดจริง
}

export interface OcrExtractResponse {
  file_id: number;
  extracted_text: string;
}

// --- Process 9: เพิ่มคำศัพท์ ---
export interface AddWordRequest {
  english_word: string;
  thai_translation: string;
  context?: string;
}

// --- Process 10: ดูสถานะคำศัพท์ที่ตนเองส่งไป ---
export interface WordStatusItem {
  pending_id: number;
  english_word: string;
  thai_translation: string;
  status: WordStatus;
  rejected_reason: string | null;
  submitted_at: Date;
}

// --- Process 12: Admin จัดการอนุมัติ ---
export interface ApproveWordRequest {
  pending_id: number;
  action: "approve" | "reject";
  rejected_reason?: string; // ใช้เมื่อ action = "reject"
}

/**
 * ==========================================================
 * API Response Wrapper กลาง
 * ==========================================================
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}