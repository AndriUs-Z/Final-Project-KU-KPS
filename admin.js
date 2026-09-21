// ============================================================
// 📁 admin.js
// 📝 Logic สำหรับหน้า Admin Panel (อนุมัติ/ปฏิเสธคำศัพท์)
// ============================================================

// ===== DOM Elements =====
const adminAccessOverlay = document.getElementById('admin-access-overlay');
const btnMakeMeAdmin = document.getElementById('btn-make-me-admin');
const btnLogin = document.getElementById('btn-login');
const userInfoEl = document.getElementById('user-info');
const userAvatarEl = document.getElementById('user-avatar');
const profileAvatarBtn = document.getElementById('profile-avatar-btn');
const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
const dropdownUserName = document.getElementById('dropdown-user-name');
const dropdownUserEmail = document.getElementById('dropdown-user-email');
const dropdownAdminLink = document.getElementById('dropdown-admin-link');
const btnLogoutEl = document.getElementById('btn-logout');
const adminVocabList = document.getElementById('admin-vocab-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

// ===== State =====
let currentUser = null;
let allVocabItems = [];
let currentFilter = 'all';

// ปุ่มยกระดับเป็น Admin
if (btnMakeMeAdmin) {
    btnMakeMeAdmin.addEventListener('click', async function () {
        showToast('กำลังยกระดับบัญชีเป็น Admin...');
        try {
            var { data, error } = await supabaseClient.auth.updateUser({
                data: { role: 'admin' }
            });
            if (error) {
                console.error('Update role error:', error);
                showToast('❌ ไม่สามารถเปลี่ยนสิทธิ์ได้: ' + error.message);
            } else {
                showToast('✅ ยกระดับเป็น Admin สำเร็จ!');
                setTimeout(function () {
                    window.location.reload();
                }, 1000);
            }
        } catch (err) {
            console.error('Unexpected update role error:', err);
        }
    });
}

// ===== Toast Notification =====
function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(function () {
        toast.classList.remove('show');
    }, 2500);
}

// ============================================================
// 🔒 AUTH & ROLE CHECK — ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
// ============================================================
supabaseClient.auth.onAuthStateChange(function (event, session) {
    if (session && session.user) {
        currentUser = session.user;
        var role = session.user.user_metadata?.role || 'user';
        var fullName = session.user.user_metadata?.full_name || session.user.email;
        var email = session.user.email;

        // แสดงผล Profile Dropdown
        var initials = fullName.trim().split(' ').length >= 2
            ? (fullName.trim().split(' ')[0][0] + fullName.trim().split(' ')[1][0]).toUpperCase()
            : fullName.trim()[0].toUpperCase();

        userAvatarEl.textContent = initials;
        dropdownUserName.textContent = fullName;
        dropdownUserEmail.textContent = email;
        userInfoEl.style.display = 'flex';
        btnLogin.style.display = 'none';

        if (role === 'admin') {
            // ✅ เป็น Admin → อนุญาตให้ใช้งาน
            adminAccessOverlay.classList.add('hidden');
            dropdownAdminLink.style.display = 'flex';
            loadAllVocabularies();
        } else {
            // ❌ ไม่ใช่ Admin → บล็อกการเข้าถึง
            adminAccessOverlay.classList.remove('hidden');
        }
    } else {
        // ❌ ไม่ได้ Login → บล็อกการเข้าถึง
        adminAccessOverlay.classList.remove('hidden');
        userInfoEl.style.display = 'none';
        btnLogin.style.display = 'flex';
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

// Close Dropdown on outside click
document.addEventListener('click', function (e) {
    if (profileDropdownMenu && !userInfoEl.contains(e.target)) {
        profileDropdownMenu.classList.remove('show');
        if (profileAvatarBtn) profileAvatarBtn.classList.remove('active');
    }
});

// Logout
if (btnLogoutEl) {
    btnLogoutEl.addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
    });
}

// ============================================================
// 📜 โหลดคำศัพท์ทั้งหมดเพื่อแสดงใน Admin Panel
// ============================================================
async function loadAllVocabularies() {
    try {
        var { data, error } = await supabaseClient
            .from('vocabulary')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admin vocab:', error);
            adminVocabList.innerHTML = '<div class="admin-empty"><p>❌ ไม่สามารถโหลดข้อมูลคำศัพท์ได้</p></div>';
            return;
        }

        allVocabItems = data || [];
        renderVocabList();

    } catch (err) {
        console.error('Unexpected error loading vocab:', err);
    }
}

