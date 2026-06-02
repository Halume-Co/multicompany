# Design: Remove Mock Data — Hubungkan FE ke BE

**Date:** 2026-06-02  
**Status:** Approved

---

## Tujuan

Hapus semua mock/hardcoded data di frontend. Seluruh data bersumber dari backend NestJS + database PostgreSQL (Supabase).

---

## Scope

### File FE yang dihapus mock datanya
| File | Mock yang dihapus |
|---|---|
| `fe/app/page.tsx` | `mockProducts[]` |
| `fe/app/products/[id]/page.tsx` | `mockProduct` |
| `fe/app/seller/products/page.tsx` | `mockProducts[]` |
| `fe/app/seller/orders/page.tsx` | `mockOrders[]` |
| `fe/app/seller/dashboard/page.tsx` | `mockStats`, `mockRecentOrders[]` |

### File BE yang ditambah serializer
| File | Perubahan |
|---|---|
| `be/src/modules/product/product.service.ts` | Tambah `serializeProduct()` |
| `be/src/modules/order/order.service.ts` | Tambah `serializeOrder()`, `serializeSellerOrder()` |
| `be/src/modules/cart/cart.service.ts` | Tambah `serializeCart()` |

---

## Arsitektur

Transformasi data dilakukan di **BE service layer** — database schema tidak berubah, tidak ada migration.

```
DB (Prisma shape)
    ↓
Service serialize() method
    ↓
Response shape yang cocok dengan FE types
    ↓
FE konsumsi langsung tanpa adapter
```

---

## Serializer Contracts

### Product → FE `Product` type

```typescript
// Input (Prisma)
{ id, name, description, price: Decimal, imageUrl, isActive, createdAt,
  category: { id, name }, company: { id, name }, sizes: [{ size: Int, stock }] }

// Output (FE Product type)
{
  id, name, description,
  price: Number(price),
  images: imageUrl ? [imageUrl] : [],
  sizes: sizes.map(s => ({ size: String(s.size), stock: s.stock })),
  sellerId: companyId,
  sellerName: company.name,
  category: category.name,
  rating: 0,           // belum ada rating system
  reviewCount: 0,      // belum ada rating system
  createdAt: createdAt.toISOString()
}
```

### Order → FE `Order` type (buyer)

```typescript
// Output
{
  id,
  buyerId: userId,
  sellerId: companyId,
  status: status.toLowerCase(),
  total: Number(totalPrice),
  subtotal: Number(totalPrice),  // tidak ada breakdown
  tax: 0,
  shippingAddress: null,         // belum ada di schema
  items: items.map(item => ({
    productId: item.productId,
    productName: item.product.name,
    size: String(item.size),
    quantity: item.quantity,
    price: Number(item.unitPrice),
    image: item.product.imageUrl ?? ''
  })),
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString()
}
```

### Seller Order → shape yang dipakai di seller/orders page

```typescript
// Output — flatten untuk tabel seller
{
  id,
  buyerName: user.name,
  buyerEmail: user.email,
  status: status.toLowerCase(),
  total: Number(totalPrice),
  date: createdAt.toISOString(),
  items: items.map(item => ({
    productId, productName: item.product.name,
    size: String(item.size), quantity, price: Number(item.unitPrice),
    image: item.product.imageUrl ?? ''
  }))
}
```

### Cart → FE `Cart` type

```typescript
// Output
{
  items: items.map(item => ({
    productId: item.productId,
    size: String(item.size),
    quantity: item.quantity,
    price: Number(item.product.price),
    product: serializeProduct(item.product)  // shape sama dengan Product
  })),
  subtotal,
  tax: 0,
  total: subtotal
}
```

### Dashboard stats — dihitung dari data real

```typescript
// Dihitung dari getSellerProducts() + getSellerOrders()
{
  totalProducts: products.length,
  activeListings: products.filter(p => p.isActive).length,
  orders: orders.length,
  revenue: orders.reduce((sum, o) => sum + o.totalPrice, 0)
}
```

---

## Perubahan FE

### Pattern untuk setiap halaman

Semua halaman yang punya mock data diubah ke pattern:
1. Tambah `useState` untuk data, loading, error
2. `useEffect` → panggil API function dari `lib/api.ts`
3. Tampilkan loading skeleton saat fetch
4. Tampilkan error message jika gagal
5. Render data real

### Loading state
Gunakan skeleton sederhana (div grey animated) — tidak perlu library tambahan.

### Error state
Tampilkan pesan "Gagal memuat data" dengan tombol retry.

---

## Yang Tidak Berubah

- Database schema (tidak ada migration)
- `lib/api.ts` — fungsi API sudah lengkap
- `lib/types.ts` — FE types tetap sama
- Semua komponen UI (ProductCard, Header, dll)
- Auth flow

---

## Field Defaults (tidak ada di DB)

| Field | Default | Alasan |
|---|---|---|
| `rating` | `0` | Rating system belum dibangun |
| `reviewCount` | `0` | Rating system belum dibangun |
| `shippingAddress` | `null` | Belum ada di schema |
| `tax` | `0` | Belum ada logika pajak |
