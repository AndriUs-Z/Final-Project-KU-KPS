// ============================================================
// 📁 add-vocab.js
// 📝 Logic สำหรับหน้าเพิ่มคำศัพท์ — Auth Guard + Form Submit + History
// ============================================================

// ===== DOM Elements =====
const authOverlay = document.getElementById('auth-overlay');
const btnLogin = document.getElementById('btn-login');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const profileAvatarBtn = document.getElementById('profile-avatar-btn');
const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
const dropdownUserName = document.getElementById('dropdown-user-name');
const dropdownUserEmail = document.getElementById('dropdown-user-email');
const dropdownAdminLink = document.getElementById('dropdown-admin-link');
const btnLogout = document.getElementById('btn-logout');
const senderName = document.getElementById('sender-name');
const englishWordInput = document.getElementById('english-word');
const thaiTranslationInput = document.getElementById('thai-translation');
const contextInput = document.getElementById('context-input');
const vocabForm = document.getElementById('vocab-form');
const btnSubmit = document.getElementById('btn-submit');
const btnSubmitText = btnSubmit.querySelector('.btn-submit-text');
const btnSubmitLoading = btnSubmit.querySelector('.btn-submit-loading');
const historyList = document.getElementById('history-list');
const hamburgerBtn = document.getElementById('hamburger-btn');
const navTabs = document.querySelector('.nav-tabs');
const navbar = document.getElementById('navbar');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

// ===== State =====
let currentUser = null;

// ===== Navbar Scroll Effect =====
window.addEventListener('scroll', function () {
    if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Mobile Hamburger Menu =====
hamburgerBtn.addEventListener('click', function () {
    navTabs.classList.toggle('open');
    hamburgerBtn.classList.toggle('active');
});

document.addEventListener('click', function (e) {
    if (!hamburgerBtn.contains(e.target) && !navTabs.contains(e.target)) {
        navTabs.classList.remove('open');
        hamburgerBtn.classList.remove('active');
    }
});

// ===== Toast Notification =====
function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(function () {
        toast.classList.remove('show');
    }, 2500);
}

// ============================================================
// 🔒 AUTH GUARD — ตรวจสอบว่า login แล้วหรือยัง
// ============================================================

supabaseClient.auth.onAuthStateChange(function (event, session) {
    console.log('🔄 Auth event:', event, session ? 'มี session' : 'ไม่มี session');

    if (session && session.user) {
        // ✅ มี session → login อยู่
        console.log('✅ User:', session.user.email);
        currentUser = session.user;
        hideAuthOverlay();
        showUserInfo(session.user);
        loadHistory(); // โหลดประวัติการส่งคำศัพท์
    } else {
        // ❌ ไม่มี session → ยังไม่ login
        console.log('❌ ไม่มี session → แสดง overlay');
        currentUser = null;
        showAuthOverlay();
        senderName.value = '';
        if (profileDropdownMenu) profileDropdownMenu.classList.remove('show');
    }
});

function showAuthOverlay() {
    authOverlay.classList.remove('hidden');
    authOverlay.style.display = 'flex';
    btnLogin.style.display = 'flex';
    userInfo.style.display = 'none';
}

function hideAuthOverlay() {
    authOverlay.classList.add('hidden');
    setTimeout(function () {
        authOverlay.style.display = 'none';
    }, 300);
}

async function showUserInfo(user) {
    var freshUser = user;
    try {
        var { data: { user: resUser } } = await supabaseClient.auth.getUser();
        if (resUser) freshUser = resUser;
    } catch (e) {}

    var fullName = freshUser.user_metadata?.full_name || freshUser.email;
    var email = freshUser.email;
    var role = freshUser.user_metadata?.role || 'user';
    var initials = getInitials(fullName);

    userAvatar.textContent = initials;
    if (dropdownUserName) dropdownUserName.textContent = fullName;
    if (dropdownUserEmail) dropdownUserEmail.textContent = email;

    // เช็คสิทธิ์ Admin
    if (role === 'admin' && dropdownAdminLink) {
        dropdownAdminLink.style.display = 'flex';
    } else if (dropdownAdminLink) {
        dropdownAdminLink.style.display = 'none';
    }

    userInfo.style.display = 'flex';
    btnLogin.style.display = 'none';

    // Auto-fill ชื่อผู้ส่ง
    senderName.value = fullName;
}

// Toggle Profile Dropdown
if (profileAvatarBtn) {
    profileAvatarBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = profileDropdownMenu.classList.contains('show');
        if (isOpen) {
            profileDropdownMenu.classList.remove('show');
            profileAvatarBtn.classList.remove('active');
        } else {
            profileDropdownMenu.classList.add('show');
            profileAvatarBtn.classList.add('active');
        }
    });
}

