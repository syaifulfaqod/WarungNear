# WarungNear API Structure

Dokumen ini mendeskripsikan struktur backend REST API yang diharapkan oleh frontend WarungNear.
Format response standard (WAJIB) untuk semua endpoint:

**Berhasil:**
```json
{
  "success": true,
  "data": { ... } // Berisi objek atau array balikan
}
```

**Gagal:**
```json
{
  "success": false,
  "message": "Pesan error untuk ditampilkan di UI"
}
```

---

## 1. Authentication (Auth)

### POST `/auth/login`
**Request Body:**
```json
{
  "email": "owner@warungnear.com",
  "password": "password123"
}
```
**Response Data:**
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": 1,
    "name": "Budi Store Owner",
    "role": "owner"
  }
}
```

---

## 2. Products (Owner Dashboard)

*Header wajib: `Authorization: Bearer <token>`*

### GET `/products`
Mengambil semua produk milik owner.
**Response Data:** Array dari object produk.

### POST `/products`
Menambahkan produk baru.
**Request Body:**
```json
{
  "name": "Beras Maknyuss 5kg",
  "category": "Sembako",
  "price": 65000,
  "stock": 20,
  "image": "url-gambar"
}
```
**Response Data:** Objek produk yang baru ditambahkan (termasuk ID).

### PUT `/products/:id`
Mengupdate data produk.
**Request Body:** (Sama seperti POST, hanya field yang diubah)
**Response Data:** Objek produk terbaru.

### DELETE `/products/:id`
Menghapus produk.
**Response Data:** Kosong atau `{ "id": 1 }`

---

## 3. Transactions (Owner Dashboard)

*Header wajib: `Authorization: Bearer <token>`*

### GET `/transactions`
Mengambil riwayat transaksi.
**Response Data:** Array dari riwayat transaksi.

### POST `/transactions`
Membuat transaksi baru (Checkout Kasir).
**Request Body:**
```json
{
  "items": [
    { "productId": 1, "name": "Indomie", "quantity": 2, "price": 3000 }
  ],
  "total": 6000
}
```
**Response Data:** Objek transaksi terbaru. Backend wajib memotong `stock` produk di sisi database sebelum mereturn response.

---

## 4. Customer & Stores (Public API)

### GET `/stores/nearby`
Mencari warung terdekat dari titik koordinat.
**Query Params:** `?lat=-7.27&lng=112.74&maxDistance=5`
**Response Data:** Array toko beserta jarak (`distance`).

### GET `/stores/:id`
Detail info toko kelontong.

### GET `/stores/:id/products`
Daftar barang yang dijual di toko tersebut.

### GET `/products/search` (Optional/Alternatif)
Pencarian produk global lintas toko terdekat.
**Query Params:** `?keyword=indomie&lat=-7.27&lng=112.74&category=makanan`

---

## 5. Orders (Customer & Owner Dashboard)

*Header wajib: `Authorization: Bearer <token>`*

### POST `/orders`
Membuat pesanan baru oleh customer.
**Request Body:**
```json
{
  "store_id": 1,
  "items": [
    { "product_id": 2, "quantity": 1 }
  ]
}
```
**Response Data:** Objek pesanan yang baru dibuat (termasuk ID, items, status PENDING, dll). Backend memotong stok produk di database secara transaksional sebelum mereturn response.

### GET `/orders`
Mengambil riwayat pesanan.
- Jika peran adalah `CUSTOMER`, mengembalikan daftar pesanan milik pelanggan.
- Jika peran adalah `OWNER`, mengembalikan daftar pesanan masuk ke toko milik owner.
**Response Data:** Array objek pesanan lengkap dengan items dan detail snapshot harga.

### PUT `/orders/:id/status`
Mengubah status pesanan (Hanya untuk Owner).
**Request Body:**
```json
{
  "status": "CONFIRMED" // CONFIRMED, READY, COMPLETED
}
```
**Response Data:** Objek pesanan dengan status terupdate. Validasi alur transisi status wajib dipatuhi: PENDING -> CONFIRMED -> READY -> COMPLETED.

---

## 6. Socket.IO Realtime Events

Koneksi Socket.IO memerlukan handshake dengan token JWT pada properti `auth.token`.

### Room & Ruang Lingkup
- Room `user:{userId}`: Untuk update status pesanan milik pelanggan.
- Room `store:{storeId}`: Untuk notifikasi pesanan masuk bagi pemilik warung.

### Event Terkirim (Outgoing Events)
- `stock:update`: Dikirim ke seluruh client terkoneksi saat stok barang berubah.
  **Format data:** `{ "product_id": 1, "stock": 15 }`
- `order:new`: Dikirim ke room `store:{storeId}` owner saat pesanan baru berhasil dibuat.
  **Format data:** Objek pesanan lengkap.
- `order:update`: Dikirim ke room `user:{userId}` customer saat status pesanan diubah oleh owner.
  **Format data:** Objek pesanan dengan status terupdate.
