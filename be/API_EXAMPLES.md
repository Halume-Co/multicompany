# Multi-Tenant Shoe Marketplace API — Request Examples

Base URL: `http://localhost:3000`

---

## 🔐 Mock Authentication Headers

All requests simulate authentication via HTTP headers:

| Header | Description | Example |
|--------|-------------|---------|
| `x-mock-role` | User role | `BUYER` \| `SELLER` \| `ADMIN` |
| `x-mock-user-id` | User's UUID | `buyer-user-id` |
| `x-mock-user-email` | User's email | `buyer@example.com` |
| `x-mock-user-name` | User's name | `John Doe` |
| `x-mock-company-id` | Company UUID (sellers only) | `<company-uuid>` |

---

## 🏢 COMPANY MODULE

### Register a Company (Seller)
```bash
curl -X POST http://localhost:3000/companies/register \
  -H "Content-Type: application/json" \
  -H "x-mock-role: SELLER" \
  -H "x-mock-user-id: new-seller-id" \
  -H "x-mock-user-email: seller@puma.com" \
  -H "x-mock-user-name: Puma Seller" \
  -d '{
    "name": "Puma",
    "description": "Forever Faster",
    "email": "contact@puma.example.com",
    "phone": "+49-9132-81-0",
    "address": "PUMA Way 1, 91574 Herzogenaurach, Germany"
  }'
```

**Response:**
```json
{
  "id": "3a1c4b2d-...",
  "name": "Puma",
  "description": "Forever Faster",
  "email": "contact@puma.example.com",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Get My Company (Seller)
```bash
curl http://localhost:3000/companies/me \
  -H "x-mock-role: SELLER" \
  -H "x-mock-user-id: nike-seller-id" \
  -H "x-mock-company-id: <nike-company-id>"
```

### List All Companies (Public)
```bash
curl http://localhost:3000/companies
```

---

## 👟 PRODUCT MODULE

### List All Products (Public)
```bash
curl http://localhost:3000/products
```

### List with Filters
```bash
# Filter by company
curl "http://localhost:3000/products?companyId=<nike-company-id>"

# Filter by category
curl "http://localhost:3000/products?categoryId=<running-category-id>"

# Search by name
curl "http://localhost:3000/products?search=Air+Max"
```

### Get Single Product
```bash
curl http://localhost:3000/products/nike-airmax-id
```

**Response:**
```json
{
  "id": "nike-airmax-id",
  "name": "Nike Air Max 270",
  "description": "The Nike Air Max 270...",
  "price": "1500000",
  "imageUrl": "https://example.com/images/nike-airmax-270.jpg",
  "isActive": true,
  "sizes": [
    { "id": "...", "size": 38, "stock": 10 },
    { "id": "...", "size": 39, "stock": 8 },
    { "id": "...", "size": 40, "stock": 15 }
  ],
  "category": { "id": "...", "name": "Running" },
  "company": { "id": "...", "name": "Nike" }
}
```

### Create a Product (Seller Only)
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "x-mock-role: SELLER" \
  -H "x-mock-user-id: nike-seller-id" \
  -H "x-mock-company-id: <nike-company-id>" \
  -d '{
    "name": "Nike React Infinity Run",
    "description": "Designed to help reduce injury and keep you running.",
    "price": 1750000,
    "imageUrl": "https://example.com/images/react-infinity.jpg",
    "categoryId": "<running-category-id>",
    "sizes": [
      { "size": 39, "stock": 20 },
      { "size": 40, "stock": 25 },
      { "size": 41, "stock": 18 },
      { "size": 42, "stock": 12 }
    ]
  }'
```

### Update a Product (Seller Only)
```bash
curl -X PUT http://localhost:3000/products/<product-id> \
  -H "Content-Type: application/json" \
  -H "x-mock-role: SELLER" \
  -H "x-mock-user-id: nike-seller-id" \
  -H "x-mock-company-id: <nike-company-id>" \
  -d '{
    "price": 1600000,
    "sizes": [
      { "size": 40, "stock": 30 },
      { "size": 41, "stock": 25 }
    ]
  }'
```

### Delete a Product (Seller Only — Soft Delete)
```bash
curl -X DELETE http://localhost:3000/products/<product-id> \
  -H "x-mock-role: SELLER" \
  -H "x-mock-user-id: nike-seller-id" \
  -H "x-mock-company-id: <nike-company-id>"
```

---

## 🛒 CART MODULE

