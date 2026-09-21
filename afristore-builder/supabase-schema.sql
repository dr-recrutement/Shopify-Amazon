-- =====================================================================
-- AfriStore Builder — Schéma complet Supabase
-- À coller dans : Supabase Studio → SQL Editor → New query → Run
-- Non destructif : utilise CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
-- =====================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- STORE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_store (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "name" text NOT NULL,
  "slug" text,
  "description" text,
  "logo" text,
  "business_name" text,
  "business_type" text,
  "country" text,
  "currency" text,
  "language" text DEFAULT 'fr',
  "phone" text,
  "email" text,
  "address" text,
  "domain" text,
  "theme_id" text,
  "status" text DEFAULT 'draft',
  "is_marketplace_seller" boolean DEFAULT false,
  "plan" text DEFAULT 'growth',
  "plan_status" text DEFAULT 'trial',
  "trial_ends_at" timestamptz
);
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "business_name" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "business_type" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "domain" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "theme_id" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "is_marketplace_seller" boolean;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "plan" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "plan_status" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamptz;
CREATE INDEX IF NOT EXISTS sellia_store_created_by_idx ON sellia_store (created_by_id);
CREATE INDEX IF NOT EXISTS sellia_store_slug_idx ON sellia_store (slug);

-- ---------------------------------------------------------------------
-- PRODUCT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_product (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "title" text NOT NULL,
  "handle" text,
  "description" text,
  "status" text DEFAULT 'draft',
  "vendor" text,
  "product_type" text,
  "tags" jsonb,
  "images" jsonb,
  "price" numeric,
  "compare_at_price" numeric,
  "cost" numeric,
  "currency" text,
  "sku" text,
  "barcode" text,
  "weight" numeric,
  "weight_unit" text DEFAULT 'kg',
  "track_inventory" boolean DEFAULT true,
  "stock" bigint DEFAULT 0,
  "options" jsonb,
  "variants" jsonb,
  "collection_ids" jsonb,
  "seo" jsonb
);
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "compare_at_price" numeric;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "cost" numeric;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "weight" numeric;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "track_inventory" boolean;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "options" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "variants" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "collection_ids" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "seo" jsonb;
CREATE INDEX IF NOT EXISTS sellia_product_store_id_idx ON sellia_product (store_id);
CREATE INDEX IF NOT EXISTS sellia_product_handle_idx ON sellia_product (handle);

-- ---------------------------------------------------------------------
-- ORDER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_order (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "order_number" text,
  "customer_id" text,
  "customer_email" text,
  "items" jsonb,
  "subtotal" numeric DEFAULT 0,
  "discount_total" numeric DEFAULT 0,
  "shipping_total" numeric DEFAULT 0,
  "tax_total" numeric DEFAULT 0,
  "total" numeric DEFAULT 0,
  "currency" text,
  "status" text DEFAULT 'pending',
  "payment_status" text DEFAULT 'pending',
  "fulfillment_status" text DEFAULT 'unfulfilled',
  "shipping_address" jsonb,
  "billing_address" jsonb,
  "shipping_method" text,
  "payment_method" text,
  "payment_id" text,
  "note" text,
  "timeline" jsonb
);
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "discount_total" numeric;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "shipping_total" numeric;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "tax_total" numeric;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "fulfillment_status" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "billing_address" jsonb;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "payment_id" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "timeline" jsonb;
CREATE INDEX IF NOT EXISTS sellia_order_store_id_idx ON sellia_order (store_id);
CREATE INDEX IF NOT EXISTS sellia_order_customer_idx ON sellia_order (customer_id);

