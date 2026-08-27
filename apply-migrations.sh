#!/usr/bin/env bash
# Applique toutes les migrations Supabase dans le bon ordre, en une fois.
#
# Prérequis : avoir le Supabase CLI installé et être lié à ton projet
#   npm install -g supabase
#   supabase link --project-ref <ton-project-ref>
#
# Usage :
#   chmod +x scripts/apply-migrations.sh
#   ./scripts/apply-migrations.sh
#
# Ce script ne fait qu'appeler `supabase db push`, qui applique déjà les
# migrations dans l'ordre chronologique de leur nom de fichier — mais le
# lister explicitement ici sert de check-list pour vérifier que rien n'a
# été oublié avant de pousser en production.

set -e

echo "Migrations qui seront appliquées, dans l'ordre :"
echo "  1. 20260719070047_liafrikos_schema_v1.sql          (schéma de base)"
echo "  2. 20260819120000_products_orders_dashboard_sync.sql"
echo "  3. 20260820090000_subscriptions_and_domains_backend.sql"
echo "  4. 20260820150000_customers_discounts_staff_sync.sql"
echo "  5. 20260820180000_public_storefront_resolution.sql  (CRITIQUE — vitrine publique)"
echo "  6. 20260821090000_tenant_settings_blob.sql"
echo ""
read -p "Confirmer et pousser vers Supabase ? (o/N) " confirm
if [ "$confirm" != "o" ]; then
  echo "Annulé."
  exit 0
fi

supabase db push
echo "✅ Migrations appliquées."
