document.addEventListener('DOMContentLoaded', function() {
    // === Konfigurasi Utama ===
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
    const loadingMessage = document.getElementById('loadingMessage');

    // Ambil elemen DOM untuk pembayaran manual yang baru
    const manualPaymentNameInput = document.getElementById('manualPaymentName');
    const manualPaymentTotalInput = document.getElementById('manualPaymentTotal');
    const manualPaymentNominalInput = document.getElementById('manualPaymentNominal');
    const manualPaymentStatusSelect = document.getElementById('manualPaymentStatus');
    const manualPaymentDateInput = document.getElementById('manualPaymentDate');
    const manualIncludePaymentCheckbox = document.getElementById('manualIncludePayment');
    const addManualPaymentBtn = document.getElementById('addManualPaymentBtn');
    const manualPaymentList = document.getElementById('manualPaymentList');

    printSlipButton.style.display = 'none';
    printArrearsButton.style.display = 'none';
    studentDetailsContainer.style.display = 'none';
    noResultsMessage.style.display = 'none';

    let allPaymentData = [];
    let currentStudentData = null;
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
        if (lowerCaseStatus === 'bayar sebagian') { return 'status-tertunda'; }
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
    
    function formatNumber(amount) {
        if (amount === null || amount === undefined || isNaN(amount) || amount === '') {
            return '0';
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) {
            return '0';
        }
        return new Intl.NumberFormat('id-ID').format(numericAmount);
    }

    function cleanNumberString(str) {
        return str.replace(/\./g, '');
    }
    
    function displayManualPayments() {
        manualPaymentList.innerHTML = '';
        manualPaymentsToPrint.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} (${item.status}) - ${formatRupiah(item.nominal)}</span>
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
        manualPaymentsToPrint = [];
        displayManualPayments();

        if (!studentData) {
            studentDetailsContainer.style.display = 'none';
            updatePrintButtonVisibility();
            return;
        }

        studentDetailsContainer.style.display = 'block';
        noResultsMessage.style.display = 'none';

        studentNameSpan.textContent = studentData['Nama Siswa'] || '-';
        studentNISNSpan.textContent = studentData['NISN'] || '-';
        studentClassSpan.textContent = studentData['Kelas'] || '-';
        parentNameDetailSpan.textContent = studentData['Nama Orang Tua'] || '-';

        paymentCardsContainer.innerHTML = '';

        const allPaymentColumns = [...sppColumns, ...paymentColumns];
        
        const formattedSppNominal = formatNumber(SPP_NOMINAL_AMOUNT);

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

                const inputValue = colName.startsWith('Status_SPP_') ? formattedSppNominal : '';

                paymentItemDiv.innerHTML = `
                    <div class="payment-info">
                        <span class="payment-name">${displayColName}:</span>
                        <span class="payment-status ${getStatusClass(status)}">${status}</span>
                    </div>
                    <div class="nominal-input-container">
                        <label for="nominal-${colName}">Nominal:</label>
                        <input type="text" id="nominal-${colName}" class="nominal-input" placeholder="0" min="0" value="${inputValue}">
                    </div>
                    <input type="checkbox" class="payment-checkbox" data-col-name="${colName}">
                `;
                paymentCardsContainer.appendChild(paymentItemDiv);
            }
        });
        
        updatePrintButtonVisibility();

        document.querySelectorAll('.payment-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updatePrintButtonVisibility);
        });

        document.querySelectorAll('.nominal-input').forEach(input => {
            input.addEventListener('keyup', function(e) {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    return;
                }

                let cleanValue = cleanNumberString(this.value);
                if (!isNaN(cleanValue) && cleanValue.trim() !== '') {
                    this.value = formatNumber(cleanValue);
                }
            });

            input.addEventListener('blur', function() {
                let cleanValue = cleanNumberString(this.value);
                if (isNaN(cleanValue) || cleanValue.trim() === '') {
                    this.value = '';
                } else {
                    this.value = formatNumber(cleanValue);
                }
            });
        });
    }

    function performSearch() {
        const studentSearchTerm = searchInput.value.toLowerCase().trim();
        const parentSearchTerm = parentNameInput.value.toLowerCase().trim();

        studentDetailsContainer.style.display = 'none';
        noResultsMessage.style.display = 'none';
        updatePrintButtonVisibility();

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
    
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    }

    function generatePrintSlip(studentData, combinedPayments) {
        if (!studentData || combinedPayments.length === 0) {
            alert('Tidak ada data siswa atau pembayaran yang dipilih untuk dicetak.');
            return;
        }

        const currentDate = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'});

        let paymentItemsHtml = '';
        let totalNominal = 0;

        combinedPayments.forEach(payment => {
            let displayColName = payment.colName || payment.name;
            let status = payment.status || 'Lunas';
            let nominalBayar = payment.nominal || 0;
            let nominalTotal = payment.total || nominalBayar;
            let sisaBayar = nominalTotal - nominalBayar;
            let tanggalBayar = payment.date ? formatDate(payment.date) : 'Hari Ini';

            if (payment.colName && payment.colName.startsWith('Status_SPP_')) {
                displayColName = `SPP ${payment.colName.replace('Status_SPP_', '')}`;
            } else if (payment.colName && payment.colName.includes('_')) {
                displayColName = payment.colName.replace(/_/g, ' ');
            }
            
            paymentItemsHtml += `
                <div class="payment-item">
                    <p class="payment-name"><strong>${displayColName}</strong></p>
                    <p class="payment-detail">Nominal: ${formatRupiah(nominalBayar)}</p>
                    <p class="payment-detail">Status: <span class="${getStatusClass(status)}">${status}</span></p>
                    ${sisaBayar > 0 ? `<p class="sisa-tagihan">Sisa: ${formatRupiah(sisaBayar)}</p>` : ''}
                    <p class="payment-detail">Tanggal: ${tanggalBayar}</p>
                    <div class="divider"></div>
                </div>
            `;
            totalNominal += nominalBayar;
        });
        
        const printContent = `
            <html>
            <head>
                <title>Slip Pembayaran - ${studentData['Nama Siswa']}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; font-size: 10px; }
                    .slip-container { width: 300px; padding: 10px; box-sizing: border-box; }
                    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                    .header img { max-width: 60px; margin-bottom: 5px; }
                    .header h1 { margin: 0; font-size: 14px; text-transform: uppercase; }
                    .header p { margin: 0; font-size: 9px; line-height: 1.2; }
                    .separator { margin: 5px 0; text-align: center; font-size: 9px; }
                    .details-section { margin-bottom: 5px; }
                    .details-section h3 { margin: 0 0 5px; font-size: 11px; border-bottom: 1px dashed #000; padding-bottom: 3px; }
                    .details-section p { margin: 2px 0; font-size: 10px; }
                    .payment-list { margin-bottom: 10px; }
                    .payment-item { margin-bottom: 5px; }
                    .payment-name { font-size: 11px; margin: 0; }
                    .payment-detail { font-size: 10px; margin: 1px 0; }
                    .divider { border-bottom: 1px dashed #000; margin-top: 5px; }
                    .total-row { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
                    .total-row p { font-weight: bold; font-size: 11px; margin: 2px 0; display: flex; justify-content: space-between; }
                    .footer { text-align: center; margin-top: 10px; }
                    .footer p { margin: 2px 0; font-size: 10px; }
                    .signature-box { margin-top: 15px; }
                    .signature-box p { margin: 0; }
                    .status-lunas { color: green; font-weight: bold; }
                    .status-belum { color: red; font-weight: bold; }
                    .status-tertunda { color: orange; font-weight: bold; }
                    .sisa-tagihan { font-size: 9px; color: red; }
                    @media print {
                        @page { size: 80mm auto; margin: 0; }
                        body { width: 80mm; padding: 0; }
                        .slip-container { width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="slip-container">
                    <div class="header">
                        <img src="${schoolLogoPath}" alt="Logo Sekolah">
                        <h1>${schoolName}</h1>
                        <p>${schoolAddress}</p>
                    </div>

                    <p class="separator">--- SLIP PEMBAYARAN ---</p>

                    <div class="details-section">
                        <p><strong>Nama Siswa:</strong> ${studentData['Nama Siswa']}</p>
                        <p><strong>Kelas:</strong> ${studentData['Kelas']}</p>
                        <p><strong>NISN:</strong> ${studentData['NISN']}</p>
                        <p><strong>Nama Orang Tua:</strong> ${studentData['Nama Orang Tua']}</p>
                        <p><strong>Tanggal Cetak:</strong> ${currentDate}</p>
                        <div class="divider"></div>
                    </div>

                    <div class="payment-list">
                        ${paymentItemsHtml}
                    </div>
                    
                    <div class="total-row">
                        <p><span>TOTAL:</span> <span>${formatRupiah(totalNominal)}</span></p>
                    </div>

                    <div class="footer">
                        <p>Pembayaran diterima oleh,</p>
                        <div class="signature-box">
                            <br>
                            <p>(_________________________)</p>
                            <p>${contactPerson}</p>
                        </div>
                        <p>Terima kasih.</p>
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

        const allPaymentColumns = [...sppColumns, ...paymentColumns];
        allPaymentColumns.forEach(colName => {
            const status = studentData[colName];
            if (status && (status.toLowerCase().trim() === 'belum lunas' || status.toLowerCase().trim() === 'tertunda' || status.toLowerCase().trim() === 'bayar sebagian')) {
                const nominalInput = document.getElementById(`nominal-${colName}`);
                let nominalValue = 0;
                if (nominalInput) {
                    nominalValue = parseInt(cleanNumberString(nominalInput.value)) || 0;
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
        
        if (arrearsItems.length === 0) {
            alert('Tidak ada tunggakan pembayaran yang ditemukan untuk siswa ini.');
            return;
        }

        let arrearsItemsHtml = '';
        arrearsItems.forEach(item => {
            arrearsItemsHtml += `
                <div class="arrears-item">
                    <p><strong>${item.name}</strong></p>
                    <p>Tagihan: ${formatRupiah(item.nominal)}</p>
                    <div class="divider"></div>
                </div>
            `;
        });

        const printContent = `
            <html>
            <head>
                <title>Tagihan Pembayaran - ${studentData['Nama Siswa']}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; font-size: 10px; }
                    .slip-container { width: 300px; padding: 10px; box-sizing: border-box; }
                    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                    .header img { max-width: 60px; margin-bottom: 5px; }
                    .header h1 { margin: 0; font-size: 14px; text-transform: uppercase; }
                    .header p { margin: 0; font-size: 9px; line-height: 1.2; }
                    .separator { margin: 5px 0; text-align: center; font-size: 9px; }
                    .details-section { margin-bottom: 5px; }
                    .details-section h3 { margin: 0 0 5px; font-size: 11px; border-bottom: 1px dashed #000; padding-bottom: 3px; }
                    .details-section p { margin: 2px 0; font-size: 10px; }
                    .arrears-list { margin-bottom: 10px; }
                    .arrears-item { margin-bottom: 5px; }
                    .arrears-item p { margin: 1px 0; }
                    .divider { border-bottom: 1px dashed #000; margin-top: 5px; }
                    .total-row { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
                    .total-row p { font-weight: bold; font-size: 11px; margin: 2px 0; display: flex; justify-content: space-between; }
                    .footer { text-align: center; margin-top: 10px; }
                    .footer p { margin: 2px 0; font-size: 10px; }
                    .signature-box { margin-top: 15px; }
                    .signature-box p { margin: 0; }
                    .notice { margin-top: 10px; padding: 5px; border: 1px solid #000; font-size: 9px; }
                    @media print {
                        @page { size: 80mm auto; margin: 0; }
                        body { width: 80mm; padding: 0; }
                        .slip-container { width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="slip-container">
                    <div class="header">
                        <img src="${schoolLogoPath}" alt="Logo Sekolah">
                        <h1>${schoolName}</h1>
                        <p>${schoolAddress}</p>
                    </div>

                    <p class="separator">--- TAGIHAN PEMBAYARAN ---</p>

                    <div class="details-section">
                        <p><strong>Nama Siswa:</strong> ${studentData['Nama Siswa']}</p>
                        <p><strong>Kelas:</strong> ${studentData['Kelas']}</p>
                        <p><strong>NISN:</strong> ${studentData['NISN']}</p>
                        <p><strong>Nama Orang Tua:</strong> ${studentData['Nama Orang Tua']}</p>
                        <p><strong>Tanggal Cetak:</strong> ${formatDate(currentDate.toISOString().slice(0, 10))}</p>
                        <div class="divider"></div>
                    </div>

                    <div class="arrears-list">
                        ${arrearsItemsHtml}
                    </div>

                    <div class="total-row">
                        <p><span>TOTAL TAGIHAN:</span> <span>${formatRupiah(totalArrearsNominal)}</span></p>
                    </div>
                    
                    <div class="notice">
                        <p>Mohon lunasi tagihan ini.</p>
                        <p>Jatuh Tempo: Setiap tgl. ${SPP_DUE_DAY}</p>
                    </div>

                    <div class="footer">
                        <p>Hormat kami,</p>
                        <div class="signature-box">
                            <br>
                            <p>(_________________________)</p>
                            <p>${contactPerson}</p>
                        </div>
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
            
            const nominalValue = nominalInput ? parseInt(cleanNumberString(nominalInput.value)) || 0 : 0;
            const statusText = statusSpan ? statusSpan.textContent.trim() : '';

            if (colName && statusSpan) {
                selectedPayments.push({
                    colName: colName,
                    status: statusText,
                    nominal: nominalValue,
                    total: nominalValue,
                    date: new Date().toISOString().slice(0, 10)
                });
            }
        });
        
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
        const total = parseInt(cleanNumberString(manualPaymentTotalInput.value));
        const nominal = parseInt(cleanNumberString(manualPaymentNominalInput.value));
        const status = manualPaymentStatusSelect.value;
        const date = manualPaymentDateInput.value || new Date().toISOString().slice(0, 10);
        const includeInSlip = manualIncludePaymentCheckbox.checked;

        if (name === '' || isNaN(nominal) || nominal <= 0 || isNaN(total) || total <= 0) {
            alert('Mohon isi semua data pembayaran manual dengan nominal yang valid (angka positif).');
            return;
        }

        if (includeInSlip) {
             manualPaymentsToPrint.push({
                 name: name,
                 status: status,
                 nominal: nominal,
                 total: total,
                 date: date
             });
        }

        manualPaymentNameInput.value = '';
        manualPaymentTotalInput.value = '';
        manualPaymentNominalInput.value = '';
        manualPaymentStatusSelect.value = 'Lunas';
        manualPaymentDateInput.value = '';
        
        displayManualPayments();
        updatePrintButtonVisibility();
    });

    document.getElementById('manualPaymentTotal').addEventListener('keyup', function() {
        this.value = formatNumber(cleanNumberString(this.value));
    });
    document.getElementById('manualPaymentNominal').addEventListener('keyup', function() {
        this.value = formatNumber(cleanNumberString(this.value));
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
