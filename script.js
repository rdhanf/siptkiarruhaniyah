document.addEventListener('DOMContentLoaded', function() {
    // === Konfigurasi Utama ===
    // PASTIKAN URL INI BENAR SESUAI PUBLIKASI CSV DARI GOOGLE SHEET ANDA!
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGPus51iCYkSnZKnqv_WqqcVMgye4d9ULtF_vNYRJy3rnVKvwoh4qUEU-eHhXNiXIKtDHklYeVMGqh/pub?output=csv'; 
    const schoolLogoPath = 'img/ARRUHANIYAH 3.png'; // Path ke logo sekolah Anda
    const schoolName = "TK Islam Arruhaniyah";
    const schoolAddress = "Kp. Tanah Tinggi Gg. H. Samat No. 30 Kel. Setia Asih Kec. Tarumajaya Kab. Bekasi 17215 Jawa Barat Indonesia";
    const contactPerson = "Pak Ridhan Fauzi"; // Nama Admin yang tanda tangan di slip
    const contactNumber = "083879667121";

    // === Ambil Elemen DOM ===
    const searchInput = document.getElementById('searchInput');
    const parentNameInput = document.getElementById('parentNameInput');
    const searchButton = document.getElementById('searchButton');
    const noResultsMessage = document.getElementById('noResults');
    const studentDetailsContainer = document.getElementById('studentDetails');
    const studentNameSpan = document.getElementById('studentName');
    const studentNISNSpan = document.getElementById('studentNISN');
    const studentClassSpan = document.getElementById('studentClass');
    const parentNameDetailSpan = document.getElementById('parentNameDetail');
    const paymentCardsContainer = document.getElementById('paymentCardsContainer');
    const printSlipButton = document.getElementById('printSlipButton');
    // Pastikan tombol cetak awalnya disembunyikan di HTML dengan style="display: none;"
    printSlipButton.style.display = 'none'; 

    let allPaymentData = [];
    let currentStudentData = null; // Untuk menyimpan data siswa yang sedang ditampilkan

    // List of payment columns in the order you want them on the slip
    // Pastikan nama kolom ini SAMA PERSIS dengan header di Google Sheet Anda
    const paymentColumns = [
        'PPDB',
        'Status_SPP_Juli', 'Status_SPP_Agustus', 'Status_SPP_September', 'Status_SPP_Oktober',
        'Status_SPP_November', 'Status_SPP_Desember', 'Status_SPP_Januari', 'Status_SPP_Februari',
        'Status_SPP_Maret', 'Status_SPP_April', 'Status_SPP_Mei', 'Status_SPP_Juni',
        'Porseni',
        'Manasik Haji',
        'Polisi_Cinta_Anak',
        'Transportasi_Umum',
        'Raport',
        'Buku LKS',
        'Foto Wisuda',
        'Akhir Tahun',
        'P5 1'
    ];

    // === Fungsi Mengambil Data dari Google Sheet ===
    async function fetchPaymentData() {
        try {
            const response = await fetch(googleSheetUrl);
            const csvText = await response.text();
            
            console.log("Raw CSV Text:", csvText.substring(0, 500)); // Untuk debugging, cek apakah CSV diterima
            // Jika Anda melihat HTML di sini, berarti URL Publikasi CSV Anda salah/tidak valid.

            allPaymentData = parseCSV(csvText); 
            console.log("Parsed Data:", allPaymentData); // Untuk debugging, cek apakah data diparse dengan benar

        } catch (error) {
            console.error('Error fetching data:', error);
            noResultsMessage.textContent = 'Gagal memuat data pembayaran. Silakan coba lagi nanti. Cek koneksi internet atau URL Google Sheet.';
            noResultsMessage.classList.add('error'); // Gunakan kelas error untuk pesan
            noResultsMessage.style.display = 'block';
        }
    }

    // === Fungsi Parsing CSV ===
    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(header => header.replace(/^"|"$/g, '').trim());
        console.log("Parsed Headers:", headers); // Sangat penting untuk debugging header!

        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let inQuote = false;
            let currentVal = '';
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    values.push(currentVal.trim());
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim());

            // Check if the number of values matches the number of headers
            if (values.length !== headers.length) {
                console.warn(`Skipping malformed row (header/value count mismatch): Line ${i + 1} - "${lines[i]}"`);
                console.warn(`Expected ${headers.length} values, got ${values.length}. Values:`, values);
                continue; // Skip this row
            }
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
        return data;
    }

    // === Fungsi Mendapatkan Kelas CSS Berdasarkan Status ===
    function getStatusClass(statusText) {
        const lowerCaseStatus = statusText ? statusText.toLowerCase().trim() : '';
        if (lowerCaseStatus === 'lunas') {
            return 'status-lunas';
        } else if (lowerCaseStatus === 'belum lunas') {
            return 'status-belum';
        } else if (lowerCaseStatus === 'tertunda' || lowerCaseStatus === 'proses') {
            return 'status-tertunda';
        }
        return ''; // Default
    }

    // === Fungsi Menampilkan Detail Siswa ===
    function displayStudentDetails(studentData) {
        currentStudentData = studentData; // Simpan data siswa yang sedang ditampilkan

        if (!studentData) { 
            studentDetailsContainer.style.display = 'none';
            printSlipButton.style.display = 'none'; // Sembunyikan tombol cetak
            noResultsMessage.textContent = 'Data siswa tidak ditemukan.'; // Set default message
            noResultsMessage.classList.add('error'); 
            noResultsMessage.style.display = 'block';
            return;
        }

        studentDetailsContainer.style.display = 'block'; 
        printSlipButton.style.display = 'inline-flex'; // Tampilkan tombol cetak
        noResultsMessage.style.display = 'none'; // Sembunyikan pesan tidak ditemukan

        studentNameSpan.textContent = studentData['Nama Siswa'] || '-';
        studentNISNSpan.textContent = studentData['NISN'] || '-';
        studentClassSpan.textContent = studentData['Kelas'] || '-';
        parentNameDetailSpan.textContent = studentData['Nama Orang Tua'] || '-';

        paymentCardsContainer.innerHTML = ''; // Bersihkan item pembayaran sebelumnya

        paymentColumns.forEach(colName => {
            const status = studentData[colName];
            if (status !== undefined && status !== null && status.trim() !== '') {
                let displayColName = colName;
                // Logic untuk membuat nama tampil lebih rapi di UI
                if (colName.startsWith('Status_SPP_')) {
                    displayColName = colName.replace('Status_SPP_', 'SPP ').replace(/_/g, ' '); // Ganti underscore dengan spasi
                } else if (colName.includes('_')) {
                    displayColName = colName.replace(/_/g, ' '); // Ganti underscore dengan spasi untuk kolom lain
                }
                
                const paymentItemDiv = document.createElement('div');
                paymentItemDiv.classList.add('payment-item-card');
                paymentItemDiv.innerHTML = `
                    <div class="payment-info">
                        <span class="payment-name">${displayColName}:</span>
                        <span class="payment-status ${getStatusClass(status)}">${status}</span>
                    </div>
                    <input type="checkbox" class="payment-checkbox" data-col-name="${colName}">
                `;
                paymentCardsContainer.appendChild(paymentItemDiv);
            }
        });
    }

    // === Fungsi Melakukan Pencarian ===
    function performSearch() {
        const studentSearchTerm = searchInput.value.toLowerCase().trim();
        const parentSearchTerm = parentNameInput.value.toLowerCase().trim();
        
        studentDetailsContainer.style.display = 'none'; // Sembunyikan hasil sebelumnya
        noResultsMessage.style.display = 'none'; // Sembunyikan pesan sebelumnya
        printSlipButton.style.display = 'none'; // Sembunyikan tombol cetak saat pencarian baru

        if (studentSearchTerm === '' || parentSearchTerm === '') {
            noResultsMessage.textContent = 'Mohon isi Nama Siswa/NISN dan Nama Orang Tua.';
            noResultsMessage.classList.add('info'); 
            noResultsMessage.style.display = 'block';
            displayStudentDetails(null); // Sembunyikan detail siswa jika input kosong
            return;
        }

        const foundStudent = allPaymentData.find(row => {
            const studentName = row['Nama Siswa'] ? row['Nama Siswa'].toLowerCase() : '';
            const nisn = row['NISN'] ? row['NISN'].toLowerCase() : '';
            const parentName = row['Nama Orang Tua'] ? row['Nama Orang Tua'].toLowerCase() : '';

            const studentMatch = (studentName.includes(studentSearchTerm) || nisn.includes(studentSearchTerm));
            const parentMatch = parentName.includes(parentSearchTerm);
            
            return studentMatch && parentMatch; 
        });

        if (foundStudent) {
            displayStudentDetails(foundStudent); 
        } else {
            noResultsMessage.textContent = 'Data siswa tidak ditemukan atau kombinasi nama tidak cocok. Mohon periksa kembali.';
            noResultsMessage.classList.add('error'); 
            noResultsMessage.style.display = 'block'; 
            displayStudentDetails(null); // Pastikan detail siswa tersembunyi
        }
    }

    // === Fungsi untuk Membuat dan Mencetak Slip Pembayaran ===
    function generatePrintSlip(studentData, selectedPayments) { // Menerima selectedPayments
        if (!studentData || selectedPayments.length === 0) {
            alert('Tidak ada data siswa atau pembayaran yang dipilih untuk dicetak. Mohon lakukan pencarian dan pilih pembayaran.');
            return;
        }

        const currentDate = new Date().toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        let paymentItemsHtml = '';
        selectedPayments.forEach(payment => {
            let displayColName = payment.colName;
            // Logika untuk menampilkan nama yang lebih user-friendly di slip cetak
            if (payment.colName.startsWith('Status_SPP_')) {
                displayColName = payment.colName.replace('Status_SPP_', 'SPP ').replace(/_/g, ' ');
            } else if (payment.colName.includes('_')) {
                displayColName = payment.colName.replace(/_/g, ' ');
            }
            
            paymentItemsHtml += `
                <tr>
                    <td>${displayColName}</td>
                    <td class="status-cell ${getStatusClass(payment.status)}">${payment.status}</td>
                </tr>
            `;
        });

        const printContent = `
            <html>
            <head>
                <title>Slip Pembayaran - ${studentData['Nama Siswa']}</title>
                <style>
                    /* Styles for the print window */
                    body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; color: #333; }
                    .slip-container { 
                        width: 100%; 
                        max-width: 80mm; /* Lebar untuk printer thermal, sesuaikan jika perlu */
                        margin: 0 auto; 
                        padding: 10px; 
                        box-sizing: border-box; 
                        border: none; /* Hilangkan border di preview cetak */
                    }
                    .header-slip { text-align: center; margin-bottom: 15px; }
                    .header-slip img { max-width: 50px; height: auto; margin-bottom: 5px; }
                    .header-slip h2 { margin: 5px 0; font-size: 1em; color: #333; }
                    .header-slip p { margin: 2px 0; font-size: 0.7em; color: #666; }
                    .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; font-size: 0.8em; border-bottom: 1px dashed #ccc; padding-bottom: 3px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 0.8em; }
                    .info-row span:first-child { font-weight: 500; }
                    .payment-table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 0.8em; }
                    .payment-table th, .payment-table td { border: 1px solid #ddd; padding: 5px; text-align: left; }
                    .payment-table th { background-color: #f5f5f5; font-weight: 600; }
                    .status-cell { text-align: center; font-weight: bold; }
                    /* Ensure colors print correctly */
                    .status-lunas { color: #4CAF50 !important; -webkit-print-color-adjust: exact; }
                    .status-belum { color: #F44333 !important; -webkit-print-color-adjust: exact; } /* Disesuaikan agar lebih jelas */
                    .status-tertunda { color: #FFC107 !important; -webkit-print-color-adjust: exact; }
                    .signature { margin-top: 20px; text-align: right; font-size: 0.8em; }
                    .signature p { margin: 3px 0; }
                    .signature .admin-name { margin-top: 30px; border-top: 1px solid #333; display: inline-block; padding-top: 5px; }
                    .footer-slip { text-align: center; margin-top: 15px; font-size: 0.7em; color: #888; }
                    
                    /* Media query for print specifically */
                    @media print {
                        body { margin: 0; padding: 0; }
                        .slip-container { border: none; padding: 0; }
                        /* Ensure text and colors are not stripped */
                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    }
                </style>
            </head>
            <body>
                <div class="slip-container">
                    <div class="header-slip">
                        <img src="${schoolLogoPath}" alt="Logo Sekolah">
                        <h2>${schoolName}</h2>
                        <p>${schoolAddress}</p>
                        <p>Telp/WA: ${contactNumber}</p>
                    </div>

                    <div class="section-title">BUKTI PEMBAYARAN SISWA</div>
                    <div class="info-row">
                        <span>Tanggal Cetak:</span> <span>${currentDate}</span>
                    </div>
                    <div class="info-row">
                        <span>Nama Siswa:</span> <span>${studentData['Nama Siswa'] || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span>NISN:</span> <span>${studentData['NISN'] || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span>Kelas:</span> <span>${studentData['Kelas'] || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span>Nama Orang Tua:</span> <span>${studentData['Nama Orang Tua'] || '-'}</span>
                    </div>

                    <div class="section-title">RINCIAN PEMBAYARAN</div>
                    <table class="payment-table">
                        <thead>
                            <tr>
                                <th>Jenis Pembayaran</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paymentItemsHtml}
                        </tbody>
                    </table>

                    <div class="signature">
                        <p>Bekasi, ${currentDate}</p>
                        <p>Yang Menerima,</p>
                        <br><br><br>
                        <p class="admin-name">${contactPerson}</p>
                    </div>

                    <div class="footer-slip">
                        <p>Terima kasih atas pembayaran Anda.</p>
                        <p>Ini adalah slip pembayaran otomatis, tidak memerlukan tanda tangan basah.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus(); // Fokus pada jendela baru
        printWindow.print(); // Buka dialog cetak
        // printWindow.close(); // Opsional: tutup jendela setelah cetak, tapi kadang mengganggu UX
    }

    // === Event Listeners ===
    searchButton.addEventListener('click', performSearch);
    
    // Event listener untuk tombol cetak: Mengumpulkan pembayaran yang dicentang
    printSlipButton.addEventListener('click', function() {
        if (!currentStudentData) {
            alert('Tidak ada data siswa yang ditemukan. Mohon lakukan pencarian terlebih dahulu.');
            return;
        }

        const selectedPayments = [];
        const checkboxes = document.querySelectorAll('.payment-checkbox:checked'); // Ambil semua checkbox yang dicentang

        if (checkboxes.length === 0) {
            alert('Pilih setidaknya satu pembayaran yang ingin dicetak!');
            return;
        }

        checkboxes.forEach(checkbox => {
            const colName = checkbox.dataset.colName; // Mengambil nama kolom dari atribut data
            // Temukan elemen span status yang terkait dengan checkbox ini
            const paymentItemDiv = checkbox.closest('.payment-item-card');
            const statusSpan = paymentItemDiv.querySelector('.payment-status');

            if (colName && statusSpan) {
                selectedPayments.push({
                    colName: colName,
                    status: statusSpan.textContent // Mengambil teks status dari UI
                });
            }
        });

        generatePrintSlip(currentStudentData, selectedPayments); // Kirim data siswa dan pembayaran terpilih
    });

    // Izinkan menekan Enter di kedua input untuk memicu pencarian
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    parentNameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // === Inisialisasi: Ambil data saat halaman dimuat ===
    fetchPaymentData();
});