# Isolated Company Silo Databases

Folder ini berisi konfigurasi Prisma untuk database terisolasi milik masing-masing perusahaan. Setiap folder bertindak sebagai database mandiri untuk menjamin otonomi data.

## Struktur Folder
- `/nike`: Konfigurasi DB Nike
- `/adidas`: Konfigurasi DB Adidas
- `/puma`: Konfigurasi DB Puma

## Cara Menghubungkan ke Neon
1. Buat 3 project/database baru di [Neon.tech](https://neon.tech).
2. Dapatkan Connection String untuk masing-masing DB.
3. Tambahkan variabel berikut ke file `.env` di folder `be`:
   ```env
   DATABASE_URL_NIKE="postgresql://user:pass@ep-nike.neon.tech/neondb"
   DATABASE_URL_ADIDAS="postgresql://user:pass@ep-adidas.neon.tech/neondb"
   DATABASE_URL_PUMA="postgresql://user:pass@ep-puma.neon.tech/neondb"
   ```

## Cara Melakukan Migrasi
Untuk melakukan migrasi pada salah satu silo secara mandiri, jalankan command berikut dari folder `be`:
```bash
# Migrasi Nike
npx prisma migrate dev --schema=./prisma/silos/nike/schema.prisma

# Migrasi Adidas
npx prisma migrate dev --schema=./prisma/silos/adidas/schema.prisma

# Migrasi Puma
npx prisma migrate dev --schema=./prisma/silos/puma/schema.prisma
```

## Keuntungan
- **CRUD Mandiri:** Setiap perusahaan bisa melakukan operasi database tanpa mengganggu platform utama.
- **Isolasi Data:** Data transaksi dan stok benar-benar terpisah secara fisik.
- **Skalabilitas:** Kamu bisa memindahkan database salah satu perusahaan ke server yang lebih kuat jika traffic mereka meledak.
