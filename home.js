// ============================================================
// 📁 home.js
// 📝 Logic สำหรับหน้าแปลภาษา
// ============================================================

// ===== DOM Elements =====
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const swapBtn = document.getElementById('swap-btn');
const langSource = document.getElementById('lang-source');
const langTarget = document.getElementById('lang-target');
const charCount = document.getElementById('char-count');
const btnCopy = document.getElementById('btn-copy');
const btnCopyOutput = document.getElementById('btn-copy-output');
const btnPaste = document.getElementById('btn-paste');
const btnClear = document.getElementById('btn-clear');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const hamburgerBtn = document.getElementById('hamburger-btn');
const navTabs = document.querySelector('.nav-tabs');
const navbar = document.getElementById('navbar');

// ===== State =====
let currentSourceLang = 'en';
let currentTargetLang = 'th';
let typingTimer = null;

// ===== API Config =====
const API_BASE_URL = 'https://en-th-translator-api.onrender.com';
const TRANSLATE_API_URL = API_BASE_URL + '/translate';

// ===== Performance: Cache & AbortController =====
const translationCache = new Map();
const MAX_CACHE_SIZE = 100;
let currentAbortController = null;

// ===== Auth: DOM Elements =====
const btnLogin = document.getElementById('btn-login');
const userInfoEl = document.getElementById('user-info');
const userAvatarEl = document.getElementById('user-avatar');
const profileAvatarBtn = document.getElementById('profile-avatar-btn');
const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
const dropdownUserName = document.getElementById('dropdown-user-name');
const dropdownUserEmail = document.getElementById('dropdown-user-email');
const dropdownAdminLink = document.getElementById('dropdown-admin-link');
const btnLogoutEl = document.getElementById('btn-logout');

// ============================================================
// 🔒 AUTH CHECK — เช็ค login status + Profile Dropdown
// ============================================================
supabaseClient.auth.onAuthStateChange(async function (event, session) {
    if (session && session.user) {
        // ✅ ดึงข้อมูล user ล่าสุดจาก Supabase Server เพื่อให้อัปเดต Role ทันที
        var freshUser = session.user;
        try {
            var { data: { user } } = await supabaseClient.auth.getUser();
            if (user) freshUser = user;
        } catch (e) {
            console.log('Using cached session user');
        }

        var fullName = freshUser.user_metadata?.full_name || freshUser.email;
        var email = freshUser.email;
        var role = freshUser.user_metadata?.role || 'user';

        var initials = fullName.trim().split(' ').length >= 2
            ? (fullName.trim().split(' ')[0][0] + fullName.trim().split(' ')[1][0]).toUpperCase()
            : fullName.trim()[0].toUpperCase();

        userAvatarEl.textContent = initials;
        dropdownUserName.textContent = fullName;
        dropdownUserEmail.textContent = email;

        // เช็คว่าผู้ใช้เป็น Admin หรือไม่
        if (role === 'admin') {
            dropdownAdminLink.style.display = 'flex';
        } else {
            dropdownAdminLink.style.display = 'none';
        }

        userInfoEl.style.display = 'flex';
        btnLogin.style.display = 'none';
    } else {
        // ❌ ยังไม่ login → แสดงปุ่มเข้าสู่ระบบ
        userInfoEl.style.display = 'none';
        btnLogin.style.display = 'flex';
        if (profileDropdownMenu) profileDropdownMenu.classList.remove('show');
    }
});

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
    if (profileDropdownMenu && !userInfoEl.contains(e.target)) {
        profileDropdownMenu.classList.remove('show');
        if (profileAvatarBtn) profileAvatarBtn.classList.remove('active');
    }
});

// ===== Logout =====
if (btnLogoutEl) {
    btnLogoutEl.addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
    });
}

// ===== Navbar Scroll Effect =====
window.addEventListener('scroll', function() {
    if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Mobile Hamburger Menu =====
hamburgerBtn.addEventListener('click', function() {
    navTabs.classList.toggle('open');
    // Animate hamburger
    hamburgerBtn.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    if (!hamburgerBtn.contains(e.target) && !navTabs.contains(e.target)) {
        navTabs.classList.remove('open');
        hamburgerBtn.classList.remove('active');
    }
});

// ===== Character Count =====
sourceText.addEventListener('input', function() {
    var len = this.value.length;
    charCount.textContent = len.toLocaleString() + ' / 5,000';
    
    // Auto-resize behavior
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 400) + 'px';

    // Auto-translate เมื่อหยุดพิมพ์ 300ms
    clearTimeout(typingTimer);
    if (this.value.trim() === '') {
        targetText.innerHTML = '<span class="output-placeholder">คำแปลจะแสดงที่นี่...</span>';
        return;
    }
    
    typingTimer = setTimeout(function() {
        translateText(sourceText.value);
    }, 300);
});

// ===== Translation via API =====
// เรียก API จริงจาก EN-TH Translator API พร้อม Cache + AbortController
async function translateText(text) {
    var trimmed = text.trim();
    if (!trimmed) return;

    // ✅ เช็ค cache ก่อน — ถ้าเคยแปลแล้วแสดงผลทันที
    if (translationCache.has(trimmed)) {
        targetText.textContent = translationCache.get(trimmed);
        return;
    }

    // ❌ ยกเลิก request เก่าที่ยังค้างอยู่
    if (currentAbortController) {
        currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    // แสดง loading animation
    targetText.innerHTML = '<span class="output-placeholder" style="animation: pulse 1s infinite;">กำลังแปล...</span>';

    try {
        const response = await fetch(TRANSLATE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: trimmed }),
            signal: currentAbortController.signal,
        });

        if (!response.ok) {
            throw new Error('API error: ' + response.status);
        }

        const data = await response.json();
        targetText.textContent = data.translated_text;

        // 💾 บันทึกลง cache
        if (translationCache.size >= MAX_CACHE_SIZE) {
            // ลบรายการเก่าที่สุด
            var firstKey = translationCache.keys().next().value;
            translationCache.delete(firstKey);
        }
        translationCache.set(trimmed, data.translated_text);

    } catch (error) {
        // ไม่แสดง error ถ้าเป็นแค่การยกเลิก request
        if (error.name === 'AbortError') return;

        console.error('Translation error:', error);
        targetText.innerHTML = '<span class="output-placeholder" style="color: #e74c3c;">❌ ไม่สามารถแปลได้ กรุณาลองใหม่อีกครั้ง</span>';
        showToast('เกิดข้อผิดพลาดในการแปล');
    }
}