### View Cart (Buyer)
```bash
curl http://localhost:3000/cart \
  -H "x-mock-role: BUYER" \
  -H "x-mock-user-id: buyer-user-id"
```

**Response:**
```json
{
  "id": "cart-uuid",
  "userId": "buyer-user-id",
  "items": [
    {
      "id": "item-uuid",
      "size": 42,
      "quantity": 2,
      "product": {
        "id": "nike-airmax-id",
        "name": "Nike Air Max 270",
        "price": "1500000",
        "company": { "id": "...", "name": "Nike" }
      }
    }
  ],
  "totalItems": 1,
  "subtotal": 3000000
}
```

### Add to Cart (Buyer)
```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Content-Type: application/json" \
  -H "x-mock-role: BUYER" \
  -H "x-mock-user-id: buyer-user-id" \
  -d '{
    "productId": "nike-airmax-id",
    "size": 42,
    "quantity": 1
  }'
```

### Add Adidas Product to Same Cart
```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Content-Type: application/json" \
  -H "x-mock-role: BUYER" \
  -H "x-mock-user-id: buyer-user-id" \
  -d '{
    "productId": "adidas-ultraboost-id",
    "size": 41,
    "quantity": 2
  }'
```

### Remove from Cart (Buyer)
```bash
curl -X DELETE http://localhost:3000/cart/remove \
  -H "Content-Type: application/json" \
  -H "x-mock-role: BUYER" \
  -H "x-mock-user-id: buyer-user-id" \
  -d '{
    "productId": "nike-airmax-id",
    "size": 42
  }'
```

---

## 📦 ORDER MODULE

### Checkout (Buyer) — ⭐ ORDER SPLITTING IN ACTION
```bash
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -H "x-mock-role: BUYER" \
  -H "x-mock-user-id: buyer-user-id" \
  -d '{
    "notes": "Please deliver before 5 PM"
  }'
```

**Response — Two orders created from one cart:**
```json
{
  "message": "Checkout successful! Orders have been created.",
  "ordersCreated": 2,
  "grandTotal": 5100000,
  "orders": [
    {
      "orderId": "order-uuid-1",
      "company": { "id": "...", "name": "Nike" },
      "status": "PENDING",
      "totalPrice": 1500000,
      "itemCount": 1,
      "items": [
        {
          "id": "item-uuid",
          "size": 42,
          "quantity": 1,
          "unitPrice": "1500000",
          "product": {
            "id": "nike-airmax-id",
            "name": "Nike Air Max 270",
            "imageUrl": "..."
          }
        }
      ]
    },
    {
      "orderId": "order-uuid-2",
      "company": { "id": "...", "name": "Adidas" },
      "status": "PENDING",
      "totalPrice": 3600000,
      "itemCount": 1,
      "items": [
        {
          "id": "item-uuid-2",
          "size": 41,
          "quantity": 2,
          "unitPrice": "1800000",
          "product": {
            "id": "adidas-ultraboost-id",
            "name": "Adidas Ultraboost 22",
            "imageUrl": "..."
          }
        }
      ]
    }
  ]
}
```

### Get Buyer's Orders
```bash
curl http://localhost:3000/orders \
  -H "x-mock-role: BUYER" \
  -H "x-mock-user-id: buyer-user-id"
```

### Get Single Order
```bash
curl http://localhost:3000/orders/<order-id> \
  -H "x-mock-role: BUYER" \
  -H "x-mock-user-id: buyer-user-id"
```

### Get Seller's Orders (Seller Only)
```bash
curl http://localhost:3000/seller/orders \
  -H "x-mock-role: SELLER" \
  -H "x-mock-user-id: nike-seller-id" \
  -H "x-mock-company-id: <nike-company-id>"
```

---

## ❌ Error Response Format

All errors return a consistent structure:
```json
{
  "statusCode": 400,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/cart/add",
  "method": "POST",
  "message": "Insufficient stock for size 42. Available: 3",
  "error": "Bad Request"
}
```

---

## 🚀 Quick Start

```bash
# 1. Set DATABASE_URL in .env (Supabase connection string)

# 2. Push schema to database
npm run db:push

# 3. Seed sample data
npm run db:seed

# 4. Start the server
npm run start:dev

# 5. Run the full checkout flow:
# Step 1: Add Nike shoe to cart
# Step 2: Add Adidas shoe to cart
# Step 3: Checkout → watch order splitting happen!
```
