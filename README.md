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
- **Login dengan JWT Token**: Sistem otentikasi menggunakan username dan password
- **Dual Database Architecture**: Database terpisah untuk auth (master) dan aplikasi (selfinotify)
- **History Notifikasi**: Riwayat semua notifikasi yang telah dikirim dengan filter multi-aplikasi
- **Dashboard Real-time**: Statistik dan monitoring koneksi client secara real-time
- **Connection Statistics**: Tracking jumlah client yang terhubung per aplikasi

## Teknologi yang Digunakan

### Backend
- Node.js
- Express.js
- Socket.IO (WebSocket)
- MSSQL (Database utama)
- Sequelize ORM
- JWT (Authentication)
- MD5 (Password Hashing)
- Centralized Logging System

### Frontend
- React.js
- Tailwind CSS
- Radix UI Components
- React Router DOM
- Axios (HTTP Client)
- Socket.IO Client
- Custom MultiSelect Component

## Struktur Proyek

```
SelfiNotify/
├── backend/           # Server Node.js
│   ├── src/
│   │   ├── api/       # Routes/Endpoints
│   │   ├── config/    # Konfigurasi dual database
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/     # Logger utility
│   └── package.json
├── frontend/          # Client React
│   └── src/
│       ├── components/
│       │   ├── ui/    # Reusable UI components
│       │   └── layout/
│       ├── pages/
│       ├── hooks/
│       └── lib/
└── README.md
```

## Arsitektur Database

### Dual Database Setup
- **Database Master**: Untuk autentikasi dengan tabel `master_login`
  - `username` (char 10)
  - `password` (varchar 2000) - MD5 hashed
  - `name` (varchar 500)

- **Database SelfiNotify**: Untuk aplikasi utama
  - Tabel `applications`
  - Tabel `notification_history`

## Instalasi dan Setup

### Prerequisites
- Node.js (v16 atau lebih baru)
- MSSQL Server
- pnpm (recommended) atau npm

### Environment Variables
Buat file `.env` di folder backend:

```env
# Database SelfiNotify (Database Utama)
DB_NAME=selfinotify
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Database Master (Untuk Auth)
MASTER_DB_NAME=master
MASTER_DB_USER=your_username
MASTER_DB_PASSWORD=your_password
MASTER_DB_HOST=localhost
MASTER_DB_ENCRYPT=false
MASTER_DB_TRUST_SERVER_CERTIFICATE=true

# JWT & Server
JWT_SECRET=your_secret_key
PORT=3000
CORS_ORIGIN=*
```

### Backend Setup
```bash
cd backend
pnpm install
pnpm run dev
```

### Frontend Setup
```bash
cd frontend
pnpm install
pnpm run dev
```

## Penggunaan

1. **Login**: Masuk menggunakan username dan password
2. **Dashboard**: Lihat statistik real-time dan aplikasi yang terdaftar
3. **Buat Aplikasi**: Buat aplikasi baru dengan platform mobile/website
4. **Salin Token**: Salin token aplikasi yang dihasilkan
5. **Integrasi Client**: Integrasikan token ke client application
6. **Kirim Notifikasi**: Kirim notifikasi melalui dashboard dengan multi-select aplikasi
7. **Monitor History**: Lihat riwayat notifikasi dengan filter multi-aplikasi

## Fitur Multi-Select

### MultiSelect Component
- **Reusable UI Component**: Digunakan di semua halaman yang memerlukan multi-selection
- **Search & Filter**: Pencarian real-time dalam dropdown
- **Chips Display**: Menampilkan item yang dipilih sebagai chips
- **Quick Actions**: Tombol "Pilih Semua" dan "Hapus Semua"
- **Customizable**: Badge, description, dan label yang fleksibel

### Implementasi di Halaman
- **HistoryPage**: Filter notifikasi berdasarkan multiple aplikasi
- **SendNotificationPage**: Pilih multiple aplikasi untuk kirim notifikasi
- **ApplicationsPage**: Filter berdasarkan multiple platform

## Optimizations

### Backend
- Centralized logging system
- Memory leak prevention
- Proper error handling
- Clean dependencies

### Frontend
- Reusable components
- Memory leak prevention dengan useEffect cleanup
- Optimized bundle size
- Consistent UI patterns

## Kontribusi

Proyek ini dikembangkan oleh MuhamadSyabitHidayattulloh.

## Lisensi

Private Project