// ===== Render List ตาม Filter =====
function renderVocabList() {
    var filteredItems = allVocabItems.filter(function (item) {
        if (currentFilter === 'all') return true;
        return item.status === currentFilter;
    });

    if (filteredItems.length === 0) {
        adminVocabList.innerHTML = '<div class="admin-empty"><p>ไม่มีรายการคำศัพท์ในหมวดนี้</p></div>';
        return;
    }

    adminVocabList.innerHTML = filteredItems.map(function (item) {
        var statusClass = 'pending';
        if (item.status === 'อนุมัติแล้ว' || item.status === 'อนุมัติ') statusClass = 'approved';
        if (item.status === 'ไม่อนุมัติ') statusClass = 'rejected';

        var dateStr = formatDate(item.created_at);

        // ซ่อนปุ่มเมื่อสถานะไม่ใช่ "รอตรวจสอบ" (อนุมัติ/ไม่อนุมัติแล้ว)
        var isPending = statusClass === 'pending';
        var actionBtnsHtml = isPending ? `
                        <button class="btn-action btn-approve" onclick="updateStatus(${item.id}, 'อนุมัติแล้ว')">
                            ✓ อนุมัติ
                        </button>
                        <button class="btn-action btn-reject" onclick="updateStatus(${item.id}, 'ไม่อนุมัติ')">
                            ✕ ไม่อนุมัติ
                        </button>` : '';

        return `
            <div class="admin-vocab-card" id="vocab-card-${item.id}">
                <div class="vocab-card-main">
                    <div class="vocab-words">
                        <span class="vocab-english">${escapeHtml(item.english_word)}</span>
                        <span class="vocab-thai">คำแปล: ${escapeHtml(item.thai_translation)}</span>
                        ${item.context ? `<div class="vocab-context">บริบท: ${escapeHtml(item.context)}</div>` : ''}
                    </div>
                    <span class="status-badge ${statusClass}">${escapeHtml(item.status || 'รอตรวจสอบ')}</span>
                </div>
                <div class="vocab-meta">
                    <div>
                        <span>ส่งโดย: <strong>${escapeHtml(item.user_name || 'ผู้ใช้งาน')}</strong></span> • <span>${dateStr}</span>
                    </div>
                    <div class="action-btns">
                        ${actionBtnsHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// ⚡ อัปเดตสถานะคำศัพท์ (อนุมัติ / ไม่อนุมัติ)
// ============================================================
async function updateStatus(itemId, newStatus) {
    try {
        var { error } = await supabaseClient
            .from('vocabulary')
            .update({ status: newStatus })
            .eq('id', itemId);

        if (error) {
            console.error('Error updating status:', error);
            showToast('❌ ไม่สามารถอัปเดตสถานะได้: ' + error.message);
        } else {
            showToast(`✅ อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`);
            // อัปเดต state ในเครื่องและแสดงผลใหม่
            var target = allVocabItems.find(i => i.id === itemId);
            if (target) target.status = newStatus;
            renderVocabList();
        }
    } catch (err) {
        console.error('Unexpected status update error:', err);
    }
}

// Filter Tab Event Listeners
filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderVocabList();
    });
});

// Helpers
function formatDate(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear() + 543;
    var hours = String(d.getHours()).padStart(2, '0');
    var minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
