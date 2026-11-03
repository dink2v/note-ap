# Menghubungkan Note AP ke Google Sheets

## 1. Buat database
1. Buka https://sheets.new dan buat spreadsheet bernama **Database Note AP**.
2. Dari spreadsheet, pilih **Extensions → Apps Script**.
3. Ganti isi file `Code.gs` dengan kode di folder `apps-script/Code.gs` pada repository ini.
4. Simpan, lalu jalankan fungsi `setupNoteAP` satu kali dan izinkan akses yang diminta. Ini akan membuat tab `Konten`.

## 2. Deploy sebagai Web App
1. Di Apps Script pilih **Deploy → New deployment**.
2. Pilih jenis **Web app**.
3. Untuk **Execute as**, pilih akun pemilik spreadsheet.
4. Atur **Who has access** sesuai kebutuhan tim. Jika memakai akun Google Workspace, batasi ke organisasi bila opsi tersedia. Jangan pilih akses publik kecuali memang sudah dipahami risikonya.
5. Tekan **Deploy**, selesaikan otorisasi, lalu salin URL Web App yang berakhiran `/exec`.

## 3. Hubungkan dari Note AP
Setelah antarmuka pengaturan backend tersedia, masukkan URL `/exec` di bagian **Setting → Database Bersama**, lalu tekan **Simpan & Hubungkan**.

## Catatan
- Jangan bagikan URL deployment secara terbuka.
- Kode backend saat ini menyediakan baca dan simpan kumpulan data konten di tab `Konten`.
- Upload media ke Google Drive, sinkronisasi notifikasi, dan kontrol akses per anggota tim merupakan tahap lanjutan.
