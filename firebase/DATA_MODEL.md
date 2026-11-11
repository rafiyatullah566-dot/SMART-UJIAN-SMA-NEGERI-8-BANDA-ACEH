# Rancangan Data Firestore

Model konseptual; sesuaikan dan uji sebelum produksi.

## Koleksi
- `users/{uid}`: `displayName`, `email`, `role` (`admin|teacher|student|proctor`), `classId`, `active`.
- `classes/{classId}`: `name`, `grade`, `homeroomTeacherId`.
- `subjects/{subjectId}`: `name`, `teacherIds`.
- `questionBanks/{bankId}`: `ownerId`, `subjectId`, `title`, `questions`.
- `exams/{examId}`: `title`, `subjectId`, `classIds`, `startAt`, `endAt`, `durationMinutes`, `status`, `createdBy`, `questionIds`.
- `examAttempts/{attemptId}`: `examId`, `studentId`, `startedAt`, `deadlineAt`, `submittedAt`, `status`, `answers`, `objectiveScore`.
- `examResults/{resultId}`: `examId`, `studentId`, `objectiveScore`, `essayScore`, `finalScore`, `gradedBy`, `gradedAt`.
- `auditLogs/{logId}`: `actorId`, `action`, `targetId`, `createdAt`.

## Ketentuan desain
- Gunakan ID attempt deterministik atau transaksi server untuk mencegah dua attempt aktif bagi siswa dan ujian yang sama.
- Jawaban benar disimpan terpisah dan hanya dapat dibaca service tepercaya.
- Mulai ujian, simpan jawaban, submit, dan penilaian dilakukan melalui Cloud Functions/server API.
- Server menentukan waktu mulai dan deadline; jangan percaya jam perangkat.
- Esai dinilai guru menggunakan rubrik.
- Jangan menyimpan password sendiri; gunakan Firebase Authentication.

## Identitas dan pengaturan SMART UJIAN
- Nama aplikasi: `SMART UJIAN`
- Identitas sekolah: `SMA NEGERI 8 BANDA ACEH`
- Role akun: `student`, `admin`, `teacher`, `proctor`.
- `schoolSettings/{schoolId}`: nama sekolah, zona waktu, aturan ujian default, kebijakan anti-kecurangan.
- `examEvents/{eventId}`: `attemptId`, `eventType`, `serverTimestamp`, metadata minimum yang diperlukan.
- Catat event seperti `focus_lost`, `focus_returned`, `answer_saved`, `submitted`; batasi akses dan masa retensi log.
