# SMART UJIAN SMA NEGERI 8 BANDA ACEH — Pembaruan Dashboard

## Perbaikan
- Memperbaiki ukuran logo sidebar agar emblem sekolah tampil utuh dan tidak terpotong pada desktop maupun mobile.
- Menambahkan ruang/flex sizing yang tetap untuk logo dan `object-fit: contain`.
- Mempertahankan ikon aplikasi SMART UJIAN dan splash screen pelajar berjalan sambil membawa buku pada project Android.

## Dashboard Web Admin
- Dashboard statistik dihitung dari data yang tersimpan di browser.
- Ujian: tambah, edit, hapus, cari, dan ubah status.
- Bank Soal: tambah, edit, hapus, dan cari soal.
- Peserta: tambah, hapus, dan cari peserta.
- Hasil & Laporan: filter kelas/ujian dan ekspor CSV.
- Anti-Kecurangan: toggle preferensi layar penuh, peringatan pindah aplikasi, acak soal, auto-submit, dan log aktivitas.
- Pengaturan: ubah nama sekolah/admin, zona waktu, bahasa, durasi default, dan nilai minimum.
- Notifikasi ringkasan status ujian.
- Data dashboard disimpan melalui localStorage pada browser yang digunakan.

## Batasan penting
Pembaruan ini membuat interaksi dashboard web berfungsi dalam mode lokal. Ini belum mengaktifkan login sekolah, database cloud, sinkronisasi antarperangkat, pelaksanaan ujian online siswa, penilaian otomatis, server timer, atau penegakan anti-kecurangan di Android. Jangan gunakan data lokal demo sebagai nilai/rekap resmi sekolah sebelum backend dan alur ujian terintegrasi serta diuji.


## V1.1 — Smart Import & Auto Rekap
- Menambahkan import soal dari XLSX, XLS, CSV, DOCX, dan PDF berbasis teks.
- Menambahkan import peserta dari XLSX, XLS, dan CSV.
- Menambahkan deteksi mapel/kelas, pratinjau impor, peringatan data belum lengkap, serta konfirmasi sebelum penyimpanan.
- Menambahkan deteksi NIS duplikat dan rekap jumlah siswa per rombel.
- Menambahkan ringkasan jumlah mata pelajaran, kelas, dan soal.
- Menambahkan tombol unduh template CSV untuk soal dan siswa.
- Data tetap tersimpan lokal di browser; sinkronisasi server belum diaktifkan.
