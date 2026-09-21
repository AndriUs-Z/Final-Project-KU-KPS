// ===== สลับฟอร์ม Login / Register =====
function showForm(formName) {
    // ซ่อนฟอร์มทั้งหมด แล้วแสดงฟอร์มที่เลือก
    document.getElementById('form-login').classList.remove('active');
    document.getElementById('form-register').classList.remove('active');
    document.getElementById('form-' + formName).classList.add('active');

    // เปลี่ยนสี tab
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('tab-' + formName).classList.add('active');
}

// ===== แสดง/ซ่อนรหัสผ่าน =====
function togglePassword(button) {
    var input = button.previousElementSibling;

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁';
    }
}

// ===== กด Login =====
// 📝 ใช้ async เพราะต้อง "รอ" ผลจาก Supabase server
async function handleLogin(event) {
    event.preventDefault();

    try {
        // ──────────────────────────────────────────
        // 1️⃣ ดึงค่า email และ password จากฟอร์ม
        // ──────────────────────────────────────────
        var email    = document.getElementById('login-email').value;
        var password = document.getElementById('login-password').value;

        // ──────────────────────────────────────────
        // 2️⃣ ส่งข้อมูลไป Supabase Auth → เข้าสู่ระบบ
        // ──────────────────────────────────────────
        // supabase.auth.signInWithPassword() คือฟังก์ชันที่:
        //   - ตรวจสอบ email + password กับฐานข้อมูล
        //   - ถ้าถูก → คืน session + user data
        //   - ถ้าผิด → คืน error
        var { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        // ──────────────────────────────────────────
        // 3️⃣ เช็คผลลัพธ์
        // ──────────────────────────────────────────
        if (error) {
            // ❌ เข้าสู่ระบบไม่สำเร็จ (email/password ผิด)
            alert('❌ เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
            console.log('Login Error:', error);
        } else {
            // ✅ เข้าสู่ระบบสำเร็จ!
            var userName = data.user.user_metadata.full_name || data.user.email;
            alert('✅ เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ' + userName);
            console.log('Login Success:', data);

            // 🔀 พาไปหน้าแปลภาษา
            window.location.href = 'home.html';
        }

    } catch (err) {
        // 🛑 จับ error ที่ไม่คาดคิด
        console.error('Unexpected Error:', err);
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
    }
}

// ===== กด Register =====
// 📝 async function = ฟังก์ชันที่ "รอ" ผลลัพธ์จาก server ได้
// เพราะการส่งข้อมูลไป Supabase ใช้เวลา → ต้อง "รอ" (await)
async function handleRegister(event) {
    event.preventDefault();

    try {
        // ──────────────────────────────────────────
        // 1️⃣ ดึงค่าจากฟอร์ม โดยใช้ id ที่เพิ่มไว้ใน Step 2
        // ──────────────────────────────────────────
        var fullName = document.getElementById('register-fullname').value;
        var email    = document.getElementById('register-email').value;
        var password = document.getElementById('register-password').value;
        var confirm  = document.getElementById('register-confirm').value;

        // ──────────────────────────────────────────
        // 2️⃣ เช็ค: รหัสผ่านตรงกันไหม? (เช็คฝั่ง front-end ก่อน)
        // ──────────────────────────────────────────
        if (password !== confirm) {
            alert('❌ รหัสผ่านไม่ตรงกัน!');
            return;
        }

        // เช็ค: รหัสผ่านยาวพอไหม? (Supabase ต้องการอย่างน้อย 6 ตัว)
        if (password.length < 6) {
            alert('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        // ──────────────────────────────────────────
        // 3️⃣ ส่งข้อมูลไป Supabase Auth → สมัครสมาชิก
        // ──────────────────────────────────────────
        // supabase.auth.signUp() คือฟังก์ชันของ Supabase ที่:
        //   - สร้าง user ใหม่ในระบบ
        //   - hash password ให้อัตโนมัติ (ไม่เก็บ plain text)
        //   - เช็ค email ซ้ำให้
        //
        // { data, error } = "destructuring" → แกะผลลัพธ์ออกมา 2 ตัว:
        //   - data  = ข้อมูล user ที่สร้างสำเร็จ
        //   - error = ข้อผิดพลาด (ถ้ามี)

        var { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,  // เก็บชื่อใน user_metadata
                    role: 'user'          // กำหนดบทบาทเริ่มต้นเป็น user
                }
            }
        });

        // ──────────────────────────────────────────
        // 4️⃣ เช็คผลลัพธ์
        // ──────────────────────────────────────────
        if (error) {
            // ❌ สมัครไม่สำเร็จ → แสดง error
            alert('❌ สมัครไม่สำเร็จ: ' + error.message);
            console.log('Register Error:', error);
        } else {
            // ✅ สมัครสำเร็จ!
            alert('✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
            console.log('Register Success:', data);

            // สลับไปแสดงฟอร์ม Login ให้อัตโนมัติ
            showForm('login');
        }

    } catch (err) {
        // 🛑 จับ error ที่ไม่คาดคิด (เช่น Supabase SDK โหลดไม่สำเร็จ)
        console.error('Unexpected Error:', err);
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
    }
}