-- ---------------------------------------------------------------------
-- CUSTOMER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_customer (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "first_name" text,
  "last_name" text,
  "email" text NOT NULL,
  "phone" text,
  "accepts_marketing" boolean DEFAULT false,
  "tags" jsonb,
  "addresses" jsonb,
  "total_spent" numeric DEFAULT 0,
  "orders_count" bigint DEFAULT 0,
  "note" text
);
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "accepts_marketing" boolean;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "total_spent" numeric;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "orders_count" bigint;
CREATE INDEX IF NOT EXISTS sellia_customer_store_id_idx ON sellia_customer (store_id);
CREATE INDEX IF NOT EXISTS sellia_customer_email_idx ON sellia_customer (email);

-- ---------------------------------------------------------------------
-- COLLECTION
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_collection (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "name" text NOT NULL,
  "handle" text,
  "description" text,
  "image" text,
  "type" text DEFAULT 'manual',
  "rules" jsonb,
  "product_ids" jsonb,
  "sort_order" text DEFAULT 'manual',
  "status" text DEFAULT 'active'
);
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "rules" jsonb;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "product_ids" jsonb;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "sort_order" text;
CREATE INDEX IF NOT EXISTS sellia_collection_store_id_idx ON sellia_collection (store_id);

-- ---------------------------------------------------------------------
-- CART
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_cart (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "customer_id" text,
  "token" text,
  "currency" text,
  "items" jsonb,
  "subtotal" numeric DEFAULT 0,
  "total" numeric DEFAULT 0,
  "discount_code" text,
  "status" text DEFAULT 'active'
);
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "discount_code" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "status" text;
CREATE INDEX IF NOT EXISTS sellia_cart_store_id_idx ON sellia_cart (store_id);
CREATE INDEX IF NOT EXISTS sellia_cart_status_idx ON sellia_cart (status);

-- ---------------------------------------------------------------------
-- DISCOUNT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_discount (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "code" text NOT NULL,
  "type" text DEFAULT 'percentage',
  "value" numeric NOT NULL,
  "min_order_amount" numeric DEFAULT 0,
  "usage_limit" bigint,
  "used_count" bigint DEFAULT 0,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "status" text DEFAULT 'active',
  "applies_to" text DEFAULT 'all',
  "target_ids" jsonb
);
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "min_order_amount" numeric;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "used_count" bigint;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "applies_to" text;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "target_ids" jsonb;
CREATE INDEX IF NOT EXISTS sellia_discount_store_id_idx ON sellia_discount (store_id);
CREATE INDEX IF NOT EXISTS sellia_discount_code_idx ON sellia_discount (code);

-- ---------------------------------------------------------------------
-- PAYMENT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_payment (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "order_id" text NOT NULL,
  "provider" text DEFAULT 'manual',
  "amount" numeric NOT NULL,
  "currency" text NOT NULL,
  "status" text DEFAULT 'pending',
  "method" text,
  "provider_ref" text,
  "customer_email" text,
  "raw" jsonb
);
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "provider_ref" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "raw" jsonb;
CREATE INDEX IF NOT EXISTS sellia_payment_store_id_idx ON sellia_payment (store_id);
CREATE INDEX IF NOT EXISTS sellia_payment_order_id_idx ON sellia_payment (order_id);

-- ---------------------------------------------------------------------
-- ARTICLE (blog)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_article (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "title" text NOT NULL,
  "handle" text,
  "excerpt" text,
  "content" text,
  "featured_image" text,
  "author" text,
  "tags" jsonb,
  "status" text DEFAULT 'draft',
  "published_at" timestamptz
);
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "published_at" timestamptz;
CREATE INDEX IF NOT EXISTS sellia_article_store_id_idx ON sellia_article (store_id);
CREATE INDEX IF NOT EXISTS sellia_article_handle_idx ON sellia_article (handle);

-- ---------------------------------------------------------------------
-- REVIEW
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_review (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "product_id" text,
  "product_title" text,
  "customer_name" text NOT NULL,
  "customer_email" text,
  "rating" bigint NOT NULL,
  "title" text,
  "body" text NOT NULL,
  "status" text DEFAULT 'pending',
  "reply" text
);
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "reply" text;
CREATE INDEX IF NOT EXISTS sellia_review_store_id_idx ON sellia_review (store_id);
CREATE INDEX IF NOT EXISTS sellia_review_product_id_idx ON sellia_review (product_id);