// ===== Swap Languages =====
swapBtn.addEventListener('click', function() {
    // Rotate animation
    swapBtn.classList.add('rotating');
    setTimeout(function() {
        swapBtn.classList.remove('rotating');
    }, 500);

    // Swap language state
    var tempLang = currentSourceLang;
    currentSourceLang = currentTargetLang;
    currentTargetLang = tempLang;

    // Swap button labels with animation
    var tempHTML = langSource.innerHTML;
    langSource.style.opacity = '0';
    langTarget.style.opacity = '0';
    
    setTimeout(function() {
        langSource.innerHTML = langTarget.innerHTML;
        langTarget.innerHTML = tempHTML;
        
        // Update data attributes
        langSource.dataset.lang = currentSourceLang;
        langTarget.dataset.lang = currentTargetLang;

        // Swap active state
        langSource.classList.add('active');
        langTarget.classList.remove('active');

        langSource.style.opacity = '1';
        langTarget.style.opacity = '1';
    }, 200);

    // Swap text content
    var sourceVal = sourceText.value;
    var targetVal = targetText.textContent;

    // Only swap if output has real content (not placeholder)
    if (targetVal && !targetVal.includes('คำแปลจะแสดงที่นี่') && !targetVal.includes('กำลังแปล') && !targetVal.includes('ไม่สามารถแปลได้')) {
        sourceText.value = targetVal;
        targetText.textContent = sourceVal;
        // Update char count
        charCount.textContent = sourceText.value.length.toLocaleString() + ' / 5,000';
    }
});

// ===== Copy Output =====
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('คัดลอกแล้ว!');
        }).catch(function() {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('คัดลอกแล้ว!');
    } catch (err) {
        showToast('ไม่สามารถคัดลอกได้');
    }
    document.body.removeChild(textarea);
}

btnCopy.addEventListener('click', function() {
    var text = targetText.textContent;
    if (text && !text.includes('คำแปลจะแสดงที่นี่')) {
        copyToClipboard(text);
        
        // Button feedback
        btnCopy.classList.add('copied');
        var originalHTML = btnCopy.innerHTML;
        btnCopy.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> คัดลอกแล้ว';
        
        setTimeout(function() {
            btnCopy.classList.remove('copied');
            btnCopy.innerHTML = originalHTML;
        }, 2000);
    }
});

btnCopyOutput.addEventListener('click', function() {
    var text = targetText.textContent;
    if (text && !text.includes('คำแปลจะแสดงที่นี่')) {
        copyToClipboard(text);
    }
});

// ===== File & Image Buttons =====
const btnFile = document.getElementById('btn-file');
const btnImage = document.getElementById('btn-image');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');

btnFile.addEventListener('click', function() {
    fileInput.click();
});

btnImage.addEventListener('click', function() {
    imageInput.click();
});

fileInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (file) {
        showToast('เลือกไฟล์: ' + file.name);
        if (file.type === 'text/plain') {
            var reader = new FileReader();
            reader.onload = function(evt) {
                sourceText.value = evt.target.result;
                sourceText.dispatchEvent(new Event('input'));
            };
            reader.readAsText(file);
        } else {
            sourceText.value = '[ ไฟล์: ' + file.name + ' ]';
            sourceText.dispatchEvent(new Event('input'));
        }
    }
});

imageInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (file) {
        showToast('เลือกรูปภาพ: ' + file.name);
        sourceText.value = '[ รูปภาพ: ' + file.name + ' ]';
        sourceText.dispatchEvent(new Event('input'));
    }
});

// ===== Paste =====
btnPaste.addEventListener('click', function() {
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function(text) {
            sourceText.value = text;
            sourceText.dispatchEvent(new Event('input'));
            showToast('วางข้อความแล้ว!');
        }).catch(function() {
            showToast('ไม่สามารถวางข้อความได้');
        });
    } else {
        // Focus textarea for manual paste
        sourceText.focus();
        showToast('กด Ctrl+V เพื่อวาง');
    }
});

// ===== Clear =====
btnClear.addEventListener('click', function() {
    if (sourceText.value.trim() === '') return;
    
    sourceText.value = '';
    sourceText.style.height = 'auto';
    targetText.innerHTML = '<span class="output-placeholder">คำแปลจะแสดงที่นี่...</span>';
    charCount.textContent = '0 / 5,000';
    sourceText.focus();
    showToast('ล้างข้อความแล้ว');
});

// ===== Toast Notification =====
function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 2500);
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter = translate (future use)
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (sourceText.value.trim()) {
            translateText(sourceText.value);
        }
    }
});

// ===== Initial Focus + API Warm-up =====
window.addEventListener('load', function() {
    // Small delay for animation
    setTimeout(function() {
        sourceText.focus();
    }, 800);

    // 🔥 Warm up API server (Render free tier cold start)
    // ส่ง request เบาๆ ให้ server ตื่นล่วงหน้า
    fetch(API_BASE_URL + '/health').catch(function() {
        // ignore errors — แค่ปลุก server
    });
});
