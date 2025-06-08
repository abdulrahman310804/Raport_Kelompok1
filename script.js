const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1fzv4tKNk6IyHel5Vudw_dTtY5wOjsnrH7vwWb9lKKpU/gviz/tq?tqx=out:json&sheet=Sheet1';

async function fetchData() {
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
}

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">Tidak ada data yang ditemukan</td></tr>';
    return;
  }

  data.forEach((siswa, index) => {
    const row = document.createElement('tr');
    const nilaiKosong = siswa.Nilai === '';
    const readOnly = nilaiKosong ? '' : 'readonly';
    const buttonLabel = nilaiKosong ? 'Simpan' : 'Edit';
    
    row.innerHTML = `
      <td>${siswa.Nama}</td>
      <td>${siswa.Kelas}</td>
      <td>${siswa.Mapel}</td>
      <td><input type="number" id="nilai-${index}" value="${siswa.Nilai}" min="0" max="100" ${readOnly}/></td>
      <td><button onclick="handleAksi(${index}, '${siswa.Nama}')">${buttonLabel}</button></td>
    `;
    tbody.appendChild(row);
  });
}

async function handleAksi(index, nama) {
  const input = document.getElementById(`nilai-${index}`);
  const button = input.parentElement.nextElementSibling.querySelector('button');

  if (input.hasAttribute('readonly')) {
    input.removeAttribute('readonly');
    button.textContent = 'Simpan';
    input.focus();
  } else {
    const nilai = input.value;
    if (!nilai) {
      alert('Silakan masukkan nilai terlebih dahulu.');
      return;
    }

    // Visual feedback saat menyimpan
    button.textContent = 'Menyimpan...';
    button.disabled = true;

    try {
      const scriptURL = 'https://script.google.com/macros/s/AKfycbzt0C7qaBWKWNLDQ1ztqPsJDs69ebThIWe6SorXzKn8qJnDWDvUJzEIYEJoFInGhfZ8/exec'; // Ganti sesuai URL Web App kamu
      await fetch(scriptURL, {
        method: 'POST',
        body: new URLSearchParams({ nama, nilai })
      });
      alert(`Nilai untuk ${nama} berhasil disimpan!`);
      input.setAttribute('readonly', true);
      button.textContent = 'Edit';
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
      button.textContent = 'Simpan';
    } finally {
      button.disabled = false;
    }
  }
}

document.getElementById('searchInput').addEventListener('input', async (e) => {
  const keyword = e.target.value.toLowerCase();
  const loadingSpinner = document.getElementById('loadingSpinner');
  const tableBody = document.getElementById('tableBody');
  
  if (keyword.length >= 3) {
    loadingSpinner.style.display = 'block';
    tableBody.innerHTML = '';
    
    try {
      const data = await fetchData();
      const filtered = data.filter(d => d.Nama.toLowerCase().includes(keyword));
      loadingSpinner.style.display = 'none';
      renderTable(filtered);
    } catch (error) {
      loadingSpinner.style.display = 'none';
      tableBody.innerHTML = '<tr><td colspan="5" class="no-data">Terjadi kesalahan saat memuat data</td></tr>';
    }
  } else {
    loadingSpinner.style.display = 'none';
    tableBody.innerHTML = '<tr><td colspan="5" class="no-data">Masukkan minimal 3 huruf untuk mencari siswa</td></tr>';
  }
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
  // Add hover effect to search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-1px)';
  });
  
  searchInput.addEventListener('mouseleave', function() {
    if (this !== document.activeElement) {
      this.style.transform = 'translateY(0)';
    }
  });
});