// Close Dropdown when clicking outside
document.addEventListener('click', function (e) {
    if (profileDropdownMenu && !userInfo.contains(e.target)) {
        profileDropdownMenu.classList.remove('show');
        if (profileAvatarBtn) profileAvatarBtn.classList.remove('active');
    }
});

function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
}

// ===== Logout =====
if (btnLogout) {
    btnLogout.addEventListener('click', async function () {
        try {
            var { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Logout error:', error);
                showToast('❌ ออกจากระบบไม่สำเร็จ');
            } else {
                showToast('ออกจากระบบแล้ว');
            }
        } catch (err) {
            console.error('Unexpected logout error:', err);
        }
    });
}

// ============================================================
// 📥 1. การส่งคำศัพท์ลง Database (Supabase)
// ============================================================
vocabForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('❌ กรุณาเข้าสู่ระบบก่อนส่งข้อมูล');
        showAuthOverlay();
        return;
    }

    var english = englishWordInput.value.trim();
    var thai = thaiTranslationInput.value.trim();
    var contextVal = contextInput.value.trim();
    var sender = senderName.value.trim() || currentUser.email;

    if (!english || !thai) {
        showToast('❌ กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
    }

    // แสดงสถานะ Loading
    setSubmitting(true);

    try {
        // ส่งข้อมูลเข้าตาราง `vocabulary` ใน Supabase
        var { data, error } = await supabaseClient
            .from('vocabulary')
            .insert([
                {
                    user_id: currentUser.id,
                    user_name: sender,
                    english_word: english,
                    thai_translation: thai,
                    context: contextVal || null,
                    status: 'รอตรวจสอบ'
                }
            ]);

        if (error) {
            console.error('Error inserting vocab:', error);
            showToast('❌ เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
        } else {
            showToast('✅ บันทึกคำศัพท์สำเร็จ! รอการตรวจสอบ');
            // ล้างฟอร์ม
            englishWordInput.value = '';
            thaiTranslationInput.value = '';
            contextInput.value = '';
            
            // โหลดประวัติใหม่
            loadHistory();
        }
    } catch (err) {
        console.error('Unexpected submit error:', err);
        showToast('❌ เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
        setSubmitting(false);
    }
});

function setSubmitting(isLoading) {
    btnSubmit.disabled = isLoading;
    if (isLoading) {
        btnSubmitText.style.display = 'none';
        btnSubmitLoading.style.display = 'flex';
    } else {
        btnSubmitText.style.display = 'inline';
        btnSubmitLoading.style.display = 'none';
    }
}

// ============================================================
// 📜 2. การดึงประวัติการส่งคำศัพท์มาแสดง (Load History)
// ============================================================
async function loadHistory() {
    if (!currentUser) return;

    try {
        // ดึงข้อมูลคำศัพท์ที่ user คนนี้เคยส่ง เรียงจากใหม่ไปเก่า
        var { data, error } = await supabaseClient
            .from('vocabulary')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
            historyList.innerHTML = '<div class="history-empty"><p>❌ ไม่สามารถโหลดประวัติได้</p></div>';
            return;
        }

        if (!data || data.length === 0) {
            historyList.innerHTML = '<div class="history-empty"><p>ยังไม่มีคำศัพท์ที่ส่ง</p></div>';
            return;
        }

        // สร้าง HTML แสดงผลประวัติ
        historyList.innerHTML = data.map(function (item) {
            var dateStr = formatDate(item.created_at);
            var statusClass = 'pending';
            if (item.status === 'อนุมัติ' || item.status === 'อนุมัติแล้ว') statusClass = 'approved';
            if (item.status === 'ไม่อนุมัติ') statusClass = 'rejected';

            return `
                <div class="history-item">
                    <div class="history-item-top">
                        <div class="history-word">
                            <span>${escapeHtml(item.english_word)}</span>
                            <span class="history-arrow">⟶</span>
                            <span>${escapeHtml(item.thai_translation)}</span>
                        </div>
                        <span class="history-status ${statusClass}">${escapeHtml(item.status || 'รอตรวจสอบ')}</span>
                    </div>
                    ${item.context ? `<div class="history-context">บริบท: ${escapeHtml(item.context)}</div>` : ''}
                    <div class="history-item-bottom">
                        <span>ถูกเพิ่มโดย ${escapeHtml(item.user_name || 'ผู้ใช้งาน')}</span>
                        <span>${dateStr}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Unexpected history error:', err);
    }
}

// Helper: แปลงวันที่ให้อ่านง่าย
function formatDate(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear() + 543; // ปี พ.ศ.
    var hours = String(d.getHours()).padStart(2, '0');
    var minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Helper: ป้องกัน XSS
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
