document.addEventListener('DOMContentLoaded', function() {
    // === Konfigurasi Utama ===
    // PASTIKAN URL INI BENAR SESUAI PUBLIKASI CSV DARI GOOGLE SHEET ANDA!
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGPus51iCYkSnZKnqv_WqqcVMgye4d9ULtF_vNYRJy3rnVKvwoh4qUEU-eHhXNiXIKtDHklYeVMGqh/pub?output=csv'; // URL Google Sheet Anda
    const schoolLogoPath = 'img/ARRUHANIYAH 3.png'; // Path ke logo sekolah Anda
    const schoolName = "TK Islam Arruhaniyah";
    const schoolAddress = "Kp. Tanah Tinggi Gg. H. Samat No. 30 Kel. Setia Asih Kec. Tarumajaya Kab. Bekasi 17215 Jawa Barat Indonesia";
    const contactPerson = "Pak Ridhan Fauzi"; // Nama Admin yang tanda tangan di slip
    const contactNumber = "083879667121";
    
    // === Konfigurasi SPP ===
    const SPP_NOMINAL_AMOUNT = 90000; // Nominal SPP setiap bulan
    const SPP_DUE_DAY = 28; // Tanggal jatuh tempo SPP setiap bulannya
    // Urutan bulan SPP sesuai tahun ajaran (Juli - Juni)
    const SPP_MONTHS_ACADEMIC_ORDER = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];


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
    const printArrearsButton = document.getElementById('printArrearsButton'); 
    
    // Pastikan tombol cetak awalnya disembunyikan di HTML dengan style="display: none;"
    printSlipButton.style.display = 'none'; 
    printArrearsButton.style.display = 'none'; 

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
        'Membatik', 
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
            
            console.log("Raw CSV Text:", csvText.substring(0, 500)); 
            allPaymentData = parseCSV(csvText); 
            console.log("Parsed Data:", allPaymentData); 

        } catch (error) {
            console.error('Error fetching data:', error);
            noResultsMessage.textContent = 'Gagal memuat data pembayaran. Silakan coba lagi nanti. Cek koneksi internet atau URL Google Sheet.';
            noResultsMessage.classList.add('error'); 
            noResultsMessage.style.display = 'block';
        }
    }

    // === Fungsi Parsing CSV ===
    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(header => header.replace(/^"|"$/g, '').trim());
        console.log("Parsed Headers:", headers); 

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

            if (values.length !== headers.length) {
                console.warn(`Skipping malformed row (header/value count mismatch): Line ${i + 1} - "${lines[i]}"`);
                console.warn(`Expected ${headers.length} values, got ${values.length}. Values:`, values);
                continue; 
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
        return ''; 
    }

    // Fungsi untuk memformat angka menjadi format mata uang Rupiah
    function formatRupiah(amount) {
        if (amount === null || amount === undefined || isNaN(amount) || amount === '') {
             return 'Rp 0'; 
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) {
            return 'Rp 0';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0
        }).format(numericAmount);
    }

    // Helper function to get 0-indexed calendar month from month name
    // (Jan=0, Feb=1, ..., Dec=11)
    function getCalendarMonthIndex(monthName) {
        const monthMap = {
            'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
            'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
        };
        return monthMap[monthName];
    }

    // === Fungsi Menampilkan Detail Siswa ===
    function displayStudentDetails(studentData) {
        currentStudentData = studentData; 

        if (!studentData) { 
            studentDetailsContainer.style.display = 'none';
            printSlipButton.style.display = 'none'; 
            printArrearsButton.style.display = 'none'; 
            noResultsMessage.textContent = 'Data siswa tidak ditemukan.'; 
            noResultsMessage.classList.add('error'); 
            noResultsMessage.style.display = 'block';
            return;
        }

        studentDetailsContainer.style.display = 'block'; 
        printSlipButton.style.display = 'inline-flex'; 
        printArrearsButton.style.display = 'inline-flex'; 
        noResultsMessage.style.display = 'none'; 

        studentNameSpan.textContent = studentData['Nama Siswa'] || '-';
        studentNISNSpan.textContent = studentData['NISN'] || '-';
        studentClassSpan.textContent = studentData['Kelas'] || '-';
        parentNameDetailSpan.textContent = studentData['Nama Orang Tua'] || '-';

        paymentCardsContainer.innerHTML = ''; 

        paymentColumns.forEach(colName => {
            const status = studentData[colName];
            if (status !== undefined && status !== null && status.trim() !== '') {
                let displayColName = colName;
                if (colName.startsWith('Status_SPP_')) {
                    displayColName = colName.replace('Status_SPP_', 'SPP ').replace(/_/g, ' '); 
                } else if (colName.includes('_')) {
                    displayColName = colName.replace(/_/g, ' '); 
                }
                
                const paymentItemDiv = document.createElement('div');
                paymentItemDiv.classList.add('payment-item-card');
                paymentItemDiv.innerHTML = `
                    <div class="payment-info">
                        <span class="payment-name">${displayColName}:</span>
                        <span class="payment-status ${getStatusClass(status)}">${status}</span>
                    </div>
                    <div class="nominal-input-container">
                        <label for="nominal-${colName}">Nominal:</label>
                        <input type="number" id="nominal-${colName}" class="nominal-input" placeholder="0" min="0" value="${colName.startsWith('Status_SPP_') ? SPP_NOMINAL_AMOUNT : ''}">
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
        
        studentDetailsContainer.style.display = 'none'; 
        noResultsMessage.style.display = 'none'; 
        printSlipButton.style.display = 'none'; 
        printArrearsButton.style.display = 'none'; 

        if (studentSearchTerm === '' || parentSearchTerm === '') {
            noResultsMessage.textContent = 'Mohon isi Nama Siswa/NISN dan Nama Orang Tua.';
            noResultsMessage.classList.add('info'); 
            noResultsMessage.style.display = 'block';
            displayStudentDetails(null); 
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
            displayStudentDetails(null); 
        }
    }

    // === Fungsi untuk Membuat dan Mencetak Slip Pembayaran Umum ===
    function generatePrintSlip(studentData, selectedPayments) { 
        if (!studentData || selectedPayments.length === 0) {
            alert('Tidak ada data siswa atau pembayaran yang dipilih untuk dicetak. Mohon lakukan pencarian dan pilih pembayaran.');
            return;
        }

        const currentDate = new Date().toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        let paymentItemsHtml = '';
        let totalNominal = 0; 

        selectedPayments.forEach(payment => {
            let displayColName = payment.colName;
            if (payment.colName.startsWith('Status_SPP_')) {
                displayColName = payment.colName.replace('Status_SPP_', 'SPP ').replace(/_/g, ' '); 
            } else if (payment.colName.includes('_')) {
                displayColName = payment.colName.replace(/_/g, ' '); 
            }
            
            paymentItemsHtml += `
                <tr>
                    <td>${displayColName}</td>
                    <td class="nominal-cell">${formatRupiah(payment.nominal)}</td>
                    <td class="status-cell ${getStatusClass(payment.status)}">${payment.status}</td>
                </tr>
            `;
            totalNominal += (payment.nominal || 0); 
        });

        const printContent = `
            <html>
            <head>
                <title>Slip Pembayaran - ${studentData['Nama Siswa']}</title>
                <style>
                    body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; color: #333; }
                    .slip-container { 
                        width: 100%; 
                        max-width: 80mm; 
                        margin: 0 auto; 
                        padding: 10px; 
                        box-sizing: border-box; 
                        border: none; 
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
                    .nominal-cell { text-align: right; } 
                    .status-cell { text-align: center; font-weight: bold; }
                    .total-row { font-weight: bold; background-color: #e9e9e9; } 
                    .total-row td { border-top: 2px solid #333; } 

                    .status-lunas { color: #4CAF50 !important; -webkit-print-color-adjust: exact; }
                    .status-belum { color: #F44336 !important; -webkit-print-color-adjust: exact; } 
                    .status-tertunda { color: #FFC107 !important; -webkit-print-color-adjust: exact; }
                    .signature { margin-top: 20px; text-align: right; font-size: 0.8em; }
                    .signature p { margin: 3px 0; }
                    .signature .admin-name { margin-top: 30px; border-top: 1px solid #333; display: inline-block; padding-top: 5px; }
                    .footer-slip { text-align: center; margin-top: 15px; font-size: 0.7em; color: #888; }
                    
                    @media print {
                        body { margin: 0; padding: 0; }
                        .slip-container { border: none; padding: 0; }
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
                                <th>Nominal</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paymentItemsHtml}
                            <tr class="total-row">
                                <td colspan="2">TOTAL PEMBAYARAN</td>
                                <td class="nominal-cell">${formatRupiah(totalNominal)}</td>
                            </tr>
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
        printWindow.focus(); 
        printWindow.print(); 
    }

    // === Fungsi untuk Membuat dan Mencetak Slip Tagihan Tunggakan SPP ===
    function generateSppArrearsSlip(studentData) {
        if (!studentData) {
            alert('Tidak ada data siswa untuk membuat tagihan tunggakan.');
            return;
        }

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonthCalendarIndex = currentDate.getMonth(); // 0-11 (Jan=0, Feb=1, ..., Juli=6)
        const currentDay = currentDate.getDate();

        let overdueSppItems = [];
        let totalArrearsNominal = 0;

        // Indeks kalender untuk bulan Juli (sebagai awal tahun ajaran)
        const ACADEMIC_YEAR_START_MONTH_CAL_INDEX = getCalendarMonthIndex('Juli'); 
        
        // Iterasi melalui bulan-bulan SPP sesuai urutan tahun ajaran
        SPP_MONTHS_ACADEMIC_ORDER.forEach(monthName => {
            const colName = `Status_SPP_${monthName}`; 
            const status = studentData[colName];

            // Hanya proses jika statusnya 'belum lunas'
            if (status && status.toLowerCase().trim() === 'belum lunas') {
                const sppCalendarMonthIndex = getCalendarMonthIndex(monthName);
                
                let isOverdue = false;

                // Konversi indeks bulan kalender ke indeks urutan tahun ajaran
                // Contoh: Juli (kalender 6) menjadi indeks 0 tahun ajaran
                // Januari (kalender 0) menjadi indeks 6 tahun ajaran
                let sppAcademicOrderIndex;
                if (sppCalendarMonthIndex >= ACADEMIC_YEAR_START_MONTH_CAL_INDEX) {
                    sppAcademicOrderIndex = sppCalendarMonthIndex - ACADEMIC_YEAR_START_MONTH_CAL_INDEX;
                } else {
                    sppAcademicOrderIndex = sppCalendarMonthIndex + (12 - ACADEMIC_YEAR_START_MONTH_CAL_INDEX);
                }

                let currentAcademicOrderIndex;
                if (currentMonthCalendarIndex >= ACADEMIC_YEAR_START_MONTH_CAL_INDEX) {
                    currentAcademicOrderIndex = currentMonthCalendarIndex - ACADEMIC_YEAR_START_MONTH_CAL_INDEX;
                } else {
                    currentAcademicOrderIndex = currentMonthCalendarIndex + (12 - ACADEMIC_YEAR_START_MONTH_CAL_INDEX);
                }

                // Logika penentuan apakah sudah jatuh tempo
                // 1. Bulan SPP secara urutan tahun ajaran lebih dulu dari bulan sekarang
                if (sppAcademicOrderIndex < currentAcademicOrderIndex) {
                    isOverdue = true;
                } 
                // 2. Bulan SPP sama dengan bulan sekarang DAN sudah melewati tanggal jatuh tempo
                else if (sppAcademicOrderIndex === currentAcademicOrderIndex) {
                    if (currentDay > SPP_DUE_DAY) {
                        isOverdue = true;
                    }
                }
                // Catatan: Asumsi semua kolom SPP di spreadsheet adalah untuk tahun ajaran yang sedang berjalan
                // atau yang terakhir. Penanganan tahun yang spesifik (misal SPP Juli 2024 vs Juli 2025)
                // memerlukan data tahun di spreadsheet.

                if (isOverdue) {
                    overdueSppItems.push({
                        month: monthName,
                        nominal: SPP_NOMINAL_AMOUNT
                    });
                    totalArrearsNominal += SPP_NOMINAL_AMOUNT;
                }
            }
        });

        if (overdueSppItems.length === 0) {
            alert('Tidak ada tunggakan SPP yang ditemukan untuk siswa ini.');
            return;
        }

        let arrearsItemsHtml = '';
        overdueSppItems.forEach(item => {
            arrearsItemsHtml += `
                <tr>
                    <td>SPP ${item.month}</td>
                    <td class="nominal-cell">${formatRupiah(item.nominal)}</td>
                </tr>
            `;
        });

        const printContent = `
            <html>
            <head>
                <title>Tagihan Tunggakan SPP - ${studentData['Nama Siswa']}</title>
                <style>
                    body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; color: #333; }
                    .slip-container { 
                        width: 100%; 
                        max-width: 80mm; 
                        margin: 0 auto; 
                        padding: 10px; 
                        box-sizing: border-box; 
                        border: none; 
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
                    .nominal-cell { text-align: right; }
                    .total-row { font-weight: bold; background-color: #e9e9e9; } 
                    .total-row td { border-top: 2px solid #333; } 
                    .signature { margin-top: 20px; text-align: right; font-size: 0.8em; }
                    .signature p { margin: 3px 0; }
                    .signature .admin-name { margin-top: 30px; border-top: 1px solid #333; display: inline-block; padding-top: 5px; }
                    .footer-slip { text-align: center; margin-top: 15px; font-size: 0.7em; color: #888; }
                    .important-note {
                        font-size: 0.8em;
                        color: #D32F2F; 
                        text-align: center;
                        margin-top: 10px;
                        font-weight: bold;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .slip-container { border: none; padding: 0; }
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

                    <div class="section-title">TAGIHAN TUNGGAKAN PEMBAYARAN SPP</div>
                    <div class="info-row">
                        <span>Tanggal Cetak:</span> <span>${currentDate.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
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

                    <div class="section-title">RINCIAN TUNGGAKAN</div>
                    <table class="payment-table">
                        <thead>
                            <tr>
                                <th>Bulan SPP</th>
                                <th>Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${arrearsItemsHtml}
                            <tr class="total-row">
                                <td colspan="2">TOTAL TUNGGAKAN</td>
                                <td class="nominal-cell">${formatRupiah(totalArrearsNominal)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <p class="important-note">Mohon segera melunasi tunggakan pembayaran SPP.</p>

                    <div class="signature">
                        <p>Bekasi, ${currentDate.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}</p>
                        <p>Admin,</p>
                        <br><br><br>
                        <p class="admin-name">${contactPerson}</p>
                    </div>

                    <div class="footer-slip">
                        <p>Terima kasih atas perhatian Anda.</p>
                        <p>Ini adalah slip tagihan otomatis, tidak memerlukan tanda tangan basah.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus(); 
        printWindow.print(); 
    }

    // === Event Listeners ===
    searchButton.addEventListener('click', performSearch);
    
    printSlipButton.addEventListener('click', function() {
        if (!currentStudentData) {
            alert('Tidak ada data siswa yang ditemukan. Mohon lakukan pencarian terlebih dahulu.');
            return;
        }

        const selectedPayments = [];
        const checkboxes = document.querySelectorAll('.payment-checkbox:checked'); 

        if (checkboxes.length === 0) {
            alert('Pilih setidaknya satu pembayaran yang ingin dicetak!');
            return;
        }

        checkboxes.forEach(checkbox => {
            const colName = checkbox.dataset.colName; 
            const paymentItemDiv = checkbox.closest('.payment-item-card');
            const statusSpan = paymentItemDiv.querySelector('.payment-status');
            const nominalInput = paymentItemDiv.querySelector('.nominal-input');
            
            const nominalValue = nominalInput ? parseInt(nominalInput.value) : 0;

            if (colName && statusSpan) {
                selectedPayments.push({
                    colName: colName,
                    status: statusSpan.textContent, 
                    nominal: nominalValue 
                });
            }
        });

        generatePrintSlip(currentStudentData, selectedPayments); 
    });

    printArrearsButton.addEventListener('click', function() {
        if (!currentStudentData) {
            alert('Tidak ada data siswa yang ditemukan. Mohon lakukan pencarian terlebih dahulu.');
            return;
        }
        generateSppArrearsSlip(currentStudentData);
    });

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

    fetchPaymentData();
});
