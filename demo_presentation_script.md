# Panduan Live Demo & Presentasi: Onboarding, Announcement, Input Daerah, & Moderasi/Eskalasi Sentimen Negatif

Dokumen ini dirancang khusus sebagai **Panduan Naskah Demo & Presentasi (Live Demo Script)** untuk mempresentasikan alur fitur **Wahub Platform** kepada Stakeholders / Clients / Team Management.

---

## 🎯 Ringkasan & Tujuan Demo
- **Tujuan Demo**: Menunjukkan kemampuan sistem Wahub dalam mengelola alur *end-to-end* anggota WhatsApp Komunitas mulai dari *Onboarding otomatis*, *Capture data daerah*, hingga *Deteksi Dini AI terhadap sentimen negatif* yang memicu *Tiket Eskalasi Support* dan *Human Agent Takeover*.
- **Link WhatsApp Group Demo**: [https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS](https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS)
- **Estimasi Waktu Presentasi**: 10 - 15 Menit

---

## 📋 Pre-Demo Checklist (Persiapan Sebelum Presentasi)

| Item Persiapan | Status | Catatan Tambahan |
| :--- | :---: | :--- |
| **Backend Service** | ✅ | Jalankan `npm run dev` atau pastikan server backend aktif. |
| **Evolution API Connection** | ✅ | WhatsApp Instance tersambung (`status: connected`). |
| **WhatsApp Group Ready** | ✅ | Pastikan bot sudah menjadi Admin di WhatsApp Group. |
| **Admin Dashboard Browser** | ✅ | Buka Dashboard Wahub (`/admin` atau Halaman Moderasi & Eskalasi). |
| **HP / Wa Web Demo Tester** | ✅ | Siapkan 1 akun WhatsApp khusus untuk berperan sebagai "User Baru". |

---

## 🎭 Naskah Presentasi & Langkah Demi Langkah Live Demo

### 🎬 BABAK 1: User Join Group & Auto Welcome Announcement
> **Tujuan**: Menunjukkan betapa cepatnya sistem menyambut anggota baru secara otomatis tanpa intervensi manual admin.

- **Aksi Live Demo**:
  1. Demo Tester membuka link: [https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS](https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS) dari ponsel/WA Web.
  2. Tester menekan tombol **Join Group**.

- **Apa yang Terjadi di Layar Screen / WhatsApp**:
  Beberapa detik setelah join, sistem secara otomatis mengirimkan pesan pengumuman sambutan ke grup.

- **💬 Pesan Otomatis Bot**:
  > *"Selamat datang di komunitas Wahub! 👋🏼*
  > *Silakan perkenalkan diri Anda dengan membalas pesan ini:*
  > **Dari daerah manakah Anda berasal? (Contoh: Jakarta / Surabaya / Bandung)**"*

- **🗣️ Naskah Presenter (Gunakan Kata-kata Ini)**:
  > *"Hadirin sekalian, dapat kita lihat di layar. Saat user baru saja menekan link bergabung ke WhatsApp Group, Wahub Backend secara instan menangkap webhook `participant.update`. Sistem langsung mendaftarkan profil member baru secara otomatis di database dan mengirimkan pesan pengumuman onboarding. Admin tidak perlu lagi menyapa satu per satu secara manual."*

---

### 🎬 BABAK 2: Pengisian Data Daerah (Region Capture)
> **Tujuan**: Menunjukkan ekstraksi data profil anggota secara otomatis dari percakapan WhatsApp.

- **Aksi Live Demo**:
  Demo Tester membalas pesan di grup dengan mengetik:
  ```text
  Halo min, salam kenal! Saya dari Jakarta Selatan.
  ```

- **Apa yang Terjadi di Layar Screen & Dashboard**:
  - Bot membalas ucapan konfirmasi: *"Terima kasih! Daerah Anda (Jakarta Selatan) telah tercatat di sistem."*
  - Pada **Dashboard Admin (Tabel Members)**: Data member diperbarui, kolom `Area = "Jakarta Selatan"` dan status onboarding berubah dari `Pending` menjadi `Completed`.

- **🗣️ Naskah Presenter (Gunakan Kata-kata Ini)**:
  > *"Selanjutnya, pengguna membalas dengan menyebutkan lokasi tempat tinggalnya. Sistem AI Wahub mengenali entitas tempat 'Jakarta Selatan', menyimpan informasi tersebut ke profil member di database, dan menyelesaikan alur onboarding. Dengan cara ini, pengelola komunitas dapat memetakan sebaran daerah anggotanya secara riil dan terstruktur."*

---

### 🎬 BABAK 3: Pemicu Sentimen Negatif (Keluhan & Komplain Member)
> **Tujuan**: Memperlihatkan kecerdasan AI dalam mendeteksi ancaman, keluhan pedas, atau kata toxic secara real-time.

- **Aksi Live Demo**:
  Demo Tester membalas pesan di grup dengan teks keluhan/sentimen negatif berikut:
  ```text
  Layanan Wahub ini parah banget! Responnya lelet dan sangat kecewa saya sama performa adminnya!
  ```

- **Apa yang Terjadi di Layar Screen**:
  Pesan terkirim di grup WhatsApp. Di belakang layar, `AiService.analyzeMessage()` mendeteksi:
  - `sentiment`: **negative**
  - `isToxic` / `isFlagged`: **true**
  - `confidence`: **0.95 (High)**