-- ---------------------------------------------------------------------
-- MESSAGE (contact)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_message (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "subject" text,
  "body" text NOT NULL,
  "status" text DEFAULT 'unread',
  "reply" text,
  "replied_at" timestamptz
);
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "replied_at" timestamptz;
CREATE INDEX IF NOT EXISTS sellia_message_store_id_idx ON sellia_message (store_id);

-- ---------------------------------------------------------------------
-- AUTOMATION
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_automation (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "name" text NOT NULL,
  "trigger" text NOT NULL,
  "action" text NOT NULL,
  "config" jsonb,
  "enabled" boolean DEFAULT true,
  "runs_count" bigint DEFAULT 0
);
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "runs_count" bigint;
CREATE INDEX IF NOT EXISTS sellia_automation_store_id_idx ON sellia_automation (store_id);

-- ---------------------------------------------------------------------
-- SHIPPING ZONE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_shippingzone (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "name" text NOT NULL,
  "countries" jsonb,
  "carrier" text,
  "rate_type" text DEFAULT 'flat',
  "rate" numeric NOT NULL,
  "currency" text,
  "min_days" bigint DEFAULT 3,
  "max_days" bigint DEFAULT 7,
  "min_order_amount" numeric DEFAULT 0,
  "enabled" boolean DEFAULT true
);
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "min_order_amount" numeric;
CREATE INDEX IF NOT EXISTS sellia_shippingzone_store_id_idx ON sellia_shippingzone (store_id);

-- ---------------------------------------------------------------------
-- MEDIA FILE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_mediafile (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "type" text DEFAULT 'image',
  "mime" text,
  "size" bigint,
  "folder" text DEFAULT 'general',
  "tags" jsonb
);
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "folder" text;
CREATE INDEX IF NOT EXISTS sellia_mediafile_store_id_idx ON sellia_mediafile (store_id);

-- ---------------------------------------------------------------------
-- PAGE (contenu personnalisé)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_page (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text NOT NULL,
  "title" text NOT NULL,
  "handle" text,
  "content" text,
  "status" text DEFAULT 'draft',
  "seo_title" text,
  "seo_description" text
);
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "seo_title" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "seo_description" text;
CREATE INDEX IF NOT EXISTS sellia_page_store_id_idx ON sellia_page (store_id);
CREATE INDEX IF NOT EXISTS sellia_page_handle_idx ON sellia_page (handle);

-- ---------------------------------------------------------------------
-- PAYMENT PROVIDER (config PSP marchand)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_paymentprovider (
  "id" text PRIMARY KEY,
  "created_date" text,
  "updated_date" text,
  "created_by_id" text,
  "store_id" text NOT NULL,
  "provider" text NOT NULL DEFAULT 'manual',
  "display_name" text,
  "mode" text DEFAULT 'test',
  "credentials" jsonb,
  "is_active" boolean DEFAULT true
);
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "mode" text;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "is_active" boolean;
CREATE INDEX IF NOT EXISTS sellia_paymentprovider_store_id_idx ON sellia_paymentprovider (store_id);

-- ---------------------------------------------------------------------
-- Tables de paramètres (clés API + settings)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_ai_keys (
  "provider" text PRIMARY KEY,
  "api_key" text,
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sellia_settings (
  "key" text PRIMARY KEY,
  "value" jsonb,
  "updated_at" timestamptz DEFAULT now()
);

-- Rafraîchit le cache PostgREST pour exposer les nouvelles colonnes
NOTIFY pgrst, 'reload schema';

-- =====================================================================
-- Fin — 16 tables métier + 2 tables de config créées.
-- Pour remplir les données : exécutez la fonction de synchronisation
-- (supabaseSync) depuis le dashboard → elle upsert par id sans écraser.
-- =====================================================================