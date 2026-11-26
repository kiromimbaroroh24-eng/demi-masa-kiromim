# Demi Masa: Website Interaktif Nilai Al-‘Ashr

Media pembelajaran PAI untuk penelitian skripsi **"Penguatan Pemahaman Nilai Al-‘Ashr dalam Pengendalian Doomscrolling pada Siswa SMAN 1 Kepohbaru melalui Media Website Interaktif"**.

Situs statis (HTML, CSS, dan JavaScript tanpa build) yang siap dihosting di GitHub Pages.

## Isi
- Beranda dan Petunjuk
- Bagian 1–5 mengikuti pilar QS. Al-‘Ashr: nilai waktu, iman, amal saleh, saling menasihati dalam kebenaran, dan saling menasihati dalam kesabaran. Setiap bagian memuat tujuan, pemantik, ayat/hadis, penjelasan dan tafsir, video, cerita situasi, aktivitas interaktif, refleksi, dan kuis.
- Rangkuman + Rencana Kecilku, Kuis Akhir (10 soal)
- Daftar Materi (`#materi`): dikelompokkan per pertemuan atau per pilar/topik
- Diagram, audio (fitur dengar berbasis suara browser), dan rangkuman di setiap bagian
- Progres Belajar (`#progres`): bagian yang dibuka/selesai, nilai kuis, dan topik yang perlu diulang
- Glosarium (`#glosarium`) dan Unduhan PDF (`#unduhan`: ringkasan materi dan lembar kerja siswa)
- Tanya Jawab (`#tanya`): formulir ke guru (Google Form atau WhatsApp), pertanyaan diskusi, dan FAQ
- Profil Pengembang (`#pengembang`)
- Halaman Guru (`#guru`): skenario 4 pertemuan, catatan pelaksanaan, dan kunci kuis

## Pengaturan (`js/config.js`)
- `VIDEOS`: isi ID video YouTube untuk setiap bagian.
- `TANYA`: isi `googleForm` (tautan Google Form) atau `whatsapp` (nomor guru, contoh `6281234567890`) agar siswa bisa mengirim pertanyaan. `grupDiskusi` opsional.
- `GURU_PASSWORD`: ganti kata sandi halaman guru. Ini hanya penyaring ringan di browser, bukan pengaman data.
- Teks materi ada di `js/content.js`.

## Hosting di GitHub Pages
1. Unggah semua isi folder ini ke root repository (pastikan `index.html` ada di root).
2. Buka **Settings → Pages**.
3. Pada *Source* pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu klik **Save**.
4. Tunggu 1–2 menit. Situs akan tersedia di `https://<username>.github.io/<nama-repo>/`.

## Privasi
Website tidak mengumpulkan data. Progres, refleksi, dan skor hanya disimpan di `localStorage` perangkat siswa.

## Catatan isi
Teks Arab, terjemah, tafsir, dan hadis wajib ditelaah ahli materi PAI sebelum uji coba. Kuis di website adalah latihan dan berbeda dari soal pretest/posttest.
