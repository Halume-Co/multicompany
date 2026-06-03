# 🚀 LumeHub Presentation Hub (Teleport)

File ini dibuat khusus untuk mempermudah navigasi saat presentasi. Di VS Code, kamu bisa tekan **Ctrl + Klik** pada nama file untuk langsung "teleport" ke kode tersebut.

---

### 🛡️ AUTH SERVICE (Speaker: Davi)
*   **Slide 5: Registrasi User**
    [be/src/modules/auth/auth.service.ts](be/src/modules/auth/auth.service.ts) -> Cari `// [PRESENTATION] SLIDE 5`
*   **Slide 6: Login & Session**
    [be/src/modules/auth/auth.service.ts](be/src/modules/auth/auth.service.ts) -> Cari `// [PRESENTATION] SLIDE 6`

---

### 🔍 DISCOVERY SERVICE (Speaker: Bobby)
*   **Slide 7: Pencarian Lintas Brand (Aggregation)**
    [be/src/modules/product/product.service.ts](be/src/modules/product/product.service.ts) -> Cari `// [PRESENTATION] SLIDE 7`
*   **Slide 8: Add to Cart (Upsert Logic)**
    [be/src/modules/cart/cart.service.ts](be/src/modules/cart/cart.service.ts) -> Cari `// [PRESENTATION] SLIDE 8`

---

### 🛒 CART SERVICE (Speaker: Dika)
*   **Slide 9: Ubah Qty / Remove Item**
    [be/src/modules/cart/cart.service.ts](be/src/modules/cart/cart.service.ts) -> Cari `// [PRESENTATION] SLIDE 9`
*   **Slide 10: Checkout (Konversi Keranjang ke Order)**
    [be/src/modules/order/order.service.ts](be/src/modules/order/order.service.ts) -> Cari `// [PRESENTATION] SLIDE 10`

---

### 💳 PAYMENT & SUPPLY (Speaker: Marco)
*   **Slide 11: Validasi Pembayaran (Status Paid)**
    [be/src/modules/order/order.service.ts](be/src/modules/order/order.service.ts) -> Cari `// [PRESENTATION] SLIDE 11`
*   **Slide 12: Tambah Produk Baru (Multi-Silo)**
    [be/src/modules/product/product.service.ts](be/src/modules/product/product.service.ts) -> Cari `// [PRESENTATION] SLIDE 12`

---

### 🏗️ INTEGRITY SERVICE (Speaker: Rafael)
*   **Slide 13: Verifikasi Stok (Row-Level Locking)**
    [be/src/modules/order/order.service.ts](be/src/modules/order/order.service.ts) -> Cari `// [PRESENTATION] SLIDE 13`
*   **Slide 14: Manajemen Pesanan (Dashboard Seller)**
    [be/src/modules/order/order.service.ts](be/src/modules/order/order.service.ts) -> Cari `// [PRESENTATION] SLIDE 14`

---

### 🔄 SYNC SERVICE (Speaker: Yazid)
*   **Slide 15: Sinkronisasi Stok (Final Decrement)**
    [be/src/modules/order/order.service.ts](be/src/modules/order/order.service.ts) -> Cari `// [PRESENTATION] SLIDE 15`
*   **Slide 16: Review Produk (Constraint)**
    *Logika validasi review selaras dengan kepemilikan order di `order.service.ts`.*

---

### 💡 Tips Cepat:
1.  Buka file ini di VS Code.
2.  Gunakan **Ctrl + Klik** pada link file di atas.
3.  Setelah file terbuka, gunakan **Ctrl + F** lalu ketik `SLIDE X` untuk langsung ke baris kodenya.
4.  Jika ingin kembali ke file ini, tekan `Alt + Panah Kiri`.
