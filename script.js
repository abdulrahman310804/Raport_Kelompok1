const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1fzv4tKNk6IyHel5Vudw_dTtY5wOjsnrH7vwWb9lKKpU/gviz/tq?tqx=out:json&sheet=Sheet1';

async function fetchData() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows;

    return rows.map(row => ({
      Nama: row.c[0]?.v || '',
      Kelas: row.c[1]?.v || '',
      Mapel: row.c[2]?.v || '',
      Nilai: row.c[3]?.v || ''
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>Tidak ada data yang ditemukan</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  data.forEach((siswa, index) => {
    const row = document.createElement('tr');
    const nilaiKosong = siswa.Nilai === '';
    const readOnly = nilaiKosong ? '' : 'readonly';
    const buttonLabel = nilaiKosong ? 'Simpan' : 'Edit';
    const buttonClass = nilaiKosong ? 'btn-save' : 'btn-edit';
    
    row.innerHTML = `
      <td><strong>${siswa.Nama}</strong></td>
      <td><span class="badge-kelas">${siswa.Kelas}</span></td>
      <td><span class="badge-mapel">${siswa.Mapel}</span></td>
      <td>
        <input type="number" 
               id="nilai-${index}" 
               value="${siswa.Nilai}" 
               min="0" 
               max="100" 
               ${readOnly}
               placeholder="0-100"/>
      </td>
      <td>
        <button class="${buttonClass}" onclick="handleAksi(${index}, '${siswa.Nama}')">
          ${buttonLabel}
        </button>
      </td>
    `;
    
    // Add fade-in animation for each row
    row.style.opacity = '0';
    row.style.transform = 'translateY(20px)';
    tbody.appendChild(row);
    
    // Trigger animation
    setTimeout(() => {
      row.style.transition = 'all 0.3s ease';
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

async function handleAksi(index, nama) {
  const input = document.getElementById(`nilai-${index}`);
  const button = input.parentElement.nextElementSibling.querySelector('button');

  if (input.hasAttribute('readonly')) {
    // Mode Edit
    input.removeAttribute('readonly');
    input.focus();
    input.select();
    button.textContent = 'Simpan';
    button.className = 'btn-save';
    
    // Add visual feedback
    input.style.background = 'rgba(255, 255, 255, 1)';
    input.style.borderColor = '#667eea';
  } else {
    // Mode Save
    const nilai = input.value;
    if (!nilai || nilai < 0 || nilai > 100) {
      showNotification('Silakan masukkan nilai antara 0-100', 'error');
      input.focus();
      return;
    }

    // Visual feedback saat menyimpan
    button.innerHTML = '<div class="btn-spinner"></div> Menyimpan...';
    button.disabled = true;
    input.disabled = true;

    try {
      const scriptURL = 'https://script.google.com/macros/s/AKfycbzt0C7qaBWKWNLDQ1ztqPsJDs69ebThIWe6SorXzKn8qJnDWDvUJzEIYEJoFInGhfZ8/exec';
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: new URLSearchParams({ nama, nilai })
      });

      if (response.ok) {
        showNotification(`Nilai untuk ${nama} berhasil disimpan! 🎉`, 'success');
        input.setAttribute('readonly', true);
        input.style.background = 'rgba(240, 245, 250, 0.8)';
        input.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        button.textContent = 'Edit';
        button.className = 'btn-edit';
      } else {
        throw new Error('Response not ok');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      showNotification('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.', 'error');
      button.textContent = 'Simpan';
      button.className = 'btn-save';
    } finally {
      button.disabled = false;
      input.disabled = false;
    }
  }
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  // Add notification styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 15px 20px;
    border-radius: 10px;
    color: white;
    font-weight: 500;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    backdrop-filter: blur(10px);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 400px;
    ${type === 'success' ? 'background: linear-gradient(135deg, #4CAF50, #45a049);' : 
      type === 'error' ? 'background: linear-gradient(135deg, #f44336, #d32f2f);' : 
      'background: linear-gradient(135deg, #2196F3, #1976D2);'}
  `;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Enhanced search functionality
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', async (e) => {
  const keyword = e.target.value.toLowerCase().trim();
  const loadingSpinner = document.getElementById('loadingSpinner');
  const tableBody = document.getElementById('tableBody');
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (keyword.length >= 3) {
    // Add debouncing for better performance
    searchTimeout = setTimeout(async () => {
      loadingSpinner.style.display = 'block';
      tableBody.innerHTML = '';
      
      try {
        const data = await fetchData();
        const filtered = data.filter(d => 
          d.Nama.toLowerCase().includes(keyword) ||
          d.Kelas.toLowerCase().includes(keyword) ||
          d.Mapel.toLowerCase().includes(keyword)
        );
        
        loadingSpinner.style.display = 'none';
        renderTable(filtered);
        
        // Show search results count
        if (filtered.length > 0) {
          showNotification(`Ditemukan ${filtered.length} data siswa`, 'info');
        }
      } catch (error) {
        console.error('Search error:', error);
        loadingSpinner.style.display = 'none';
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="no-data">
              <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Terjadi kesalahan saat memuat data</p>
              </div>
            </td>
          </tr>`;
        showNotification('Terjadi kesalahan saat memuat data', 'error');
      }
    }, 300); // 300ms debounce
  } else {
    loadingSpinner.style.display = 'none';
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>Masukkan minimal 3 huruf untuk mencari siswa</p>
          </div>
        </td>
      </tr>`;
  }
});

// Enhanced interactive effects
document.addEventListener('DOMContentLoaded', function() {
  // Add enhanced hover effect to search input
  const searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px)';
  });
  
  searchInput.addEventListener('mouseleave', function() {
    if (this !== document.activeElement) {
      this.style.transform = 'translateY(0)';
    }
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Add smooth scrolling for long tables
  const tableContainer = document.querySelector('.table-container');
  if (tableContainer) {
    tableContainer.style.scrollBehavior = 'smooth';
  }

  // Initialize page with animation
  const elements = document.querySelectorAll('.fade-in');
  elements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.1}s`;
  });
});

