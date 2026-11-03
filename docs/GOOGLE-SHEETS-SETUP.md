# Menyiapkan Database Note AP di Google Sheets

## Struktur database
Gunakan satu Google Spreadsheet bernama **DATABASE NOTE AP – APOTEK PRAPATAN** dengan lima tab:

| Tab | Fungsi |
|---|---|
| DASHBOARD | Rekap otomatis total konten, publish, terjadwal, dan dalam produksi |
| KONTEN | Data utama seluruh konten Instagram dan TikTok |
| AKTIVITAS | Riwayat konten, persetujuan, dan komentar |
| TIM | Daftar anggota tim dan peran |
| SETTING | Konfigurasi dasar workspace |

Tidak perlu mengisi data contoh. Fungsi setup akan membuat header dan rumus dashboard; tabel KONTEN, AKTIVITAS, dan TIM dimulai kosong.

## 1. Siapkan spreadsheet
1. Buat atau buka spreadsheet database.
2. Pastikan nama spreadsheet: **DATABASE NOTE AP – APOTEK PRAPATAN**.
3. Dari spreadsheet tersebut, pilih **Extensions → Apps Script**. Penting: Apps Script harus dibuat dari spreadsheet ini agar terikat ke database yang benar.
4. Buka file `Code.gs`, lalu ganti isinya dengan kode terbaru dari [apps-script/Code.gs](../apps-script/Code.gs) pada repository.
5. Simpan, pilih fungsi `setupNoteAP`, lalu tekan **Run**.
6. Berikan izin akses yang diminta Google. Setelah berhasil, kembali ke spreadsheet dan muat ulang. Lima tab database akan dibuat otomatis.

## 2. Deploy sebagai Web App
1. Di Apps Script pilih **Deploy → New deployment**.
2. Pilih jenis **Web app**.
3. Untuk **Execute as**, pilih akun pemilik spreadsheet.
4. Atur **Who has access** sesuai kebutuhan tim. Jika memakai akun Google Workspace, batasi ke organisasi bila opsi tersedia. Jangan pilih akses publik kecuali memang sudah memahami risikonya.
5. Tekan **Deploy**, selesaikan otorisasi, lalu salin URL Web App yang berakhiran `/exec`.

## 3. Hubungkan dari Note AP
Masukkan URL `/exec` di bagian **Setting → Database Bersama**, lalu tekan **Simpan & Hubungkan**.

## Catatan
- DASHBOARD dihitung otomatis dari data pada KONTEN.
- Data lengkap tiap konten disimpan sebagai JSON sekaligus kolom-kolom terstruktur agar mudah dibaca dan diolah.
- AKTIVITAS dibangun dari riwayat, persetujuan, dan komentar yang ikut tersimpan pada data konten.
- TIM sudah disiapkan sebagai tabel kosong; pengelolaan akun dan hak akses anggota belum diaktifkan.
- Upload media ke Google Drive dan sinkronisasi notifikasi lintas perangkat masih tahap lanjutan.
- Jangan bagikan URL deployment secara terbuka.
