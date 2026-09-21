-- =====================================================================
-- AfriStore Builder — Schéma complet Supabase (robuste)
-- À coller dans : Supabase Studio → SQL Editor → New query → Run
-- Non destructif : CREATE IF NOT EXISTS + ALTER ADD COLUMN IF NOT EXISTS
-- pour CHAQUE colonne (fonctionne même sur des tables pré-existantes).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- STORE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_store (
  "id" text PRIMARY KEY
);
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "logo" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "business_name" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "business_type" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "country" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'fr';
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "domain" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "theme_id" text;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft';
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "is_marketplace_seller" boolean DEFAULT false;
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'growth';
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "plan_status" text DEFAULT 'trial';
ALTER TABLE sellia_store ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamptz;
CREATE INDEX IF NOT EXISTS sellia_store_created_by_idx ON sellia_store (created_by_id);
CREATE INDEX IF NOT EXISTS sellia_store_slug_idx ON sellia_store (slug);

-- ---------------------------------------------------------------------
-- PRODUCT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_product ("id" text PRIMARY KEY);
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "handle" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft';
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "vendor" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "product_type" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "tags" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "images" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "price" numeric;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "compare_at_price" numeric;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "cost" numeric;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "sku" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "barcode" text;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "weight" numeric;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "weight_unit" text DEFAULT 'kg';
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "track_inventory" boolean DEFAULT true;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "stock" bigint DEFAULT 0;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "options" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "variants" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "collection_ids" jsonb;
ALTER TABLE sellia_product ADD COLUMN IF NOT EXISTS "seo" jsonb;
CREATE INDEX IF NOT EXISTS sellia_product_store_id_idx ON sellia_product (store_id);
CREATE INDEX IF NOT EXISTS sellia_product_handle_idx ON sellia_product (handle);

-- ---------------------------------------------------------------------
-- ORDER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_order ("id" text PRIMARY KEY);
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "order_number" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "customer_id" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "customer_email" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "items" jsonb;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "subtotal" numeric DEFAULT 0;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "discount_total" numeric DEFAULT 0;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "shipping_total" numeric DEFAULT 0;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "tax_total" numeric DEFAULT 0;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "total" numeric DEFAULT 0;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending';
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending';
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "fulfillment_status" text DEFAULT 'unfulfilled';
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "shipping_address" jsonb;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "billing_address" jsonb;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "shipping_method" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "payment_id" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE sellia_order ADD COLUMN IF NOT EXISTS "timeline" jsonb;
CREATE INDEX IF NOT EXISTS sellia_order_store_id_idx ON sellia_order (store_id);
CREATE INDEX IF NOT EXISTS sellia_order_customer_idx ON sellia_order (customer_id);

-- ---------------------------------------------------------------------
-- CUSTOMER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_customer ("id" text PRIMARY KEY);
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "first_name" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "last_name" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "accepts_marketing" boolean DEFAULT false;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "tags" jsonb;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "addresses" jsonb;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "total_spent" numeric DEFAULT 0;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "orders_count" bigint DEFAULT 0;
ALTER TABLE sellia_customer ADD COLUMN IF NOT EXISTS "note" text;
CREATE INDEX IF NOT EXISTS sellia_customer_store_id_idx ON sellia_customer (store_id);
CREATE INDEX IF NOT EXISTS sellia_customer_email_idx ON sellia_customer (email);

-- ---------------------------------------------------------------------
-- COLLECTION
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_collection ("id" text PRIMARY KEY);
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "handle" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "image" text;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'manual';
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "rules" jsonb;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "product_ids" jsonb;
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "sort_order" text DEFAULT 'manual';
ALTER TABLE sellia_collection ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';
CREATE INDEX IF NOT EXISTS sellia_collection_store_id_idx ON sellia_collection (store_id);

-- ---------------------------------------------------------------------
-- CART
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_cart ("id" text PRIMARY KEY);
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "customer_id" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "token" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "items" jsonb;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "subtotal" numeric DEFAULT 0;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "total" numeric DEFAULT 0;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "discount_code" text;
ALTER TABLE sellia_cart ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';
CREATE INDEX IF NOT EXISTS sellia_cart_store_id_idx ON sellia_cart (store_id);
CREATE INDEX IF NOT EXISTS sellia_cart_status_idx ON sellia_cart (status);

-- ---------------------------------------------------------------------
-- DISCOUNT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_discount ("id" text PRIMARY KEY);
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'percentage';
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "value" numeric;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "min_order_amount" numeric DEFAULT 0;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "usage_limit" bigint;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "used_count" bigint DEFAULT 0;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "starts_at" timestamptz;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "ends_at" timestamptz;
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "applies_to" text DEFAULT 'all';
ALTER TABLE sellia_discount ADD COLUMN IF NOT EXISTS "target_ids" jsonb;
CREATE INDEX IF NOT EXISTS sellia_discount_store_id_idx ON sellia_discount (store_id);
CREATE INDEX IF NOT EXISTS sellia_discount_code_idx ON sellia_discount (code);

