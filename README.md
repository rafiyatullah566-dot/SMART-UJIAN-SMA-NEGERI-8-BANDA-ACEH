# SMART UJIAN SMA NEGERI 8 BANDA ACEH — V1.0

Project berisi Android app, web admin, dokumentasi model data Firebase, dan GitHub Actions.

## Menjalankan Web Admin

```bash
cd web-admin
npm install
npm run dev
```

Untuk build web:

```bash
npm run build
```

## Fitur Web Admin yang aktif dalam mode lokal

- Dashboard statistik dari data browser.
- Ujian: tambah, edit, hapus, pencarian, dan perubahan status.
- Bank Soal: tambah, edit, hapus, dan pencarian soal.
- Peserta: tambah, hapus, dan pencarian peserta.
- Hasil & Laporan: filter data jadwal ujian dan ekspor CSV.
- Anti-Kecurangan: preferensi toggle disimpan lokal.
- Pengaturan: nama sekolah/admin, zona waktu, bahasa, durasi default, dan nilai minimum.
- Notifikasi ringkasan status ujian.
- Data disimpan di localStorage browser yang sedang digunakan.

Logo SMA Negeri 8 di sidebar memakai ukuran tetap dan `object-fit: contain` agar lambang tampil utuh.

## Status integrasi

Mode dashboard saat ini adalah **lokal/demo**, bukan sistem ujian sekolah siap produksi. Data tidak otomatis tersinkron antar-browser, komputer, atau HP. Firebase Authentication/Firestore, backend, alur pengerjaan ujian siswa, timer server, nilai resmi, dan fitur anti-kecurangan Android perlu diintegrasikan dan diuji sebelum digunakan dalam ujian resmi.

## Identitas aplikasi

- Nama: SMART UJIAN
- Sekolah: SMA NEGERI 8 BANDA ACEH
- Pengembang: RAFIYATULLAH
- Tanggal informasi aplikasi: 11 November 2026


## SMART IMPORT & AUTO REKAP (V1.1)

Dashboard web menyediakan import lokal dengan pratinjau dan konfirmasi sebelum data disimpan.

### Import bank soal
- Format: XLSX, XLS, CSV, DOCX, dan PDF berbasis teks.
- Untuk spreadsheet, gunakan kolom `Pertanyaan`, `Mata Pelajaran`, `Kelas`, `Jenis`, `Kunci Jawaban`.
- Untuk DOCX/PDF teks, sistem mencoba mengenali soal bernomor (`1.`, `2.`), metadata `Mata Pelajaran:` / `Mapel:` dan `Kelas:` / `Rombel:`.
- Kunci yang tidak terbaca diberi label `Perlu diisi` dan harus diperiksa guru.

### Import peserta
- Format: XLSX, XLS, atau CSV.
- Header wajib: `Nama`, `NIS` (atau `NISN`), dan `Kelas` (atau `Rombel`).
- NIS duplikat terhadap data yang sudah ada maupun duplikat di file yang sama dilewati.
- Daftar siswa otomatis diringkas per rombel dan jumlah siswa.

### Pengelompokan otomatis
- Soal dikelompokkan melalui kolom Mata Pelajaran dan Kelas.
- Jika metadata tidak ada, sistem mencoba mendeteksi nama pelajaran/kelas dari nama file atau teks metadata.
- Ringkasan jumlah mapel, kelas, soal, siswa, dan siswa per rombel ditampilkan pada menu Bank Soal dan Peserta.

### Batasan penting
- Data saat ini disimpan di `localStorage` browser yang mengimpor. Data tidak otomatis tersinkron ke komputer guru lain sampai backend sekolah/Firebase diaktifkan.
- PDF hasil scan/foto tidak dapat dibaca otomatis oleh parser teks; file tersebut memerlukan OCR atau dikonversi menjadi PDF teks terlebih dahulu.
- Import tidak menjamin kunci jawaban benar. Guru wajib memeriksa pratinjau dan isi bank soal sebelum ujian diterbitkan.
- Import DOCX/PDF ditujukan untuk format soal sederhana dan bernomor. Tata letak kompleks, tabel, gambar, rumus, dan soal dua kolom mungkin perlu dirapikan manual.

### Menjalankan
Dari folder `web-admin`:

```bash
npm install
npm run dev
```
