# WarungNear 🏪

WarungNear adalah aplikasi full-stack berbasis Web (React + Node.js) yang dirancang untuk menjembatani pelanggan (Customer) dengan pemilik warung kelontong (Owner). Aplikasi ini memungkinkan pelanggan mencari stok produk secara real-time dan melihat toko terdekat berdasarkan radius jarak (Haversine Formula), sekaligus menyediakan dashboard penjualan Point of Sales (POS) kasir bagi pemilik toko.

## 🛠️ Tech Stack

### Frontend
- **Framework & Core**: React JS + Vite
- **Styling**: Tailwind CSS (v4)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Map Library**: Leaflet + React-Leaflet
- **Icons**: Lucide-React
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth & Security**: JWT + bcrypt
- **Input Validation**: Zod

---

## 🚀 Fitur Utama & Demo Flow

### 1. Demo Flow Customer 🛒
- **Registrasi & Login**: Mendaftarkan akun customer baru dan masuk untuk mencari barang.
- **Pencarian Produk**: Mencari produk secara real-time berdasarkan keyword dan kategori belanja.
- **Toko Terdekat**: Melihat daftar warung/toko terdekat yang diurutkan berdasarkan jarak terdekat dan ketersediaan stok barang.
- **Peta Lokasi**: Melihat peta sebaran toko terdekat dengan Leaflet Map.
- **Detail Warung**: Membuka profil warung untuk melihat jam operasional, alamat, peta mini, dan daftar katalog stok produk.

### 2. Demo Flow Owner (Dashboard POS) 💼
- **Registrasi & Login**: Mendaftar sebagai Owner dan diarahkan ke Dashboard.
- **Tambah Toko**: Owner mendaftarkan nama, alamat, jam operasional, serta koordinat toko di menu **Settings**.
- **CRUD Produk**: Mengelola daftar katalog barang warung di menu **Products**.
- **Kelola Inventori**: Mengupdate jumlah stok barang secara manual (+/-) di menu **Inventory**.
- **POS Kasir & Transaksi**: Melakukan transaksi kasir di menu **Transactions** yang secara otomatis memotong stok barang secara transaksional (atomik) dan mencatat riwayat transaksi.

---

## 📋 Ringkasan API Endpoint

### Autentikasi
- `POST /api/auth/register` : Mendaftarkan pengguna baru (CUSTOMER/OWNER).
- `POST /api/auth/login` : Autentikasi pengguna dan mendapatkan token JWT.
- `GET /api/auth/me` : Mendapatkan detail profil user aktif (diperlukan JWT).

### Toko / Warung
- `GET /api/stores/nearby` : Mencari toko terdekat berdasarkan latitude, longitude, keyword, dan radius jarak (km).
- `GET /api/stores/:id` : Menampilkan informasi detail toko kelontong beserta daftar produknya.
- `GET /api/stores/owner/store` : Mengambil data toko yang dimiliki oleh Owner aktif.
- `POST /api/stores/owner/store` : Membuat baru atau memperbarui data toko milik Owner aktif.

### Produk
- `GET /api/products` : Menampilkan daftar produk (OWNER: produk miliknya sendiri; CUSTOMER: produk umum/publik).
- `POST /api/products` : Menambahkan produk baru (khusus OWNER).
- `PUT /api/products/:id` : Mengupdate informasi produk (khusus OWNER).
- `DELETE /api/products/:id` : Menghapus produk (khusus OWNER).

### Transaksi
- `GET /api/transactions` : Menampilkan riwayat transaksi toko (khusus OWNER).
- `POST /api/transactions` : Membuat transaksi POS baru dan mengurangi stok produk secara transaksional (khusus OWNER).

---

## ⚙️ Cara Instalasi & Menjalankan Project

### Prerequisites
- Node.js (versi terbaru direkomendasikan)
- PostgreSQL Database server

### 1. Setup Backend
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Install seluruh dependensi:
   ```bash
   npm install
   ```
3. Buat file konfigurasi `.env` dengan menyalin `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Sesuaikan connection string database PostgreSQL Anda di `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/warungnear?schema=public"
   JWT_SECRET="ganti_dengan_key_rahasia_anda"
   ```
5. Jalankan database migration untuk membuat struktur tabel:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Jalankan database seeder untuk mengisi data awal:
   ```bash
   npm run seed
   ```
7. Jalankan backend server:
   ```bash
   npm run dev
   ```
   *Backend akan berjalan di port `http://localhost:5000`*

### 2. Setup Frontend
1. Masuk ke direktori frontend:
   ```bash
   cd ../frontend
   ```
2. Install dependensi dan postcss v4 wrapper:
   ```bash
   npm install
   ```
3. Buat file `.env` dengan menyalin `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Jalankan frontend development server:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di port `http://localhost:5173`*

## 📦 Production Build & Deployment Guide

### 1. Database Production (Railway / Supabase)
1. Buat instance database PostgreSQL di platform cloud pilihan Anda (misal Railway atau Supabase).
2. Salin connection string database production yang disediakan.
3. Gunakan perintah berikut di folder `backend` untuk menerapkan migrasi skema database terbaru secara langsung (tanpa membuat file migrasi baru):
   ```bash
   npx prisma migrate deploy
   ```
4. Jalankan seeder di database production jika diperlukan:
   ```bash
   npm run seed
   ```

### 2. Backend Production Deployment (Railway / Render / VPS)
1. Hubungkan repository GitHub proyek Anda ke Railway atau Render.
2. Konfigurasikan root directory layanan baru ke `/backend` (atau sesuaikan root build command).
3. Atur variabel lingkungan berikut pada platform hosting Anda:
   - `PORT` = `5000` (atau port otomatis yang disediakan oleh platform)
   - `DATABASE_URL` = *[PostgreSQL Connection String Anda]*
   - `JWT_SECRET` = *[Key Rahasia JWT Anda]*
   - `FRONTEND_URL` = *[Domain Frontend Produksi Anda, contoh: `https://warungnear.vercel.app`]* (Pisahkan dengan koma jika ada lebih dari satu domain)
4. Sistem akan otomatis menjalankan perintah `npm start`.

### 3. Frontend Production Deployment (Vercel / Netlify)
1. Hubungkan repository GitHub ke Vercel atau Netlify.
2. Atur root directory ke `/frontend`.
3. Tambahkan environment variable pada pengaturan project deployment:
   - `VITE_API_URL` = *[URL Backend Produksi Anda, contoh: `https://warungnear-backend.railway.app/api`]*
4. Jalankan build. Vercel/Netlify akan mengeksekusi `npm run build` dan menyebarkan static assets yang dihasilkan di folder `dist`.

---

## 🌐 Production URLs (Contoh Referensi)
- **Frontend URL**: `https://warungnear.vercel.app`
- **Backend API URL**: `https://warungnear-backend.up.railway.app/api`
- **Health check**: `https://warungnear-backend.up.railway.app/api/health`

