# SelfiNotify

Aplikasi notifikasi real-time menggunakan WebSocket untuk lingkungan local server dan full offline.

## Deskripsi

SelfiNotify adalah aplikasi web yang memungkinkan pengguna untuk mengirimkan notifikasi real-time ke client (website maupun mobile apps) menggunakan teknologi WebSocket. Aplikasi ini dirancang untuk berjalan di local server dan dapat beroperasi secara full offline.

## Fitur Utama

### Fitur Inti
- **Manajemen Aplikasi**: Pengguna dapat membuat aplikasi (website/mobile) dengan deskripsi opsional
- **Token Unik**: Setiap aplikasi menghasilkan token unik sebagai alamat client untuk menerima notifikasi
- **Pengiriman Notifikasi**: Mengirim notifikasi berisi title, pesan, dan URL file opsional untuk client

### Fitur Lanjutan
- **Login dengan JWT Token**: Sistem otentikasi menggunakan NPK dan password
- **History Notifikasi**: Riwayat semua notifikasi yang telah dikirim
- **Halaman Pengaturan**: Manajemen akun dan preferensi pengguna
- **Dashboard Real-time**: Statistik dan monitoring koneksi client secara real-time

## Teknologi yang Digunakan

### Backend
- Node.js
- Express.js
- Socket.IO (WebSocket)
- SQLite (Database)
- JWT (Authentication)
- bcryptjs (Password Hashing)

### Frontend
- React.js
- Tailwind CSS (Offline)
- React Router DOM
- Axios (HTTP Client)
- Socket.IO Client

## Struktur Proyek

```
selfinotify/
├── backend/           # Server Node.js
│   └── src/
│       ├── api/       # Routes/Endpoints
│       ├── config/    # Konfigurasi database
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── services/
│       └── utils/
└── frontend/          # Client React
    └── src/
        ├── components/
        ├── pages/
        ├── services/
        └── styles/
```

## Instalasi dan Setup

### Prerequisites
- Node.js (v16 atau lebih baru)
- npm atau yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Penggunaan

1. Login menggunakan NPK dan password
2. Buat aplikasi baru di dashboard
3. Salin token aplikasi yang dihasilkan
4. Integrasikan token ke client application
5. Kirim notifikasi melalui dashboard

## Kontribusi

Proyek ini dikembangkan oleh MuhamadSyabitHidayattulloh.

## Lisensi

Private Project

