-- Registry Tables (Public Schema) are already handled by Prisma db push
-- This script creates the Silos for Nike, Adidas, and Puma

-- 1. Helper Function to create a Tenant Schema with full structure
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS "' || schema_name || '"';
    
    -- Categories
    EXECUTE 'CREATE TABLE IF NOT EXISTS "' || schema_name || '"."categories" ('
        || 'id UUID PRIMARY KEY, name TEXT UNIQUE, slug TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())';

    -- Products
    EXECUTE 'CREATE TABLE IF NOT EXISTS "' || schema_name || '"."products" ('
        || 'id UUID PRIMARY KEY, name TEXT, description TEXT, price DECIMAL(12,2), "imageUrl" TEXT, "isActive" BOOLEAN DEFAULT TRUE, '
        || '"categoryId" UUID REFERENCES "' || schema_name || '"."categories"(id), "companyId" UUID, '
        || '"createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())';

    -- Product Sizes
    EXECUTE 'CREATE TABLE IF NOT EXISTS "' || schema_name || '"."product_sizes" ('
        || 'id UUID PRIMARY KEY, size INT, stock INT DEFAULT 0, "productId" UUID REFERENCES "' || schema_name || '"."products"(id) ON DELETE CASCADE, '
        || '"createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE("productId", size))';

    -- Orders
    EXECUTE 'CREATE TABLE IF NOT EXISTS "' || schema_name || '"."orders" ('
        || 'id UUID PRIMARY KEY, "totalPrice" DECIMAL(12,2), status TEXT, notes TEXT, "userId" UUID, '
        || '"createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())';

    -- Order Items
    EXECUTE 'CREATE TABLE IF NOT EXISTS "' || schema_name || '"."order_items" ('
        || 'id UUID PRIMARY KEY, size INT, quantity INT, "unitPrice" DECIMAL(12,2), "orderId" UUID REFERENCES "' || schema_name || '"."orders"(id) ON DELETE CASCADE, '
        || '"productId" UUID REFERENCES "' || schema_name || '"."products"(id), "createdAt" TIMESTAMP DEFAULT NOW())';
END;
$$ LANGUAGE plpgsql;

-- 2. Initialize the 3 demo Silos
SELECT create_tenant_schema('tenant_11111111_1111_4111_8111_111111111111'); -- Nike
SELECT create_tenant_schema('tenant_22222222_2222_4222_8222_222222222222'); -- Adidas
SELECT create_tenant_schema('tenant_c35628e2_ac6f_4f8a_b866_bc293550d591'); -- Puma (UUID from previous test)
