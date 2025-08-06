document.addEventListener('DOMContentLoaded', () => {
    const manualPaymentForm = document.getElementById('manualPaymentForm');

    manualPaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(manualPaymentForm);
        const scriptURL = 'https://script.google.com/macros/s/AKfycbzXe5UATwKiRpVhi-fIh2x4lzl-K6BNYirzKnEDka5kkT8iOafmh7vO9owJ5d9ERHQN/exec'; // GANTI DENGAN URL SCRIPT ANDA

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