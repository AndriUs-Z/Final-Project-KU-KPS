// ============================================================
// 📁 supabase-config.js
// 📝 ไฟล์นี้ทำหน้าที่: เชื่อมต่อหน้าเว็บของเรากับ Supabase
// ============================================================

// 🔑 ค่า 2 ตัวนี้ได้จาก Supabase Dashboard → Settings → API
// ⚠️  ให้เปลี่ยนเป็นค่าของคุณเอง!

const SUPABASE_URL = 'https://hefytemsjkescpihahsg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZnl0ZW1zamtlc2NwaWhhaHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDM5MTQsImV4cCI6MjA5MzUxOTkxNH0.K7rq1n6eodsRT9nxw0YOjLDBIB0WcoghiB3FqlYodbg';

// 🏗️ สร้าง Supabase Client
// - window.supabase คือ SDK ที่โหลดจาก CDN (มีฟังก์ชัน createClient)
// - เราเรียก createClient() เพื่อสร้าง "client" ที่ใช้คุยกับ Supabase
// - ใช้ var เพื่อให้ตัวแปรเป็น global (script อื่นเรียกใช้ได้)
// - ชื่อ supabaseClient เพื่อไม่ให้ชนกับ window.supabase (SDK)

var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ ลอง log ดูว่าเชื่อมต่อสำเร็จไหม (เปิด Console ในเบราว์เซอร์ดู)
console.log('✅ Supabase Client พร้อมใช้งาน:', supabaseClient);
console.log('✅ Auth module:', supabaseClient.auth);
