document.addEventListener('DOMContentLoaded', function() {
    // === Konfigurasi Utama ===
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGPus51iCYkSnZKnqv_WqqcVMgye4d9ULtF_vNYRJy3rnVKvwoh4qUEU-eHhXNiXIKtDHklYeVMGqh/pub?output=csv'; // URL Google Sheet Anda yang baru
    const schoolLogoPath = 'img/ARRUHANIYAH 3.png'; // Path ke logo sekolah Anda
    const schoolName = "TK Islam Arruhaniyah";
    const schoolAddress = "Kp. Tanah Tinggi Gg. H. Samat No. 30 Kel. Setia Asih Kec. Tarumajaya Kab. Bekasi 17215 Jawa Barat Indonesia";
    const contactPerson = "Pak Ridhan Fauzi"; // Nama Admin yang tanda tangan di slip
    const contactNumber = "083879667121";

    // === Konfigurasi SPP ===
    const SPP_NOMINAL_AMOUNT = 90000; // Nominal SPP setiap bulan
    const SPP_DUE_DAY = 28; // Tanggal jatuh tempo SPP setiap bulannya
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
    
    const manualPaymentNameInput = document.getElementById('manualPaymentName');
    const manualPaymentNominalInput = document.getElementById('manualPaymentNominal');
    const addManualPaymentBtn = document.getElementById('addManualPaymentBtn');
    const manualPaymentList = document.getElementById('manualPaymentList');

    printSlipButton.style.display = 'none';
    printArrearsButton.style.display = 'none';

    let allPaymentData = [];
    let currentStudentData = null;
    let manualPayments = []; // Menggunakan array ini untuk pembayaran manual yang ingin dicetak
    let manualArrears = []; // Menggunakan array ini untuk pembayaran manual yang dimasukkan

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

    function getCalendarMonthIndex(monthName) {
        const monthMap = {
            'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
            'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
        };
        return monthMap[monthName];
    }
    
    // Fungsi untuk menambah pembayaran manual
    function addManualPayment() {
        const name = manualPaymentNameInput.value.trim();
        const nominal = parseInt(manualPaymentNominalInput.value);

        if (name === '' || isNaN(nominal) || nominal <= 0) {
            alert('Mohon isi nama pembayaran dan nominal yang valid (angka positif).');
            return;
        }

        // Tambahkan pembayaran manual ke array manualPayments
        manualPayments.push({
            name: name,
            nominal: nominal,
            status: 'Lunas'
        });

        // Kosongkan input
        manualPaymentNameInput.value = '';
        manualPaymentNominalInput.value = '';

        // Tampilkan daftar pembayaran manual yang diperbarui
        renderManualPayments();
    }
    
    // Fungsi untuk menampilkan daftar pembayaran manual di UI
    function renderManualPayments() {
        manualPaymentList.innerHTML = '';
        manualPayments.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} - ${formatRupiah(item.nominal)}</span>
                <button class="remove-manual-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            manualPaymentList.appendChild(li);
        });
        
        // Tambahkan event listener untuk tombol hapus
        document.querySelectorAll('.remove-manual-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.dataset.index;
                manualPayments.splice(index, 1);
                renderManualPayments();
            });
        });
    }


    function displayStudentDetails(studentData) {
        currentStudentData = studentData;
        manualPayments = []; // Reset manual payments saat data siswa baru dimuat
        renderManualPayments(); // Tampilkan daftar kosong

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
            // Cek jika ini pembayaran manual
            if (payment.isManual) {
                 paymentItemsHtml += `
                    <tr>
                        <td>${payment.name}</td>
                        <td class="nominal-cell">${formatRupiah(payment.nominal)}</td>
                        <td class="status-cell ${getStatusClass('Lunas')}">${'Lunas'}</td>
                    </tr>
                `;
            } else {
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
            }
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

    function generateCombinedArrearsSlip(studentData) {
        if (!studentData) {
            alert('Tidak ada data siswa untuk membuat tagihan tunggakan.');
            return;
        }

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonthCalendarIndex = currentDate.getMonth();
        const currentDay = currentDate.getDate();

        let arrearsItems = [];
        let totalArrearsNominal = 0;

        const ACADEMIC_YEAR_START_MONTH_CAL_INDEX = getCalendarMonthIndex('Juli');
        
        paymentColumns.forEach(colName => {
            const status = studentData[colName];

            // Cek apakah statusnya BELUM LUNAS atau TERTUNDA
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
                    const monthName = colName.replace('Status_SPP_', '');
                    displayColName = `SPP ${monthName}`;
                    arrearsItems.push({
                        name: displayColName,
                        nominal: nominalValue
                    });
                    totalArrearsNominal += nominalValue;
                } else {
                    displayColName = colName.replace(/_/g, ' ');
                    arrearsItems.push({
                        name: displayColName,
                        nominal: nominalValue
                    });
                    totalArrearsNominal += nominalValue;
                }
            }
        });

        // Tambahkan pembayaran manual ke dalam daftar tunggakan
        manualPayments.forEach(item => {
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

        if (checkboxes.length === 0 && manualPayments.length === 0) {
            alert('Pilih setidaknya satu pembayaran atau tambahkan pembayaran manual yang ingin dicetak!');
            return;
        }

        // Ambil pembayaran dari Google Sheet yang dicentang
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
                    nominal: nominalValue,
                    isManual: false
                });
            }
        });
        
        // Gabungkan dengan pembayaran manual
        const allPaymentsToPrint = [...selectedPayments, ...manualPayments];
        
        // Panggil fungsi cetak dengan data gabungan
        generatePrintSlip(currentStudentData, allPaymentsToPrint);
        
        // Opsional: kosongkan daftar manual setelah dicetak
        manualPayments = [];
        renderManualPayments();
    });

    printArrearsButton.addEventListener('click', function() {
        if (!currentStudentData) {
            alert('Tidak ada data siswa yang ditemukan. Mohon lakukan pencarian terlebih dahulu.');
            return;
        }
        generateCombinedArrearsSlip(currentStudentData);
    });
    
    // Event listener untuk tombol Tambah pembayaran manual
    addManualPaymentBtn.addEventListener('click', addManualPayment);

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
