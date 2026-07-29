/**
 * ==========================================
 * PERHATIAN: Masukkan Web App URL Anda di sini
 * ==========================================
 */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5Xo6CnrITVXBFSkajqncptm2_NvpMkJ22O5b1tH2pjDa9DP4GSePYdy_6omvFNd9NyA/exec";

// Elemen DOM
const galleryGrid = document.getElementById('gallery-grid');
const loader = document.getElementById('loader');
const emptyState = document.getElementById('empty-state');

const cmsTrigger = document.getElementById('cms-trigger');
const cmsModal = document.getElementById('cms-modal');
const closeModal = document.getElementById('close-modal');

const uploadForm = document.getElementById('upload-form');
const photoInput = document.getElementById('photo');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const imagePreview = document.getElementById('image-preview');

const submitBtn = document.getElementById('submit-btn');
const btnText = document.querySelector('.btn-text');
const btnSpinner = document.querySelector('.btn-spinner');
const uploadMessage = document.getElementById('upload-message');

let base64PhotoData = null;

// ==========================================
// 1. Logika Load Galeri (GET)
// ==========================================
async function fetchGallery() {
    // Jika SCRIPT_URL belum diisi
    if (SCRIPT_URL === "ISI_DENGAN_WEB_APP_URL_ANDA_DI_SINI") {
        loader.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<p style="color: var(--danger-color);">Tolong masukkan SCRIPT URL Google Apps Script Anda di file app.js terlebih dahulu!</p>';
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        loader.style.display = 'none';
        
        if (data && data.length > 0) {
            renderGallery(data);
            galleryGrid.style.display = 'grid';
        } else {
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        loader.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `<p style="color: var(--danger-color);">Terjadi kesalahan saat memuat galeri. Pastikan CORS dan URL benar.</p>`;
    }
}

function renderGallery(items) {
    galleryGrid.innerHTML = ''; // Bersihkan kontainer
    
    items.forEach(item => {
        // Format tanggal sederhana
        const dateObj = new Date(item.timestamp);
        const dateString = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        const card = document.createElement('div');
        card.className = 'gallery-item';
        
        card.innerHTML = `
            <div class="gallery-image-container">
                <img src="${item.url}" alt="${item.title}" class="gallery-image" loading="lazy">
            </div>
            <div class="gallery-info">
                <h3 class="gallery-title">${item.title}</h3>
                <p class="gallery-description">${item.description}</p>
                <div class="gallery-date">${dateString}</div>
            </div>
        `;
        
        galleryGrid.appendChild(card);
    });
}

// ==========================================
// 2. Logika Modal CMS
// ==========================================

// Buka Modal
cmsTrigger.addEventListener('click', () => {
    cmsModal.classList.add('show');
    resetForm();
});

// Tutup Modal
closeModal.addEventListener('click', () => {
    cmsModal.classList.remove('show');
});

// Tutup modal jika klik di luar kotak
window.addEventListener('click', (e) => {
    if (e.target === cmsModal) {
        cmsModal.classList.remove('show');
    }
});

// Preview Gambar
photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            // Tampilkan preview
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
            
            // Simpan base64 data untuk dikirim
            // Hapus prefix "data:image/jpeg;base64,"
            base64PhotoData = event.target.result.split(',')[1]; 
        }
        
        reader.readAsDataURL(file);
    } else {
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        base64PhotoData = null;
    }
});

// ==========================================
// 3. Logika Upload (POST)
// ==========================================
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (SCRIPT_URL === "ISI_DENGAN_WEB_APP_URL_ANDA_DI_SINI") {
        showMessage('Peringatan: Isi SCRIPT_URL di app.js terlebih dahulu!', 'error');
        return;
    }

    const file = photoInput.files[0];
    if (!file || !base64PhotoData) {
        showMessage('Pilih gambar terlebih dahulu!', 'error');
        return;
    }
    
    // Set loading state
    setLoadingState(true);
    showMessage('', ''); // clear message

    // Siapkan data sebagai URLSearchParams agar mudah dikirim melalui POST ke Google Script
    const formData = new URLSearchParams();
    formData.append('fileBase64', base64PhotoData);
    formData.append('mimeType', file.type);
    formData.append('fileName', file.name);
    formData.append('title', titleInput.value);
    formData.append('description', descriptionInput.value);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Foto berhasil diunggah!', 'success');
            setTimeout(() => {
                cmsModal.classList.remove('show');
                // Refresh galeri
                galleryGrid.style.display = 'none';
                emptyState.style.display = 'none';
                loader.style.display = 'flex';
                fetchGallery();
            }, 1500);
        } else {
            showMessage('Gagal mengunggah: ' + result.error, 'error');
        }
    } catch (error) {
        console.error("Upload error:", error);
        // Terkadang Google Apps Script melempar error CORS pada POST meski berhasil,
        // Ini adalah workaround kasar
        showMessage('Terjadi kesalahan koneksi, namun data mungkin berhasil tersimpan. Coba refresh halaman.', 'error');
    } finally {
        setLoadingState(false);
    }
});

function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'block';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'block';
        btnSpinner.style.display = 'none';
    }
}

function showMessage(text, type) {
    uploadMessage.textContent = text;
    uploadMessage.className = 'message';
    if (type) {
        uploadMessage.classList.add(type);
    }
}

function resetForm() {
    uploadForm.reset();
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    base64PhotoData = null;
    showMessage('', '');
}

// Inisialisasi: Muat galeri saat pertama kali halaman dibuka
document.addEventListener('DOMContentLoaded', fetchGallery);
