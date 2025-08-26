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
    
    const manualPaymentNameInput = document.getElementById('manualPaymentName');
    const manualPaymentNominalInput = document.getElementById('manualPaymentNominal');
    const addManualPaymentBtn = document.getElementById('addManualPaymentBtn');
    const manualPaymentList = document.getElementById('manualPaymentList');

    if (printSlipButton) printSlipButton.style.display = 'none'; 
    if (printArrearsButton) printArrearsButton.style.display = 'none'; 

    let allPaymentData = [];
    let currentStudentData = null; 
    let manualArrears = []; 
    let paymentColumns = []; 

    const nonPaymentColumns = ['No.', 'Nama Siswa', 'NISN', 'Nama Orang Tua', 'Kelas', 'Tgl Bayar PPDB',
                               'Tgl Bayar SPP Juli', 'Tgl Bayar SPP Agustus', 'Tgl Bayar SPP September', 
                               'Tgl Bayar SPP Oktober', 'Tgl Bayar SPP November', 'Tgl Bayar SPP Desember', 
                               'Tgl Bayar SPP Januari', 'Tgl Bayar SPP Februari', 'Tgl Bayar SPP Maret', 
                               'Tgl Bayar SPP April', 'Tgl Bayar SPP Mei', 'Tgl Bayar SPP Juni'];

    async function fetchPaymentData() {
        try {
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Memuat data...';
                noResultsMessage.classList.remove('error');
                noResultsMessage.style.display = 'block';
            }

            const response = await fetch(googleSheetUrl);
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.status} ${response.statusText}`);
            }
            const csvText = await response.text();
            
            allPaymentData = parseCSV(csvText); 
            
            if (allPaymentData.length > 0) {
                paymentColumns = Object.keys(allPaymentData[0]).filter(header => 
                    !nonPaymentColumns.includes(header.trim()) && header.trim().startsWith('Status_')
                );
                paymentColumns = paymentColumns.concat(['PPDB', 'Porseni', 'Membatik', 'Polisi Cinta Anak', 'Transportasi Umum', 'Raport', 'Buku LKS', 'Foto Wisuda', 'Akhir Tahun', 'P5 1']);

                console.log("Parsed Data:", allPaymentData); 
                console.log("Payment Columns:", paymentColumns); 
                if (noResultsMessage) noResultsMessage.style.display = 'none';
            } else {
                if (noResultsMessage) {
                    noResultsMessage.textContent = 'Data siswa kosong.';
                    noResultsMessage.classList.add('error');
                    noResultsMessage.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            if (noResultsMessage) {
                noResultsMessage.textContent = `Gagal memuat data pembayaran: ${error.message}. Cek URL Google Sheet dan koneksi internet Anda.`;
                noResultsMessage.classList.add('error'); 
                noResultsMessage.style.display = 'block';
            }
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) return [];

        const headers = lines[0].split(',').map(header => header.replace(/^"|"$/g, '').trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const row = {};
            const values = lines[i].match(/(?:"[^"]*"|[^,])+/g);
            
            if (!values || values.length !== headers.length) {
                console.warn(`Skipping malformed row: Line ${i + 1}`);
                continue;
            }

            headers.forEach((header, index) => {
                const value = values[index].replace(/^"|"$/g, '').trim();
                row[header] = value;
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
    
    function displayManualPayments() {
        if (!manualPaymentList) return;
        manualPaymentList.innerHTML = '';
        manualArrears.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} - ${formatRupiah(item.nominal)}</span>
                <button class="remove-manual-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            manualPaymentList.appendChild(li);
        });
        
        document.querySelectorAll('.remove-manual-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.dataset.index;
                manualArrears.splice(index, 1);
                displayManualPayments();
            });
        });
    }

    function displayStudentDetails(studentData) {
        currentStudentData = studentData; 
        manualArrears = []; 

        if (!studentData) { 
            if (studentDetailsContainer) studentDetailsContainer.style.display = 'none';
            if (printSlipButton) printSlipButton.style.display = 'none'; 
            if (printArrearsButton) printArrearsButton.style.display = 'none'; 
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Data siswa tidak ditemukan.'; 
                noResultsMessage.classList.add('error'); 
                noResultsMessage.style.display = 'block';
            }
            return;
        }

        if (studentDetailsContainer) studentDetailsContainer.style.display = 'block'; 
        if (printSlipButton) printSlipButton.style.display = 'inline-flex'; 
        if (printArrearsButton) printArrearsButton.style.display = 'inline-flex'; 
        if (noResultsMessage) noResultsMessage.style.display = 'none'; 
        
        displayManualPayments();

        if (studentNameSpan) studentNameSpan.textContent = studentData['Nama Siswa'] || '-';
        if (studentNISNSpan) studentNISNSpan.textContent = studentData['NISN'] || '-';
        if (studentClassSpan) studentClassSpan.textContent = studentData['Kelas'] || '-';
        if (parentNameDetailSpan) parentNameDetailSpan.textContent = studentData['Nama Orang Tua'] || '-';

        if (paymentCardsContainer) paymentCardsContainer.innerHTML = ''; 

        paymentColumns.forEach(colName => {
            const status = studentData[colName];
            if (status !== undefined && status !== null && status.trim() !== '' && paymentCardsContainer) {
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
                        <input type="number" id="nominal-${colName}" class="nominal-input" placeholder="0" min="0" value="${colName.startsWith('Status_SPP_') && status.toLowerCase().trim() !== 'lunas' ? SPP_NOMINAL_AMOUNT : ''}">
                    </div>
                    <input type="checkbox" class="payment-checkbox" data-col-name="${colName}">
                `;
                paymentCardsContainer.appendChild(paymentItemDiv);
            }
        });
    }

    function performSearch() {
        const studentSearchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const parentSearchTerm = parentNameInput ? parentNameInput.value.toLowerCase().trim() : '';
        
        if (studentDetailsContainer) studentDetailsContainer.style.display = 'none'; 
        if (noResultsMessage) noResultsMessage.style.display = 'none'; 
        if (printSlipButton) printSlipButton.style.display = 'none'; 
        if (printArrearsButton) printArrearsButton.style.display = 'none'; 

        if (studentSearchTerm === '' || parentSearchTerm === '') {
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Mohon isi Nama Siswa/NISN dan Nama Orang Tua.';
                noResultsMessage.classList.remove('error'); 
                noResultsMessage.classList.add('info'); 
                noResultsMessage.style.display = 'block';
            }
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
            if (noResultsMessage) {
                noResultsMessage.textContent = 'Data siswa tidak ditemukan atau kombinasi nama tidak cocok. Mohon periksa kembali.';
                noResultsMessage.classList.remove('info');
                noResultsMessage.classList.add('error'); 
                noResultsMessage.style.display = 'block'; 
            }
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
            let displayColName = payment.colName;
            if (payment.colName.startsWith('Status_SPP_')) {
                displayColName = payment.colName.replace('Status_SPP_', 'SPP ').replace(/_/g, ' '); 
            } else if (payment.colName.includes('_')) {
                displayColName = colName.replace(/_/g, ' '); 
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
                        <span>Kelas:</span> <span>${studentData['Kelas