-- ---------------------------------------------------------------------
-- PAYMENT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_payment ("id" text PRIMARY KEY);
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "order_id" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "provider" text DEFAULT 'manual';
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "amount" numeric;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending';
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "method" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "provider_ref" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "customer_email" text;
ALTER TABLE sellia_payment ADD COLUMN IF NOT EXISTS "raw" jsonb;
CREATE INDEX IF NOT EXISTS sellia_payment_store_id_idx ON sellia_payment (store_id);
CREATE INDEX IF NOT EXISTS sellia_payment_order_id_idx ON sellia_payment (order_id);

-- ---------------------------------------------------------------------
-- ARTICLE (blog)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_article ("id" text PRIMARY KEY);
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "handle" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "excerpt" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "content" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "featured_image" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "author" text;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "tags" jsonb;
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft';
ALTER TABLE sellia_article ADD COLUMN IF NOT EXISTS "published_at" timestamptz;
CREATE INDEX IF NOT EXISTS sellia_article_store_id_idx ON sellia_article (store_id);
CREATE INDEX IF NOT EXISTS sellia_article_handle_idx ON sellia_article (handle);

-- ---------------------------------------------------------------------
-- REVIEW
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_review ("id" text PRIMARY KEY);
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "product_id" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "product_title" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "customer_email" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "rating" bigint;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending';
ALTER TABLE sellia_review ADD COLUMN IF NOT EXISTS "reply" text;
CREATE INDEX IF NOT EXISTS sellia_review_store_id_idx ON sellia_review (store_id);
CREATE INDEX IF NOT EXISTS sellia_review_product_id_idx ON sellia_review (product_id);

-- ---------------------------------------------------------------------
-- MESSAGE (contact)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_message ("id" text PRIMARY KEY);
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "customer_email" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "subject" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'unread';
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "reply" text;
ALTER TABLE sellia_message ADD COLUMN IF NOT EXISTS "replied_at" timestamptz;
CREATE INDEX IF NOT EXISTS sellia_message_store_id_idx ON sellia_message (store_id);

-- ---------------------------------------------------------------------
-- AUTOMATION
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_automation ("id" text PRIMARY KEY);
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "trigger" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "action" text;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "config" jsonb;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "enabled" boolean DEFAULT true;
ALTER TABLE sellia_automation ADD COLUMN IF NOT EXISTS "runs_count" bigint DEFAULT 0;
CREATE INDEX IF NOT EXISTS sellia_automation_store_id_idx ON sellia_automation (store_id);

-- ---------------------------------------------------------------------
-- SHIPPING ZONE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_shippingzone ("id" text PRIMARY KEY);
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "countries" jsonb;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "carrier" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "rate_type" text DEFAULT 'flat';
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "rate" numeric;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "min_days" bigint DEFAULT 3;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "max_days" bigint DEFAULT 7;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "min_order_amount" numeric DEFAULT 0;
ALTER TABLE sellia_shippingzone ADD COLUMN IF NOT EXISTS "enabled" boolean DEFAULT true;
CREATE INDEX IF NOT EXISTS sellia_shippingzone_store_id_idx ON sellia_shippingzone (store_id);

-- ---------------------------------------------------------------------
-- MEDIA FILE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_mediafile ("id" text PRIMARY KEY);
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "url" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'image';
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "mime" text;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "size" bigint;
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "folder" text DEFAULT 'general';
ALTER TABLE sellia_mediafile ADD COLUMN IF NOT EXISTS "tags" jsonb;
CREATE INDEX IF NOT EXISTS sellia_mediafile_store_id_idx ON sellia_mediafile (store_id);

-- ---------------------------------------------------------------------
-- PAGE (contenu personnalisé)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_page ("id" text PRIMARY KEY);
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "handle" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "content" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft';
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "seo_title" text;
ALTER TABLE sellia_page ADD COLUMN IF NOT EXISTS "seo_description" text;
CREATE INDEX IF NOT EXISTS sellia_page_store_id_idx ON sellia_page (store_id);
CREATE INDEX IF NOT EXISTS sellia_page_handle_idx ON sellia_page (handle);

-- ---------------------------------------------------------------------
-- PAYMENT PROVIDER (config PSP marchand)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellia_paymentprovider ("id" text PRIMARY KEY);
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "created_date" text;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "updated_date" text;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "created_by_id" text;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "store_id" text;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "provider" text DEFAULT 'manual';
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "display_name" text;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "mode" text DEFAULT 'test';
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "credentials" jsonb;
ALTER TABLE sellia_paymentprovider ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
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
-- Fin — 16 tables métier + 2 tables de config. Idempotent : relancez
-- cette commande à tout moment sans risque. Pour remplir les données,
-- exécutez la fonction de synchronisation (supabaseSync) depuis le dashboard.
-- =====================================================================