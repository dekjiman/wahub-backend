# 🧪 Skenario Pengujian WhatsApp Community (Testing Journey)

Dokumen ini disusun khusus sebagai **Panduan Pengujian (Testing Scenario)** yang berfokus pada **User Journey** dan **Contoh Pesan (Sample Messages)** yang siap di-preview atau di-share screen saat demo/uji coba.

---

## 📌 Informasi Pengujian
- **Fokus Pengujian**: User Journey (Join Grup ➔ Welcome Announcement ➔ Input Daerah ➔ Komplain Sentimen Negatif ➔ Eskalasi Support).
- **Link WhatsApp Group**: [https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS](https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS)
- **Subjek Penguji**:
  - 📱 **Tester**: Anggota baru yang mengirim pesan di WhatsApp.
  - 🖥️ **Admin**: Pengelola yang menampilkan Dashboard di Share Screen.

---

## 🗺️ Visual User Journey

```
┌─────────────────┐      ┌─────────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ 1. Join Group   │ ───► │ 2. Welcome Announcement │ ───► │ 3. Jawab Daerah     │ ───► │ 4. Kirim Komplain   │ ───► │ 5. Eskalasi Support │
│    via Link     │      │    & Prompt Daerah      │      │    (Profil Terisi)  │      │    Sentimen Negatif │      │    (Human Handover) │
└─────────────────┘      └─────────────────────────┘      └─────────────────────┘      └─────────────────────┘      └─────────────────────┘
```

---

## 📝 Detail Steps & Pesan Uji Coba (Ready to Copy-Paste)

### 🔹 Skenario 1: User Join Grup & Menerima Announcement
- **Tindakan Tester**:
  - Klik link WhatsApp Group: **[https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS](https://chat.whatsapp.com/FFmDIPrq86ZFmlncOcFHYS)**
  - Tekan tombol **Join Group / Bergabung**.
- **Hasil yang Dilihat di Layar WhatsApp**:
  - Bot secara otomatis menyapa di grup dengan pesan sambutan.
- **💬 Contoh Pesan Bot yang Diterima**:
  > *"Selamat datang di komunitas Wahub! 👋🏼*
  > *Silakan perkenalkan diri Anda dengan membalas pesan ini:*
  > **Dari daerah manakah Anda berasal? (Contoh: Jakarta / Surabaya / Bandung)**"*

---

### 🔹 Skenario 2: User Membalas Daerah Asal (Profile Input)
- **Tindakan Tester**:
  - Balas pesan di grup WhatsApp dengan menyebutkan nama daerah.
- **📲 Teks yang Di-Copy & Paste oleh Tester**:
  ```text
  Halo min, perkenalkan saya dari Jakarta Selatan.
  ```
  *(Pilihan teks alternatif: "Saya dari Bandung min", "Tinggal di Surabaya nih")*
- **Hasil yang Dilihat di Layar**:
  - **WhatsApp**: Bot mengonfirmasi data daerah telah tercatat.
  - **Share Screen Dashboard**: Profil member otomatis ter-update (`Area: Jakarta Selatan`, `Status: Completed`).

---

### 🔹 Skenario 3: User Mengirim Pesan Sentimen Negatif (Komplain / Keluhan)
- **Tindakan Tester**:
  - Kirim pesan di grup yang berisi keluhan pedas / sentimen negatif.
- **📲 Teks yang Di-Copy & Paste oleh Tester**:
  ```text
  Layanan Wahub ini parah banget! Respon adminnya lelet dan aplikasinya kecewa banget saya!
  ```
  *(Pilihan teks alternatif: "Komunitas ga jelas ini, respon admin lelet banget kecewa!")*
- **Hasil yang Dilihat di Layar**:
  - Pesan terkirim di grup WhatsApp dan AI langsung menganalisis emosi teks tersebut.

---

### 🔹 Skenario 4: Eskalasi Support & Human Agent Handover
- **Tampilan pada Share Screen Dashboard Admin**:
  - 🔴 **Moderation Alert**: Terdeteksi indikasi sentimen negatif / keluhan tinggi (*High Severity*).
  - 🎫 **Tiket Eskalasi Support**: Otomatis terbuat tiket baru ber-prioritas tinggi (*Urgent*) di daftar eskalasi.
  - ⏸️ **Human Agent Handover**: Bot AI di-pause otomatis di grup tersebut (agar bot tidak membalas acak dan balasan ditangani langsung oleh Admin manusia).
- **Penyelesaian oleh Admin**:
  - Admin mengambil tiket, merespon user secara personal di grup/DM, dan menandai tiket **Resolved**.

---

## 📋 Tabel Pengujian Share Screen (Testing Cheat Sheet)

*(Tabel ini sangat ideal untuk dipajang saat presentasi/share screen)*

| Step | Tahap Pengujian | Teks yang Di-Kirim Tester (Copy-Paste) | Ekspektasi Tampilan Layar | Status |
| :-: | :--- | :--- | :--- | :-: |
| **1** | Join Group | *(Klik link WA Group)* | Bot kirim Welcome Announcement & tanya daerah | 🟢 Pass |
| **2** | Input Daerah | `Halo min, perkenalkan saya dari Jakarta Selatan.` | Bot konfirmasi & Data `Area` di Dashboard terisi | 🟢 Pass |
| **3** | Komplain / Sentimen Negatif | `Layanan Wahub ini parah banget! Respon adminnya lelet dan aplikasinya kecewa banget saya!` | Pesan terkirim, AI mendeteksi sentimen negatif | 🟢 Pass |
| **4** | Eskalasi Support | *(Lihat Dashboard Share Screen)* | Tiket Eskalasi Urgent terbuat & AI Bot Paused 24h | 🟢 Pass |
