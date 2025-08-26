document.addEventListener('DOMContentLoaded', function() {
    // === Konfigurasi Utama ===
    // GANTI URL INI DENGAN URL CSV GOOGLE SHEET ANDA
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGPus51iCYkSnZKnqv_WqqcVMgye4d9ULtF_vNYRJy3rnVKvwoh4qUEU-eHhXNiXIKtDHklYeVMGqh/pub?output=csv'; 
    const schoolLogoPath = 'img/ARRUHANIYAH 3.png'; 
    const schoolName = "TK Islam Arruhaniyah";
    const schoolAddress = "Kp. Tanah Tinggi Gg. H. Samat No. 30 Kel. Setia Asih Kec. Tarumajaya Kab. Bekasi 17215 Jawa Barat Indonesia";
    const contactPerson = "Pak Ridhan Fauzi";
    const contactNumber = "087783049121";
    
    // === Konfigurasi SPP ===
    const SPP_NOMINAL_AMOUNT = 90000;
    const SPP_DUE_DAY = 28;
    const SPP_MONTHS_ACADEMIC_ORDER = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

    // === Ambil Elemen DOM ===
    const searchInput = document.getElementById('searchInput');
    const parentNameInput = document.getElementById('parentNameInput');
    const searchButton = document.getElementById('searchButton');
    const loadingMessage = document.getElementById('loadingMessage');
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

    // Kolom yang tidak dianggap sebagai pembayaran
    const nonPaymentColumns = ['No.', 'Nama Siswa', 'NISN', 'Nama Orang Tua', 'Kelas', 'Tgl Bayar PPDB',
                               'Tgl Bayar SPP Juli', 'Tgl Bayar SPP Agustus', 'Tgl Bayar SPP September', 
                               'Tgl Bayar SPP Oktober', 'Tgl Bayar SPP November', 'Tgl Bayar SPP Desember', 
                               'Tgl Bayar SPP Januari', 'Tgl Bayar SPP Februari', 'Tgl Bayar SPP Maret', 
                               'Tgl Bayar SPP April', 'Tgl Bayar SPP Mei', 'Tgl Bayar SPP Juni'];

    async function fetchPaymentData() {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        
        try {
            const response = await fetch(googleSheetUrl);
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.status} ${response.statusText}`);
            }
            const csvText = await response.text();
            
            allPaymentData = parseCSV(csvText); 
            
            if (allPaymentData.length > 0) {
                // Ambil semua header kolom dari baris pertama CSV
                const allHeaders = Object.keys(allPaymentData[0]).map(h => h.trim());
                // Filter header untuk mendapatkan kolom pembayaran
                paymentColumns = allHeaders.filter(header => 
                    !nonPaymentColumns.includes(header) && header.startsWith('Status_')
                );

                console.log("Parsed Data:", allPaymentData); 
                console.log("Payment Columns:", paymentColumns); 
                if (loadingMessage) loadingMessage.style.display = 'none';
            } else {
                if (loadingMessage) loadingMessage.style.display = 'none';
                if (noResultsMessage) {
                    noResultsMessage.textContent = 'Data siswa kosong.';
                    noResultsMessage.classList.remove('info');
                    noResultsMessage.classList.add('error');
                    noResultsMessage.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (noResultsMessage) {
                noResultsMessage.textContent = `Gagal memuat data pembayaran: ${error.message}. Cek URL Google Sheet dan koneksi internet Anda.`;
                noResultsMessage.classList.remove('info');
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
                let displayColName = colName.replace(/^Status_/, '').replace(/_/g, ' ');
                
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
            let displayColName = payment.colName.replace(/^Status_/, '').replace(/_/g, ' ');
            
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

    function generateCombinedArrearsSlip(studentData) {
        if (!studentData) {
            alert('Tidak ada data siswa untuk membuat tagihan tunggakan.');
            return;
        }

        const currentDate = new Date();

        let arrearsItems = [];
        let totalArrearsNominal = 0;

        paymentColumns.forEach(colName => {
            const status = studentData[colName];

            if (status && (status.toLowerCase().trim() === 'belum lunas' || status.toLowerCase().trim() === 'tertunda')) {
                
                const nominalInput = document.getElementById(`nominal-${colName}`);
                let nominalValue = 0;
                if (nominalInput) {
                    nominalValue = parseInt(nominalInput.value) || 0;
                } else if (colName.startsWith('Status_SPP_')) {
                    nominalValue = SPP_NOMINAL_AMOUNT;
                }
                
                let displayColName = colName.replace(/^Status_/, '').replace(/_/g, ' ');
                
                arrearsItems.push({
                    name: displayColName,
                    nominal: nominalValue
                });
                totalArrearsNominal += nominalValue;
            }
        });
        
        manualArrears.forEach(item => {
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
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    if (printSlipButton) {
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
                const statusSpan = paymentItemDiv ? paymentItemDiv.querySelector('.payment-status') : null;
                const nominalInput = paymentItemDiv ? paymentItemDiv.querySelector('.nominal-input') : null;
                
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
    }

    if (printArrearsButton) {
        printArrearsButton.addEventListener('click', function() {
            if (!currentStudentData) {
                alert('Tidak ada data siswa yang ditemukan. Mohon lakukan pencarian terlebih dahulu.');
                return;
            }
            generateCombinedArrearsSlip(currentStudentData);
        });
    }
    
    if (addManualPaymentBtn) {
        addManualPaymentBtn.addEventListener('click', function() {
            const name = manualPaymentNameInput ? manualPaymentNameInput.value.trim() : '';
            const nominal = manualPaymentNominalInput ? parseInt(manualPaymentNominalInput.value) : NaN;

            if (name === '' || isNaN(nominal) || nominal <= 0) {
                alert('Mohon isi nama pembayaran dan nominal yang valid (angka positif).');
                return;
            }

            manualArrears.push({
                name: name,
                nominal: nominal
            });

            if (manualPaymentNameInput) manualPaymentNameInput.value = '';
            if (manualPaymentNominalInput) manualPaymentNominalInput.value = '';
            displayManualPayments();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }

    if (parentNameInput) {
        parentNameInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Fungsi tambahan untuk scroll
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    fetchPaymentData();
});


