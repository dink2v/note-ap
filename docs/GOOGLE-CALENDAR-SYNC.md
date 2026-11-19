# Google Calendar — Sinkronisasi Dua Arah Note AP

Note AP menggunakan Google Sheets sebagai database utama dan Google Calendar sebagai kalender kerja. Sinkronisasi dua arah berjalan melalui Google Apps Script.

## Yang disinkronkan

- Simpan atau ubah konten di Note AP: acara Google Calendar dibuat/diperbarui.
- Ubah judul, tanggal, atau waktu acara yang sudah terhubung di Google Calendar: data jadwal di Note AP diperbarui.
- Hapus acara yang terhubung dari Google Calendar: tanggal dan waktu posting dikosongkan di Note AP; data kontennya tetap ada.
- Acara baru yang dibuat langsung di Google Calendar dapat diimpor jika deskripsinya memuat `#NOTEAP`. Judul acara menjadi judul konten dan status awalnya `Planning`.

Sinkronisasi Calendar → Sheets berjalan melalui trigger setiap 15 menit. Perubahan dari Note AP → Calendar dilakukan saat konten disimpan.

## Aktivasi (wajib dilakukan satu kali)

1. Buka project Google Apps Script yang terhubung ke spreadsheet Note AP.
2. Salin versi terbaru `Code.gs` dari repository ini ke project Apps Script.
3. Pastikan zona waktu project Apps Script adalah `Asia/Jakarta`.
4. Dari editor Apps Script, pilih fungsi `setupNoteApCalendarSync`, lalu klik **Run**.
5. Berikan izin akses Google Calendar saat diminta.
6. Jalankan `syncCalendarToSheets` sekali untuk uji sinkronisasi awal.

Secara default, Note AP memakai kalender utama akun Google yang menjalankan Apps Script.

## Menggunakan kalender lain (opsional)

Jalankan fungsi `setNoteApCalendarId("ID_KALENDER")` dari editor Apps Script. ID kalender dapat ditemukan di Google Calendar → Settings → kalender yang dipilih → Integrate calendar → Calendar ID. Untuk kembali ke kalender utama, jalankan `setNoteApCalendarId("")`.

## Batasan dan keamanan sinkronisasi

- Trigger berjalan tiap 15 menit, jadi perubahan dari Google Calendar tidak selalu muncul seketika.
- Untuk mengimpor acara baru dari Google Calendar, tambahkan `#NOTEAP` pada deskripsi acara.
- Penghapusan acara dari Google Calendar hanya menghapus jadwal yang terhubung, bukan baris konten di Google Sheets.
- ID acara dan waktu sinkronisasi disimpan di kolom `Data Lengkap (JSON)` yang sudah ada. Tidak ada tab atau kolom spreadsheet baru yang dibuat.
- Jalankan aktivasi dengan akun Google yang memiliki akses edit ke spreadsheet dan kalender tujuan.
