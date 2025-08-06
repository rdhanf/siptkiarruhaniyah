document.addEventListener('DOMContentLoaded', () => {
    const manualPaymentForm = document.getElementById('manualPaymentForm');

    manualPaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(manualPaymentForm);
        const scriptURL = 'https://script.google.com/macros/s/AKfycbye6GMmHH24bYPaf9VichMbBx3UesY3jK3mMdHuO3Jlk6gp74xrmUM4uZfVL-3PI2kH/exec'; // GANTI DENGAN URL SCRIPT ANDA

        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    alert('Data pembayaran berhasil dikirim!');
                    manualPaymentForm.reset(); // Reset form
                } else {
                    alert('Gagal mengirim data. Error: ' + result.message);
                }
            } else {
                alert('Gagal terhubung ke Apps Script. Mohon periksa URL dan koneksi Anda.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan. Silakan coba lagi.');
        }
    });

});
