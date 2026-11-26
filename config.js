/*
  PENGATURAN WEBSITE
  ------------------
  1. VIDEO: isi dengan ID video YouTube (bagian setelah "v=" pada tautan).
     Contoh: https://www.youtube.com/watch?v=AbCdEf12345  ->  "AbCdEf12345"
     Biarkan "" (kosong) bila video belum dipilih; halaman akan menampilkan kotak penanda.
  2. TANYA: tempat siswa mengirim pertanyaan ke guru (website statis tidak bisa menyimpan pesan sendiri).
     - googleForm: tautan Google Form (bentuk .../viewform). Bila diisi, form tampil langsung di halaman Tanya Jawab.
     - whatsapp: nomor WA guru dengan kode negara tanpa "+" atau spasi, misalnya "6281234567890".
     - grupDiskusi: tautan grup WhatsApp/Telegram kelas untuk diskusi (opsional).
  3. GURU_PASSWORD: kata sandi halaman guru. Ganti sebelum dipakai di kelas.
     Catatan: ini hanya penyaring ringan di sisi browser, bukan pengaman data.
*/
window.SITE_CONFIG = {
  sekolah: "SMAN 1 Kepohbaru",
  VIDEOS: {
    1: { id: "", judul: "Video: Makna QS. Al-‘Ashr dan nilai waktu" },
    2: { id: "", judul: "Video: Muhasabah dan pertanggungjawaban waktu" },
    3: { id: "", judul: "Video: Bermedia sosial yang bernilai amal saleh" },
    4: { id: "", judul: "Video: Tabayyun dan cara mengecek kabar" },
    5: { id: "", judul: "Video: Sabar dan saling menguatkan" }
  },
  TANYA: {
    googleForm: "",
    whatsapp: "",
    grupDiskusi: "",
    namaGuru: "Guru PAI"
  },
  GURU_PASSWORD: "alashr2027"
};