// Add CSS for additional styling
const additionalStyles = `
<style>
.badge-kelas {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.badge-mapel {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-save {
  background: linear-gradient(135deg, #4CAF50, #45a049) !important;
}

.btn-edit {
  background: linear-gradient(135deg, #2196F3, #1976D2) !important;
}

.btn-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  margin-left: auto;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-close:hover {
  opacity: 0.7;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

@media (max-width: 768px) {
  .notification {
    top: 10px !important;
    right: 10px !important;
    left: 10px !important;
    max-width: none !important;
  }
  
  .badge-kelas, .badge-mapel {
    font-size: 0.75rem;
    padding: 3px 8px;
  }
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Add performance optimization
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Add input validation
function validateNilai(nilai) {
  const num = parseFloat(nilai);
  return !isNaN(num) && num >= 0 && num <= 100;
}

// Add data caching for better performance
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedData() {
  const now = Date.now();
  if (cachedData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData;
  }
  
  const data = await fetchData();
  cachedData = data;
  cacheTimestamp = now;
  return data;
}

// Add error handling for network issues
window.addEventListener('online', () => {
  showNotification('Koneksi internet tersambung kembali', 'success');
});

window.addEventListener('offline', () => {
  showNotification('Koneksi internet terputus', 'error');
});

// Add loading state management
function setLoadingState(isLoading) {
  const searchInput = document.getElementById('searchInput');
  const loadingSpinner = document.getElementById('loadingSpinner');
  
  if (isLoading) {
    searchInput.disabled = true;
    loadingSpinner.style.display = 'block';
  } else {
    searchInput.disabled = false;
    loadingSpinner.style.display = 'none';
  }
}

// Enhanced error handling
function handleError(error, context = '') {
  console.error(`Error in ${context}:`, error);
  
  let errorMessage = 'Terjadi kesalahan yang tidak diketahui';
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  } else if (error.name === 'SyntaxError') {
    errorMessage = 'Format data tidak valid dari server.';
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  showNotification(errorMessage, 'error');
}

// Add analytics tracking (optional)
function trackEvent(eventName, data = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, data);
  }
  console.log(`Event: ${eventName}`, data);
}

// Initialize app
function initializeApp() {
  console.log('Aplikasi Pengisian Rapor - SMPN 1 Bandar Lampung');
  console.log('Versi: 2.0.0');
  console.log('Dikembangkan dengan ❤️');
  
  // Track page load
  trackEvent('page_load', {
    page_title: document.title,
    page_location: window.location.href
  });
}

// Call initialization
initializeApp();
