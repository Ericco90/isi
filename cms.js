/**
 * ==========================================
 * PERHATIAN: Masukkan Web App URL Anda di sini
 * ==========================================
 */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5Xo6CnrITVXBFSkajqncptm2_NvpMkJ22O5b1tH2pjDa9DP4GSePYdy_6omvFNd9NyA/exec";

// State
let sessionPassword = "";
let fileBase64 = null;
let currentMimeType = null;
let currentFileName = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');
const loginSpin = document.getElementById('login-spin');
const loginMsg = document.getElementById('login-msg');

const uploadForm = document.getElementById('upload-form');
const photoInput = document.getElementById('cms-photo');
const photoPreview = document.getElementById('cms-preview');
const uploadBtn = document.getElementById('upload-btn');
const uploadText = document.getElementById('upload-text');
const uploadSpin = document.getElementById('upload-spin');
const uploadMsg = document.getElementById('upload-msg');

const refreshBtn = document.getElementById('refresh-btn');
const galleryLoader = document.getElementById('gallery-loader');
const galleryContainer = document.getElementById('gallery-container');
const galleryTbody = document.getElementById('gallery-tbody');
const emptyState = document.getElementById('empty-state');
const logoutBtns = document.querySelectorAll('.logout-action');

// Utility Functions
function showMsg(el, text, isError) {
    el.textContent = text;
    el.className = `mt-4 text-center text-sm p-2 rounded-lg font-medium ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-pupus-500/10 text-pupus-400 border border-pupus-500/20'} block`;
}
function hideMsg(el) {
    el.classList.add('hidden');
}

// 1. LOGIN LOGIC
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (SCRIPT_URL === "ISI_DENGAN_WEB_APP_URL_ANDA_DI_SINI") {
        showMsg(loginMsg, "Silakan masukkan SCRIPT_URL terlebih dahulu di file cms.js!", true);
        return;
    }

    const passwordInput = document.getElementById('login-password').value;
    
    // UI Loading state
    loginText.textContent = "Memverifikasi...";
    loginSpin.classList.remove('hidden');
    loginBtn.disabled = true;
    hideMsg(loginMsg);

    try {
        const formData = new URLSearchParams();
        formData.append('password', passwordInput);
        formData.append('action', 'login');

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Login Success
            sessionPassword = passwordInput;
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            // Fetch initial gallery data
            fetchGallery();
        } else {
            showMsg(loginMsg, result.error || "Kata sandi salah!", true);
        }
    } catch (error) {
        showMsg(loginMsg, "Terjadi kesalahan jaringan, periksa URL Script.", true);
    } finally {
        loginText.textContent = "Masuk Dashboard";
        loginSpin.classList.add('hidden');
        loginBtn.disabled = false;
    }
});

// 2. LOGOUT LOGIC
logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if(confirm("Apakah Anda yakin ingin keluar?")) {
            sessionPassword = "";
            window.location.reload();
        }
    });
});

// 3. PREVIEW IMAGE
photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        currentMimeType = file.type;
        currentFileName = file.name;
        const reader = new FileReader();
        reader.onload = function(event) {
            photoPreview.src = event.target.result;
            photoPreview.classList.remove('hidden');
            fileBase64 = event.target.result.split(',')[1];
        }
        reader.readAsDataURL(file);
    } else {
        photoPreview.classList.add('hidden');
        fileBase64 = null;
    }
});

// 4. UPLOAD LOGIC
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileBase64) {
        showMsg(uploadMsg, "Silakan pilih foto terlebih dahulu.", true);
        return;
    }

    const title = document.getElementById('cms-title').value;
    const desc = document.getElementById('cms-desc').value;

    uploadText.textContent = "Mengunggah...";
    uploadSpin.classList.remove('hidden');
    uploadBtn.disabled = true;
    hideMsg(uploadMsg);

    const formData = new URLSearchParams();
    formData.append('fileBase64', fileBase64);
    formData.append('mimeType', currentMimeType);
    formData.append('fileName', currentFileName);
    formData.append('title', title);
    formData.append('description', desc);
    formData.append('password', sessionPassword); // Auth with saved password

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if(result.success) {
            showMsg(uploadMsg, 'Berhasil mengunggah foto!', false);
            uploadForm.reset();
            photoPreview.classList.add('hidden');
            fileBase64 = null;
            // Auto refresh gallery
            fetchGallery();
            
            // Hide success message after 3 seconds
            setTimeout(() => { hideMsg(uploadMsg); }, 3000);
        } else {
            showMsg(uploadMsg, 'Gagal: ' + result.error, true);
        }
    } catch (err) {
        showMsg(uploadMsg, 'Error koneksi ke server.', true);
    } finally {
        uploadText.textContent = 'Simpan & Unggah';
        uploadSpin.classList.add('hidden');
        uploadBtn.disabled = false;
    }
});

// 5. FETCH GALLERY LOGIC
async function fetchGallery() {
    galleryLoader.style.display = 'block';
    galleryContainer.classList.add('hidden');
    emptyState.classList.add('hidden');
    
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        
        galleryTbody.innerHTML = '';
        
        if (data && data.length > 0) {
            data.forEach(item => {
                // Formatting Date
                let dateStr = item.timestamp;
                try {
                    const dateObj = new Date(item.timestamp);
                    if(!isNaN(dateObj.getTime())) {
                        dateStr = dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                    }
                } catch(e){}

                // Transform URL Drive to Thumbnail URL for better image rendering
                let displayUrl = item.url;
                if (item.url.includes('drive.google.com') && item.url.includes('id=')) {
                    const fileId = item.url.split('id=')[1].split('&')[0];
                    displayUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
                }

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-800/50 transition-colors group';
                tr.innerHTML = `
                    <td class="px-4 py-3">
                        <a href="${item.url}" target="_blank" class="block w-16 h-12 rounded overflow-hidden border border-gray-700 group-hover:border-pupus-500/50 transition-colors">
                            <img src="${displayUrl}" alt="${item.title}" class="w-full h-full object-cover">
                        </a>
                    </td>
                    <td class="px-4 py-3">
                        <div class="font-medium text-white mb-1 line-clamp-1">${item.title}</div>
                        <div class="text-xs text-gray-400 line-clamp-2" title="${item.description}">${item.description || '-'}</div>
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-500">
                        ${dateStr}
                    </td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="deletePhoto('${item.url}')" class="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors" title="Hapus Foto">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                galleryTbody.appendChild(tr);
            });
            galleryContainer.classList.remove('hidden');
        } else {
            galleryContainer.classList.remove('hidden');
            emptyState.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
        galleryContainer.classList.remove('hidden');
        galleryTbody.innerHTML = `<tr><td colspan="3" class="text-center text-red-400 py-4">Gagal memuat galeri.</td></tr>`;
    } finally {
        galleryLoader.style.display = 'none';
    }
}

// 6. DELETE LOGIC
async function deletePhoto(targetUrl) {
    if (!confirm("Yakin ingin menghapus foto ini secara permanen?")) return;

    // Show deleting state (you might want to add a global loader, or just change cursor)
    document.body.style.cursor = 'wait';
    
    const formData = new URLSearchParams();
    formData.append('password', sessionPassword);
    formData.append('action', 'delete');
    formData.append('url', targetUrl);

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if(result.success) {
            alert("Foto berhasil dihapus!");
            fetchGallery();
        } else {
            alert("Gagal menghapus: " + (result.error || "Kata sandi salah."));
        }
    } catch (err) {
        alert("Error koneksi saat menghapus.");
    } finally {
        document.body.style.cursor = 'default';
    }
}

refreshBtn.addEventListener('click', fetchGallery);