- **🗣️ Naskah Presenter (Gunakan Kata-kata Ini)**:
  > *"Sekarang kita masuk ke skenario penanganan masalah. Pengguna mengirimkan pesan bermuatan sentimen negatif dan kritik keras di dalam grup. Dalam hitungan milidetik, AI Engine Wahub menganalisis emosi dan konten pesan ini, kemudian mengategorikannya sebagai risiko sentimen negatif tinggi."*

---

### 🎬 BABAK 4: Moderasi Alert, Tiket Eskalasi, & Human Takeover
> **Tujuan**: Menunjukkan dashboard operasional admin dan penghentian bot otomatis agar penanganan keluhan diambil alih manusia.

- **Aksi Live Demo**:
  Presenter beralih ke browser yang menampilkan **Dashboard Admin Wahub**.

- **Apa yang Tampil di Dashboard Admin**:
  1. 🔴 **Moderation Alert**: Muncul notifikasi baru tipe `toxic / negative_sentiment` dengan severity **HIGH**.
  2. 🎫 **Escalation Ticket**: Terbuat tiket baru otomatis:
     - **Judul**: *Keluhan Sentimen Negatif Member: [Nomor WA Tester]*
     - **Prioritas**: *Urgent / High*
     - **Status**: *Open*
  3. ⏸️ **Human Agent Takeover**: Indikator *AI Paused for 24 Hours* aktif di grup tersebut.

- **🗣️ Naskah Presenter (Gunakan Kata-kata Ini)**:
  > *"Perhatikan layar Dashboard Admin kami. Pertama, sistem secara otomatis menaikkan **Moderation Alert** berwarna merah. Kedua, sistem membuat **Tiket Eskalasi Prioritas Tinggi** agar tim Customer Support dapat langsung menindaklanjuti.*
  >
  > *Dan fitur yang paling unggul di sini adalah **Human Agent Takeover**: AI secara otomatis menjeda dirinya sendiri (*pause*) di grup ini selama 24 jam. Kenapa? Agar bot tidak membalas dengan jawaban kaku yang justru bisa membuat emosi pelanggan makin meningkat. Penanganan kini sepenuhnya diserahkan ke Admin Manusia."*

---

### 🎬 BABAK 5: Penanganan Admin & Penutupan Demo
> **Tujuan**: Menunjukkan penyelesaian masalah oleh Admin Support secara cepat.

- **Aksi Live Demo**:
  1. Admin mengklik **Assign to Me** pada tiket eskalasi di Dashboard.
  2. Admin membalas pesan profesional langsung ke grup atau DM pengguna:
     > *"Halo Kak, mohon maaf atas ketidaknyamanannya. Tim Support kami sudah menerima laporan Kakak dan sedang menangani masalah ini secara khusus."*
  3. Admin mengubah status tiket menjadi **Resolved**.

- **🗣️ Naskah Presenter (Gunakan Kata-kata Ini)**:
  > *"Admin Support menerima tiket, memberikan respon empati kepada pengguna, dan menandai masalah sebagai 'Resolved'. Demo ini membuktikan bagaimana Wahub menggabungkan otomatisasi AI untuk onboarding dan keamanan komunitas, dengan kehangatan penanganan manusia ketika terjadi keluhan. Terima kasih!"*

---

## 📌 Cheat Sheet Pesan Demo (Teks Tinggal Copy-Paste)

Gunakan tabel ini saat melakukan uji coba live selama presentasi:

| Langkah | Aksi Demo | Teks yang Ditinggal Copy-Paste ke WhatsApp | Hasil yang Diharapkan |
| :---: | :--- | :--- | :--- |
| **1** | Join Group | Klik Link: `https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS` | Bot kirim Welcome Message & Tanya Daerah |
| **2** | Jawab Daerah | `Halo min, perkenalkan saya dari Jakarta Selatan.` | Profile Area terisi `"Jakarta Selatan"`, Onboarding `Completed` |
| **3** | Sentimen Negatif | `Layanan Wahub ini parah banget! Responnya lelet dan sangat kecewa saya!` | Terbuat Moderation Alert + Escalation Ticket High + AI Paused |
| **4** | Admin Respond | `Halo Kak, mohon maaf atas ketidaknyamanannya. Tim Support kami langsung bantu tangani ya.` | Tiket di-resolve oleh Admin di Dashboard |

---

## 💡 Pertanyaan yang Sering Ditanyakan (Anticipated Q&A)

1. **Q: Mengapa AI tidak membalas pesan sentimen negatif secara otomatis?**
   - **Jawaban**: Untuk keluhan/sentimen negatif tinggi, balasan otomatis bot sering kali memperburuk keadaan (*customer frustration*). Sistem Wahub secara cerdas melakukan *Human Takeover* (mem-pause bot 24 jam) agar Admin manusia yang menangani secara personal.

2. **Q: Apakah lokasi daerah bisa dikenali jika format ketikan user berbeda?**
   - **Jawaban**: Ya, AI dan regex parser Wahub dapat mengekstrak nama kota/daerah meskipun dipadukan dengan kalimat ramah tamah (contoh: "Saya tinggal di Bandung", "Dari Jogja nih min").

3. **Q: Apakah admin mendapatkan notifikasi saat tiket eskalasi dibuat?**
   - **Jawaban**: Ya, notifikasi muncul di Dashboard Admin secara real-time dan dapat dihubungkan ke email/webhook internal (seperti Slack atau Telegram).
