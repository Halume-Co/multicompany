# End-to-End System Test Cases (Shoe Marketplace)

Dokumen ini berisi skenario pengujian untuk memastikan seluruh sistem (Frontend + Backend + Database) berjalan dengan benar setelah penghapusan data mock dan integrasi real-time.

---

## 1. Skenario Buyer (User Journey)

### 1.1 Registrasi & Login
- [ ] **Test Case:** Daftar sebagai buyer baru.
- [ ] **Ekspektasi:** Akun tersimpan di DB, otomatis login, dan diarahkan ke Homepage.
- [ ] **Test Case:** Login dengan email & password yang benar.
- [ ] **Ekspektasi:** Nama user muncul di Header, session tersimpan di browser (HTTP-only cookie).

### 1.2 Penemuan Produk & Detail
- [ ] **Test Case:** Klik salah satu produk di Homepage.
- [ ] **Ekspektasi:** Diarahkan ke `/products/[id]`, data real (nama, harga, kategori) muncul, gambar tidak pecah (jika tidak ada gambar, muncul placeholder).
- [ ] **Test Case:** Filter produk berdasarkan kategori.
- [ ] **Ekspektasi:** List produk berubah sesuai kategori yang dipilih dari database.

### 1.3 Shopping Cart (Sinkronisasi Database)
- [ ] **Test Case:** Pilih size dan tambah ke keranjang (Add to Cart).
- [ ] **Ekspektasi:** Muncul notifikasi "Added to cart", angka di icon keranjang di Header bertambah.
- [ ] **Test Case:** Refresh halaman Cart.
- [ ] **Ekspektasi:** Keranjang **TIDAK** kosong. Muncul loading spinner sebentar, lalu data dari database tampil.
- [ ] **Test Case:** Ubah quantity atau hapus item di halaman Cart.
- [ ] **Ekspektasi:** Subtotal & Total terupdate secara otomatis dan tersimpan di database.

### 1.4 Checkout & Pembayaran (Kritikal)
- [ ] **Test Case:** Klik "Proceed to Checkout" dari halaman Cart.
- [ ] **Ekspektasi:** Diarahkan ke form alamat. Keranjang tetap tampil di sidebar kanan.
- [ ] **Test Case:** Isi alamat, pilih pembayaran, dan klik "Place Order".
- [ ] **Ekspektasi:** Diarahkan ke halaman konfirmasi sukses. Keranjang otomatis kosong.
- [ ] **Test Case:** Cek halaman "My Orders" di menu profil.
- [ ] **Ekspektasi:** Pesanan baru muncul dengan status "PENDING" atau "PAID".

---

## 2. Skenario Seller (Management Journey)

### 2.1 Tambah Produk Baru
- [ ] **Test Case:** Masuk ke Seller Dashboard -> Add New Product.
- [ ] **Ekspektasi:** Dropdown Kategori berisi data asli dari database.
- [ ] **Test Case:** Isi form produk, masukkan URL gambar (atau upload), isi stok untuk beberapa size, lalu simpan.
- [ ] **Ekspektasi:** Produk tersimpan di database, muncul di list "Seller Products", dan muncul di Homepage buyer.

### 2.2 Verifikasi Stok (Integritas Data)
- [ ] **Test Case:** Setelah Buyer melakukan checkout, Seller cek stok produk tersebut di Dashboard.
- [ ] **Ekspektasi:** Stok produk berkurang secara akurat sesuai jumlah yang dibeli buyer.

### 2.3 Manajemen Pesanan
- [ ] **Test Case:** Seller cek menu "Orders".
- [ ] **Ekspektasi:** Pesanan dari buyer muncul (hanya pesanan yang berisi produk milik perusahaan seller tersebut).
- [ ] **Test Case:** Update status pesanan (misal: Mark as Shipped).
- [ ] **Ekspektasi:** Status terupdate di dashboard seller dan dashboard buyer secara real-time.

---

## 3. Pengujian Integritas & Keamanan

- [ ] **Multi-Tenancy:** Pastikan Seller A **tidak bisa** melihat atau mengedit produk milik Seller B.
- [ ] **Auth Guard:** Pastikan buyer tidak bisa mengakses halaman `/seller/dashboard`.
- [ ] **CORS:** Pastikan frontend bisa berkomunikasi dengan backend tanpa error "CORS Blocked".
- [ ] **Validation:** Masukkan harga negatif atau stok negatif di form. Pastikan backend menolak dan frontend menampilkan error yang jelas.

---

## 4. Cara Menjalankan Pengujian Manual

1. **Persiapan:** Run backend (`cd be && npm run start:dev`) dan frontend (`cd fe && npm run dev`).
2. **Database:** Gunakan `be/prisma/seed.ts` untuk mengisi data awal jika perlu (`npx prisma db seed`).
3. **User Test:**
   - **Buyer:** `buyer@example.com` / password sesuai `.env`
   - **Seller (Nike):** `nike-seller@example.com` / password sesuai `.env`
