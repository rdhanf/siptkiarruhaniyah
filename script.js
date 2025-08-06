document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const parentNameInput = document.getElementById('parentNameInput');
    const studentDetailsDiv = document.getElementById('studentDetails');
    const studentNameSpan = document.getElementById('studentName');
    const studentNISNSpan = document.getElementById('studentNISN');
    const studentClassSpan = document.getElementById('studentClass');
    const parentNameDetailSpan = document.getElementById('parentNameDetail');
    const paymentCardsContainer = document.getElementById('paymentCardsContainer');
    const noResultsMessage = document.getElementById('noResults');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const printSlipButton = document.getElementById('printSlipButton');
    const printArrearsButton = document.getElementById('printArrearsButton');
    
    const inputNamaSiswa = document.getElementById('inputNamaSiswa');
    const inputNamaOrangTua = document.getElementById('inputNamaOrangTua');
    const displayedNamaSiswa = document.getElementById('displayedNamaSiswa');
    const displayedNamaOrangTua = document.getElementById('displayedNamaOrangTua');

    // Ganti dengan URL Google Sheets Anda yang sudah dipublikasikan
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGPus51iCYkSnZKnqv_WqqcVMgye4d9ULtF_vNYRJy3rnVKvwoh4qUEU-eHhXNiXIKtDHklYeVMGqh/pub?output=csv';

    let studentData = [];

    const fetchData = async () => {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        try {
            const response = await fetch(sheetUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const csvText = await response.text();
            studentData = parseCSV(csvText);
            loadingMessage.style.display = 'none';
        } catch (error) {
            console.error('Error fetching data:', error);
            loadingMessage.style.display = 'none';
            errorMessage.style.display = 'block';
        }
    };

    const parseCSV = (text) => {
        const rows = text.split('\n').filter(row => row.trim() !== '');
        if (rows.length === 0) return [];

        const headers = rows[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',').map(value => value.trim());
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index] || '';
            });
            data.push(entry);
        }
        return data;
    };

    const displayStudentDetails = (student) => {
        noResultsMessage.style.display = 'none';
        studentDetailsDiv.style.display = 'block';
        
        studentNameSpan.textContent = student['Nama Siswa'];
        studentNISNSpan.textContent = student['NISN'];
        studentClassSpan.textContent = student['Kelas'];
        parentNameDetailSpan.textContent = student['Nama Orang Tua'];

        // Mengisi input form pembayaran baru secara otomatis
        inputNamaSiswa.value = student['Nama Siswa'];
        inputNamaOrangTua.value = student['Nama Orang Tua'];
        displayedNamaSiswa.textContent = student['Nama Siswa'];
        displayedNamaOrangTua.textContent = student['Nama Orang Tua'];

        paymentCardsContainer.innerHTML = '';
        const paymentHeaders = ['PPDB', 'Status_SPP_Juli', 'Status_SPP_Agustus', 'Status_SPP_September', 'Status_SPP_Oktober', 'Status_SPP_November', 'Status_SPP_Desember', 'Status_SPP_Januari', 'Status_SPP_Februari', 'Status_SPP_Maret', 'Status_SPP_April', 'Status_SPP_Mei', 'Status_SPP_Juni', 'Porseni', 'Membatik', 'Polisi_Cinta_Anak', 'Transportasi_Umum', 'Raport', 'Buku LKS', 'Foto Wisuda', 'Akhir Tahun', 'P5 1'];

        paymentHeaders.forEach(header => {
            const status = student[header] || 'Belum Lunas';
            const nominal = student[header];
            if (nominal && nominal.startsWith('Lunas')) {
                // Jangan tampilkan jika sudah lunas atau ada tanggal
            } else {
                const card = document.createElement('div');
                card.className = 'payment-item-card';

                const paymentName = header.replace(/_/g, ' ').replace('Status SPP', 'SPP');
                const paymentInfo = `
                    <div class="payment-info">
                        <span class="payment-name">${paymentName}</span>
                        <span class="payment-status status-${status.toLowerCase().replace(' ', '')}">${status}</span>
                    </div>
                `;

                card.innerHTML = paymentInfo;
                paymentCardsContainer.appendChild(card);
            }
        });
        printSlipButton.style.display = 'inline-block';
        printArrearsButton.style.display = 'inline-block';
    };

    const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        const parentName = parentNameInput.value.toLowerCase().trim();
        let foundStudent = null;

        if (query === '' && parentName === '') {
            noResultsMessage.textContent = 'Mohon masukkan Nama Siswa/NISN dan Nama Ibu.';
            noResultsMessage.style.display = 'block';
            studentDetailsDiv.style.display = 'none';
            return;
        }

        foundStudent = studentData.find(student => {
            const studentName = student['Nama Siswa'].toLowerCase().trim();
            const nisn = student['NISN'].toLowerCase().trim();
            const orangTua = student['Nama Orang Tua'].toLowerCase().trim();

            const nameMatch = query && (studentName.includes(query) || nisn.includes(query));
            const parentMatch = parentName && orangTua.includes(parentName);

            return nameMatch && parentMatch;
        });

        if (foundStudent) {
            displayStudentDetails(foundStudent);
        } else {
            studentDetailsDiv.style.display = 'none';
            noResultsMessage.textContent = 'Data siswa tidak ditemukan atau kombinasi nama tidak cocok. Mohon periksa kembali.';
            noResultsMessage.style.display = 'block';
        }
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    parentNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    fetchData();
});
