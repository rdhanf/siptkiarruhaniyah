document.addEventListener('DOMContentLoaded', function() {
    // === Konfigurasi Utama ===
    // PASTIKAN URL INI BENAR SESUAI PUBLIKASI CSV DARI GOOGLE SHEET ANDA!
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGPus51iCYkSnZKnqv_WqqcVMgye4d9ULtF_vNYRJy3rnVKvwoh4qUEU-eHhXNiXIKtDHklYeVMGqh/pub?output=csv'; 
    const schoolLogoPath = 'img/ARRUHANIYAH 3.png'; 
    const schoolName = "TK Islam Arruhaniyah";
    const schoolAddress = "Kp. Tanah Tinggi Gg. H. Samat No. 30 Kel. Setia Asih Kec. Tarumajaya Kab. Bekasi 17215 Jawa Barat Indonesia";
    const contactPerson = "Pak Ridhan Fauzi";
    const contactNumber = "083879667121";

    // === Konfigurasi SPP ===
    const SPP_NOMINAL_AMOUNT = 90000; 
    const SPP_DUE_DAY = 28; 
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
    const loadingMessage = document.getElementById('loadingMessage'); // Tambahkan ini

    const manualPaymentNameInput = document.getElementById('manualPaymentName');
    const manualPaymentNominalInput = document.getElementById('manualPaymentNominal');
    const addManualPaymentBtn = document.getElementById('addManualPaymentBtn');
    const manualPaymentList = document.getElementById('manualPaymentList');

    // Sembunyikan tombol saat inisialisasi
    printSlipButton.style.display = 'none';
    printArrearsButton.style.display = 'none';
    
    // Pastikan container siswa tersembunyi
    studentDetailsContainer.style.display = 'none';
    noResultsMessage.style.display = 'none';

    let allPaymentData = [];
    let currentStudentData = null;
    // Array untuk menyimpan pembayaran manual yang akan dicetak pada slip
    let manualPaymentsToPrint = [];

    const paymentColumns = [
        'PPDB', 'Porseni', 'Membatik', 'Polisi_Cinta_Anak', 'Transportasi_Umum', 'Raport', 'Buku LKS',
        'Foto Wisuda', 'Akhir Tahun', 'P5 1'
    ];
    const sppColumns = SPP_MONTHS_ACADEMIC_ORDER.map(month => `Status_SPP_${month}`);

    async function fetchPaymentData() {
        loadingMessage.style.display = 'block';
        try {
            const response = await fetch(googleSheetUrl);
            const csvText = await response.text();
            allPaymentData = parseCSV(csvText);
            console.log("Parsed Data:", allPaymentData);
            loadingMessage.style.display = 'none';
        } catch (error) {
            console.error('Error fetching data:', error);
            loadingMessage.style.display = 'none';
            noResultsMessage.textContent = 'Gagal memuat data pembayaran. Mohon cek koneksi internet atau URL publik Google Sheet Anda.';
            noResultsMessage.classList.add('error');
            noResultsMessage.style.display = 'block';
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(header => header.replace(/^"|"$/g, '').trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.replace(/^"|"$/g, '').trim());

            if (values.length !== headers.length) {
                console.warn(`Skipping malformed row: Line ${i + 1}`);
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

    function getStatusClass(statusText) {
        const lowerCaseStatus = statusText ? statusText.toLowerCase().trim() : '';
        if (lowerCaseStatus === 'lunas') { return 'status-lunas'; }
        if (lowerCaseStatus === 'belum lunas') { return 'status-belum'; }
        if (lowerCaseStatus === 'tertunda' || lowerCaseStatus === 'proses') { return 'status-tertunda'; }
        return '';
    }

    function formatRupiah(amount) {
        if (amount === null || amount === undefined || isNaN(amount) || amount === '') {
            return 'Rp 0';
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) {
            return 'Rp 0';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(numericAmount);
    }
    
    // Fungsi untuk memperbarui tampilan daftar pembayaran manual
    function displayManualPayments() {
        manualPaymentList.innerHTML = '';
        manualPaymentsToPrint.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} - ${formatRupiah(item.nominal)}</span>
                <button class="remove-manual-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            manualPaymentList.appendChild(li);
        });
        
        document.querySelectorAll('.remove-manual-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                manualPaymentsToPrint.splice(index, 1);
                displayManualPayments();
                updatePrintButtonVisibility();
            });
        });
    }

    // Fungsi baru untuk mengelola tampilan tombol cetak
    function updatePrintButtonVisibility() {
        const selectedCount = document.querySelectorAll('.payment-checkbox:checked').length;
        const manualCount = manualPaymentsToPrint.length;
        if (selectedCount > 0 || manualCount > 0) {
            printSlipButton.style.display = 'inline-flex';
        } else {
            printSlipButton.style.display = 'none';
        }

        const arrearsCount = document.querySelectorAll('.payment-status.status-belum, .payment-status.status-tertunda').length;
        if (arrearsCount > 0) {
             printArrearsButton.style.display = 'inline-flex';
        } else {
             printArrearsButton.style.display = 'none';
        }
    }

    function displayStudentDetails(studentData) {
        currentStudentData = studentData;
        manualPaymentsToPrint = []; // Reset pembayaran manual

        if (!studentData) {
            studentDetailsContainer.style.display = 'none';
            updatePrintButtonVisibility(); // Sembunyikan tombol cetak
            return;
        }

        studentDetailsContainer.style.display = 'block';
        noResultsMessage.style.display = 'none';

        studentNameSpan.textContent = studentData['Nama Siswa'] || '-';
        studentNISNSpan.textContent = studentData['NISN'] || '-';
        studentClassSpan.textContent = studentData['Kelas'] || '-';
        parentNameDetailSpan.textContent = studentData['Nama Orang Tua'] || '-';

        paymentCardsContainer.innerHTML = '';

        // Gabungkan kolom SPP dan kolom pembayaran lainnya
        const allPaymentColumns = [...sppColumns, ...paymentColumns];

        allPaymentColumns.forEach(colName => {
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
        
        displayManualPayments();
        updatePrintButtonVisibility();

        // Tambahkan event listener ke setiap checkbox yang baru dibuat
        document.querySelectorAll('.payment-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updatePrintButtonVisibility);
        });
    }

    function performSearch() {
        const studentSearchTerm = searchInput.value.toLowerCase().trim();
        const parentSearchTerm = parentNameInput.value.toLowerCase().trim();

        studentDetailsContainer.style.display = 'none';
        noResultsMessage.style.display = 'none';
        updatePrintButtonVisibility(); // Sembunyikan tombol cetak

        if (studentSearchTerm === '' || parentSearchTerm === '') {
            noResultsMessage.textContent = 'Mohon isi Nama Siswa/NISN dan Nama Orang Tua.';
            noResultsMessage.classList.remove('error');
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
            noResultsMessage.classList.remove('info');
            noResultsMessage.classList.add('error');
            noResultsMessage.style.display = 'block';
            displayStudentDetails(null);
        }
    }
    
    function generatePrintSlip(studentData, combinedPayments) {
        if (!studentData || combinedPayments.length === 0) {
            alert('Tidak ada data siswa atau pembayaran yang dipilih untuk dicetak. Mohon lakukan pencarian dan pilih pembayaran.');
            return;
        }

        const currentDate = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'});

        let paymentItemsHtml = '';
        let totalNominal = 0;

        combinedPayments.forEach(payment => {
            let displayColName = payment.colName || payment.name;
            let status = payment.status || 'Lunas';

            if (payment.colName && payment.colName.startsWith('Status_SPP_')) {
                displayColName = payment.colName.replace('Status_SPP_', 'SPP ').replace(/_/g, ' ');
            } else if (payment.colName && payment.colName.includes('_')) {
                displayColName = payment.colName.replace(/_/g, ' ');
            }
            
            paymentItemsHtml += `
                <tr>
                    <td>${displayColName}</td>
                    <td class="nominal-cell">${formatRupiah(payment.nominal)}</td>
                    <td class="status-cell ${getStatusClass(status)}">${status}</td>
                </tr>
            `;
            totalNominal += (payment.nominal || 0);
        });
        
        // ... (sisanya kode cetak slip tidak berubah) ...
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

    function generateCombinedArrearsSlip(studentData) {
    if (!studentData) {
        alert('Tidak ada data siswa untuk membuat tagihan tunggakan.');
        return;
    }

    const currentDate = new Date();
    
    let arrearsItems = [];
    let totalArrearsNominal = 0;

    // Ambil tunggakan dari data Google Sheet
    const allPaymentColumns = [...sppColumns, ...paymentColumns];
    allPaymentColumns.forEach(colName => {
        const status = studentData[colName];
        if (status && (status.toLowerCase().trim() === 'belum lunas' || status.toLowerCase().trim() === 'tertunda')) {
            const nominalInput = document.getElementById(`nominal-${colName}`);
            let nominalValue = 0;
            if (nominalInput) {
                nominalValue = parseInt(nominalInput.value) || 0;
            } else if (colName.startsWith('Status_SPP_')) {
                nominalValue = SPP_NOMINAL_AMOUNT;
            }
            
            let displayColName = colName;
            if (colName.startsWith('Status_SPP_')) {
                displayColName = `SPP ${colName.replace('Status_SPP_', '')}`;
            } else {
                displayColName = colName.replace(/_/g, ' ');
            }

            arrearsItems.push({
                name: displayColName,
                nominal: nominalValue
            });
            totalArrearsNominal += nominalValue;
        }
    });

    // === PERUBAHAN DI SINI ===
    // Tambahkan pembayaran manual dari array manualPaymentsToPrint ke dalam daftar tunggakan
    manualPaymentsToPrint.forEach(item => {
        arrearsItems.push(item);
        totalArrearsNominal += item.nominal;
    });

    if (arrearsItems.length === 0) {
        alert('Tidak ada tunggakan pembayaran yang ditemukan untuk siswa ini.');
        return;
    }

    let arrearsItemsHtml = '';
    arrearsItems.forEach(item => {
        arrearsItemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td class="nominal-cell">${formatRupiah(item.nominal)}</td>
            </tr>
        `;
    });

    // ... (sisanya kode cetak tagihan tunggakan tidak berubah) ...
    const printContent = `
        <html>
        <head>
            <title>Tagihan Pembayaran - ${studentData['Nama Siswa']}</title>
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

                <div class="section-title">TAGIHAN TUNGGAKAN PEMBAYARAN</div>
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
                            <th>Jenis Pembayaran</th>
                            <th>Nominal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${arrearsItemsHtml}
                        <tr class="total-row">
                            <td>TOTAL TUNGGAKAN</td>
                            <td class="nominal-cell">${formatRupiah(totalArrearsNominal)}</td>
                        </tr>
                    </tbody>
                </table>

                <p class="important-note">Mohon segera melunasi tunggakan pembayaran.</p>

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
        
        // Gabungkan pembayaran dari checkbox dengan pembayaran manual
        const combinedPayments = [...selectedPayments, ...manualPaymentsToPrint];
        
        if (combinedPayments.length === 0) {
            alert('Pilih setidaknya satu pembayaran atau tambahkan pembayaran manual yang ingin dicetak!');
            return;
        }

        generatePrintSlip(currentStudentData, combinedPayments);
    });

    printArrearsButton.addEventListener('click', function() {
        if (!currentStudentData) {
            alert('Tidak ada data siswa yang ditemukan. Mohon lakukan pencarian terlebih dahulu.');
            return;
        }
        generateCombinedArrearsSlip(currentStudentData);
    });
    
    addManualPaymentBtn.addEventListener('click', function() {
        const name = manualPaymentNameInput.value.trim();
        const nominal = parseInt(manualPaymentNominalInput.value);
        const includeInSlip = document.getElementById('manualIncludePayment').checked;

        if (name === '' || isNaN(nominal) || nominal <= 0) {
            alert('Mohon isi nama pembayaran dan nominal yang valid (angka positif).');
            return;
        }
        
        // Hanya tambahkan ke array pembayaran manual yang akan dicetak jika checkbox dicentang
        if (includeInSlip) {
             manualPaymentsToPrint.push({
                name: name,
                nominal: nominal,
                status: 'Lunas' // Status default untuk pembayaran manual
            });
        }

        manualPaymentNameInput.value = '';
        manualPaymentNominalInput.value = '';
        displayManualPayments();
        updatePrintButtonVisibility(); // Perbarui tampilan tombol setelah menambahkan manual
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

